import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname
    console.log('[Middleware] リクエスト:', path)
    if (path.startsWith('/auth/callback')) {
        console.log('[Middleware] Callback request detected')
        console.log('[Middleware] Cookies keys:', req.cookies.getAll().map(c => c.name).join(', '))
    }

    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return req.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        req.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: req.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        req.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: req.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        // Refresh session if expired - required for Server Components
        const { data, error } = await supabase.auth.getSession()

        if (error) {
            console.error('[Middleware] セッション取得エラー:', error)
        } else if (data.session) {
            console.log('[Middleware] セッション有効:', data.session.user.id)
        } else {
            console.log('[Middleware] セッションなし')
        }
    } catch (err) {
        console.error('[Middleware] 予期しないエラー:', err)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
