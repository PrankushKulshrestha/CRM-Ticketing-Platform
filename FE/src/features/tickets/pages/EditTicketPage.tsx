
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTicketById, updateTicket } from "../api/ticketApi";
import type { UpdateTicketPayload } from "../types/ticket.types";

export default function EditTicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: ticket,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tickets", id],
    queryFn: () => getTicketById(id!),
    enabled: Boolean(id),
  });

  const [form, setForm] = useState<UpdateTicketPayload>({});
  // ✅ color_code tracked separately since it's a number, not in UpdateTicketPayload originally
  const [colorCode, setColorCode] = useState<number>(2);

  useEffect(() => {
    if (!ticket) return;
    setForm({
      email_subject: ticket.email_subject,
      description: ticket.description ?? undefined,
      tkt_status: ticket.tkt_status ?? undefined,
      tkt_type: ticket.tkt_type ?? undefined,
      cat_id: ticket.cat_id ?? undefined,
      sub_cat_id: ticket.sub_cat_id ?? undefined,
      sub_sub_cat_id: ticket.sub_sub_cat_id ?? undefined,
      tkt_customer_name: ticket.tkt_customer_name ?? undefined,
      tkt_customer_mobile: ticket.tkt_customer_mobile ?? undefined,
      tkt_user: ticket.tkt_user ?? undefined,
      eml_ticket_created_for: ticket.eml_ticket_created_for ?? undefined,
      color_code: ticket.color_code ?? 2,
    });
    setColorCode(ticket.color_code ?? 2);
  }, [ticket]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateTicketPayload) => updateTicket(id!, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      navigate(`/tickets/${updated.id}`);
    },
    onError: () => {
      alert("Failed to update ticket");
    },
  });

  function handleChange<K extends keyof UpdateTicketPayload>(
    key: K,
    value: UpdateTicketPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ ...form, color_code: colorCode });
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center">
        Loading Ticket...
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center">
        <p className="text-destructive">Ticket not found.</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => navigate("/tickets")}
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Ticket</h1>
        <p className="text-sm text-muted-foreground">
          Ticket Number: {ticket.tkt_number}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={form.tkt_customer_name ?? ""}
                  onChange={(e) =>
                    handleChange("tkt_customer_name", e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Customer Email</Label>
                <Input
                  type="email"
                  value={form.eml_ticket_created_for ?? ""}
                  onChange={(e) =>
                    handleChange("eml_ticket_created_for", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Customer Mobile</Label>
                <Input
                  value={form.tkt_customer_mobile ?? ""}
                  onChange={(e) =>
                    handleChange("tkt_customer_mobile", e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Assigned Agent</Label>
                <Input
                  value={form.tkt_user ?? ""}
                  onChange={(e) => handleChange("tkt_user", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={form.email_subject ?? ""}
                onChange={(e) => handleChange("email_subject", e.target.value)}
              />
            </div>

            <div>
              <Label>Remarks</Label>
              <Textarea
                className="min-h-32"
                value={form.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            {/* ✅ 3 cols — Status / Priority / Type on same row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Status</Label>
                <Select
                  value={form.tkt_status ?? "open"}
                  onValueChange={(v) => handleChange("tkt_status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reopened">Reopened</SelectItem>
                    <SelectItem value="request_clarification">Request Clarification</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ Priority = color_code — was completely missing from EditTicketPage */}
              <div>
                <Label>Priority</Label>
                <Select
                  value={String(colorCode)}
                  onValueChange={(v) => setColorCode(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                    <SelectItem value="4">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ Type = tkt_type (classification, not priority) */}
              <div>
                <Label>Type</Label>
                <Select
                  value={form.tkt_type ?? "General"}
                  onValueChange={(v) => handleChange("tkt_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Complaint">Complaint</SelectItem>
                    <SelectItem value="Request">Request</SelectItem>
                    <SelectItem value="Incident">Incident</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Category</Label>
                <Input
                  value={form.cat_id ?? ""}
                  onChange={(e) => handleChange("cat_id", e.target.value)}
                />
              </div>
              <div>
                <Label>Sub Category</Label>
                <Input
                  value={form.sub_cat_id ?? ""}
                  onChange={(e) => handleChange("sub_cat_id", e.target.value)}
                />
              </div>
              <div>
                <Label>Root Cause</Label>
                <Input
                  value={form.sub_sub_cat_id ?? ""}
                  onChange={(e) =>
                    handleChange("sub_sub_cat_id", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}