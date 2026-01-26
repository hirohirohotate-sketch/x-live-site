import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    console.log('[Callback] コールバック処理開始')
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // リダイレクト先の取得（デフォルトはトップページ）
    let next = requestUrl.searchParams.get('next') ?? '/'
    // オープンリダイレクト対策: スラッシュで始まらない場合はルートに強制
    if (!next.startsWith('/')) {
        next = '/'
    }

    console.log('[Callback] URL:', requestUrl.toString())
    console.log('[Callback] Code:', code ? '取得成功' : 'なし')
    console.log('[Callback] Error:', error)
    console.log('[Callback] Next Redirect:', next)

    if (error) {
        console.error('[Callback] OAuth エラー:', error, errorDescription)
        const errorMessage = encodeURIComponent(errorDescription || error)
        return NextResponse.redirect(`${requestUrl.origin}/?auth_error=${errorMessage}`)
    }

    if (code) {
        try {
            console.log('[Callback] セッション交換開始')

            // 共通のクライアント作成関数を使用
            const supabase = await createSupabaseServerClient()

            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                console.error('[Callback] セッション交換エラー:', exchangeError)
                return NextResponse.redirect(`${requestUrl.origin}/?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`)
            }

            console.log('[Callback] セッション交換成功:', data.session ? 'セッション確立' : 'セッションなし')
            console.log('[Callback] User ID:', data.user?.id)
        } catch (err) {
            console.error('[Callback] 予期しないエラー:', err)
            return NextResponse.redirect(`${requestUrl.origin}/?error=unexpected`)
        }
    } else {
        console.warn('[Callback] codeパラメータがありません')
    }

    // URL to redirect to after sign in process completes
    console.log('[Callback] リダイレクト先:', `${requestUrl.origin}${next}`)
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
}
