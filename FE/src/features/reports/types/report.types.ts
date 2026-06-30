
export type ReportPeriod = "7d" | "30d" | "90d" | "custom";

export interface ReportSummary {
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionTimeHours: number;
  slaBreaches: number;
  slaCompliancePercent: number;
  topCategory: string;
  topAgent: string;
}

export interface ReportTrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface ReportData {
  summary: ReportSummary;
  trends: ReportTrendPoint[];
  period: ReportPeriod;
  generatedAt: string;
}

export interface ReportFilters {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
}