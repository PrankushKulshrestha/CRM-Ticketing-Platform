import { useQuery } from "@tanstack/react-query";
import { Clock, AlertCircle, Inbox, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/business/TicketStatusBadge";
import { PriorityBadge } from "@/components/business/PriorityBadge";
import { getBacklog } from "../api/ticketApi";
import { Link } from "react-router-dom";

const PRIORITY_LABELS: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Urgent" };
const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-slate-100 text-slate-600",
  2: "bg-blue-100 text-blue-700",
  3: "bg-orange-100 text-orange-700",
  4: "bg-red-100 text-red-700",
};

export default function BacklogWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ticket-backlog"],
    queryFn: getBacklog,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const backlog = data as any;

  if (isError) return null;
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle className="text-sm">Backlog Overview</CardTitle></CardHeader>
        <CardContent><div className="h-20 rounded-xl bg-muted/40" /></CardContent>
      </Card>
    );
  }

  const byStatus: { _id: string; count: number }[] = backlog?.byStatus ?? [];
  const byPriority: { _id: number; count: number }[] = backlog?.byPriority ?? [];
  const unassigned: number = backlog?.unassignedCount ?? 0;
  const oldest: any[] = backlog?.oldestOpenTickets ?? [];
  const total = byStatus.reduce((s, x) => s + x.count, 0);

  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          Backlog Overview
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {total} open
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {/* By status */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">By Status</p>
          <div className="flex flex-col gap-1.5">
            {byStatus.map((s) => (
              <div key={s._id} className="flex items-center justify-between">
                <TicketStatusBadge status={s._id as any} />
                <span className="text-sm font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By priority + unassigned */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">By Priority</p>
          <div className="flex flex-col gap-1.5">
            {byPriority.map((p) => (
              <div key={p._id} className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[p._id] ?? "bg-muted text-muted-foreground"}`}>
                  {PRIORITY_LABELS[p._id] ?? p._id}
                </span>
                <span className="text-sm font-semibold">{p.count}</span>
              </div>
            ))}
            {unassigned > 0 && (
              <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                <Users className="h-3 w-3" />
                {unassigned} unassigned
              </div>
            )}
          </div>
        </div>

        {/* Oldest open */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Oldest Open</p>
          <div className="flex flex-col gap-1.5">
            {oldest.length === 0 ? (
              <p className="text-xs text-muted-foreground">None</p>
            ) : (
              oldest.map((t) => (
                <Link
                  key={t._id}
                  to={`/tickets/${t._id}`}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-2 py-1.5 text-xs hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground group-hover:text-primary">
                      {t.email_subject ?? "Untitled"}
                    </span>
                    <span className="text-muted-foreground">{t.tkt_number}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <PriorityBadge priority={t.color_code ?? 2} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
