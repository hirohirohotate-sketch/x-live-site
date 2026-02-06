import Link from 'next/link';
import type { BroadcasterSearchResult } from '@/lib/search/searchActions';

interface BroadcasterRowProps {
    broadcaster: BroadcasterSearchResult;
}

export default function BroadcasterRow({ broadcaster }: BroadcasterRowProps) {
    const statusConfig = {
        claimed: { label: '認証済み', color: 'bg-green-100 text-green-800' },
        pending: { label: '認証中', color: 'bg-yellow-100 text-yellow-800' },
        unclaimed: { label: '未認証', color: 'bg-gray-100 text-gray-600' },
    };

    const status = statusConfig[broadcaster.status as keyof typeof statusConfig] || statusConfig.unclaimed;

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <Link
                href={`/u/${broadcaster.x_username}`}
                className="text-blue-600 hover:underline font-medium text-lg"
            >
                @{broadcaster.x_username}
            </Link>
            <span className={`px-2 py-1 text-xs font-medium rounded ${status.color}`}>
                {status.label}
            </span>
        </div>
    );
}
