import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import TicketTable from "../components/TicketTable";
import { useTickets } from "../hooks/useTickets";
import { useDebounce } from "@/hooks/useDebounce";
import BacklogWidget from "../components/BacklogWidget";
import { useSystemSettings } from "@/features/settings/api/systemSettingsApi";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all",                   label: "All Statuses" },
  { value: "new",                   label: "New" },
  { value: "open",                  label: "Open" },
  { value: "pending",               label: "Pending" },
  { value: "reopened",              label: "Reopened" },
  { value: "request_clarification", label: "Request Clarification" },
  { value: "resolved",              label: "Resolved" },
  { value: "closed",                label: "Closed" },
];

export default function TicketsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("new");
  const debouncedSearch = useDebounce(search, 400);
  const { data: sysSettings } = useSystemSettings();

  const { data, isLoading, isError } = useTickets({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    tkt_status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Manage support tickets</p>
        </div>
        <Button asChild>
          <Link to="/tickets/create">Create Ticket</Link>
        </Button>
      </div>

      {/* Backlog widget — visible to all, especially useful for agents */}
      <BacklogWidget />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>All Tickets</CardTitle>
            {statusFilter === "new" && sysSettings && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing tickets created in the last {sysSettings.new_ticket_window_hours}h
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="h-9 w-52 text-sm">
                <SelectValue placeholder="Filter by status…" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search by subject, customer, ticket #…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 w-72 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-10 text-center text-sm text-destructive">
              Failed to load tickets.
            </div>
          ) : (
            <>
              <TicketTable tickets={data?.data ?? []} isLoading={isLoading} />
              {data?.meta && data.meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Page {data.meta.page} of {data.meta.totalPages} ·{" "}
                    {data.meta.total} total
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
