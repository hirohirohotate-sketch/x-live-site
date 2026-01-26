'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Tab = 'login' | 'signup';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<Tab>('login');

    // フォーム状態
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

    const supabase = createSupabaseBrowserClient();

    // メール/パスワードで処理
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (tab === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });

                if (error) throw error;

                setMessage({
                    type: 'success',
                    text: '確認メールを送信しました。メール内のリンクをクリックしてください。',
                });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // ログイン成功したらリダイレクト
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.message || 'エラーが発生しました',
            });
        } finally {
            setLoading(false);
        }
    };

    // Xでログイン
    const handleXLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'x',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.message || 'Xログインエラーが発生しました',
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                {/* ヘッダー */}
                <div className="bg-white px-6 py-6 text-center border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900">LiveShelf</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        アーカイブ整理のためのログイン
                    </p>
                </div>

                {/* タブ切り替え */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setTab('login')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'login'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        ログイン
                    </button>
                    <button
                        onClick={() => setTab('signup')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'signup'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        新規登録
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* メッセージ表示 */}
                    {message && (
                        <div
                            className={`p-4 rounded-lg text-sm ${message.type === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* メール/パスワードフォーム */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="liveshelf@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                パスワード
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="6文字以上"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '処理中...' : tab === 'login' ? 'ログイン' : 'アカウント作成'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">または</span>
                        </div>
                    </div>

                    {/* Xログインボタン */}
                    <button
                        onClick={handleXLogin}
                        disabled={loading}
                        className="w-full py-2.5 flex items-center justify-center gap-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        X (Twitter) でログイン
                    </button>
                </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
                <a href="/" className="hover:underline">
                    ホームに戻る
                </a>
            </div>
        </div>
    );
}
