import { apiClient } from "@/lib/api/apiClient";

export interface MetricDefinition {
  key: string;
  label: string;
  weight: number;
  higher_is_better: boolean;
  max_value: number;
  enabled: boolean;
  is_builtin: boolean;
}

export interface ScoringScheme {
  _id?: string;
  name: string;
  description?: string;
  metrics: MetricDefinition[];
  display_mode: "percentage" | "points";
  period: "monthly" | "weekly" | "all_time";
}

export interface AgentScore {
  agent: { id: string; name: string; email: string };
  score: number;
  breakdown: Record<string, { value: number; normalized: number; contribution: number; weight: number }>;
  raw: { tickets_solved: number; sla_adherence: number; mttr_minutes: number; csat: number | null };
  period: string;
  since: string;
}

export const agentScoringApi = {
  getScheme: () =>
    apiClient.get<{ success: boolean; data: ScoringScheme }>("/agent-scoring/scheme"),

  updateScheme: (data: Partial<ScoringScheme>) =>
    apiClient.put<{ success: boolean; data: ScoringScheme }>("/agent-scoring/scheme", data),

  getScores: (period?: "monthly" | "weekly" | "all_time") =>
    apiClient.get<{ success: boolean; data: AgentScore[] }>("/agent-scoring/scores", {
      params: period ? { period } : undefined,
    }),
};
