// ホーム画面での表示に必要な型定義

export type TimeFilter = 'all' | '24h' | '7d';

// ホーム表示に必要なbroadcastフィールド
export interface BroadcastItem {
    broadcast_id: string;
    broadcast_url: string;
    x_username: string | null;
    published_at: string | null;
    first_seen_at: string;
}

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
