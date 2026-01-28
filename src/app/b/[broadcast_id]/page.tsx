import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import AddInlineNote from '@/components/AddInlineNote';

interface PageProps {
    params: Promise<{ broadcast_id: string }>;
}

// 日付フォーマット関数（ホーム/棚と統一）
function formatDate(dateString: string | null): string {
    if (!dateString) return '不明';
    return new Date(dateString).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default async function BroadcastDetailPage(props: PageProps) {
    const params = await props.params;
    const broadcastId = params.broadcast_id;

    if (!broadcastId) {
        return <NotFoundPage />;
    }

    const supabase = await createSupabaseServerClient();

    // 1) broadcastを取得
    const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcasts')
        .select('broadcast_id, broadcast_url, x_username, published_at, first_seen_at')
        .eq('broadcast_id', broadcastId)
        .single();

    if (broadcastError || !broadcast) {
        return <NotFoundPage broadcastId={broadcastId} />;
    }

    // 2) broadcast_notesを取得
    const { data: notes, error: notesError } = await supabase
        .from('broadcast_notes')
        .select('id, title, body, tags, timestamps, created_at')
        .eq('broadcast_id', broadcastId)
        .order('created_at', { ascending: false });

    if (notesError) {
        console.error('Error fetching notes:', notesError);
    }

    const broadcastNotes = notes || [];

    // ページタイトル（notesのtitleがあれば使用）
    const pageTitle =
        broadcastNotes.find((n) => n.title)?.title || `Broadcast ${broadcastId}`;

    // 配信日時（published_at優先、なければfirst_seen_at）
    const displayDate = broadcast.published_at || broadcast.first_seen_at;
    const dateLabel = broadcast.published_at ? '配信日時' : '追加日時';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー：配信の基本情報 */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{pageTitle}</h1>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            {/* 配信者 */}
                            {broadcast.x_username && (
                                <div>
                                    <Link
                                        href={`/u/${broadcast.x_username}`}
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        @{broadcast.x_username}
                                    </Link>
                                </div>
                            )}

                            {/* 配信日時 */}
                            <div className="text-sm text-gray-600">
                                {dateLabel}: {formatDate(displayDate)}
                            </div>
                        </div>

                        {/* アクション */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* Xで開く */}
                            {broadcast.broadcast_url ? (
                                <a
                                    href={broadcast.broadcast_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    Xで開く
                                </a>
                            ) : (
                                <div className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
                                    URL未登録
                                </div>
                            )}

                            {/* この棚を見る */}
                            {broadcast.x_username && (
                                <Link
                                    href={`/u/${broadcast.x_username}`}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    この棚を見る
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* メインコンテンツ：Notes */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">メモ</h2>

                {broadcastNotes.length === 0 ? (
                    /* メモ0件の場合：目立つフォーム */
                    <AddInlineNote broadcastId={broadcastId} variant="prominent" />
                ) : (
                    /* Notes一覧 + 下部に追加フォーム */
                    <>
                        <div className="space-y-4 mb-6">
                            {broadcastNotes.map((note) => (
                                <div
                                    key={note.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                                >
                                    {/* Title */}
                                    {note.title && (
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {note.title}
                                        </h3>
                                    )}

                                    {/* Body */}
                                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                                        {note.body}
                                    </p>

                                    {/* Tags */}
                                    {note.tags && note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {note.tags.slice(0, 10).map((tag: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Timestamps */}
                                    {note.timestamps && Array.isArray(note.timestamps) && note.timestamps.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-sm text-gray-600">
                                                {note.timestamps.join(', ')}
                                            </div>
                                        </div>
                                    )}

                                    {/* Created at */}
                                    <div className="text-xs text-gray-500">
                                        {formatDate(note.created_at)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* メモあり時の追加フォーム（控えめ） */}
                        <AddInlineNote broadcastId={broadcastId} variant="compact" />
                    </>
                )}
            </main>
        </div>
    );
}

// broadcastが見つからない場合のコンポーネント
function NotFoundPage({ broadcastId }: { broadcastId?: string }) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center max-w-md">
                <div className="text-5xl mb-4">🔍</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    アーカイブが見つかりません
                </h1>
                <p className="text-gray-600 mb-6">
                    このアーカイブはまだ登録されていません。
                    {broadcastId && (
                        <span className="block mt-2 text-sm text-gray-500">
                            ID: {broadcastId}
                        </span>
                    )}
                </p>
                <div className="space-y-3">
                    <Link
                        href="/add"
                        className="block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        アーカイブを追加する
                    </Link>
                    <Link
                        href="/"
                        className="block px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        ホームに戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
