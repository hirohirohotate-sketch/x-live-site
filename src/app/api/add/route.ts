import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
    extractBroadcastId,
    normalizeBroadcastUrl,
    normalizeUsername,
    parseTags,
} from '@/lib/broadcastUtils';
import type { AddBroadcastFormData, AddBroadcastResponse } from '@/types/add';

export async function POST(request: NextRequest) {
    try {
        const body: AddBroadcastFormData = await request.json();

        // 1. 入力検証
        if (!body.broadcast_url) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'broadcast_url is required',
                } as AddBroadcastResponse,
                { status: 400 }
            );
        }

        // 2. broadcast_id 抽出
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

        // 3. データ正規化
        const normalizedUrl = normalizeBroadcastUrl(broadcastId);
        const normalizedUsername = normalizeUsername(body.x_username);
        const tags = parseTags(body.tags);

        const supabase = await createSupabaseServerClient();

        // 4. broadcasts upsert
        const { error: broadcastError } = await supabase.from('broadcasts').upsert(
            {
                broadcast_id: broadcastId,
                broadcast_url: normalizedUrl,
                x_username: normalizedUsername,
                source: 'manual',
                last_seen_at: new Date().toISOString(),
            },
            {
                onConflict: 'broadcast_id',
                ignoreDuplicates: false,
            }
        );

        if (broadcastError) {
            console.error('Error upserting broadcast:', broadcastError);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to save broadcast',
                } as AddBroadcastResponse,
                { status: 500 }
            );
        }

        // 5. broadcasters insert（x_username がある場合のみ）
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

        // 6. broadcast_notes insert（note_body または tags がある場合）
        let noteSaved = false;
        let warning: string | undefined;

        if (body.note_body || tags.length > 0) {
            const { error: noteError } = await supabase
                .from('broadcast_notes')
                .insert({
                    broadcast_id: broadcastId,
                    author_user_id: null,
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

        // 7. レスポンス
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
