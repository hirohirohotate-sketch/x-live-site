import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function MePage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">User Info</h1>
                <p className="text-gray-600">Not logged in</p>
            </div>
        )
    }

    // Find Twitter/X identity from user.identities
    const twitterIdentity = user.identities?.find(
        (identity) => identity.provider === 'twitter' || identity.provider === 'x'
    )

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">User Info</h1>

            <div className="space-y-6">
                <section className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="font-semibold mb-2">Basic Info</h2>
                    <div className="space-y-1 text-sm">
                        <p><strong>User ID:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                        <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
                    </div>
                </section>

                {twitterIdentity ? (
                    <section className="bg-blue-50 p-4 rounded-lg">
                        <h2 className="font-semibold mb-2">X (Twitter) Identity</h2>
                        <div className="space-y-2">
                            <p className="text-sm"><strong>Provider:</strong> {twitterIdentity.provider}</p>
                            <p className="text-sm"><strong>Identity ID:</strong> {twitterIdentity.id}</p>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800">
                                    View Full Identity Data (JSON)
                                </summary>
                                <pre className="mt-2 p-3 bg-white rounded border border-gray-200 text-xs overflow-x-auto">
                                    {JSON.stringify(twitterIdentity, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </section>
                ) : (
                    <section className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">No Twitter/X identity found</p>
                    </section>
                )}

                <details className="bg-gray-50 p-4 rounded-lg">
                    <summary className="cursor-pointer font-semibold hover:text-gray-700">
                        View Full User Object (JSON)
                    </summary>
                    <pre className="mt-2 p-3 bg-white rounded border border-gray-200 text-xs overflow-x-auto">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    )
}
