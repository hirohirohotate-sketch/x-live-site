import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// タグ正規化関数（既存のbroadcastUtilsと同様）
function normalizeTags(tags: string | string[] | undefined): string[] {
    if (!tags) return [];

    let tagArray: string[];
    if (typeof tags === 'string') {
        // カンマ区切り文字列を配列に変換
        tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    } else {
        tagArray = tags;
    }

    // 最大10個に制限
    return tagArray.slice(0, 10);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. 入力検証
        if (!body.broadcast_id) {
            return NextResponse.json(
                { success: false, error: 'broadcast_id is required' },
                { status: 400 }
            );
        }

        if (!body.body || body.body.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'body is required' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();

        // 2. broadcast_id の存在チェック
        const { data: broadcast, error: broadcastError } = await supabase
            .from('broadcasts')
            .select('broadcast_id')
            .eq('broadcast_id', body.broadcast_id)
            .single();

        if (broadcastError || !broadcast) {
            return NextResponse.json(
                { success: false, error: 'broadcast not found' },
                { status: 400 }
            );
        }

        // 3. 重複チェック（直近1分以内の同一body）
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

        const { data: recentNotes, error: duplicateCheckError } = await supabase
            .from('broadcast_notes')
            .select('id')
            .eq('broadcast_id', body.broadcast_id)
            .eq('body', body.body.trim())
            .gte('created_at', oneMinuteAgo)
            .limit(1);

        if (duplicateCheckError) {
            console.error('Error checking for duplicates:', duplicateCheckError);
            // 重複チェック失敗は致命的ではないので続行
        } else if (recentNotes && recentNotes.length > 0) {
            return NextResponse.json(
                { success: false, error: 'duplicate note' },
                { status: 400 }
            );
        }

        // 4. タグの正規化
        const normalizedTags = normalizeTags(body.tags);

        // 5. 認証ユーザーの取得
        const { data: { user } } = await supabase.auth.getUser();
        const authorUserId = user?.id || null;

        // 6. broadcast_notes に insert
        const { error: insertError } = await supabase
            .from('broadcast_notes')
            .insert({
                broadcast_id: body.broadcast_id,
                author_user_id: authorUserId,
                title: '',
                body: body.body.trim(),
                tags: normalizedTags,
                timestamps: [],
            });

        if (insertError) {
            console.error('Error inserting note:', insertError);
            return NextResponse.json(
                { success: false, error: 'note could not be saved due to permissions' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error in /api/notes/add:', error);
        return NextResponse.json(
            { success: false, error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
