/**
 * Tag normalization and validation utilities
 */

const MAX_TAG_LENGTH = 50;
const MIN_TAG_LENGTH = 1;

/**
 * Normalize a raw tag string for consistent storage and URL matching
 * - Decode URI components
 * - Trim whitespace
 * - Convert to lowercase
 * - Returns null if invalid
 */
export function normalizeTag(rawTag: string): string | null {
    try {
        // Decode URI component (handles %20 etc)
        let normalized = decodeURIComponent(rawTag);

        // Trim and lowercase
        normalized = normalized.trim().toLowerCase();

        // Validate
        if (!isValidTag(normalized)) {
            return null;
        }

        return normalized;
    } catch (error) {
        // Invalid URI encoding
        console.error('Failed to normalize tag:', error);
        return null;
    }
}

/**
 * Validate a tag string
 * - Length between MIN_TAG_LENGTH and MAX_TAG_LENGTH
 * - Not empty after trimming
 */
export function isValidTag(tag: string): boolean {
    const trimmed = tag.trim();
    return trimmed.length >= MIN_TAG_LENGTH && trimmed.length <= MAX_TAG_LENGTH;
}

/**
 * Encode a tag for use in URLs
 */
export function encodeTag(tag: string): string {
    return encodeURIComponent(tag);
}
