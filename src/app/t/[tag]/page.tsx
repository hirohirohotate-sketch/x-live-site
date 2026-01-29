import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTagShelf } from '@/lib/tags/getTagShelf';
import { normalizeTag } from '@/lib/tags/tagUtils';
import BroadcastCard from '@/components/BroadcastCard';
import TimeFilter from '@/components/TimeFilter';
import type { TimeFilter as TimeFilterType } from '@/types/home';

interface PageProps {
    params: Promise<{ tag: string }>;
    searchParams: Promise<{ time?: string }>;
}

export default async function TagShelfPage({ params, searchParams }: PageProps) {
    const { tag: rawTag } = await params;
    const { time } = await searchParams;

    // Normalize and validate tag
    const normalizedTag = normalizeTag(rawTag);

    if (!normalizedTag) {
        // Invalid tag
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🏷️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Invalid Tag
                    </h1>
                    <p className="text-gray-600 mb-6">
                        The tag &quot;{rawTag}&quot; is not valid. Tags must be between 1 and 50 characters.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        );
    }

    // Parse time filter
    const timeFilter: TimeFilterType =
        time === '24h' || time === '7d' ? time : 'all';

    // Fetch data
    const { broadcasts, count, noteCount } = await getTagShelf(
        normalizedTag,
        timeFilter,
        30
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-4xl">🏷️</div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            #{normalizedTag}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{count} broadcasts</span>
                        <span>•</span>
                        <span>{noteCount} notes</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <TimeFilter currentFilter={timeFilter} />
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                {broadcasts.length === 0 ? (
                    // Empty state
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            No broadcasts found
                        </h2>
                        <p className="text-gray-600 mb-6">
                            There are no broadcasts with the tag &quot;#{normalizedTag}&quot;
                            {timeFilter !== 'all' && ` in the last ${timeFilter}`}.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                href="/add"
                                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add Broadcast
                            </Link>
                            {timeFilter !== 'all' && (
                                <Link
                                    href={`/t/${encodeURIComponent(normalizedTag)}`}
                                    className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    View All Time
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    // Broadcast grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {broadcasts.map((broadcast) => (
                            <BroadcastCard
                                key={broadcast.broadcast_id}
                                broadcast={broadcast}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
