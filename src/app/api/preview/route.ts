import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchPreview } from '@/lib/preview/fetchPreview';
import { shouldRetryFetch } from '@/lib/preview/previewUtils';

export const dynamic = 'force-dynamic'; // No static caching for API

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const broadcastId = searchParams.get('broadcast_id');

    if (!broadcastId) {
        return NextResponse.json({ success: false, error: 'Missing broadcast_id' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // 1. Get Broadcast
    const { data: broadcast, error } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .single();

    if (error || !broadcast) {
        return NextResponse.json({ success: false, error: 'Broadcast not found' }, { status: 404 });
    }

    // 2. Check if we need to fetch
    if (!shouldRetryFetch(broadcast)) {
        // Return cached data
        console.log(`[PreviewAPI] Returning cached data for ${broadcastId}, status: ${broadcast.preview_fetch_status}`);
        return NextResponse.json({
            success: true,
            preview: {
                title: broadcast.preview_title,
                description: broadcast.preview_description,
                image_url: broadcast.preview_image_url,
                site: broadcast.preview_site,
                status: broadcast.preview_fetch_status,
                fetched_at: broadcast.preview_fetched_at,
            },
            cached: true
        });
    }

    // 3. Locking (Set status to 'fetching')
    const now = new Date().toISOString();
    await supabase
        .from('broadcasts')
        .update({
            preview_fetch_status: 'fetching',
            preview_fetched_at: now,
        })
        .eq('id', broadcast.id);

    // 4. Fetch External
    console.log(`[PreviewAPI] Fetching external for ${broadcastId} (${broadcast.broadcast_url})`);
    const result = await fetchPreview(broadcast.broadcast_url);

    console.log(`[PreviewAPI] Fetch result for ${broadcastId}:`, {
        status: result.status,
        title: result.title?.substring(0, 50) || null,
        hasDescription: !!result.description,
        hasImage: !!result.imageUrl,
        site: result.site
    });

    // 5. Update DB
    const updatePayload = {
        preview_title: result.title,
        preview_description: result.description,
        preview_image_url: result.imageUrl,
        preview_site: result.site,
        preview_fetch_status: result.status,
        preview_fetched_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
        .from('broadcasts')
        .update(updatePayload)
        .eq('id', broadcast.id);

    if (updateError) {
        console.error(`[PreviewAPI] DB update error:`, updateError);
    } else {
        console.log(`[PreviewAPI] Successfully updated DB with status: ${updatePayload.preview_fetch_status}`);
    }

    return NextResponse.json({
        success: true,
        preview: {
            title: updatePayload.preview_title,
            description: updatePayload.preview_description,
            image_url: updatePayload.preview_image_url,
            site: updatePayload.preview_site,
            status: updatePayload.preview_fetch_status,
            fetched_at: updatePayload.preview_fetched_at,
        },
        cached: false
    });
}
