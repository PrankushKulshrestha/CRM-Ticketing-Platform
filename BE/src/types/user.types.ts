
import type { ID, PaginatedResponse } from "./common.types";

/*
|--------------------------------------------------------------------------
| User Roles (RBAC Core)
|--------------------------------------------------------------------------
*/

export type UserRole = "admin" | "manager" | "agent" | "customer";

/*
|--------------------------------------------------------------------------
| User Status (Lifecycle State)
|--------------------------------------------------------------------------
*/

export type UserStatus = "active" | "inactive" | "suspended";

/*
|--------------------------------------------------------------------------
| Core User Entity (DB Shape)
|--------------------------------------------------------------------------
| NOTE:
| - password is intentionally optional to avoid accidental exposure
|--------------------------------------------------------------------------
*/

export interface User {
  _id?: ID;

  id?: number;

  name: string;
  email: string;

  password?: string; // NEVER exposed in API responses

  role: UserRole;

  status?: UserStatus;
  isActive?: boolean;

  phone?: string;
  avatar?: string;

  lastLoginAt?: Date | string;

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/*
|--------------------------------------------------------------------------
| DTOs (Write Operations)
|--------------------------------------------------------------------------
*/

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;

  role?: UserRole;
  status?: UserStatus;

  phone?: string;
}

export type UpdateUserDto = Partial<CreateUserDto>;

/*
|--------------------------------------------------------------------------
| Query Filters
|--------------------------------------------------------------------------
*/

export interface UserFilters {
  search?: string;

  role?: UserRole;
  status?: UserStatus;

  isActive?: boolean;

  page?: number;
  limit?: number;
}

/*
|--------------------------------------------------------------------------
| Auth-safe User (Frontend / JWT-safe)
|--------------------------------------------------------------------------
| Minimal shape exposed after login or in auth context
|--------------------------------------------------------------------------
*/

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/*
|--------------------------------------------------------------------------
| JWT Payload (Auth Contract)
|--------------------------------------------------------------------------
*/

export interface UserJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/*
|--------------------------------------------------------------------------
| API Response Types
|--------------------------------------------------------------------------
*/

export type UserListResponse = PaginatedResponse<User>;