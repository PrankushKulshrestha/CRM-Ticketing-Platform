
import type { PaginationMeta, ApiResponse, ApiListResponse } from "@/types";

// Re-export shared types for convenience within the feature
export type { PaginationMeta };

/* -------------------------------------------------------------------------- */
/* Core Enums                                                                 */
/* -------------------------------------------------------------------------- */

export type TicketStatus =
  | "new"
  | "open"
  | "pending"
  | "reopened"
  | "request_clarification"
  | "resolved"
  | "closed"
  | string;

export type TicketType =
  | "General"
  | "Complaint"
  | "Request"
  | "Incident"
  | "Service"
  | string;

export type TicketActorRole = "customer" | "agent" | "system";

export type TicketActivityType =
  | "created"
  | "updated"
  | "assigned"
  | "status_changed"
  | "priority_changed"
  | "comment_added"
  | "resolved"
  | "closed";

/* -------------------------------------------------------------------------- */
/* Ticket Sub-Entities                                                        */
/* -------------------------------------------------------------------------- */

export interface TicketComment {
  id: string;
  message: string;
  authorName: string;
  authorRole: TicketActorRole;
  internal: boolean;
  /** Channel that originated this message. */
  source?: "agent_reply" | "email_inbound" | "note";
  /** True when the message came from the customer via email. */
  fromCustomer?: boolean;
  /** Customer email address for email_inbound messages. */
  fromEmail?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketActivity {
  type: TicketActivityType;
  message: string;
  createdAt: string;
}

export interface TicketAssignee {
  id: string;
  name: string;
  email: string;
  role?: string;
}

/** Derived from the assignee's team membership. */
export interface TicketTeam {
  id: string;
  name: string;
}

/** Multi-level SLA state, lazily resolved by the backend at read time. */
export interface TicketSLA {
  currentLevel: number;
  status: string;
  resolutionDueAt: string;
  responseDueAt: string;
  remainingMs: number;
  isResolutionBreached: boolean;
  escalatedPriority: number;
  priorityEscalated: boolean;
}

/* -------------------------------------------------------------------------- */
/* Ticket Entity                                                              */
/* -------------------------------------------------------------------------- */

export interface Ticket {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  /** color_code: 1=Low, 2=Medium, 3=High, 4=Urgent */
  priority: number;
  status: string;
  category: string;
  assignee: TicketAssignee | null;
  /** Derived from the assignee's team membership; null if unassigned or assignee has no team. */
  team?: TicketTeam | null;
  /** Multi-level SLA state, lazily resolved by the backend. Null if no tracker exists. */
  sla?: TicketSLA | null;
  /** 1-5 CSAT rating, from customer email reply or manually set by agent. */
  customer_satisfaction?: number | null;
  feedback_requested_at?: string | null;
  comments: TicketComment[];
  activities: TicketActivity[];
  createdAt: string;
  updatedAt: string;

  /* Legacy CRM DB column names */
  tkt_number: string;
  tkt_status?: TicketStatus;
  tkt_type?: string;
  description?: string;
  tkt_customer_name?: string;
  tkt_customer_mobile?: string;
  eml_ticket_created_for?: string;
  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;
  tkt_user?: string;
  email_subject?: string;
  created_date?: string;
  update_date?: string;
  remarks_n?: string;
  color_code?: number;

  /*
   * FIX: added — backend's ticket.service.ts now sets and returns these
   * (see toTicket() mapper), but the frontend Ticket type had no fields
   * to receive them, so they'd be silently dropped by anything doing
   * typed access (e.g. `ticket.resolved_date` would be a TS error).
   * ISO date strings, same convention as created_date/update_date above.
   */
  resolved_date?: string;
  closed_date?: string;

  /** ISO date string. Set once on the first non-internal agent reply. */
  first_response_at?: string;

  /** True if this ticket was resolved/closed at least once, then reopened. */
  was_reopened?: boolean;

  /** Set when this ticket is merged into another ticket. */
  merged_into?: string | null;
  merged_at?: string | null;
}

/* -------------------------------------------------------------------------- */
/* API Responses — use shared generics                                        */
/* -------------------------------------------------------------------------- */

export type TicketsResponse = ApiListResponse<Ticket>;
export type TicketResponse  = ApiResponse<Ticket>;

/* -------------------------------------------------------------------------- */
/* Filters                                                                    */
/* -------------------------------------------------------------------------- */

export interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  tkt_status?: TicketStatus;
  tkt_type?: string;
  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;
  tkt_user?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

/* -------------------------------------------------------------------------- */
/* Mutation Payloads                                                          */
/* -------------------------------------------------------------------------- */

export interface CreateTicketPayload {
  email_subject: string;
  description?: string;
  tkt_customer_name: string;
  eml_ticket_created_for: string;
  tkt_status?: TicketStatus;
  tkt_type?: string;
  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;
  tkt_customer_mobile?: string;
  tkt_user?: string;
  tkt_assigned_to?: string | null;

  color_code?: number;
}

export interface UpdateTicketPayload {
  email_subject?: string;
  description?: string;
  remarks_n?: string;
  tkt_status?: TicketStatus;
  tkt_type?: string;
  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;
  tkt_customer_name?: string;
  tkt_customer_mobile?: string;
  eml_ticket_created_for?: string;
  tkt_user?: string;
  color_code?: number;

  tkt_assigned_to?: string | null;

  /** 1-5 customer satisfaction rating, or null to clear. */
  customer_satisfaction?: number | null;
}

export interface AddCommentPayload {
  comment: string;
  is_internal?: boolean;
  tkt_user?: string;
}