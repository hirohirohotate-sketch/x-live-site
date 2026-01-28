import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { BroadcastWithNotes, TimeFilter } from '@/types/home';

interface GetBroadcasterShelfOptions {
    limit?: number;
    timeFilter?: TimeFilter;
}

interface BroadcasterShelfResult {
    broadcasts: BroadcastWithNotes[];
    count: number;
    latestAt: string | null;
}

/**
 * 配信者の棚データを取得する
 */
export async function getBroadcasterShelf(
    username: string,
    options: GetBroadcasterShelfOptions = {}
): Promise<BroadcasterShelfResult> {
    const { limit = 30, timeFilter = 'all' } = options;
    const usernameLower = username.toLowerCase();

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
            preview_title,
            preview_description,
            preview_image_url,
            preview_site,
            preview_fetch_status,
            preview_fetched_at
        `, { count: 'exact' })
        .ilike('x_username', usernameLower) // 大文字小文字を区別せず検索
        .order('first_seen_at', { ascending: false })
        .limit(limit);

    // 期間フィルタ
    if (timeFilter === '24h') {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        query = query.or(`published_at.gte.${since},first_seen_at.gte.${since}`);
    } else if (timeFilter === '7d') {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.or(`published_at.gte.${since},first_seen_at.gte.${since}`);
    }

    const { data: broadcasts, error: broadcastsError, count } = await query;

    if (broadcastsError) {
        console.error('Error fetching broadcaster shelf:', broadcastsError);
        return { broadcasts: [], count: 0, latestAt: null };
    }

    if (!broadcasts || broadcasts.length === 0) {
        return { broadcasts: [], count: 0, latestAt: null };
    }

    // 2) broadcast_notesをまとめて取得（N+1回避）
    const broadcastIds = broadcasts.map((b) => b.broadcast_id);
    const { data: notes, error: notesError } = await supabase
        .from('broadcast_notes')
        .select('id, broadcast_id, title, body, tags')
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
        })),
    }));

    return {
        broadcasts: result,
        count: count || 0,
        latestAt: broadcasts[0]?.first_seen_at || null,
    };
}
