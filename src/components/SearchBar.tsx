'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { TimeFilter } from '@/types/home';

export default function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>(
        (searchParams.get('time') as TimeFilter) || 'all'
    );

    useEffect(() => {
        setQuery(searchParams.get('q') || '');
        setTimeFilter((searchParams.get('time') as TimeFilter) || 'all');
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateURL(query, timeFilter);
    };

    const handleTimeFilterChange = (newTimeFilter: TimeFilter) => {
        setTimeFilter(newTimeFilter);
        updateURL(query, newTimeFilter);
    };

    const updateURL = (q: string, time: TimeFilter) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (time !== 'all') params.set('time', time);

        const newURL = params.toString() ? `/?${params.toString()}` : '/';
        router.push(newURL);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="@username で検索"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    検索
                </button>
            </form>

            <div className="flex gap-2">
                <span className="text-sm text-gray-600 flex items-center">期間:</span>
                {(['all', '24h', '7d'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => handleTimeFilterChange(filter)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFilter === filter
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {filter === 'all' ? 'すべて' : filter === '24h' ? '24時間' : '7日間'}
                    </button>
                ))}
            </div>
        </div>
    );
}
