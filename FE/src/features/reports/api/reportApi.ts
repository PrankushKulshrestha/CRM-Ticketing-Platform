
import { apiClient } from "@/lib/api/apiClient";
import type { ReportData, ReportFilters } from "../types/report.types";

export const reportApi = {
  async getReport(filters: ReportFilters): Promise<ReportData> {
    const params = new URLSearchParams();
    params.set("period", filters.period);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate)   params.set("endDate",   filters.endDate);

    const res = await apiClient.get<{ success: boolean; data: ReportData }>(
      `/reports/summary?${params.toString()}`,
    );
    return res.data;
  },
};