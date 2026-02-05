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

    // 1) broadcastを取得 (added_by_user_id を追加)
    const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcasts')
        .select('broadcast_id, broadcast_url, x_username, published_at, first_seen_at, added_by_user_id, preview_title, preview_description, preview_image_url')
        .eq('broadcast_id', broadcastId)
        .single();

    if (broadcastError || !broadcast) {
        return <NotFoundPage broadcastId={broadcastId} />;
    }

    // 2) broadcast_notesを取得 (author_user_id を追加)
    const { data: notes, error: notesError } = await supabase
        .from('broadcast_notes')
        .select('id, title, body, tags, timestamps, created_at, author_user_id')
        .eq('broadcast_id', broadcastId)
        .order('created_at', { ascending: false });

    if (notesError) {
        console.error('Error fetching notes:', notesError);
    }

    const allNotes = notes || [];

    // Note Separation Logic
    // Note Separation Logic
    // TODO: Enable this logic when X Auth is implemented and we can verify the actual owner (streamer)
    // For now, verifiedOwner is null, so "Added By" user notes are treated as regular comments.
    const curatorNote: any = null;

    const communityNotes = allNotes.filter((n) => n.id !== curatorNote?.id);

    // ページタイトル（Curator Noteがあればそのタイトル、なければCommunity Noteのタイトル、なければデフォルト）
    const pageTitle =
        curatorNote?.title ||
        communityNotes.find((n) => n.title)?.title ||
        `Broadcast ${broadcastId}`;

    // 配信日時（published_at優先、なければfirst_seen_at）
    const displayDate = broadcast.published_at || broadcast.first_seen_at;
    const dateLabel = broadcast.published_at ? '配信日時' : '追加日時';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー：配信の基本情報 */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Thumbnail */}
                    {broadcast.preview_image_url && (
                        <div className="mb-6 relative w-full rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                            <img
                                src={`/img?u=${encodeURIComponent(broadcast.preview_image_url)}`}
                                alt={broadcast.preview_title || 'Preview'}
                                className="w-full h-auto max-h-[500px] object-contain mx-auto"
                            />
                        </div>
                    )}

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

            {/* メインコンテンツ */}
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

                {/* 1. Owner's Note (Always Visible) */}
                {/* 1. Owner's Note (Only Visible if Verified Owner has a note) */}
                {curatorNote && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-900">Owner&apos;s Note</h2>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border-2 border-yellow-400 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                                PICK UP
                            </div>

                            {curatorNote.title && (
                                <h3 className="text-lg font-bold text-gray-900 mb-3">
                                    {curatorNote.title}
                                </h3>
                            )}

                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
                                {curatorNote.body}
                            </p>

                            {/* Tags */}
                            {curatorNote.tags && curatorNote.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {curatorNote.tags.map((tag: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-100"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs text-gray-500 text-right">
                                {formatDate(curatorNote.created_at)}
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. Comments (Collapsible) */}
                <section>
                    <details className="group bg-white rounded-lg border border-gray-200 shadow-sm" open={communityNotes.length > 0}>
                        <summary className="cursor-pointer p-4 font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between select-none">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>Comments</span>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                    {communityNotes.length}
                                </span>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </summary>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-4">
                            {communityNotes.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="mb-4">まだコメントはありません</p>
                                    <p className="text-sm">最初のコメントを追加してみよう！</p>
                                </div>
                            ) : (
                                communityNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="bg-white rounded border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                                    >
                                        {note.title && (
                                            <h4 className="font-bold text-gray-800 mb-2">
                                                {note.title}
                                            </h4>
                                        )}
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap mb-3">
                                            {note.body}
                                        </p>

                                        {/* Tags */}
                                        {note.tags && note.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {note.tags.slice(0, 5).map((tag: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-400 text-right">
                                            {formatDate(note.created_at)}
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Inline Add Note Form for Community */}
                            <div className="pt-4 mt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">コメントを追加する</h4>
                                <AddInlineNote broadcastId={broadcastId} variant="compact" />
                            </div>
                        </div>
                    </details>
                </section>

            </main>
        </div >
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
