
import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shared Constants
|--------------------------------------------------------------------------
*/

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 100;

/*
|--------------------------------------------------------------------------
| Shared Password Schema (Single Source of Truth)
|--------------------------------------------------------------------------
*/

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, "Password must be at least 8 characters")
  .max(PASSWORD_MAX, "Password too long")
  .regex(/[A-Z]/, "Must include at least one uppercase letter")
  .regex(/[a-z]/, "Must include at least one lowercase letter")
  .regex(/[0-9]/, "Must include at least one number");

/*
|--------------------------------------------------------------------------
| Shared Email Schema
|--------------------------------------------------------------------------
*/

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format");

/*
|--------------------------------------------------------------------------
| Register Schema
|--------------------------------------------------------------------------
*/

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long")
    .trim(),

  email: emailSchema,

  password: passwordSchema,
});

/*
|--------------------------------------------------------------------------
| Login Schema
|--------------------------------------------------------------------------
*/

export const loginSchema = z.object({
  email: emailSchema,

  password: z.string().min(1, "Password is required"),
});

/*
|--------------------------------------------------------------------------
| Token Schemas
|--------------------------------------------------------------------------
*/

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, "Invalid refresh token"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  password: passwordSchema,
});

/*
|--------------------------------------------------------------------------
| Change Password Schema
|--------------------------------------------------------------------------
*/

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

/*
|--------------------------------------------------------------------------
| Inferred Types
|--------------------------------------------------------------------------
*/

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;