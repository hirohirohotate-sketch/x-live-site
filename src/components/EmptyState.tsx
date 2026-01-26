export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="max-w-md space-y-4">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-2xl font-semibold text-gray-900">
                    まだ棚がありません
                </h2>
                <p className="text-gray-600 leading-relaxed">
                    LiveShelfは、Xのライブ配信アーカイブを整理・管理するサービスです。
                    <br />
                    配信URLを追加すると、あなたの棚が育っていきます。
                </p>
                <div className="pt-4">
                    <button
                        className="px-6 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        disabled
                    >
                        アーカイブを追加（準備中）
                    </button>
                </div>
            </div>
        </div>
    );
}
