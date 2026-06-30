// src/features/tickets/pages/TicketDetailsPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Printer,
  Merge,
  Trash2,
  Clock,
  Mail,
  MessageSquare,
  Bot,
  UserCog,
  Star,
  History,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmailTemplateSelector from "@/features/emailTemplates/components/EmailTemplateSelector";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TicketStatusBadge } from "@/components/business/TicketStatusBadge";
import { PriorityBadge } from "@/components/business/PriorityBadge";
import { CustomerAvatar } from "@/components/business/CustomerAvatar";
import { UserAvatar } from "@/components/business/UserAvatar";
import {
  AuditTimeline,
  type AuditEntry,
} from "@/components/business/AuditTimeline";
import { useTicketDetails } from "../hooks/useTickets";
import { useUpdateTicket } from "../hooks/useUpdateTicket";
import { useDeleteTicket } from "../hooks/useDeleteTicket";
import { useAgents } from "../hooks/useAgents";
import { useTicketFeedback, useRequestFeedback } from "../hooks/useTicketFeedback";
import {
  useTicketComments,
  useAddTicketComment,
} from "../hooks/useTicketComments";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicketHistory, mergeTicket, getPrintData } from "../api/ticketApi";
import { QUERY_KEYS } from "@/lib/queryKeys";

/* -------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------- */
const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTimestamp(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMATTER.format(date);
}

export function getSlaTone(remainingMinutes: number): string {
  if (remainingMinutes <= 0) return "text-danger border-danger/30 bg-danger/10";
  if (remainingMinutes <= 60) return "text-warning border-warning/30 bg-warning/10";
  return "text-success border-success/30 bg-success/10";
}

