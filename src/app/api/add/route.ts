import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
    extractBroadcastId,
    normalizeBroadcastUrl,
    normalizeUsername,
    parseTags,
    extractUsernameFromText,
} from '@/lib/broadcastUtils';
import { fetchPreview } from '@/lib/preview/fetchPreview';
import type { AddBroadcastFormData, AddBroadcastResponse } from '@/types/add';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // 1. Check authentication (REQUIRED)
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required. Please log in.',
                } as AddBroadcastResponse,
                { status: 401 }
            );
        }

        const body: AddBroadcastFormData = await request.json();

        // 2. 入力検証
        if (!body.broadcast_url) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'broadcast_url is required',
                } as AddBroadcastResponse,
                { status: 400 }
            );
        }

        // 3. broadcast_id 抽出
        const broadcastId = extractBroadcastId(body.broadcast_url);
        if (!broadcastId) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Invalid broadcast URL. Expected format: https://x.com/i/broadcasts/1234...',
                } as AddBroadcastResponse,
                { status: 400 }
            );
        }

        // 4. データ正規化
        const normalizedUrl = normalizeBroadcastUrl(broadcastId);
        let normalizedUsername = normalizeUsername(body.x_username);
        const tags = parseTags(body.tags);

        // 5. Check if broadcast exists (lookup by broadcast_id)
        const { data: existingBroadcast } = await supabase
            .from('broadcasts')
            .select('id, broadcast_id, added_by_user_id, x_username')
            .eq('broadcast_id', broadcastId)
            .single();

        let claimed: boolean = false;

        if (existingBroadcast) {
            // Existing broadcast - try to claim if unclaimed
            if (!existingBroadcast.added_by_user_id) {
                // Conditional UPDATE (concurrency-safe)
                const { data: updateResult } = await supabase
                    .from('broadcasts')
                    .update({
                        added_by_user_id: user.id,
                        x_username: normalizedUsername || existingBroadcast.x_username,
                        last_seen_at: new Date().toISOString(),
                    })
                    .eq('broadcast_id', broadcastId)
                    .eq('added_by_user_id', null) // Only if still unclaimed
                    .select();

                claimed = !!(updateResult && updateResult.length > 0);
            }
        } else {
            // 6. Preview取得（非同期・エラーでも続行）
            console.log(`[AddAPI] Fetching preview for ${normalizedUrl}`);
            const previewResult = await fetchPreview(normalizedUrl).catch(err => {
                console.error('[AddAPI] Preview fetch error:', err);
                return {
                    title: null,
                    description: null,
                    imageUrl: null,
                    site: 'unknown' as const,
                    status: 'fail' as const,
                    author: null
                };
            });

            console.log(`[AddAPI] Preview result:`, {
                status: previewResult.status,
                hasTitle: !!previewResult.title,
                hasImage: !!previewResult.imageUrl,
                site: previewResult.site
            });

            // Extract username if missing
            if (!normalizedUsername) {
                // Try title first (often contains "Name (@handle)" format)
                normalizedUsername = extractUsernameFromText(previewResult.title);

                // Fallback to author
                if (!normalizedUsername) {
                    normalizedUsername = extractUsernameFromText(previewResult.author);
                }
            }

            // Ensure username is present
            if (!normalizedUsername) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Could not detect username. Please enter manually.',
                    } as AddBroadcastResponse,
                    { status: 400 }
                );
            }

            // 7. New broadcast - insert with user ID
            const { error: broadcastError } = await supabase.from('broadcasts').insert({
                broadcast_id: broadcastId,
                broadcast_url: normalizedUrl,
                x_username: normalizedUsername,
                source: 'manual',
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
                added_by_user_id: user.id, // Track who added it
                // Preview data
                preview_title: previewResult.title,
                preview_description: previewResult.description,
                preview_image_url: previewResult.imageUrl,
                preview_site: previewResult.site,
                preview_fetch_status: previewResult.status,
                preview_fetched_at: new Date().toISOString(),
            });

            if (broadcastError) {
                console.error('Error inserting broadcast:', broadcastError);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to save broadcast',
                    } as AddBroadcastResponse,
                    { status: 500 }
                );
            }

            claimed = true; // New broadcast is automatically claimed
        }

        // 6. broadcasters insert（x_username がある場合のみ）
        if (normalizedUsername) {
            const { error: broadcasterError } = await supabase
                .from('broadcasters')
                .insert({
                    x_username: normalizedUsername,
                    status: 'unclaimed',
                })
                .select()
                .single();

            // on conflict は Supabase JS では直接サポートされていないため、
            // エラーコード 23505 (unique violation) を無視する
            if (broadcasterError && broadcasterError.code !== '23505') {
                console.error('Error inserting broadcaster:', broadcasterError);
                // broadcasterのエラーは致命的ではないので続行
            }
        }

        // 7. broadcast_notes insert（note_body または tags がある場合）
        let noteSaved = false;
        let warning: string | undefined;

        if (body.note_body || tags.length > 0) {
            const { error: noteError } = await supabase
                .from('broadcast_notes')
                .insert({
                    broadcast_id: broadcastId,
                    author_user_id: user.id, // Track note author
                    title: '',
                    body: body.note_body || '',
                    tags: tags,
                    timestamps: [],
                });

            if (noteError) {
                console.error('Error inserting note:', noteError);
                warning = 'Note could not be saved due to permissions';
                noteSaved = false;
            } else {
                noteSaved = true;
            }
        } else {
            noteSaved = true; // メモがない場合は成功扱い
        }

        // 8. レスポンス
        const response: AddBroadcastResponse = {
            success: true,
            broadcast_id: broadcastId,
            note_saved: noteSaved,
        };

        if (warning) {
            response.warning = warning;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Unexpected error in /api/add:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred',
            } as AddBroadcastResponse,
            { status: 500 }
        );
    }
}
