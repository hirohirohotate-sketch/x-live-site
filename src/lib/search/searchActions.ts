import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { BroadcastWithNotes, TimeFilter } from '@/types/home';

export interface BroadcasterSearchResult {
    x_username: string;
    status: string;
}

/**
 * 配信者を検索する（MVPはusernameのみ）
 */
export async function searchBroadcasters(
    q: string,
    limit: number = 20
): Promise<BroadcasterSearchResult[]> {
    if (!q || q.trim().length === 0) {
        return [];
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('broadcasters')
        .select('x_username, status')
        .ilike('x_username', `%${q}%`)
        .order('x_username', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error searching broadcasters:', error);
        return [];
    }

    return data || [];
}

/**
 * 配信とメモを横断検索する（別クエリ→union→最終取得）
 */
export async function searchBroadcastsAndNotes(
    q: string,
    timeFilter: TimeFilter = 'all',
    limit: number = 30
): Promise<BroadcastWithNotes[]> {
    if (!q || q.trim().length === 0) {
        return [];
    }

    const supabase = await createSupabaseServerClient();
    const broadcastIdsSet = new Set<string>();

    // 1) broadcasts テーブルから検索（x_username, preview_title, preview_description）
    const broadcastsQuery = supabase
        .from('broadcasts')
        .select('broadcast_id')
        .or(`x_username.ilike.%${q}%,preview_title.ilike.%${q}%,preview_description.ilike.%${q}%`);

    const { data: broadcastMatches, error: broadcastsError } = await broadcastsQuery;

    if (broadcastsError) {
        console.error('Error searching broadcasts:', broadcastsError);
    } else if (broadcastMatches) {
        broadcastMatches.forEach((b) => broadcastIdsSet.add(b.broadcast_id));
    }

    // 2) broadcast_notes テーブルから検索（body, title）
    const notesQuery = supabase
        .from('broadcast_notes')
        .select('broadcast_id')
        .or(`body.ilike.%${q}%,title.ilike.%${q}%`);

    const { data: noteMatches, error: notesError } = await notesQuery;

    if (notesError) {
        console.error('Error searching notes:', notesError);
    } else if (noteMatches) {
        noteMatches.forEach((n) => broadcastIdsSet.add(n.broadcast_id));
    }

    // 3) broadcast_notes の tags を検索（Cast演算子::はORクエリで使えないため別クエリ）
    const tagsQuery = supabase
        .from('broadcast_notes')
        .select('broadcast_id')
        .filter('tags::text', 'ilike', `%${q}%`);

    const { data: tagMatches, error: tagsError } = await tagsQuery;

    if (tagsError) {
        console.error('Error searching tags:', tagsError);
    } else if (tagMatches) {
        tagMatches.forEach((n) => broadcastIdsSet.add(n.broadcast_id));
    }

    // 4) broadcast_id を union して最終取得
    const broadcastIds = Array.from(broadcastIdsSet);

    if (broadcastIds.length === 0) {
        return [];
    }

    // 5) 該当する broadcasts を取得（期間フィルタ適用）
    let finalQuery = supabase
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
        `)
        .in('broadcast_id', broadcastIds)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('first_seen_at', { ascending: false })
        .limit(limit);

    // 期間フィルタ適用
    if (timeFilter === '24h') {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        finalQuery = finalQuery.or(`published_at.gte.${since},first_seen_at.gte.${since}`);
    } else if (timeFilter === '7d') {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        finalQuery = finalQuery.or(`published_at.gte.${since},first_seen_at.gte.${since}`);
    }

    const { data: broadcasts, error: finalError } = await finalQuery;

    if (finalError) {
        console.error('Error fetching final broadcasts:', finalError);
        return [];
    }

    if (!broadcasts || broadcasts.length === 0) {
        return [];
    }

    // 6) broadcast_notes をまとめて取得（N+1回避）
    const finalBroadcastIds = broadcasts.map((b) => b.broadcast_id);
    const { data: notes, error: notesLoadError } = await supabase
        .from('broadcast_notes')
        .select('id, broadcast_id, title, body, tags')
        .in('broadcast_id', finalBroadcastIds);

    if (notesLoadError) {
        console.error('Error fetching notes for broadcasts:', notesLoadError);
    }

    // 7) broadcasts に notes を紐付け
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

    return result;
}
