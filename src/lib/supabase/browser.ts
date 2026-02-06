import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    // ビルド時に環境変数がない場合はダミークライアントを返す
    // 実際のブラウザ実行時には環境変数が利用可能
    if (!supabaseUrl || !supabaseAnonKey) {
        return null
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
