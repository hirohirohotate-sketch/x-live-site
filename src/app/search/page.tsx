import { Suspense } from 'react';
import Link from 'next/link';
import { searchBroadcasters, searchBroadcastsAndNotes } from '@/lib/search/searchActions';
import SearchBox from '@/components/SearchBox';
import SearchTabs, { type SearchTab } from '@/components/SearchTabs';
import TimeFilter from '@/components/TimeFilter';
import BroadcasterRow from '@/components/BroadcasterRow';
import BroadcastCard from '@/components/BroadcastCard';
import SearchEmptyState from '@/components/SearchEmptyState';
import type { TimeFilter as TimeFilterType } from '@/types/home';

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
        tab?: string;
        time?: string;
    }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q?.trim() || '';
    const tab = (params.tab as SearchTab) || 'all';
    const timeFilter = (params.time as TimeFilterType) || 'all';

    // クエリが空の場合は空状態を表示
    if (!query) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">検索</h1>
                        <Suspense fallback={<div className="h-12" />}>
                            <SearchBox />
                        </Suspense>
                    </div>
                    <SearchEmptyState hasQuery={false} />
                </main>
            </div>
        );
    }

    // データ取得
    let broadcasters = tab === 'all' || tab === 'broadcasters' ? await searchBroadcasters(query, 20) : [];
    let broadcasts = tab === 'all' || tab === 'broadcasts' ? await searchBroadcastsAndNotes(query, timeFilter, 30) : [];

    // 結果が0件の場合
    const hasResults = broadcasters.length > 0 || broadcasts.length > 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* ヘッダー */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">検索</h1>
                    <Suspense fallback={<div className="h-12" />}>
                        <SearchBox />
                    </Suspense>
                </div>

                {/* タブ */}
                <div className="mb-4">
                    <SearchTabs currentTab={tab} />
                </div>

                {/* 期間フィルタ（broadcasts タブの時のみ） */}
                {(tab === 'broadcasts' || tab === 'all') && (
                    <div className="mb-6">
                        <TimeFilter currentFilter={timeFilter} />
                    </div>
                )}

                {/* コンテンツ */}
                {!hasResults ? (
                    <SearchEmptyState hasQuery={true} />
                ) : (
                    <>
                        {tab === 'all' && (
                            <div className="space-y-8">
                                {/* 配信者セクション */}
                                {broadcasters.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                配信者
                                            </h2>
                                            {broadcasters.length >= 5 && (
                                                <Link
                                                    href={`/search?q=${encodeURIComponent(query)}&tab=broadcasters`}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    もっと見る →
                                                </Link>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {broadcasters.slice(0, 5).map((broadcaster) => (
                                                <BroadcasterRow
                                                    key={broadcaster.x_username}
                                                    broadcaster={broadcaster}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* 配信セクション */}
                                {broadcasts.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                配信
                                            </h2>
                                            {broadcasts.length >= 10 && (
                                                <Link
                                                    href={`/search?q=${encodeURIComponent(query)}&tab=broadcasts`}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    もっと見る →
                                                </Link>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {broadcasts.slice(0, 10).map((broadcast) => (
                                                <BroadcastCard
                                                    key={broadcast.broadcast_id}
                                                    broadcast={broadcast}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                        {tab === 'broadcasters' && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        配信者
                                    </h2>
                                    <span className="text-sm text-gray-500">
                                        {broadcasters.length}件
                                    </span>
                                </div>
                                {broadcasters.length === 0 ? (
                                    <SearchEmptyState hasQuery={true} />
                                ) : (
                                    <div className="space-y-2">
                                        {broadcasters.map((broadcaster) => (
                                            <BroadcasterRow
                                                key={broadcaster.x_username}
                                                broadcaster={broadcaster}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {tab === 'broadcasts' && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        配信
                                    </h2>
                                    <span className="text-sm text-gray-500">
                                        {broadcasts.length}件
                                    </span>
                                </div>
                                {broadcasts.length === 0 ? (
                                    <SearchEmptyState hasQuery={true} />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {broadcasts.map((broadcast) => (
                                            <BroadcastCard
                                                key={broadcast.broadcast_id}
                                                broadcast={broadcast}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
