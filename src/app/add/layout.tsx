import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AddLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        // Redirect to login with returnTo parameter
        redirect('/login?returnTo=/add');
    }

    return <>{children}</>;
}
