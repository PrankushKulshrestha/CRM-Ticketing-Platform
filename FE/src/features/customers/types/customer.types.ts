
import type { ApiListResponse } from "@/types";

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

export type CustomersResponse = ApiListResponse<Customer>;

export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
}