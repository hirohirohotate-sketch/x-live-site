import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { BroadcastWithNotes, TimeFilter } from '@/types/home';

/**
 * Fetch broadcasts containing a specific tag
 * Implements efficient N+1 prevention by batch fetching
 */
export async function getTagShelf(
    tag: string,
    timeFilter: TimeFilter = 'all',
    limit: number = 30
): Promise<{
    broadcasts: BroadcastWithNotes[];
    count: number;
    noteCount: number;
}> {
    const supabase = await createSupabaseServerClient();

    // 1. Find all notes containing this tag
    const { data: notesWithTag, error: notesError } = await supabase
        .from('broadcast_notes')
        .select('broadcast_id, id, title, body, tags')
        .contains('tags', [tag]);

    if (notesError) {
        console.error('[getTagShelf] Error fetching notes:', notesError);
        return { broadcasts: [], count: 0, noteCount: 0 };
    }

    if (!notesWithTag || notesWithTag.length === 0) {
        return { broadcasts: [], count: 0, noteCount: 0 };
    }

    // 2. Extract distinct broadcast_ids
    const broadcastIds = Array.from(
        new Set(notesWithTag.map((note) => note.broadcast_id))
    );

    if (broadcastIds.length === 0) {
        return { broadcasts: [], count: 0, noteCount: 0 };
    }

    // 3. Build time filter condition
    const now = new Date();
    let timeFilterDate: Date | null = null;

    if (timeFilter === '24h') {
        timeFilterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeFilter === '7d') {
        timeFilterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 4. Fetch broadcasts (with time filtering if applicable)
    let broadcastQuery = supabase
        .from('broadcasts')
        .select('*')
        .in('broadcast_id', broadcastIds);

    if (timeFilterDate) {
        const isoDate = timeFilterDate.toISOString();
        broadcastQuery = broadcastQuery.or(
            `published_at.gte.${isoDate},and(published_at.is.null,first_seen_at.gte.${isoDate})`
        );
    }

    const { data: broadcasts, error: broadcastsError } = await broadcastQuery;

    if (broadcastsError) {
        console.error('[getTagShelf] Error fetching broadcasts:', broadcastsError);
        return { broadcasts: [], count: 0, noteCount: 0 };
    }

    if (!broadcasts || broadcasts.length === 0) {
        return { broadcasts: [], count: 0, noteCount: 0 };
    }

    // 5. Get all broadcast_ids that passed the filter
    const filteredBroadcastIds = broadcasts.map((b) => b.broadcast_id);

    // 6. Fetch ALL notes for these broadcasts (not just tagged ones)
    const { data: allNotes, error: allNotesError } = await supabase
        .from('broadcast_notes')
        .select('broadcast_id, id, title, body, tags')
        .in('broadcast_id', filteredBroadcastIds);

    if (allNotesError) {
        console.error('[getTagShelf] Error fetching all notes:', allNotesError);
        return { broadcasts: [], count: 0, noteCount: 0 };
    }

    // 7. Join notes to broadcasts
    const broadcastsWithNotes: BroadcastWithNotes[] = broadcasts.map((broadcast) => {
        const notes = (allNotes || []).filter(
            (note) => note.broadcast_id === broadcast.broadcast_id
        );

        return {
            ...broadcast,
            notes: notes.map((note) => ({
                id: note.id,
                title: note.title,
                body: note.body,
                tags: note.tags || [],
            })),
        };
    });

    // 8. Sort in JavaScript (Supabase in() doesn't guarantee order)
    // published_at desc (nulls last), then first_seen_at desc
    broadcastsWithNotes.sort((a, b) => {
        // Compare published_at
        if (a.published_at && b.published_at) {
            return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        }
        if (a.published_at && !b.published_at) {
            return -1; // a comes first (has published_at)
        }
        if (!a.published_at && b.published_at) {
            return 1; // b comes first
        }

        // Both null, compare first_seen_at
        return new Date(b.first_seen_at).getTime() - new Date(a.first_seen_at).getTime();
    });

    // 9. Apply limit
    const limitedBroadcasts = broadcastsWithNotes.slice(0, limit);

    return {
        broadcasts: limitedBroadcasts,
        count: broadcastsWithNotes.length,
        noteCount: notesWithTag.length,
    };
}
