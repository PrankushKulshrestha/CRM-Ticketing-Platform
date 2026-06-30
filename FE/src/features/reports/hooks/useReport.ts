
import { useQuery } from "@tanstack/react-query";
import { reportApi } from "../api/reportApi";
import type { ReportFilters } from "../types/report.types";

export function useReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ["reports", filters],
    queryFn:  () => reportApi.getReport(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}