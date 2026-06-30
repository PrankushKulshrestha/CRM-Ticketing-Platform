
import { useCallback } from "react";
import type { AxiosError } from "axios";

interface ApiErrorBody {
  message?: string;
  error?: string;
}

/**
 * Normalise an unknown error (Axios, plain Error, string) to a
 * human-readable message string.
 *
 * @example
 *   const { formatError } = useApiError();
 *   toast.error(formatError(mutation.error));
 */
export function useApiError() {
  const formatError = useCallback((error: unknown): string => {
    if (!error) return "Something went wrong";

    // Axios error with a structured body
    const axiosError = error as AxiosError<ApiErrorBody>;
    if (axiosError.isAxiosError) {
      return (
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        axiosError.message ??
        "Request failed"
      );
    }

    if (error instanceof Error) return error.message;

    if (typeof error === "string") return error;

    return "Something went wrong";
  }, []);

  return { formatError };
}