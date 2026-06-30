
import type { AnalyticsDashboard, SLALevelHealthPoint } from "../types/analytics.types";

type NormalizedAnalytics = {
  metrics: {
    resolvedToday: number;
    avgResolutionTime: number;
    slaBreaches: number;
    slaCompliance: number;
    customerSatisfaction: number;
  };
  charts: {
    statusDistribution: any[];
    categoryDistribution: any[];
    subCategoryDistribution: any[];
    agentPerformance: any[];
    slaByLevel: SLALevelHealthPoint[];
  };
};

export function normalizeAnalyticsDashboard(
  input: AnalyticsDashboard,
): NormalizedAnalytics {
  const metrics = input?.metrics ?? {};

  return {
    metrics: {
      resolvedToday: Number(metrics.resolvedToday || 0),
      avgResolutionTime: Number(metrics.avgResolutionTime || 0),
      slaBreaches: Number(metrics.slaBreaches || 0),
      slaCompliance: Number(metrics.slaCompliance || 0),
      customerSatisfaction: Number(metrics.customerSatisfaction || 0),
    },

    charts: {
      statusDistribution: input?.charts?.statusDistribution ?? [],
      categoryDistribution: input?.charts?.categoryDistribution ?? [],
      subCategoryDistribution: input?.charts?.subCategoryDistribution ?? [],
      agentPerformance: input?.charts?.agentPerformance ?? [],
      slaByLevel: input?.charts?.slaByLevel ?? [],
    },
  };
}
