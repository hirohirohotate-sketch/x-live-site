// ホーム画面での表示に必要な型定義

export type TimeFilter = 'all' | '24h' | '7d';

// ホーム表示に必要なbroadcastフィールド
export interface BroadcastItem {
    broadcast_id: string;
    broadcast_url: string;
    x_username: string | null;
    published_at: string | null;
    first_seen_at: string;

    // Previews
    preview_title?: string | null;
    preview_description?: string | null;
    preview_image_url?: string | null;
    preview_site?: 'x' | 'twitter' | 'other' | 'unknown' | null;
    preview_fetch_status?: 'success' | 'partial' | 'fail' | 'fetching' | null;
    preview_fetched_at?: string | null;
}

export type Broadcast = BroadcastItem;

// notesの表示に必要なフィールド
export interface BroadcastNote {
    id: string;
    title: string | null;
    body: string;
    tags: string[];
}

// broadcastとnotesを結合した型（ホーム画面での表示用）
export interface BroadcastWithNotes extends BroadcastItem {
    notes: BroadcastNote[];
}
