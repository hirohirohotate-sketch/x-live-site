import { type Broadcast } from '@/types/home';

/**
 * Checks if the preview data is stale or if a retry is needed.
 * - 'fetching' state timing out (> 5 mins)
 * - 'fail' state expiring (> 24 hours)
 */
export function shouldRetryFetch(
    broadcast: Broadcast,
    currentDate: Date = new Date()
): boolean {
    const { preview_fetch_status, preview_fetched_at } = broadcast;

    // 1. Not fetched yet
    if (!preview_fetch_status || !preview_fetched_at) {
        return true;
    }

    const fetchedAt = new Date(preview_fetched_at).getTime();
    const now = currentDate.getTime();
    const diffMs = now - fetchedAt;
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMinutes / 60;

    // 2. Stuck in 'fetching'? (Timeout: 5 mins)
    if (preview_fetch_status === 'fetching') {
        return diffMinutes > 5;
    }

    // 3. 'fail' ? (Retry after 24 hours)
    if (preview_fetch_status === 'fail') {
        return diffHours > 24;
    }

    // 4. 'success' or 'partial' ? (Cache for 24 hours or longer, maybe 7 days? user said 24h fallback if failed)
    // User requirement: "If not missing or fail > 24h, fetch"
    // Does 'success' need refresh? Usually metadata doesn't change often.
    // Let's assume success is valid for a long time, or we don't refetch unless forced.
    // For now, only retry 'fail' or 'fetching'.
    return false;
}

/**
 * Checks if we can return the current DB data without fetching.
 * Typically inverse of shouldRetryFetch, but specifically checking if we have *something* usable or a valid 'fail' state to respect.
 */
export function isPreviewStale(broadcast: Broadcast): boolean {
    return shouldRetryFetch(broadcast);
}

// Define valid states constants if needed
export const PREVIEW_STATUS = {
    SUCCESS: 'success',
    PARTIAL: 'partial',
    FAIL: 'fail',
    FETCHING: 'fetching'
} as const;
