'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
    totalCount: number;
    currentPage: number;
    limit: number;
}

export default function Pagination({ totalCount, currentPage, limit }: PaginationProps) {
    const searchParams = useSearchParams();
    const totalPages = Math.ceil(totalCount / limit);

    if (totalPages <= 1) return null;

    // Helper to create page link preserving other params
    const createPageLink = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        return `/?${params.toString()}`;
    };

    return (
        <div className="flex justify-center items-center gap-6 mt-10 mb-8">
            {currentPage > 1 ? (
                <Link
                    href={createPageLink(currentPage - 1)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                    &lt; 前へ
                </Link>
            ) : (
                <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-300 cursor-not-allowed font-medium">
                    &lt; 前へ
                </span>
            )}

            <span className="text-gray-600 font-medium font-mono">
                {currentPage} / {totalPages}
            </span>

            {currentPage < totalPages ? (
                <Link
                    href={createPageLink(currentPage + 1)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                    次へ &gt;
                </Link>
            ) : (
                <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-300 cursor-not-allowed font-medium">
                    次へ &gt;
                </span>
            )}
        </div>
    );
}
