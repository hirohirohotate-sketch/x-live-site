import Link from 'next/link';

interface SearchEmptyStateProps {
    hasQuery: boolean;
}

export default function SearchEmptyState({ hasQuery }: SearchEmptyStateProps) {
    if (!hasQuery) {
        // クエリが空の場合：使い方を案内
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="max-w-md space-y-4">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                        配信者やアーカイブを検索
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        配信者名、タグ、メモの内容で検索できます。
                    </p>
                    <div className="pt-2">
                        <p className="text-sm text-gray-500 mb-2">検索例:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                                vtuber
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                                game
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                                @username
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 結果が0件の場合
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="max-w-md space-y-4">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-2xl font-semibold text-gray-900">
                    見つかりませんでした
                </h2>
                <p className="text-gray-600 leading-relaxed">
                    検索条件に一致する結果がありません。
                    <br />
                    別のキーワードで試してみてください。
                </p>
                <div className="pt-4">
                    <p className="text-sm text-gray-600 mb-3">
                        お探しの配信がまだ登録されていない場合は、
                    </p>
                    <Link
                        href="/add"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        配信URLを追加して棚を育てる
                    </Link>
                </div>
            </div>
        </div>
    );
}
