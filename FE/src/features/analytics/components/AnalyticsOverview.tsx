
import { Ticket, Clock3, BadgeCheck, AlertTriangle } from "lucide-react";
import StatCard from "@/components/shared/StatCard";

/* -------------------------------------------------------------------------- */

interface Props {
  data?: {
    resolvedToday: number;
    avgResolutionTime: number;
    slaBreaches: number;
    slaCompliance: number;
  } | null;
}
const formatTime = (hours: number): string => {
  if (!Number.isFinite(hours)) return "0s";

  const totalSeconds = Math.round(hours * 3600);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatPercent = (value: number): string => `${Math.round(value)}%`;
/* -------------------------------------------------------------------------- */

export default function AnalyticsOverview({ data }: Props) {
  if (!data) return null;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Resolved Today"
        value={data.resolvedToday}
        icon={BadgeCheck}
      />

      <StatCard
        title="Avg Resolution"
        value={formatTime(data.avgResolutionTime)}
        icon={Clock3}
      />

      <StatCard
        title="SLA Compliance"
        value={formatPercent(data.slaCompliance)}
        icon={Ticket}
      />

      <StatCard
        title="Breached SLA"
        value={data.slaBreaches}
        icon={AlertTriangle}
      />
    </div>
  );
}