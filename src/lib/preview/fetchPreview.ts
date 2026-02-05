import { type Broadcast } from '@/types/home';

export type PreviewFetchResult = {
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    site: 'x' | 'twitter' | 'other' | 'unknown';
    status: 'success' | 'partial' | 'fail';
    author?: string | null;
};

const TIMEOUT_MS = 3000;
const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * X/Twitter URL判定
 */
function isXUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('x.com') || urlObj.hostname.includes('twitter.com');
    } catch {
        return false;
    }
}

/**
 * Microlink APIを使用してプレビュー取得（X/Twitter専用）
 */
async function fetchPreviewWithMicrolink(targetUrl: string): Promise<PreviewFetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒に延長

    try {
        const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&prerender=true`;

        console.log(`[Microlink] Fetching: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            signal: controller.signal,
        });

        console.log(`[Microlink] Response status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`Microlink API error: ${response.status}`);
        }

        const json = await response.json();
        console.log(`[Microlink] Response data:`, {
            status: json.status,
            hasData: !!json.data,
            hasTitle: !!json.data?.title,
            hasImage: !!json.data?.image
        });

        if (json.status === 'success' && json.data) {
            const data = json.data;

            // サイト判定
            const site = targetUrl.includes('x.com') ? 'x' : 'twitter';

            // ステータス判定
            let status: PreviewFetchResult['status'] = 'fail';
            if (data.title && data.image?.url) {
                status = 'success';
            } else if (data.title || data.image?.url) {
                status = 'partial';
            }

            return {
                title: data.title || null,
                description: data.description || null,
                imageUrl: data.image?.url || null,
                site,
                status,
                author: data.author || null
            };
        }

        throw new Error('Microlink returned unsuccessful status');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Microlink] Fetch failed for ${targetUrl}:`, errorMessage);

        // タイムアウトの場合
        if (errorMessage.includes('abort')) {
            console.warn(`[Microlink] Timeout - URL may not be supported: ${targetUrl}`);
        }

        return {
            title: null,
            description: null,
            imageUrl: null,
            site: targetUrl.includes('x.com') ? 'x' : 'twitter',
            status: 'fail',
            author: null
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * 直接fetch方式（X以外のサイト用）
 */
async function fetchPreviewDirect(targetUrl: string): Promise<PreviewFetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'LiveShelf-Preview/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
            return { title: null, description: null, imageUrl: null, site: 'unknown', status: 'fail' };
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        let chunks: Uint8Array[] = [];
        let receivedLength = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (value) {
                    if (receivedLength + value.length > MAX_BODY_SIZE) {
                        const remaining = MAX_BODY_SIZE - receivedLength;
                        if (remaining > 0) {
                            chunks.push(value.slice(0, remaining));
                            receivedLength += remaining;
                        }
                        break;
                    }

                    chunks.push(value);
                    receivedLength += value.length;
                }
            }
        } finally {
            reader.releaseLock();
        }

        const combinedBuffer = new Uint8Array(receivedLength);
        let offset = 0;
        for (const chunk of chunks) {
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        const html = new TextDecoder("utf-8").decode(combinedBuffer);

        const getMetaContent = (prop: string) => {
            const regex = new RegExp(
                `<meta\\s+(?:property|name)=["']?${prop}["']?\\s+content=["'](.*?)["']`,
                'i'
            );
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        const ogTitle = getMetaContent('og:title');
        const twTitle = getMetaContent('twitter:title');
        const title = ogTitle || twTitle || (html.match(/<title>(.*?)<\/title>/i)?.[1]) || null;

        const ogDesc = getMetaContent('og:description');
        const twDesc = getMetaContent('twitter:description');
        const description = ogDesc || twDesc || getMetaContent('description') || null;

        const author = getMetaContent('author') || getMetaContent('twitter:creator') || null;

        const ogImage = getMetaContent('og:image');
        const twImage = getMetaContent('twitter:image');
        let imageUrl = ogImage || twImage || null;

        if (imageUrl && !imageUrl.startsWith('http')) {
            try {
                imageUrl = new URL(imageUrl, targetUrl).toString();
            } catch {
                imageUrl = null;
            }
        }

        const ogSiteName = getMetaContent('og:site_name');
        let site: PreviewFetchResult['site'] = 'unknown';

        if (ogSiteName) {
            const lower = ogSiteName.toLowerCase();
            if (lower === 'x' || lower.includes('twitter')) {
                site = targetUrl.includes('x.com') ? 'x' : 'twitter';
            } else {
                site = 'other';
            }
        } else {
            try {
                const urlObj = new URL(targetUrl);
                const hostname = urlObj.hostname;
                if (hostname.includes('twitter.com')) site = 'twitter';
                else if (hostname.includes('x.com')) site = 'x';
                else site = 'other';
            } catch {
                site = 'unknown';
            }
        }

        let status: PreviewFetchResult['status'] = 'fail';
        if (title && imageUrl) {
            status = 'success';
        } else if (title || imageUrl) {
            status = 'partial';
        }

        return {
            title,
            description,
            imageUrl,
            site,
            status,
            author
        };

    } catch (error) {
        console.error(`Preview fetch failed for ${targetUrl}:`, error);
        return {
            title: null,
            description: null,
            imageUrl: null,
            site: 'unknown',
            status: 'fail',
            author: null
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * プレビュー取得（X/Twitterの場合はMicrolink、それ以外は直接fetch）
 */
export async function fetchPreview(targetUrl: string): Promise<PreviewFetchResult> {
    if (isXUrl(targetUrl)) {
        console.log(`[fetchPreview] Using Microlink API for X/Twitter URL: ${targetUrl}`);
        return fetchPreviewWithMicrolink(targetUrl);
    } else {
        console.log(`[fetchPreview] Using direct fetch for URL: ${targetUrl}`);
        return fetchPreviewDirect(targetUrl);
    }
}
