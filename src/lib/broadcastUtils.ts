/**
 * broadcast URLから broadcast_id を抽出
 */
export function extractBroadcastId(url: string): string | null {
    const pattern = /\/i\/broadcasts\/([A-Za-z0-9_-]+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
}

/**
 * broadcast_id から正規化URLを生成
 */
export function normalizeBroadcastUrl(broadcastId: string): string {
    return `https://x.com/i/broadcasts/${broadcastId}`;
}

/**
 * username を正規化（trim → @除去 → 小文字化 → 空ならnull）
 */
export function normalizeUsername(username: string | undefined | null): string | null {
    if (!username) return null;

    const trimmed = username.trim();
    if (!trimmed) return null;

    const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
    const normalized = withoutAt.toLowerCase();

    return normalized || null;
}

/**
 * テキストから username を抽出
 * 対応フォーマット:
 * - "Name (@username)"
 * - "@username"
 * - "username"
 */
export function extractUsernameFromText(text: string | null | undefined): string | null {
    if (!text) return null;

    // 1. "(@username)" pattern (common in OGP)
    const parenMatch = text.match(/\(@([a-zA-Z0-9_]+)\)/);
    if (parenMatch) return normalizeUsername(parenMatch[1]);

    // 2. "@username" at start
    if (text.trim().startsWith('@')) {
        const atMatch = text.trim().match(/^@([a-zA-Z0-9_]+)/);
        if (atMatch) return normalizeUsername(atMatch[1]);
    }

    // 3. Just username (alphanumeric + underscore only)
    if (/^[a-zA-Z0-9_]+$/.test(text.trim())) {
        return normalizeUsername(text);
    }

    return null;
}

/**
 * タグ文字列をパース（カンマ区切り → trim → 小文字化 → 重複除去 → 最大10個）
 */
export function parseTags(tagsString: string | undefined): string[] {
    if (!tagsString) return [];

    const tags = tagsString
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

    // 重複除去
    const uniqueTags = Array.from(new Set(tags));

    // 最大10個
    return uniqueTags.slice(0, 10);
}
