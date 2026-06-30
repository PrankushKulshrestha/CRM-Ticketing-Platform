
import type { Request } from "express";

/*
|--------------------------------------------------------------------------
| Core Utility Types
|--------------------------------------------------------------------------
*/

export type ID = string;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

/*
|--------------------------------------------------------------------------
| Base Entity (DB Standard Shape)
|--------------------------------------------------------------------------
*/

export interface BaseEntity {
  _id: ID;
  createdAt: Date;
  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Pagination System
|--------------------------------------------------------------------------
*/

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/*
|--------------------------------------------------------------------------
| Standard API Response (Single Source of Truth)
|--------------------------------------------------------------------------
| Used across ALL modules (auth, tickets, users, analytics, etc.)
|--------------------------------------------------------------------------
*/

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;

  data?: T;
  meta?: PaginationMeta;

  timestamp?: string;
}

/*
|--------------------------------------------------------------------------
| Sorting & Filtering
|--------------------------------------------------------------------------
*/

export type SortOrder = "asc" | "desc";

export interface SortOptions {
  field: string;
  order: SortOrder;
}

export interface FilterQuery {
  [key: string]: unknown;
}

/*
|--------------------------------------------------------------------------
| Generic Domain Enums
|--------------------------------------------------------------------------
*/

export type Status = "active" | "inactive";

export type Priority = "low" | "medium" | "high" | "urgent";

/*
|--------------------------------------------------------------------------
| Audit Fields (Cross-module consistency layer)
|--------------------------------------------------------------------------
*/

export interface AuditFields {
  createdBy?: ID;
  updatedBy?: ID;
  deletedBy?: ID;
}

/*
|--------------------------------------------------------------------------
| Express Auth Extension (Generic & Reusable)
|--------------------------------------------------------------------------
| Used instead of duplicating AuthenticatedRequest everywhere
|--------------------------------------------------------------------------
*/

export interface AuthRequest<TUser = unknown> extends Request {
  user?: TUser;
}