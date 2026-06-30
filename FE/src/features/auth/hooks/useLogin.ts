
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/app/providers/AuthProvider";
import type { LoginPayload } from "../types/auth.types";

export function useLogin(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const { login } = useAuth();

  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: async (payload: LoginPayload) => {
      await login(payload);
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("[LOGIN_MUTATION_ERROR]", error);
      options?.onError?.(error);
    },
  });
}

export default useLogin;