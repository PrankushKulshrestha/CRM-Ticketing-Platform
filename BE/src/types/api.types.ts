/**
 * @/types/api.types — shared API response shapes
 *
 * Previously PaginationMeta was copy-pasted into:
 *   - features/tickets/types/ticket.types.ts
 *   - features/customers/types/customer.types.ts
 *   - features/automation/types/automation.types.ts
 *
 * Now imported from here:
 *   import type { PaginationMeta, ApiResponse, ApiListResponse } from "@/types"
 */

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Generic API response envelopes
// ---------------------------------------------------------------------------

/** Single-item response */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

/** List response with pagination */
export interface ApiListResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  meta: PaginationMeta;
  timestamp?: string;
}

/** Bare list (no pagination), used by some endpoints */
export interface ApiArrayResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  timestamp?: string;
}