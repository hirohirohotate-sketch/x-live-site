'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { TimeFilter as TimeFilterType } from '@/types/home';

interface TimeFilterProps {
    currentFilter: TimeFilterType;
}

export default function TimeFilter({ currentFilter }: TimeFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleFilterChange = (filter: TimeFilterType) => {
        const params = new URLSearchParams(searchParams);
        if (filter === 'all') {
            params.delete('time');
        } else {
            params.set('time', filter);
        }
        router.push(`/search?${params.toString()}`);
    };

    const filters: { value: TimeFilterType; label: string }[] = [
        { value: 'all', label: 'すべて' },
        { value: '24h', label: '24時間' },
        { value: '7d', label: '7日間' },
    ];

    return (
        <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">期間:</span>
            {filters.map((filter) => (
                <button
                    key={filter.value}
                    onClick={() => handleFilterChange(filter.value)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${currentFilter === filter.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}
