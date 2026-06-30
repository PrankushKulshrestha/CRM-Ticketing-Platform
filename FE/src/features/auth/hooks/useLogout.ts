
// src/features/auth/hooks/useLogout.ts

import { useMutation } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/AuthProvider";

import routes from "@/config/routes";

export function useLogout() {
  const navigate = useNavigate();

  const { logout } = useAuth();

  return useMutation<void, Error>({
    mutationKey: ["auth", "logout"],

    mutationFn: async (): Promise<void> => {
      await logout();
    },

    onSuccess: () => {
      navigate(
        routes.login,
        {
          replace: true,
        },
      );
    },

    onError: (error) => {
      console.error(
        "[LOGOUT_MUTATION_ERROR]",
        error,
      );
    },
  });
}

export default useLogout;