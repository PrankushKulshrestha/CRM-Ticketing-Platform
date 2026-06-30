

import { Link } from "react-router-dom";
import { PriorityBadge } from "@/components/business/PriorityBadge";
import { TicketStatusBadge } from "@/components/business/TicketStatusBadge";
import { SLAIndicator } from "@/components/business/SLAIndicator";
import { truncate } from "@/lib/utils";
import type { Ticket } from "../types/ticket.types";

/* -------------------------------------------------------------------------- */
/* NOTE: adjust the two imports above if PriorityBadge / TicketStatusBadge   */
/* actually live somewhere other than this same `components` folder.        */
/* -------------------------------------------------------------------------- */

interface TicketTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


export default function TicketTable({ tickets, isLoading }: TicketTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }
  if (!tickets.length) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No tickets found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Subject</th>
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Customer</th>
            <th className="py-2 pr-4 font-medium">Assignee</th>
            <th className="py-2 pr-4 font-medium">Priority</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">SLA</th>
            <th className="py-2 pr-4 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-b last:border-0">
              <td className="py-3 pr-4">
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="font-medium hover:underline"
                >
                  {ticket.email_subject || ticket.tkt_number}
                </Link>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">
                {ticket.description ? truncate(ticket.description, 30) : "—"}
              </td>
              <td className="py-3 pr-4">
                {ticket.tkt_customer_name || "—"}
              </td>
              <td className="py-3 pr-4">
                <div className="flex flex-col">
                  <span>{ticket.assignee?.name ?? "Unassigned"}</span>
                  {ticket.team?.name && (
                    <span className="text-xs text-muted-foreground">
                      {ticket.team.name}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 pr-4">
                <PriorityBadge priority={ticket.color_code} />
              </td>
              <td className="py-3 pr-4">
                <TicketStatusBadge status={ticket.tkt_status} />
              </td>
              <td className="py-3 pr-4">
                {ticket.sla ? (
                  <SLAIndicator
                    dueAt={ticket.sla.resolutionDueAt}
                    createdAt={ticket.created_date}
                    breached={ticket.sla.isResolutionBreached}
                    showProgress={false}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {ticket.assignee ? "Initializing…" : "Unassigned"}
                  </span>
                )}
              </td>
              <td className="py-3 pr-4 text-muted-foreground">
                {formatDate(ticket.created_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}