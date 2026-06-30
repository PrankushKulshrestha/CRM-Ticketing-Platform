
// ---------------------------------------------------------------------------
// Initials & Avatar helpers
// Previously inlined in CustomerAvatar.tsx
// ---------------------------------------------------------------------------

/**
 * Extract up to 2 initials from a display name.
 * "John Doe" → "JD", "Alice" → "AL", "" → "?"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic integer hash of a string (djb2 variant).
 * Used to pick a stable avatar background colour.
 */
export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Label formatting
// Previously inlined in StatusTimeline.tsx
// ---------------------------------------------------------------------------

/**
 * Convert a snake_case or kebab-case token into Title Case.
 * "in_progress" → "In Progress"
 */
export function formatLabel(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Generic string helpers
// ---------------------------------------------------------------------------

/** Truncate a string to maxLength, appending "…" when cut. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/** Normalise a string to lowercase trimmed form (useful for comparisons). */
export function normalise(str: string): string {
  return str.trim().toLowerCase();
}