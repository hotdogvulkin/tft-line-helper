/**
 * Normalize a string for fuzzy matching:
 * lowercase, unify apostrophes/quotes, strip punctuation and extra spaces.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9 ']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check whether two augment strings match after normalization.
 * Also handles partial substring matching for meta-label style entries.
 */
export function augmentMatches(a: string, b: string): boolean {
  return normalize(a) === normalize(b)
}
