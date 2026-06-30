
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type TableColumn } from "@/components/tables/DataTable";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomers } from "../hooks/useCustomers";
import type { Customer } from "../types/customer.types";

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error } = useCustomers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const columns: TableColumn<Customer>[] = [
    {
      key: "name",
      title: "Name",
      render: (c) => <span className="font-medium">{c.name}</span>,
    },
    { key: "email", title: "Email" },
    {
      key: "company",
      title: "Company",
      render: (c) => c.company ?? "—",
    },
    {
      key: "openTickets",
      title: "Open tickets",
      render: (c) => (
        <span className={c.openTickets > 0 ? "font-medium" : "text-muted-foreground"}>
          {c.openTickets}
        </span>
      ),
    },
    {
      key: "totalTickets",
      title: "Total tickets",
      className: "text-muted-foreground",
    },
    {
      key: "actions",
      title: "",
      headerClassName: "w-px",
      className: "text-right",
      render: (c) => (
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <a href={`mailto:${c.email}`} title={`Email ${c.email}`}>
            <Mail className="mr-2 h-4 w-4" />
            Send email
          </a>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Everyone who has emailed in, with their ticket history at a glance.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>All customers</CardTitle>
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-10 text-center text-sm text-destructive">
              Failed to load customers
              {error instanceof Error ? `: ${error.message}` : "."}
            </div>
          ) : (
            <>
              <DataTable
                data={data?.data ?? []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No customers found."
                keyExtractor={(c) => c.id}
              />

              {data?.meta && data.meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Page {data.meta.page} of {data.meta.totalPages} ·{" "}
                    {data.meta.total} total
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
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