export function formatSlaCountdown(remainingMinutes: number): string {
  if (remainingMinutes <= 0) {
    const overdue = Math.abs(Math.round(remainingMinutes));
    return `Breached ${overdue}m ago`;
  }
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = Math.round(remainingMinutes % 60);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/* -------------------------------------------------------------------------
 * All ticket statuses — used in every dropdown throughout the app
 * ---------------------------------------------------------------------- */
export const ALL_TICKET_STATUSES = [
  { value: "new",                   label: "New" },
  { value: "open",                  label: "Open" },
  { value: "pending",               label: "Pending" },
  { value: "reopened",              label: "Reopened" },
  { value: "request_clarification", label: "Request Clarification" },
  { value: "resolved",              label: "Resolved" },
  { value: "closed",                label: "Closed" },
] as const;

/* -------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------- */
export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const isAgent = user?.role === "agent";

  const { data: ticket, isLoading, isError } = useTicketDetails(id);
  const { mutate: updateTicket, isPending: isUpdating } = useUpdateTicket();
  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket();
  const { data: agents, isLoading: isLoadingAgents } = useAgents();
  const { data: feedbackHistory } = useTicketFeedback(id);
  const { mutate: sendFeedbackRequest, isPending: isSendingFeedback } = useRequestFeedback(id);
  const { data: comments, isLoading: isLoadingComments } = useTicketComments(id);
  const { mutate: addComment, isPending: isAddingComment } = useAddTicketComment(id ?? "");

  /* History panel */
  const [showHistory, setShowHistory] = useState(false);
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["ticket-history", id],
    queryFn: () => getTicketHistory(id as string),
    enabled: showHistory && Boolean(id),
  });

  /* Merge dialog */
  const [showMerge, setShowMerge] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const { mutate: doMerge, isPending: isMerging, error: mergeError } = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      mergeTicket(sourceId, targetId),
    onSuccess: (merged) => {
      setShowMerge(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets({}) });
      // Navigate to the target ticket
      if (merged && (merged as any).id) navigate(`/tickets/${(merged as any).id}`);
    },
  });

  /* Print — fetch full data then trigger browser print */
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrint = async () => {
    if (!id || isPrinting) return;
    setIsPrinting(true);
    try {
      const printData = await getPrintData(id);
      // Store in sessionStorage for the print window, then trigger print
      sessionStorage.setItem("crm_print_data", JSON.stringify(printData));
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const [replyTab, setReplyTab] = useState<"public" | "internal">("internal");
  const [replyText, setReplyText] = useState<string>("");
  const [confirmSendFeedback, setConfirmSendFeedback] = useState(false);

  /* Early guards */
  if (!id) return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">No ticket ID provided.</div>;
  if (isLoading) return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Loading ticket...</div>;
  if (isError || !ticket) return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Failed to load ticket.</div>;

  const ticketId = String(id);

  /* Normalized fields */
  const subject = ticket.subject ?? ticket.email_subject ?? "Untitled Ticket";
  const customerName = ticket.customerName ?? ticket.tkt_customer_name ?? "Unknown Customer";
  const customerEmail = ticket.customerEmail ?? ticket.eml_ticket_created_for ?? "";
  const status = ticket.status ?? ticket.tkt_status ?? "open";
  const priority = ticket.color_code ?? ticket.priority ?? 2;
  const category = ticket.category ?? ticket.cat_id ?? "";
  const remarks = ticket.description ?? "";
  const createdAt = ticket.createdAt ?? ticket.created_date;
  const updatedAt = ticket.updatedAt ?? ticket.update_date;

  /* Audit */
  const auditEntries: AuditEntry[] = (ticket.activities ?? []).map(
    (activity: any, index: number) => ({
      id: `${ticket.id}-activity-${index}`,
      action: activity.type,
      label: activity.message,
      actor: "System",
      timestamp: activity.createdAt,
    })
  );

  /* SLA */
  const sla = ticket.sla ?? null;
  const remainingMinutes = sla ? sla.remainingMs / 60000 : 0;

  // Total SLA remaining = time until resolutionDueAt from now
  const totalRemainingMs = sla?.resolutionDueAt
    ? new Date(sla.resolutionDueAt).getTime() - Date.now()
    : null;
  const totalRemainingMinutes = totalRemainingMs !== null ? totalRemainingMs / 60000 : 0;

  // Response deadline
  const responseRemainingMs = sla?.responseDueAt
    ? new Date(sla.responseDueAt).getTime() - Date.now()
    : null;

  /* Handlers */
  const handleStatusChange = (value: string) =>
    updateTicket({ id: ticketId, payload: { tkt_status: value } });

  const handlePriorityChange = (value: string) =>
    updateTicket({ id: ticketId, payload: { color_code: Number(value) } });

  const handleAssigneeChange = (value: string) =>
    updateTicket({ id: ticketId, payload: { tkt_assigned_to: value === "unassigned" ? "" : value } });

  const handleSatisfactionChange = (rating: number) => {
    const next = ticket?.customer_satisfaction === rating ? null : rating;
    updateTicket({ id: ticketId, payload: { customer_satisfaction: next } });
  };

  const handleDelete = () =>
    deleteTicket(ticketId, { onSuccess: () => navigate("/tickets") });

  const handleReplySubmit = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    addComment({ comment: trimmed, is_internal: replyTab === "internal" }, { onSuccess: () => setReplyText("") });
  };

  const handleMergeSubmit = () => {
    const target = mergeTargetId.trim();
    if (!target) return;
    doMerge({ sourceId: ticketId, targetId: target });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-6 border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Ticket #{ticket.tkt_number ?? ticket.id}
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight">{subject}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={status as any} />
            <PriorityBadge priority={priority} />
            {isUpdating && <span className="text-xs text-muted-foreground">Saving...</span>}
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
              <History className="mr-1.5 h-4 w-4" />
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowMerge(true)}>
              <Merge className="mr-1.5 h-4 w-4" />
              Merge
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint} disabled={isPrinting}>
              <Printer className="mr-1.5 h-4 w-4" />
              {isPrinting ? "Preparing..." : "Print"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      {/* History slide-over */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="w-full max-w-md overflow-y-auto border-l border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Ticket History</h2>
              <button onClick={() => setShowHistory(false)} className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            {isLoadingHistory ? (
              <p className="text-sm text-muted-foreground">Loading history…</p>
            ) : !history || (history as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No history recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(history as any[]).map((entry: any, i: number) => (
                  <div key={entry._id ?? i} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{entry.action}</span>
                      <span className="text-muted-foreground">{formatTimestamp(entry.createdAt)}</span>
                    </div>
                    {entry.message && (
                      <p className="mt-1 text-muted-foreground">{entry.message}</p>
                    )}
                    {entry.userId?.name && (
                      <p className="mt-1 text-muted-foreground">By: {entry.userId.name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Merge dialog */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Merge Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              This ticket will be merged <strong>into</strong> the target. All comments will move to
              the target and this ticket will be archived.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Target Ticket ID (MongoDB _id or ticket number)
              </label>
              <Input
                placeholder="e.g. 6849a2f3... or TCK-XXXX"
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
              />
            </div>
            {mergeError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {(mergeError as any)?.message ?? "Merge failed"}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowMerge(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!mergeTargetId.trim() || isMerging}
                onClick={handleMergeSubmit}
              >
                {isMerging ? "Merging…" : "Merge"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* LEFT SIDE */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Original email */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{customerName}</span>
                  {customerEmail && <span className="truncate">&lt;{customerEmail}&gt;</span>}
                  <span>{formatTimestamp(createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed">
                  {remarks || "No content available for this ticket."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conversation + Internal Notes */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex gap-1 border-b border-border/60">
                <button
                  type="button"
                  onClick={() => setReplyTab("public")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    replyTab !== "internal"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Conversation
                </button>
                <button
                  type="button"
                  onClick={() => setReplyTab("internal")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    replyTab === "internal"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Internal Notes
                  {comments && comments.filter(c => c.internal).length > 0 && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                      {comments.filter(c => c.internal).length}
                    </span>
                  )}
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              {isLoadingComments ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : replyTab === "internal" ? (
                (() => {
                  const notes = (comments ?? []).filter(c => c.internal);
                  return notes.length > 0 ? notes.map((c) => (
                    <div key={c.id} className="flex flex-row-reverse gap-3 text-right">
                      <UserAvatar name={c.authorName} role="agent" size="md" />
                      <div className="flex max-w-[80%] flex-col items-end">
                        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{c.authorName}</span>
                          <span>{formatTimestamp(c.createdAt)}</span>
                          <span className="rounded-full border border-amber-300/50 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            Internal Note
                          </span>
                        </div>
                        <div className="rounded-2xl border border-amber-200/50 bg-amber-50/60 px-4 py-3 text-sm leading-relaxed">
                          {c.message}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">No internal notes yet.</p>
                  );
                })()
              ) : (
                (() => {
                  const thread = (comments ?? []).filter(c => !c.internal);
                  return thread.length > 0 ? thread.map((c) => {
                    const isCustomer = c.fromCustomer;
                    return (
                      <div key={c.id} className={`flex gap-3 ${isCustomer ? "" : "flex-row-reverse text-right"}`}>
                        <UserAvatar name={c.authorName} role={isCustomer ? "customer" : "agent"} size="md" />
                        <div className={`flex max-w-[80%] flex-col ${isCustomer ? "items-start" : "items-end"}`}>
                          <div className={`mb-1 flex items-center gap-2 text-xs text-muted-foreground ${isCustomer ? "" : "flex-row-reverse"}`}>
                            <span className="font-medium text-foreground">
                              {c.authorName}
                              {isCustomer && c.fromEmail && (
                                <span className="ml-1 font-normal text-muted-foreground">&lt;{c.fromEmail}&gt;</span>
                              )}
                            </span>
                            <span>{formatTimestamp(c.createdAt)}</span>
                            {isCustomer && (
                              <span className="rounded-full border border-sky-300/50 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                Customer
                              </span>
                            )}
                          </div>
                          <div className={isCustomer
                            ? "rounded-2xl rounded-tl-sm border border-sky-200/50 bg-sky-50/60 px-4 py-3 text-sm leading-relaxed"
                            : "rounded-2xl rounded-tr-sm border border-border/60 bg-muted/30 px-4 py-3 text-sm leading-relaxed"
                          }>
                            {c.message}
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">No replies yet.</p>
                  );
                })()
              )}
            </CardContent>
          </Card>

          {/* Reply composer */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={replyTab} onValueChange={(v) => setReplyTab(v as "public" | "internal")}>
                <TabsList>
                  <TabsTrigger value="internal">
                    <UserCog className="h-3.5 w-3.5 mr-1.5" />
                    Internal Note
                  </TabsTrigger>
                  <TabsTrigger value="public">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Email Reply
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="internal" className="mt-3">
                  <Textarea
                    placeholder="Add internal note (only visible to agents)..."
                    value={replyTab === "internal" ? replyText : ""}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-32 resize-none border-amber-300/40 bg-amber-50/40"
                  />
                </TabsContent>
                <TabsContent value="public" className="mt-3">
                  <Textarea
                    placeholder="Write email reply to customer..."
                    value={replyTab === "public" ? replyText : ""}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-32 resize-none"
                  />
                </TabsContent>
              </Tabs>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {replyTab === "public"
                    ? `Sends email to ${customerEmail || "customer"}`
                    : "Visible only to agents — not sent to customer"}
                </p>
                <div className="flex items-center gap-2">
                  {replyTab === "public" && (
                    <EmailTemplateSelector
                      replyText={replyText}
                      onReplyTextChange={setReplyText}
                      ticketContext={{
                        tkt_number: ticket?.tkt_number,
                        email_subject: ticket?.email_subject,
                        description: ticket?.description,
                        tkt_status: ticket?.tkt_status,
                        tkt_type: ticket?.tkt_type,
                        tkt_custom1: ticket?.tkt_custom1,
                        tkt_custom2: ticket?.tkt_custom2,
                        tkt_custom3: ticket?.tkt_custom3,
                        tkt_custom4: ticket?.tkt_custom4,
                        tkt_custom5: ticket?.tkt_custom5,
                      }}
                      customerContext={{
                        name: ticket?.tkt_customer_name,
                        email: customerEmail,
                        mobile: ticket?.tkt_customer_mobile,
                      }}
                    />
                  )}
                  <Button disabled={!replyText.trim() || isAddingComment} onClick={handleReplySubmit}>
                    {isAddingComment ? "Sending…" : replyTab === "public" ? "Send Reply" : "Add Note"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTimeline entries={auditEntries} maxVisible={5} />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col gap-4">
          {/* Requester */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Requester</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CustomerAvatar name={customerName} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{customerName}</p>
                  {customerEmail && (
                    <p className="truncate text-xs text-muted-foreground">{customerEmail}</p>
                  )}
                </div>
              </div>
              <Separator />
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowHistory(true)}>
                <History className="mr-1.5 h-3.5 w-3.5" />
                View history
              </Button>
            </CardContent>
          </Card>

          {/* Assignee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assignee</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {ticket.assignee ? (
                <div className="flex items-center gap-3">
                  <UserAvatar name={ticket.assignee.name} role={ticket.assignee.role} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ticket.assignee.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ticket.assignee.role ?? "Agent"}
                      {ticket.team?.name ? ` · ${ticket.team.name}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Unassigned</p>
                    <p className="text-xs text-muted-foreground">No agent assigned</p>
                  </div>
                </div>
              )}
              <Select
                value={ticket.assignee?.id ?? "unassigned"}
                onValueChange={handleAssigneeChange}
                disabled={isLoadingAgents}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue placeholder="Assign agent..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      <div className="flex flex-col py-0.5">
                        <span className="text-xs font-medium">
                          {agent.name}{" "}
                          <span className="font-normal text-muted-foreground">({agent.role})</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">{agent.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Customer Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackHistory && feedbackHistory.length > 0 ? (
                <div className="space-y-3">
                  {feedbackHistory.map((fb) => (
                    <div key={fb._id} className="rounded-2xl border border-border/60 bg-background/50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star key={rating} className={`h-4 w-4 ${fb.rating >= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {fb.source === "email_reply" ? "Email reply" : "Manual"}
                        </span>
                      </div>
                      {fb.description && <p className="mt-2 text-xs text-muted-foreground">"{fb.description}"</p>}
                      <p className="mt-2 text-[10px] text-muted-foreground">{formatTimestamp(fb.respondedAt)}</p>
                    </div>
                  ))}
                  <div className="pt-1">
                    {!confirmSendFeedback ? (
                      <button type="button" onClick={() => setConfirmSendFeedback(true)} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                        Re-send feedback request
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Send again?</span>
                        <button type="button" disabled={isSendingFeedback} onClick={() => sendFeedbackRequest(undefined, { onSuccess: () => setConfirmSendFeedback(false) })} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">
                          {isSendingFeedback ? "Sending…" : "Confirm"}
                        </button>
                        <button type="button" onClick={() => setConfirmSendFeedback(false)} className="rounded-lg border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const filled = (ticket.customer_satisfaction ?? 0) >= rating;
                      return (
                        <button key={rating} type="button" onClick={() => handleSatisfactionChange(rating)} className="rounded p-0.5 transition-colors hover:bg-muted/50" title={`Rate ${rating} out of 5`}>
                          <Star className={`h-5 w-5 ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ticket.tkt_status === "resolved" || ticket.tkt_status === "closed"
                      ? "Awaiting the customer's email reply. You can also record it manually above."
                      : "Resolve the ticket to auto-send a request, or send one now:"}
                  </p>
                  {!confirmSendFeedback ? (
                    <button type="button" onClick={() => setConfirmSendFeedback(true)} className="rounded-xl border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50">
                      Send feedback request email
                    </button>
                  ) : (
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-medium">
                        Send to <span className="text-foreground">{ticket.eml_ticket_created_for ?? "the customer"}</span>?
                      </p>
                      <div className="flex gap-2">
                        <button type="button" disabled={isSendingFeedback} onClick={() => sendFeedbackRequest(undefined, { onSuccess: () => setConfirmSendFeedback(false) })} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                          {isSendingFeedback ? "Sending…" : "Yes, send"}
                        </button>
                        <button type="button" onClick={() => setConfirmSendFeedback(false)} className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>SLA Timer</span>
                {sla && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Level {sla.currentLevel}/5
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sla ? (
                sla.status === "sla_violated" ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    <Clock className="h-4 w-4 shrink-0" />
                    SLA Violated — final level breached
                  </div>
                ) : (
                  <>
                    {/* Current level countdown */}
                    <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium ${getSlaTone(remainingMinutes)}`}>
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="flex-1">
                        Level {sla.currentLevel} — {formatSlaCountdown(remainingMinutes)}
                      </span>
                    </div>

                    {/* Total SLA remaining (only meaningful if level > 1 or shows full picture) */}
                    {sla.currentLevel > 1 && totalRemainingMs !== null && (
                      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${getSlaTone(totalRemainingMinutes)}`}>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Total remaining: {formatSlaCountdown(totalRemainingMinutes)}</span>
                      </div>
                    )}

                    {/* Response deadline (if not yet responded) */}
                    {responseRemainingMs !== null && !ticket.first_response_at && (
                      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${responseRemainingMs < 0 ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400" : "border-border/50 bg-muted/30 text-muted-foreground"}`}>
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Response deadline:{" "}
                          {responseRemainingMs < 0
                            ? `${Math.round(Math.abs(responseRemainingMs) / 60000)}m overdue`
                            : formatSlaCountdown(responseRemainingMs / 60000)}
                        </span>
                      </div>
                    )}

                    {/* Due date */}
                    <p className="text-[11px] text-muted-foreground px-1">
                      Resolution due: {new Date(sla.resolutionDueAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </>
                )
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {ticket.assignee
                      ? "SLA initializing — refresh in a moment"
                      : "Assign a ticket to start the SLA timer"}
                  </div>
                  {!ticket.assignee && (
                    <p className="text-[11px] text-muted-foreground">
                      SLA tracking begins automatically when an agent is assigned.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-7 w-44 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_TICKET_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority</span>
                <Select value={String(priority)} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="h-7 w-44 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" disabled={isAgent} className={isAgent ? "opacity-40 cursor-not-allowed" : ""}>Low</SelectItem>
                    <SelectItem value="2" disabled={isAgent} className={isAgent ? "opacity-40 cursor-not-allowed" : ""}>Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                    <SelectItem value="4">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="text-right font-medium">{category || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatTimestamp(createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{formatTimestamp(updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
