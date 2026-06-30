
import { AnalyticsCharts } from "../types/analytics.types";

// utils/safeAnalytics.ts
export function safeAnalyticsCharts(charts?: AnalyticsCharts) {
  return {
    trends: charts?.trends ?? [],
    statusDistribution: charts?.statusDistribution ?? [],
    categoryDistribution: charts?.categoryDistribution ?? [],
    subCategoryDistribution: charts?.subCategoryDistribution ?? [],
    agentPerformance: charts?.agentPerformance ?? [],
  };
}