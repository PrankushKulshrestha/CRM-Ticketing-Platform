
import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shared Regex
|--------------------------------------------------------------------------
*/

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10,15}$/;

/*
|--------------------------------------------------------------------------
| Base Reusable Schemas (Single Source of Truth)
|--------------------------------------------------------------------------
*/

export const BaseSchemas = {
  id: z.string().trim().min(1, "Invalid ID"),

  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(EMAIL_REGEX, "Invalid email format"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Must include uppercase letter")
    .regex(/[a-z]/, "Must include lowercase letter")
    .regex(/[0-9]/, "Must include number"),

  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Invalid phone number")
    .optional(),
};

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
*/

export const createUserSchema = z.object({
  name: BaseSchemas.name,
  email: BaseSchemas.email,
  password: BaseSchemas.password,

  role: z.string().trim().default("user"),
  phone: BaseSchemas.phone,
  isActive: z.boolean().default(true),
});

/*
|--------------------------------------------------------------------------
| Update User (PATCH-safe)
|--------------------------------------------------------------------------
*/

export const updateUserSchema = z.object({
  id: BaseSchemas.id,

  name: BaseSchemas.name.optional(),
  email: BaseSchemas.email.optional(),

  role: z.string().trim().optional(),
  phone: BaseSchemas.phone,

  isActive: z.boolean().optional(),
});

/*
|--------------------------------------------------------------------------
| Get Users Query (Safe + Normalized)
|--------------------------------------------------------------------------
*/

const toNumber = (val: unknown, fallback: number) => {
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => toNumber(v, 1)),

  limit: z
    .string()
    .optional()
    .transform((v) => toNumber(v, 10)),

  search: z.string().trim().optional(),

  role: z.string().trim().optional(),

  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    }),
});

/*
|--------------------------------------------------------------------------
| ID Schemas (explicit reuse for routes)
|--------------------------------------------------------------------------
*/

export const getUserByIdSchema = z.object({
  id: BaseSchemas.id,
});

export const deleteUserSchema = z.object({
  id: BaseSchemas.id,
});

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;