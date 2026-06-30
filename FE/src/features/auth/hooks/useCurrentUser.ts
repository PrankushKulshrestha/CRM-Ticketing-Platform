
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api/authApi";
import { getAccessToken } from "../utils/authStorage";
import { QUERY_KEYS } from "@/lib/queryKeys";

export function useCurrentUser() {
  const hasToken = Boolean(getAccessToken());

  return useQuery({
    queryKey: QUERY_KEYS.currentUser(),
    queryFn:  getCurrentUser,
    enabled:  hasToken,
    staleTime: 5 * 60_000,
    gcTime:    10 * 60_000,
    retry: 1,
  });
}