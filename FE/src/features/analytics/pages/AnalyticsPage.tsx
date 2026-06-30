
import AnalyticsOverview from "../components/AnalyticsOverview";
import CustomerExperienceCard from "../components/CustomerExperienceCard";
import SLAHealthCard from "../components/SLAHealthCard";
import SLALevelHealthChart from "../components/SLALevelHealthChart";
import AnalyticsCharts from "../components/AnalyticsCharts";
import ResponseTimeChart from "../components/ResponseTimeChart";
import ResolutionHistogram from "../components/ResolutionHistogram";
import {
  useAnalytics,
  useResponseTimeAnalytics,
  useResolutionHistogram,
} from "../hooks/useAnalytics";
import { toChartItems } from "../types/chart.types";

/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="p-6 text-sm text-muted-foreground">
      Loading analytics dashboard...
    </div>
  );
}

function ErrorState() {
  return (
    <div className="p-6 text-sm text-red-500">
      Unable to load analytics. Please try again later.
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useAnalytics();
  const {
    data: responseTimeData,
    isLoading: isResponseTimeLoading,
    isError: isResponseTimeError,
    error: responseTimeError,
  } = useResponseTimeAnalytics();
  const {
    data: histogramData,
    isLoading: isHistogramLoading,
    isError: isHistogramError,
    error: histogramError,
  } = useResolutionHistogram();

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState />;

  const dashboard = data.data;

  const statusItems = toChartItems(
    Object.fromEntries(
      dashboard.charts.statusDistribution.map((i) => [i._id, i.value])
    )
  );

  const categoryItems = toChartItems(
    Object.fromEntries(
      dashboard.charts.categoryDistribution.map((i) => [i._id, i.value])
    )
  );

  return (
    <div className="space-y-10 p-6">
      <header>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      </header>

      <AnalyticsOverview data={dashboard.metrics} />

      <section className="grid lg:grid-cols-2 gap-6">
        <CustomerExperienceCard
          score={dashboard.metrics.customerSatisfaction}
        />

        <SLAHealthCard
          compliance={dashboard.metrics.slaCompliance}
          breached={dashboard.metrics.slaBreaches}
        />
      </section>

      <section>
        <SLALevelHealthChart
          data={dashboard.charts.slaByLevel}
          combinedCompliance={dashboard.metrics.slaCompliance}
        />
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <AnalyticsCharts title="Tickets by Status" items={statusItems} />
        <AnalyticsCharts title="Tickets by Category" items={categoryItems} />
      </section>

      <section>
        {isResponseTimeError ? (
          <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            Failed to load response time analytics:{" "}
            {responseTimeError instanceof Error
              ? responseTimeError.message
              : "Unknown error"}
          </div>
        ) : (
          <ResponseTimeChart
            months={responseTimeData?.months}
            isLoading={isResponseTimeLoading}
          />
        )}
      </section>

      <section>
        {isHistogramError ? (
          <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            Failed to load resolution histogram:{" "}
            {histogramError instanceof Error
              ? histogramError.message
              : "Unknown error"}
          </div>
        ) : (
          <ResolutionHistogram
            buckets={histogramData?.buckets}
            sampleSize={histogramData?.sampleSize}
            meanHours={histogramData?.meanHours}
            medianHours={histogramData?.medianHours}
            isLoading={isHistogramLoading}
          />
        )}
      </section>
    </div>
  );
}