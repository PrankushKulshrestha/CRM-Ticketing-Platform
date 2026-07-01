/**
 * Escapes characters that have special meaning in a JS regular expression.
 *
 * User-supplied search strings are frequently passed straight into
 * `$regex` filters. Without escaping, a value like `(a+)+$` or `.*.*.*`
 * can cause catastrophic backtracking (ReDoS) or unintended pattern
 * matching. Always run free-text search input through this before
 * building a RegExp / $regex filter.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
