import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserShelf } from '@/lib/user/getUserShelf';
import BroadcastCard from '@/components/BroadcastCard';

export default async function MyPage() {
    const supabase = await createSupabaseServerClient();

    // Check authentication with returnTo redirect
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login?returnTo=/me');
    }

    // Fetch user's shelf
    const { addedBroadcasts, contributedBroadcasts } = await getUserShelf(user.id);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 My Shelf</h1>
                    <p className="text-gray-600">あなたが育てた棚</p>
                </div>
            </div>

            {/* Section 1: Added Broadcasts */}
            <section className="max-w-7xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    📝 Added by You ({addedBroadcasts.length})
                </h2>

                {addedBroadcasts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            まだ何も追加していません
                        </h3>
                        <p className="text-gray-600 mb-6">
                            最初のブロードキャストを追加してみましょう
                        </p>
                        <Link
                            href="/add"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Add Broadcast
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {addedBroadcasts.map(broadcast => (
                            <BroadcastCard
                                key={broadcast.broadcast_id}
                                broadcast={broadcast}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Section 2: Contributed Notes */}
            <section className="max-w-7xl mx-auto px-4 py-8 pb-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    ✍️ Notes by You ({contributedBroadcasts.length})
                </h2>

                {contributedBroadcasts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">✏️</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            まだメモを書いていません
                        </h3>
                        <p className="text-gray-600 mb-6">
                            ブロードキャストにメモを追加してみましょう
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Browse Broadcasts
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contributedBroadcasts.map(broadcast => (
                            <BroadcastCard
                                key={broadcast.broadcast_id}
                                broadcast={broadcast}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
