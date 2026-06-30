
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useCreateTicket } from "../hooks/useCreateTicket";
import { useAgents } from "../hooks/useAgents";
import type { CreateTicketPayload , Ticket, } from "../types/ticket.types";

const initialForm: CreateTicketPayload = {
  email_subject: "",
  description: "",
  tkt_customer_name: "",
  eml_ticket_created_for: "",
  tkt_status: "open",
  tkt_type: "General",
  color_code: 2,
  cat_id: "",
  sub_cat_id: "",
  sub_sub_cat_id: "",
  tkt_customer_mobile: "",
  tkt_assigned_to: null,
};

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { mutate: createTicket, isPending } = useCreateTicket();
  const { data: agents, isLoading: isLoadingAgents } = useAgents();
  const [form, setForm] = useState<CreateTicketPayload>(initialForm);

  function handleChange<K extends keyof CreateTicketPayload>(
    key: K,
    value: CreateTicketPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createTicket(form, {
      onSuccess: (ticket: Ticket) => {
        setForm(initialForm);
        navigate(`/tickets/${ticket.id}`);
      },
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-6">
      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Create Ticket</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Create and assign a new CRM helpdesk ticket with proper
          classification, customer details, and tracking metadata.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* CUSTOMER */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pb-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  required
                  value={form.tkt_customer_name}
                  onChange={(e) =>
                    handleChange("tkt_customer_name", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={form.eml_ticket_created_for}
                  onChange={(e) =>
                    handleChange("eml_ticket_created_for", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input
                  value={form.tkt_customer_mobile ?? ""}
                  onChange={(e) =>
                    handleChange("tkt_customer_mobile", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Agent</Label>
                <Select
                  value={form.tkt_assigned_to ?? "unassigned"}
                  onValueChange={(v) =>
                    handleChange(
                      "tkt_assigned_to",
                      v === "unassigned" ? null : v,
                    )
                  }
                  disabled={isLoadingAgents}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents?.map((agent) => (
                      <SelectItem key={agent._id} value={agent._id}>
                        <div className="flex flex-col py-0.5">
                          <span className="text-xs font-medium">
                            {agent.name}{" "}
                            <span className="font-normal text-muted-foreground">
                              ({agent.role})
                            </span>
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {agent.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TICKET DETAILS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pb-5">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                required
                value={form.email_subject}
                onChange={(e) => handleChange("email_subject", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                className="min-h-36 resize-none"
                value={form.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            {/* ✅ 3 cols — Status / Priority / Type all on same row */}
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.tkt_status || "open"}
                  onValueChange={(v) =>
                    handleChange(
                      "tkt_status",
                      v as CreateTicketPayload["tkt_status"],
                    )
                  }
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

              {/* ✅ Priority = color_code (1=Low 2=Medium 3=High 4=Urgent) */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={String(form.color_code)}
                  onValueChange={(v) => handleChange("color_code", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                    <SelectItem value="4">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ Type = tkt_type (General/Complaint/etc) — NOT priority */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.tkt_type || "General"}
                  onValueChange={(v) =>
                    handleChange(
                      "tkt_type",
                      v as CreateTicketPayload["tkt_type"],
                    )
                  }
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
          </CardContent>
        </Card>

        {/* CLASSIFICATION */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pb-5">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.cat_id ?? ""}
                  onChange={(e) => handleChange("cat_id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sub Category</Label>
                <Input
                  value={form.sub_cat_id ?? ""}
                  onChange={(e) => handleChange("sub_cat_id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Root Cause</Label>
                <Input
                  value={form.sub_sub_cat_id ?? ""}
                  onChange={(e) =>
                    handleChange("sub_sub_cat_id", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/tickets")}
            className="px-6"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="px-6">
            {isPending ? "Creating..." : "Create Ticket"}
          </Button>
        </div>
      </form>
    </div>
  );
}