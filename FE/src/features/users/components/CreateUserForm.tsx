// src/features/users/components/CreateUserForm.tsx

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateUser } from "../api/userApi";
import type { UserRole } from "../types/user.types";

/* -------------------------------------------------------------------------- */
/* Validation — mirrors BE createUserSchema (validators/user.validator.ts)    */
/* -------------------------------------------------------------------------- */

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
  role: z.enum(["admin", "manager", "agent"]),
});

type FormValues = z.infer<typeof schema>;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "agent", label: "Agent" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

export default function CreateUserForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", password: "", role: "agent" },
  });

  const onSubmit = (values: FormValues) => {
    setSuccessMessage(null);
    createUserMutation.mutate(values, {
      onSuccess: (res) => {
        setSuccessMessage(`${res.data.name} was created successfully.`);
        reset();
      },
    });
  };

  const errorMessage =
    (createUserMutation.error as any)?.response?.data?.message ??
    "Failed to create user — please try again.";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" placeholder="Jane Doe" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      <Button type="submit" disabled={createUserMutation.isPending}>
        {createUserMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Create User
      </Button>

      {successMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
          {successMessage}
        </div>
      )}

      {createUserMutation.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </form>
  );
}
