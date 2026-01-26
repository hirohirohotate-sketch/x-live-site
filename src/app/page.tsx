import { Suspense } from 'react';
import { getRecentBroadcasts } from '@/lib/home/getRecentBroadcasts';
import BroadcastCard from '@/components/BroadcastCard';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';
import type { TimeFilter } from '@/types/home';

interface HomeProps {
  searchParams: Promise<{ q?: string; time?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const usernameFilter = params.q;
  const timeFilter = (params.time as TimeFilter) || 'all';

  const broadcasts = await getRecentBroadcasts({
    limit: 30,
    usernameFilter,
    timeFilter,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ヒーローセクション */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            あなたの配信アーカイブを整理する棚
          </h2>
          <p className="text-gray-600 mb-6">
            Xのライブ配信は流れて消えていく。LiveShelfは、それらを「棚」として整理し、文章で価値を残す場所です。
          </p>

          {/* 検索UI */}
          <Suspense fallback={<div className="h-24" />}>
            <SearchBar />
          </Suspense>
        </div>

        {/* メインコンテンツ */}
        {broadcasts.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                新着アーカイブ
              </h3>
              <span className="text-sm text-gray-500">
                {broadcasts.length}件
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {broadcasts.map((broadcast) => (
                <BroadcastCard key={broadcast.broadcast_id} broadcast={broadcast} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
