import { apiClient } from "@/lib/api/apiClient";

export type TimeFrame = "1h" | "24h" | "7d" | "30d" | "all" | "custom";

const base = "/sla-analytics";

const p = (frame: TimeFrame, start?: string, end?: string) => ({
  params: { frame, ...(start ? { start } : {}), ...(end ? { end } : {}) },
});

export const slaAnalyticsApi = {
  getViolations: (frame: TimeFrame, start?: string, end?: string) =>
    apiClient.get<{
      success: boolean;
      data: {
        violations: number;
        total: number;
        adherence_rate: number;
        trend: { _id: string; count: number }[];
      };
    }>(`${base}/violations`, p(frame, start, end)),

  getAdherenceVsViolated: (frame: TimeFrame, start?: string, end?: string) =>
    apiClient.get<{
      success: boolean;
      data: {
        total: number;
        adhered: number;
        violated: number;
        adherence_rate: number;
        violation_rate: number;
      };
    }>(`${base}/adherence`, p(frame, start, end)),

  getViolationsByAgent: (frame: TimeFrame, start?: string, end?: string) =>
    apiClient.get<{
      success: boolean;
      data: { agent_id: string; agent_name: string; agent_email: string; count: number }[];
    }>(`${base}/violations/by-agent`, p(frame, start, end)),

  getViolationsBySLA: (frame: TimeFrame, start?: string, end?: string) =>
    apiClient.get<{
      success: boolean;
      data: { priority: string; sla_name: string; count: number; violated: number }[];
    }>(`${base}/violations/by-sla`, p(frame, start, end)),

  getComplianceByTeam: (frame: TimeFrame, team?: string, start?: string, end?: string) =>
    apiClient.get<{
      success: boolean;
      data: {
        total: number;
        adhered: number;
        violated: number;
        compliance_rate: number;
        by_team: { team_id: string; team_name: string; total: number; adhered: number; violated: number; compliance_rate: number }[];
      };
    }>(`${base}/compliance/by-team`, { params: { frame, ...(team ? { team } : {}), ...(start ? { start } : {}), ...(end ? { end } : {}) } }),

  getViolationsByStatus: (frame: TimeFrame, start?: string, end?: string) =>
    apiClient.get<{
      success: boolean;
      data: { status: string; count: number }[];
    }>(`${base}/violations/by-status`, p(frame, start, end)),
};
