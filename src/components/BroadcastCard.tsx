'use client';

import Link from 'next/link';
import type { BroadcastWithNotes } from '@/types/home';

interface BroadcastCardProps {
    broadcast: BroadcastWithNotes;
}

export default function BroadcastCard({ broadcast }: BroadcastCardProps) {
    // 表示する日時（published_at優先、なければfirst_seen_at）
    const displayDate = broadcast.published_at || broadcast.first_seen_at;
    const formattedDate = new Date(displayDate).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Note Prioritization Logic
    // TODO: Enable this when X Auth is ready. For now, disable "Owner" highlight for added_by_user.
    const curatorNote: any = null;
    /*
    const curatorNote = broadcast.notes.find(
        (n) => n.author_user_id && n.author_user_id === broadcast.added_by_user_id
    );
    */
    const displayNote = curatorNote || broadcast.notes[0];

    const notePreview = displayNote
        ? displayNote.title || displayNote.body.slice(0, 100)
        : null;

    const isCuratorNote = !!curatorNote;

    // タグ（最大5個）
    const allTags = broadcast.notes.flatMap((note) => note.tags);
    const uniqueTags = Array.from(new Set(allTags)).slice(0, 5);

    // --- Preview Data (from DB, fetched server-side in /api/add) ---
    const preview = {
        title: broadcast.preview_title,
        desc: broadcast.preview_description,
        img: broadcast.preview_image_url,
        site: broadcast.preview_site,
        status: broadcast.preview_fetch_status,
    };

    // Image Source (Proxy)
    const renderImage = () => {
        if (!preview.img) return null;
        const encodedUrl = encodeURIComponent(preview.img);
        return `/img?u=${encodedUrl}`;
    };

    // Card Type Determination
    const hasPreview = preview.status === 'success' || preview.status === 'partial';

    return (
        <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className="p-4 flex-grow">
                {/* ヘッダー: 配信者と日時 */}
                <div className="flex items-center justify-between mb-2">
                    <Link
                        href={`/u/${broadcast.x_username}`}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        @{broadcast.x_username || 'unknown'}
                    </Link>
                    <span className="text-sm text-gray-500">{formattedDate}</span>
                </div>

                {/* メモプレビュー（これがあれば詳細へのリンクとして機能） */}
                {notePreview && (
                    <Link
                        href={`/b/${broadcast.broadcast_id}`}
                        className="block mb-3 group"
                    >
                        <p className="text-gray-800 font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {isCuratorNote && (
                                <span className="mr-1 inline-flex items-center justify-center">
                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </span>
                            )}
                            {notePreview}
                        </p>
                    </Link>
                )}

                {/* Preview Card Area */}
                <div className="mt-2 mb-3">
                    {hasPreview ? (
                        // Discord-style Card
                        <a
                            href={broadcast.broadcast_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-gray-50 border border-l-4 border-gray-300 rounded overflow-hidden hover:bg-gray-100 transition-colors max-w-full"
                            style={{ borderLeftColor: '#1d9bf0' }}
                        >
                            <div className="flex flex-col sm:flex-row">
                                {preview.img && (
                                    <div className="sm:w-32 sm:h-auto w-full h-48 relative flex-shrink-0 bg-gray-200">
                                        <img
                                            src={renderImage()!}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                                <div className="p-3 min-w-0 flex-1 flex flex-col justify-center">
                                    {preview.site && (
                                        <small className="text-gray-500 text-xs uppercase mb-1 tracking-wide">
                                            {preview.site}
                                        </small>
                                    )}
                                    <div className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1 leading-snug">
                                        {preview.title || 'No Title'}
                                    </div>
                                    {preview.desc && (
                                        <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                            {preview.desc}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </a>
                    ) : (
                        // Fallback / No Image Card
                        <a
                            href={broadcast.broadcast_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 border border-gray-200 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                <span>
                                    {preview.status === 'fail' ? 'ポストを開く' : 'URLを開く'}
                                </span>
                            </div>
                        </a>
                    )}
                </div>

                {/* タグ */}
                {uniqueTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {uniqueTags.map((tag, idx) => (
                            <Link
                                key={idx}
                                href={`/t/${encodeURIComponent(tag)}`}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* フッター */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <Link
                    href={`/b/${broadcast.broadcast_id}`}
                    className="text-xs text-gray-400 hover:text-gray-600"
                >
                    詳細へ
                </Link>
                {broadcast.notes.length > 0 && (
                    <span className="text-xs text-gray-500 font-medium">
                        {broadcast.notes.length} notes
                    </span>
                )}
            </div>
        </div>
    );
}
