
import React, { useMemo } from "react";

import {
  Clock3,
  Ticket,
  User,
} from "lucide-react";

import { formatTimestamp } from "@/lib/utils";

import type {
  DashboardActivity,
} from "../types/dashboard.types";

interface Props {
  activities?: DashboardActivity[];
}

function getStatusColor(
  status?: string,
): string {
  switch (
    status?.toLowerCase()
  ) {
    case "resolved":
    case "closed":
      return "bg-green-500/10 text-green-600";

    case "open":
      return "bg-blue-500/10 text-blue-600";

    case "pending":
      return "bg-yellow-500/10 text-yellow-600";

    case "escalated":
      return "bg-red-500/10 text-red-600";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function ActivityFeed({
  activities = [],
}: Props): React.ReactElement {
  const safeActivities =
    useMemo(
      () =>
        [...activities].sort(
          (a, b) =>
            new Date(
              b.updatedAt ?? "",
            ).getTime() -
            new Date(
              a.updatedAt ?? "",
            ).getTime(),
        ),
      [activities],
    );

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          Live Activity
        </h3>

        <p className="text-sm text-muted-foreground">
          Latest ticket operations
        </p>
      </div>

      {safeActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
          No recent activity available.
        </div>
      ) : (
        <div className="space-y-4">
          {safeActivities.map(
            (
              activity,
              index,
            ) => {
              const ticketNumber =
                activity.ticketNumber ??
                "N/A";

              const title =
                activity.title ??
                "Untitled Ticket";

              const customer =
                activity.customer ??
                "Unknown Customer";

              const assignedTo =
                activity.assignedTo ??
                "Unassigned";

              const category =
                activity.category ??
                "General";

              const subCategory =
                activity.subCategory ??
                "N/A";

              const status =
                activity.status ??
                "Unknown";

              return (
                <article
                  key={`${ticketNumber}-${activity.updatedAt ?? index}`}
                  className="rounded-2xl border border-border/60 bg-background/50 p-4 transition-colors hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />

                        <p className="truncate text-sm font-medium">
                          Ticket #
                          {ticketNumber}
                          {" — "}
                          {title}
                        </p>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />

                        <span>
                          {customer}
                        </span>

                        <span>•</span>

                        <span>
                          Assigned to{" "}
                          {assignedTo}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>
                      {category}
                    </span>

                    <span>•</span>

                    <span>
                      {subCategory}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3 w-3" />

                    <span>
                      Updated{" "}
                      {formatTimestamp(
                        activity.updatedAt,
                      )}
                    </span>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}