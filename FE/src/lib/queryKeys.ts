/**
 * src/lib/queryKeys.ts — centralised TanStack Query key registry
 *
 * Single source of truth for all query keys.
 * Import with:  import { QUERY_KEYS, QUERY_ROOTS } from "@/lib/queryKeys"
 *
 * FIX: src/config/queryKeys.ts was removed — it had zero importers anywhere
 * in the project despite a comment here claiming it was "kept for the
 * ProtectedRoute / config layer." This file is the only query-key registry.
 */

export const QUERY_KEYS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUser: () => ["current-user"] as const,

  // ── Tickets ───────────────────────────────────────────────────────────────
  tickets:        (filters?: object) => ["tickets", filters]        as const,
  ticket:         (id: string)       => ["tickets", id]              as const,
  ticketComments: (id: string)       => ["tickets", id, "comments"]  as const,
  ticketFeedback: (id: string)       => ["tickets", id, "feedback"]  as const,

  // ── SLA Policy ────────────────────────────────────────────────────────────
  slaPolicy: () => ["sla", "policy"] as const,

  // ── Customers ─────────────────────────────────────────────────────────────
  customers: (filters?: object) => ["customers", filters] as const,
  customer:  (id: string)       => ["customers", id]      as const,

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: (period?: string | object) => ["dashboard", period] as const,

  // ── Analytics ─────────────────────────────────────────────────────────────
  analytics:           (period?: string | object) => ["analytics", "dashboard", period] as const,
  responseTimes:       (months?: number)           => ["analytics", "response-times", months] as const,
  resolutionHistogram: (range?: object)            => ["analytics", "resolution-histogram", range] as const,

  // ── Automation ────────────────────────────────────────────────────────────
  automation: (filters?: object) => ["automation", filters] as const,

  // ── Teams ─────────────────────────────────────────────────────────────────
  /*
   * FIX: was `teams: () => ["teams"] as const` — zero-arity, but
   * useTeams.ts calls `QUERY_KEYS.teams(filters)` and `QUERY_KEYS.team(id)`.
   * Neither matched this file as it actually existed in the project,
   * which would fail to compile. Aligned to what the hook actually calls,
   * keeping the flat ["teams", filters] shape consistent with every other
   * entry in this file (tickets/customers/automation), rather than the
   * ["teams", "list"/"detail", ...] shape from an earlier, divergent patch.
   */
  teams: (filters?: object) => ["teams", filters] as const,
  team:  (id: string)       => ["teams", id]      as const,

  // ── Mailboxes ─────────────────────────────────────────────────────────────
  mailboxes: () => ["mailboxes"] as const,

  // ── Reports ───────────────────────────────────────────────────────────────
  reports: (filters?: object) => ["reports", filters] as const,
} as const;

/**
 * Root keys per domain — pass to invalidateQueries to bust the whole domain.
 *
 * @example
 *   queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.tickets })
 */
export const QUERY_ROOTS = {
  tickets:    ["tickets"]    as const,
  customers:  ["customers"]  as const,
  automation: ["automation"] as const,
  teams:      ["teams"]      as const,
  mailboxes:  ["mailboxes"]  as const,
  reports:    ["reports"]    as const,
  dashboard:  ["dashboard"]  as const,
  analytics:  ["analytics"]  as const,
} as const;
