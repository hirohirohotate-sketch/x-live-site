'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { User } from '@supabase/supabase-js'

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createSupabaseBrowserClient()

    useEffect(() => {
        // SSR/プリレンダリング時はsupabaseがnullになる
        if (!supabase) {
            setLoading(false)
            return
        }

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const handleLogout = async () => {
        await supabase?.auth.signOut()
    }

    if (loading) {
        return <div className="text-sm text-gray-500">...</div>
    }

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700 hidden sm:inline">
                    {user.email || user.user_metadata?.user_name}
                </span>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                    Logout
                </button>
            </div>
        )
    }

    return (
        <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-500 transition-colors"
        >
            Login
        </Link>
    )
}
