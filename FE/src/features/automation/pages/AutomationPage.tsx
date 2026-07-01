
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  useAutomationRules,
  useToggleAutomationRule,
  useCreateAutomationRule,
} from "../hooks/useAutomation";
import { useTeams } from "@/features/teams/hooks/useTeams";
import type {
  AutomationRule,
  AutomationTrigger,
  AutomationActionType,
} from "../types/automation.types";

const PAGE_SIZE = 10;

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  ticket_created: "Ticket created",
  ticket_updated: "Ticket updated",
  ticket_assigned: "Ticket assigned",
  sla_breached: "SLA breached",
  status_changed: "Status changed",
};

const ACTION_LABELS: Record<AutomationActionType, string> = {
  assign_agent: "Assign agent",
  assign_team: "Assign team",
  set_priority: "Set priority",
  send_notification: "Send notification",
  change_status: "Change status",
  add_tag: "Add tag",
};

// Mirrors the catId values produced by the backend classifier
// (be/src/email/shared/ticket-classifier.ts). Kept in sync manually since
// there's no shared taxonomy endpoint yet.
const TICKET_CATEGORIES = [
  "Billing",
  "Technical",
  "Sales",
  "Feedback",
  "Account",
  "Complaint",
  "Uncategorized",
];

function CreateRuleDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger>("ticket_created");
  const [actionType, setActionType] = useState<AutomationActionType>("assign_agent");
  const [actionValue, setActionValue] = useState("");
  const [category, setCategory] = useState<string>("any");

  const { mutate, isPending, error } = useCreateAutomationRule();
  const { data: teamsData, isLoading: isLoadingTeams } = useTeams({
    limit: 100,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !actionValue.trim()) return;

    mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        trigger,
        // Only scope the rule to a category when one is picked — leaving it
        // on "Any category" runs the action for every ticket on this
        // trigger, which is intentional for broad rules but should be an
        // explicit choice, not the accidental default.
        conditions: category !== "any" ? { cat_id: category } : undefined,
        actions: [{ type: actionType, value: actionValue.trim() }],
        enabled: true,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          setActionValue("");
          setCategory("any");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New rule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create an automation rule</DialogTitle>
            <DialogDescription>
              When the trigger fires, the action runs automatically. You can
              add more conditions later by editing the rule.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Name</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Auto-assign billing tickets"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-description">Description (optional)</Label>
              <Textarea
                id="rule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this rule does and why"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>When</Label>
                <Select
                  value={trigger}
                  onValueChange={(v) => setTrigger(v as AutomationTrigger)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Only for category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any category</SelectItem>
                    {TICKET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {category === "any" && (
                  <p className="text-xs text-muted-foreground">
                    Runs for every ticket on this trigger.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Then</Label>
                <Select
                  value={actionType}
                  onValueChange={(v) => {
                    setActionType(v as AutomationActionType);
                    setActionValue("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-action-value">Action value</Label>
              {actionType === "assign_team" ? (
                <Select
                  value={actionValue}
                  onValueChange={setActionValue}
                  disabled={isLoadingTeams}
                >
                  <SelectTrigger id="rule-action-value">
                    <SelectValue placeholder="Select a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamsData?.data.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No teams yet — create one on the Teams page first.
                      </div>
                    ) : (
                      teamsData?.data.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="rule-action-value"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  placeholder={
                    actionType === "assign_agent"
                      ? "Agent ID or email"
                      : actionType === "set_priority"
                        ? "low / medium / high / urgent"
                        : actionType === "change_status"
                          ? "open / pending / resolved / closed"
                          : "Value"
                  }
                  required
                />
              )}
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to create rule."}
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
            <Button
              type="submit"
              disabled={isPending || !name.trim() || !actionValue.trim()}
            >
              {isPending ? "Creating…" : "Create rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AutomationPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useAutomationRules({
    page,
    limit: PAGE_SIZE,
  });
  const { mutate: toggleRule, isPending: isToggling } = useToggleAutomationRule();

  const columns: TableColumn<AutomationRule>[] = [
    {
      key: "name",
      title: "Rule",
      render: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          {r.description && (
            <div className="text-xs text-muted-foreground">{r.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "trigger",
      title: "Trigger",
      render: (r) => TRIGGER_LABELS[r.trigger] ?? r.trigger,
    },
    {
      key: "actions",
      title: "Action",
      render: (r) =>
        r.actions
          .map((a) => `${ACTION_LABELS[a.type] ?? a.type}: ${a.value}`)
          .join(", ") || "—",
    },
    {
      key: "enabled",
      title: "Enabled",
      headerClassName: "w-px",
      render: (r) => (
        <Switch
          checked={r.enabled}
          disabled={isToggling}
          onCheckedChange={(checked) =>
            toggleRule({ id: r.id, enabled: checked })
          }
          aria-label={`Toggle ${r.name}`}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation</h1>
          <p className="text-muted-foreground">
            Rules that run automatically when ticket events happen.
          </p>
        </div>
        <CreateRuleDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All rules</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-10 text-center text-sm text-destructive">
              Failed to load automation rules
              {error instanceof Error ? `: ${error.message}` : "."}
            </div>
          ) : (
            <>
              <DataTable
                data={data?.data ?? []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No rules yet. Create one to automate ticket handling."
                keyExtractor={(r) => r.id}
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