
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, type TableColumn } from "@/components/tables/DataTable";
import { useTeams, useCreateTeam, useUpdateTeamMembers } from "../hooks/useTeams";
import { useAgents } from "@/features/tickets/hooks/useAgents";
import type { Team } from "../types/team.types";

const PAGE_SIZE = 10;

function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { mutate, isPending, error } = useCreateTeam();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a team</DialogTitle>
            <DialogDescription>
              Give it a name agents will recognize. You can add members afterward.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Name</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Billing Support"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description (optional)</Label>
              <Textarea
                id="team-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this team handles"
                rows={3}
              />
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to create team."}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Creating…" : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageMembersDialog({ team }: { team: Team }) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    team.members.map((m) => m.id),
  );

  const { data: agents, isLoading: isLoadingAgents } = useAgents();
  const { mutate, isPending, error } = useUpdateTeamMembers();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Reset selection to the team's current roster each time the dialog
      // opens, in case it was edited elsewhere since the last open.
      setSelectedIds(team.members.map((m) => m.id));
    }
  }

  function toggleMember(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  function handleSave() {
    mutate(
      { id: team.id, payload: { memberIds: selectedIds } },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          Manage members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage members — {team.name}</DialogTitle>
          <DialogDescription>
            Select everyone who belongs on this team. Changes replace the
            current roster.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-1 overflow-y-auto py-2">
          {isLoadingAgents ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading agents…
            </p>
          ) : !agents || agents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No assignable users found.
            </p>
          ) : (
            agents.map((agent) => (
              <label
                key={agent._id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={selectedIds.includes(agent._id)}
                  onChange={() => toggleMember(agent._id)}
                />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {agent.name}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({agent.role})
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {agent.email}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>

        {error && (
          <p className="mb-2 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to update members."}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save members"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TeamsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useTeams({
    page,
    limit: PAGE_SIZE,
  });

  const columns: TableColumn<Team>[] = [
    {
      key: "name",
      title: "Team",
      render: (t) => (
        <div>
          <div className="font-medium">{t.name}</div>
          {t.description && (
            <div className="text-xs text-muted-foreground">{t.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "members",
      title: "Members",
      render: (t) =>
        t.members.length === 0 ? (
          <span className="text-muted-foreground">No members yet</span>
        ) : (
          <span>{t.members.length}</span>
        ),
    },
    {
      key: "resolved",
      title: "Resolved (team)",
      render: (t) =>
        t.members.reduce((sum, m) => sum + m.resolvedTickets, 0),
    },
    {
      key: "createdAt",
      title: "Created",
      className: "text-muted-foreground",
      render: (t) =>
        new Date(t.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "actions",
      title: "",
      headerClassName: "w-px",
      className: "text-right",
      render: (t) => <ManageMembersDialog team={t} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Group agents to route and report on ticket work together.
          </p>
        </div>
        <CreateTeamDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All teams</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-10 text-center text-sm text-destructive">
              Failed to load teams
              {error instanceof Error ? `: ${error.message}` : "."}
            </div>
          ) : (
            <>
              <DataTable
                data={data?.data ?? []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No teams yet. Create one to get started."
                keyExtractor={(t) => t.id}
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