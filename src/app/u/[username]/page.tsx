import Link from 'next/link';
import { Suspense } from 'react';
import { getBroadcasterShelf } from '@/lib/user/getBroadcasterShelf';
import BroadcastCard from '@/components/BroadcastCard';
import SearchBar from '@/components/SearchBar'; // フィルタUIを再利用
import type { TimeFilter } from '@/types/home';

interface PageProps {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ time?: string }>;
}

export default async function BroadcasterPage(props: PageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;

    const username = params.username.toLowerCase();
    const timeFilter = (searchParams.time as TimeFilter) || 'all';

    const { broadcasts, count, latestAt } = await getBroadcasterShelf(username, {
        limit: 30,
        timeFilter,
    });

    // 日付フォーマット
    const latestDate = latestAt
        ? new Date(latestAt).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
        : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダーセクション */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                @{username}
                            </h1>
                            <p className="text-gray-600">
                                {username} のライブアーカイブ棚
                            </p>
                        </div>
                        {latestDate && (
                            <div className="text-sm text-gray-500 text-right">
                                <p>アーカイブ数: {count}件</p>
                                <p>最終追加: {latestDate}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* フィルタUI - SearchBarの一部機能を利用 */}
                {/* username検索は不要だが、期間フィルタは欲しいので一旦SearchBarを使用 */}
                {/* 将来的には専用フィルタコンポーネントに分離しても良い */}
                <div className="mb-6 flex justify-end">
                    <div className="w-full sm:w-auto">
                        {/* 
               TODO: SearchBarは現在検索入力も含んでいるため、
               シンプルに期間フィルタだけを表示するUIをここに直接書くか、
               SearchBarを改修してモードを持たせるのが良い。
               一旦は、SearchBarを使わず、シンプルな期間リンクを実装する。
             */}
                        <TimeFilterSelector currentTime={timeFilter} />
                    </div>
                </div>

                {/* 0件の場合（空の棚） */}
                {broadcasts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-5xl mb-4">📦</div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            この棚にはまだアーカイブがありません
                        </h2>
                        <p className="text-gray-600 mb-6">
                            URLを追加して、@{username} の棚を作りましょう。
                        </p>
                        <Link
                            href="/add"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            アーカイブを追加する
                        </Link>
                    </div>
                ) : (
                    /* アーカイブ一覧 */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {broadcasts.map((broadcast) => (
                            <BroadcastCard key={broadcast.broadcast_id} broadcast={broadcast} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

// 簡易的な期間フィルタコンポーネント（このファイル内で定義）
function TimeFilterSelector({ currentTime }: { currentTime: string }) {
    const filters = [
        { value: 'all', label: 'すべて' },
        { value: '24h', label: '24時間' },
        { value: '7d', label: '7日間' },
    ];

    return (
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {filters.map((f) => (
                <Link
                    key={f.value}
                    href={f.value === 'all' ? '?' : `?time=${f.value}`}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${currentTime === f.value
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    {f.label}
                </Link>
            ))}
        </div>
    );
}
