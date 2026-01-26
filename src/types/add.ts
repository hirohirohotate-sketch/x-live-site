// /add ページのフォーム入力とAPI通信の型定義

export interface AddBroadcastFormData {
    broadcast_url: string;
    x_username?: string;
    note_body?: string;
    tags?: string;
}

export interface AddBroadcastResponse {
    success: boolean;
    broadcast_id?: string;
    note_saved?: boolean;
    warning?: string;
    error?: string;
}
