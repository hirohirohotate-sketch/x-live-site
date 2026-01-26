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

    // メモのプレビュー（最初のnoteのtitleまたはbody先頭）
    const firstNote = broadcast.notes[0];
    const notePreview = firstNote
        ? firstNote.title || firstNote.body.slice(0, 100)
        : null;

    // タグ（最大5個）
    const allTags = broadcast.notes.flatMap((note) => note.tags);
    const uniqueTags = Array.from(new Set(allTags)).slice(0, 5);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* 配信者 */}
            <div className="flex items-center justify-between mb-2">
                <Link
                    href={`/u/${broadcast.x_username}`}
                    className="text-blue-600 hover:underline font-medium"
                >
                    @{broadcast.x_username || 'unknown'}
                </Link>
                <span className="text-sm text-gray-500">{formattedDate}</span>
            </div>

            {/* メモプレビュー */}
            {notePreview && (
                <p className="text-gray-700 mb-3 line-clamp-2">{notePreview}</p>
            )}

            {/* タグ */}
            {uniqueTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {uniqueTags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Xで開く */}
            <div className="flex items-center justify-between">
                <a
                    href={broadcast.broadcast_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Xで開く
                </a>
                {broadcast.notes.length > 0 && (
                    <span className="text-xs text-gray-500">
                        {broadcast.notes.length}件のメモ
                    </span>
                )}
            </div>
        </div>
    );
}
