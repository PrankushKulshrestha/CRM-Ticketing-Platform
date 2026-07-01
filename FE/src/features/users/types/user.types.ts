// src/features/users/types/user.types.ts

export type UserRole = "admin" | "manager" | "agent";

export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

// Mirrors BE createUserSchema (validators/user.validator.ts)
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: ManagedUser;
}
