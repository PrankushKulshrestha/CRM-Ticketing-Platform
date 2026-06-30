
/*
 * FIX (duplication reduction): PaginationMeta below was an exact duplicate
 * of common.types.ts's PaginationMeta. Now imported from the single
 * canonical source.
 */
import type { PaginationMeta } from "./common.types";

/* -------------------------------------------------------------------------- */
/* Customer — VIRTUAL RESOURCE                                                */
/* There is no Customer collection. Each row is derived by grouping Ticket    */
/* documents by eml_ticket_created_for. See customer.service.ts.              */
/* -------------------------------------------------------------------------- */

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  totalTickets: number;
  openTickets: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
}

/* PaginationMeta now imported from common.types.ts — see top of file. */

export interface CustomersResult {
  data: Customer[];
  meta: PaginationMeta;
}