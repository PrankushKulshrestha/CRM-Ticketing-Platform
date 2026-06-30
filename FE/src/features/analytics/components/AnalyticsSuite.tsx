
import { useMemo, lazy, Suspense, useCallback, useEffect } from "react";
import type { ElementType } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BarChart2, Shield, Users } from "lucide-react";
import { useAnalytics } from "../hooks/useAnalytics";
import routes from "@/config/routes";

/* -------------------------------------------------------------------------- */

const VolumeTab = lazy(() => import("./TicketVolumeTab"));
const SlaTab = lazy(() => import("./SlaMetricsTab"));

/* -------------------------------------------------------------------------- */

type TabId = "volume" | "sla" | "agents";

type TabConfig = {
  id: TabId;
  label: string;
  icon: ElementType;
};

const TABS = [
  { id: "volume", label: "Ticket Volume & Trends", icon: BarChart2 },
  { id: "sla", label: "SLA & Resolution Metrics", icon: Shield },
  { id: "agents", label: "Agent Performance", icon: Users },
] as const satisfies readonly TabConfig[];

const isTab = (v: string | null): v is TabId =>
  v === "volume" || v === "sla" || v === "agents";

/* -------------------------------------------------------------------------- */

export default function AnalyticsSuite() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { data } = useAnalytics();

  const rawTab = params.get("tab");
  const tab: TabId = isTab(rawTab) ? rawTab : "volume";

  // Agents tab is a dedicated page — redirect immediately
  useEffect(() => {
    if (tab === "agents") navigate(routes.agents, { replace: true });
  }, [tab, navigate]);

  const setTab = useCallback(
    (id: TabId) => {
      if (id === "agents") { navigate(routes.agents); return; }
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", id);
        return next;
      });
    },
    [setParams, navigate]
  );

  const ActiveTab = useMemo(() => {
    switch (tab) {
      case "volume": {
        // BE TrendPoint: { _id: "YYYY-MM-DD", count, resolvedCount, closedCount, openCount }
        // FE TimeSeriesPoint: { date: string, tickets: number }
        const rawTrends = (data?.data?.charts as any)?.trends ?? [];
        const dailyVolume = rawTrends.map((p: any) => ({ date: p._id, tickets: p.count ?? 0 }));

        // BE DistributionPoint: { _id: string, value: number }
        // FE CategoryPoint: { name: string, value: number }
        const toCategory = (arr: any[]) => arr.map((p: any) => ({ name: p._id, value: p.value ?? 0 }));
        const metrics = data?.data?.metrics as any;

        return (
          <VolumeTab
            kpis={{
              created: metrics?.totalTickets ?? 0,
              resolved: metrics?.resolvedTickets ?? 0,
              avgResolution: metrics?.avgResolutionTime ? `${metrics.avgResolutionTime}h` : "—",
              csat: metrics?.customerSatisfaction ? `${metrics.customerSatisfaction}/100` : "—",
            }}
            dailyVolume={dailyVolume}
            sources={toCategory((data?.data?.charts as any)?.sourceDistribution ?? [])}
            tiers={toCategory((data?.data?.charts as any)?.categoryDistribution ?? [])}
            priority={toCategory((data?.data?.charts as any)?.priorityDistribution ?? [])}
          />
        );
      }
      case "sla":
        return <SlaTab />;
      case "agents":
        return null; // redirected above
      default:
        return null;
    }
  }, [tab, data]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card/80 backdrop-blur sticky top-0">
        <div className="flex gap-2 px-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
                tab === id
                  ? "border-indigo-500 text-indigo-500"
                  : "border-transparent"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <Suspense fallback={<div>Loading...</div>}>{ActiveTab}</Suspense>
      </div>
    </div>
  );
}