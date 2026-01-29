'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export type SearchTab = 'all' | 'broadcasters' | 'broadcasts';

interface SearchTabsProps {
    currentTab: SearchTab;
}

export default function SearchTabs({ currentTab }: SearchTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleTabChange = (tab: SearchTab) => {
        const params = new URLSearchParams(searchParams);
        if (tab === 'all') {
            params.delete('tab');
        } else {
            params.set('tab', tab);
        }
        router.push(`/search?${params.toString()}`);
    };

    const tabs: { value: SearchTab; label: string }[] = [
        { value: 'all', label: 'すべて' },
        { value: 'broadcasters', label: '配信者' },
        { value: 'broadcasts', label: '配信' },
    ];

    return (
        <div className="flex gap-2 border-b border-gray-200">
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => handleTabChange(tab.value)}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${currentTab === tab.value
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
