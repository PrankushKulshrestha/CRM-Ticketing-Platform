
import { useQuery } from "@tanstack/react-query";
import { customerApi } from "../api/customerApi";
import type { CustomerFilters } from "../types/customer.types";
import { QUERY_KEYS } from "@/lib/queryKeys";

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.customers(filters),
    queryFn: () => customerApi.getCustomers(filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}