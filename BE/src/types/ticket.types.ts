
import type {
  TicketStatus,
  TicketClassification,
} from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* CORE ENTITY (CLEAN MONGOOSE / DOMAIN CONTRACT)                            */
/* -------------------------------------------------------------------------- */

export interface Ticket {
  id: string;

  tkt_number: string;

  email_subject?: string;
  description?: string;

  tkt_status: TicketStatus;
  tkt_type: TicketClassification;

  created_date: Date;
  update_date?: Date;

  email_date?: Date;

  eml_ticket_created_by?: string;
  eml_ticket_created_for?: string;

  tkt_user?: string;
  tkt_eml_id?: number;

  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;

  color_code?: number;

  assigned_date?: Date;
  reopened_date?: Date;
  resolved_date?: Date;
  closed_date?: Date;

  /** Set once by CommentService on the first non-internal agent reply. */
  first_response_at?: Date;

  /** Set once if a resolved/closed ticket is later reopened. Used for FCR. */
  was_reopened?: boolean;

  tkt_customer_name?: string;
  tkt_customer_mobile?: string;

  remarks_n?: string;

  /** Raw ObjectId string of the assigned agent (User._id) */
  tkt_assigned_to?: string | null;

  /** Populated agent details, built by TicketService.toTicket() */
  assignee?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;

  /** Derived from the assignee's team membership (Team.members includes them). */
  team?: {
    id: string;
    name: string;
  } | null;

  /** Multi-level SLA state, lazily resolved at read time. Null if no tracker exists. */
  sla?: {
    currentLevel: number;
    status: string;
    resolutionDueAt: string;
    responseDueAt: string;
    remainingMs: number;
    isResolutionBreached: boolean;
    escalatedPriority: number;
    priorityEscalated: boolean;
  } | null;

  customer_satisfaction?: number | null;
  feedback_requested_at?: Date | null;

  /** FIX #3: Set when this ticket is merged into another. Merged tickets are archived. */
  merged_into?: string | null;
  merged_at?: Date | null;
}

/*
 * FIX (duplication reduction): removed three exports that were defined here
 * but never imported anywhere in the backend — confirmed via grep across
 * be/src for each identifier with zero hits outside this file:
 *
 *   - PaginationMeta   — duplicate of common.types.ts's PaginationMeta
 *                        (identical shape: total/page/limit/totalPages).
 *                        Import from "./common.types" if ever needed here.
 *   - TicketResponse   — unused; controllers build responses inline via
 *                        buildResponse() in ticket.controller.ts instead.
 *   - TicketsResponse  — same as above, plus only consumer was the now-
 *                        removed PaginationMeta.
 *
 * AddCommentPayload was previously removed for the same reason, but is now
 * back (see below) — comment.controller.ts/comment.service.ts use it.
 *
 * If any of these are needed later, PaginationMeta should come from
 * "./common.types" rather than being redefined here.
 */

/* -------------------------------------------------------------------------- */
/* FILTERS                                                                   */
/* -------------------------------------------------------------------------- */

export interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;

  /* Widened to string: query params arrive as strings, narrowing happens
     in buildFilters() inside the controller, not at the type level.        */
  tkt_status?: string;
  tkt_type?: string;

  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;

  tkt_user?: string;
}

/* -------------------------------------------------------------------------- */
/* CREATE PAYLOAD                                                            */
/* -------------------------------------------------------------------------- */

export interface CreateTicketPayload {
  email_subject: string;
  description?: string;

  tkt_customer_name: string;
  eml_ticket_created_for: string;

  /* Widened to string/number: callers hold runtime values, not literal
     union members. The Mongoose enum constraint enforces valid values.     */
  tkt_status?: string;
  tkt_type?: string;

  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;

  tkt_customer_mobile?: string;
  tkt_user?: string;

  color_code?: number;
}

/* -------------------------------------------------------------------------- */
/* UPDATE PAYLOAD                                                            */
/* -------------------------------------------------------------------------- */

export interface UpdateTicketPayload {
  email_subject?: string;
  description?: string;
  remarks_n?: string;

  tkt_status?: string;
  tkt_type?: string;

  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;

  tkt_customer_name?: string;
  tkt_customer_mobile?: string;

  eml_ticket_created_for?: string;
  tkt_user?: string;

  color_code?: number;

  /** Pass agent's User._id to assign, or null/"" to unassign */
  tkt_assigned_to?: string | null;

  /** 1-5 customer satisfaction rating, or null to clear. */
  customer_satisfaction?: number | null;
  feedback_requested_at?: Date | null;

  /** Direct team assignment — stored and returned so FE can display it without agent lookup. */
  tkt_team?: string | null;

  /** Internal only — set by TicketService.updateTicket()'s reopen detection */
  was_reopened?: boolean;
}

/* -------------------------------------------------------------------------- */
/* COMMENT PAYLOAD                                                            */
/* -------------------------------------------------------------------------- */

export interface AddCommentPayload {
  message: string;
  isInternal?: boolean;
}