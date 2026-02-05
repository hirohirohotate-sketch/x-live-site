import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { BroadcastWithNotes } from '@/types/home';

/**
 * Fetch broadcasts added or contributed to by a specific user
 * Returns two separate lists:
 * 1. Broadcasts the user added (based on added_by_user_id)
 * 2. Broadcasts the user contributed notes to (based on author_user_id)
 */
export async function getUserShelf(
    userId: string
): Promise<{
    addedBroadcasts: BroadcastWithNotes[];
    contributedBroadcasts: BroadcastWithNotes[];
}> {
    const supabase = await createSupabaseServerClient();

    // 1. Fetch broadcasts added by this user
    const { data: addedBroadcasts, error: addedError } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('added_by_user_id', userId)
        .order('first_seen_at', { ascending: false });

    if (addedError) {
        console.error('[getUserShelf] Error fetching added broadcasts:', addedError);
    }

    const addedIds = (addedBroadcasts || []).map(b => b.broadcast_id);

    // 2. Fetch all notes for added broadcasts
    let addedNotes: any[] = [];
    if (addedIds.length > 0) {
        const { data } = await supabase
            .from('broadcast_notes')
            .select('*')
            .in('broadcast_id', addedIds);
        addedNotes = data || [];
    }

    // 3. Join notes to broadcasts (sort in JavaScript)
    const addedWithNotes: BroadcastWithNotes[] = (addedBroadcasts || []).map(broadcast => ({
        ...broadcast,
        notes: addedNotes
            .filter(n => n.broadcast_id === broadcast.broadcast_id)
            .map(n => ({
                id: n.id,
                title: n.title,
                body: n.body,
                tags: n.tags || [],
                author_user_id: n.author_user_id,
                created_at: n.created_at,
            })),
    }));

    // Sort by first_seen_at desc (JavaScript final sort)
    addedWithNotes.sort((a, b) => {
        const aDate = new Date(a.first_seen_at).getTime();
        const bDate = new Date(b.first_seen_at).getTime();
        return bDate - aDate;
    });

    // 4. Fetch notes written by this user
    const { data: userNotes, error: notesError } = await supabase
        .from('broadcast_notes')
        .select('broadcast_id, created_at')
        .eq('author_user_id', userId);

    if (notesError) {
        console.error('[getUserShelf] Error fetching user notes:', notesError);
    }

    // 5. Get broadcasts where user contributed (exclude already added ones)
    const contributedIds = [...new Set((userNotes || []).map(n => n.broadcast_id))]
        .filter(id => !addedIds.includes(id));

    let contributedWithNotes: any[] = [];

    if (contributedIds.length > 0) {
        // Batch fetch broadcasts
        const { data: contributedBroadcasts } = await supabase
            .from('broadcasts')
            .select('*')
            .in('broadcast_id', contributedIds);

        // Batch fetch all notes for these broadcasts
        const { data: contributedNotes } = await supabase
            .from('broadcast_notes')
            .select('*')
            .in('broadcast_id', contributedIds);

        // Join and prepare for sorting
        contributedWithNotes = (contributedBroadcasts || []).map(broadcast => {
            const notes = (contributedNotes || [])
                .filter(n => n.broadcast_id === broadcast.broadcast_id)
                .map(n => ({
                    id: n.id,
                    title: n.title,
                    body: n.body,
                    tags: n.tags || [],
                    created_at: n.created_at,
                    author_user_id: n.author_user_id,
                }));

            // Find latest note created_at
            const latestNoteDate = notes.reduce((latest, note) => {
                const noteDate = new Date(note.created_at || 0).getTime();
                return noteDate > latest ? noteDate : latest;
            }, 0);

            return {
                ...broadcast,
                notes,
                _latestNoteDate: latestNoteDate,
            };
        });

        // Sort by latest note date (JavaScript final sort)
        contributedWithNotes.sort((a, b) =>
            (b._latestNoteDate || 0) - (a._latestNoteDate || 0)
        );

        // Remove temporary sort field
        contributedWithNotes.forEach(b => delete (b as any)._latestNoteDate);
    }

    return {
        addedBroadcasts: addedWithNotes,
        contributedBroadcasts: contributedWithNotes,
    };
}
