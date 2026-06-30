
/**
 * Build a URLSearchParams string from a plain object.
 * Skips undefined / null values automatically.
 *
 * Previously duplicated inside every feature API file:
 *   customerApi.ts, automationApi.ts, ticketApi.ts, analyticsApi.ts
 *
 * Usage:
 *   const qs = buildParams({ page: 1, search: "foo", status: undefined });
 *   // → "page=1&search=foo"
 *   apiClient.get(`/tickets?${qs}`)
 */
export function buildParams<T extends object>(filters: T): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters) as Array<
    [string, string | number | boolean | undefined | null]
  >) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  return params.toString();
}