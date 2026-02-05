import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { BroadcastWithNotes, TimeFilter } from '@/types/home';

interface GetRecentBroadcastsOptions {
    limit?: number;
    offset?: number;
    usernameFilter?: string;
    timeFilter?: TimeFilter;
}

/**
 * 新着アーカイブを取得する（N+1回避）
 */
export async function getRecentBroadcasts(
    options: GetRecentBroadcastsOptions = {}
): Promise<{ broadcasts: BroadcastWithNotes[]; count: number | null }> {
    const { limit = 20, offset = 0, usernameFilter, timeFilter = 'all' } = options;

    const supabase = await createSupabaseServerClient();

    // 1) broadcastsを取得
    let query = supabase
        .from('broadcasts')
        .select(`
            broadcast_id, 
            broadcast_url, 
            x_username, 
            published_at, 
            first_seen_at,
            added_by_user_id,
            preview_title,
            preview_description,
            preview_image_url,
            preview_site,
            preview_fetch_status,
            preview_fetched_at
        `, { count: 'exact' })
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('first_seen_at', { ascending: false })


    // username フィルタ
    if (usernameFilter) {
        query = query.ilike('x_username', `%${usernameFilter}%`);
    }

    // 期間フィルタ
    if (timeFilter === '24h') {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        query = query.or(`published_at.gte.${since},first_seen_at.gte.${since}`);
    } else if (timeFilter === '7d') {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.or(`published_at.gte.${since},first_seen_at.gte.${since}`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: broadcasts, error: broadcastsError, count } = await query;

    if (broadcastsError) {
        console.error('Error fetching broadcasts:', broadcastsError);
        return { broadcasts: [], count: 0 };
    }

    if (!broadcasts || broadcasts.length === 0) {
        return { broadcasts: [], count: 0 };
    }

    // 2) broadcast_notesをまとめて取得（N+1回避）
    const broadcastIds = broadcasts.map((b) => b.broadcast_id);
    const { data: notes, error: notesError } = await supabase
        .from('broadcast_notes')
        .select('id, broadcast_id, title, body, tags, author_user_id, created_at')
        .in('broadcast_id', broadcastIds);

    if (notesError) {
        console.error('Error fetching notes:', notesError);
    }

    // 3) broadcastsにnotesを紐付け
    const notesMap = new Map<string, typeof notes>();
    if (notes) {
        for (const note of notes) {
            const existing = notesMap.get(note.broadcast_id) || [];
            existing.push(note);
            notesMap.set(note.broadcast_id, existing);
        }
    }

    const result: BroadcastWithNotes[] = broadcasts.map((broadcast) => ({
        ...broadcast,
        notes: (notesMap.get(broadcast.broadcast_id) || []).map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            tags: n.tags || [],
            author_user_id: n.author_user_id,
            created_at: n.created_at,
        })),
    }));

    return {
        broadcasts: result,
        count,
    };
}
