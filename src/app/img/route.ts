import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Cloudflare Workers / Edge runtime preferred for proxy

export async function GET(request: NextRequest) {
    const urlParams = request.nextUrl.searchParams;
    const targetUrl = urlParams.get('u');

    if (!targetUrl) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    // 1. Security Checks (SSRF Basic)
    try {
        const urlObj = new URL(targetUrl);

        // Only allow HTTPS
        if (urlObj.protocol !== 'https:') {
            return new NextResponse('Only HTTPS allowed', { status: 400 });
        }

        // (Optional) Block private IPs if needed, but for MVP just trusting standard fetch behavior to some extent + protocol check
        // Cloudflare workers often have some built-in protections, but be careful.

    } catch {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    // 2. Cloudflare Cache Lookup
    // In Next.js on Cloudflare Pages/Workers, 'caches' is available in global scope.
    // We use type assertion to avoid TS errors if types aren't perfect.
    const cacheKey = new Request(request.url, request);
    // @ts-ignore
    const cache = typeof caches !== 'undefined' ? (caches as any).default : null;

    let response = cache ? await cache.match(cacheKey) : null;

    if (!response) {
        // 3. Fetch (Origin)
        try {
            // Limit redirects and timeout manually if platform doesn't support options standardly
            // But fetch usually handles standard usage. 
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

            const originResponse = await fetch(targetUrl, {
                signal: controller.signal,
                redirect: 'follow', // standard fetch follows redirects
                headers: {
                    'User-Agent': 'LiveShelf-ImageProxy/1.0'
                }
            });
            clearTimeout(timeoutId);

            if (!originResponse.ok) {
                return new NextResponse(`Failed to fetch image: ${originResponse.status}`, { status: 502 });
            }

            const contentType = originResponse.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                return new NextResponse('Invalid content-type', { status: 400 });
            }

            // 4. Create Response for Cache
            // Copy body
            const body = originResponse.body;

            response = new NextResponse(body, {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, s-maxage=2592000, max-age=2592000', // 30 days
                    'Access-Control-Allow-Origin': '*', // Allow use in <img> tags cleanly
                }
            });

            // 5. Save to Cache
            if (cache) {
                // Clone because body is stream
                try {
                    await cache.put(cacheKey, response.clone());
                } catch (e) {
                    console.error('Cache put failed', e);
                }
            }

        } catch (err) {
            console.error('Image proxy error:', err);
            return new NextResponse('Internal Proxy Error', { status: 500 });
        }
    }

    return response;
}
