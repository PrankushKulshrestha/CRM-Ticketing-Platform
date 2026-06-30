
import { apiClient } from "@/lib/api/apiClient";
import type {
  AddCommentPayload,
  TicketComment,
} from "../types/ticket.types";

/* -------------------------------------------------------------------------- */
/* API Response Wrapper                                                     */
/* -------------------------------------------------------------------------- */

interface ApiResponse<T> {
  readonly success: boolean;
  readonly message?: string;
  readonly data: T;
  readonly timestamp?: string;
}

/**
 * Raw shape returned by the backend's comment.controller.ts — every
 * authenticated commenter in this app is an agent-side user (there's no
 * customer-facing auth), so authorRole is always normalized to "agent"
 * below regardless of the specific internal role (admin/manager/
 * team_lead/agent/viewer) the backend reports.
 */
interface RawTicketComment {
  id: string;
  ticketId: string;
  message: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  isInternal: boolean;
  source?: string;
  fromCustomer?: boolean;
  fromEmail?: string;
  createdAt: string;
  updatedAt: string;
}

function toTicketComment(raw: RawTicketComment): TicketComment {
  return {
    id: raw.id,
    message: raw.message,
    authorName: raw.authorName,
    // Customer-originated messages have authorRole "customer" from the backend;
    // all others are agent-side users regardless of their specific internal role.
    authorRole: raw.fromCustomer ? "customer" : "agent",
    internal: raw.isInternal,
    source: (raw.source as TicketComment["source"]) ?? (raw.isInternal ? "note" : "agent_reply"),
    fromCustomer: raw.fromCustomer ?? false,
    fromEmail: raw.fromEmail,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Get Ticket Comments                                                       */
/* -------------------------------------------------------------------------- */

export async function getTicketComments(
  ticketId: string,
): Promise<TicketComment[]> {
  const response = await apiClient.get<ApiResponse<RawTicketComment[]>>(
    `/tickets/${ticketId}/comments`,
  );

  return response.data.data.map(toTicketComment);
}

/* -------------------------------------------------------------------------- */
/* Add Ticket Comment                                                       */
/* -------------------------------------------------------------------------- */

export async function addTicketComment(
  ticketId: string,
  payload: AddCommentPayload,
): Promise<TicketComment> {
  try {
    const response = await apiClient.post<ApiResponse<RawTicketComment>>(
      `/tickets/${ticketId}/comments`,
      {
        message: payload.comment,
        isInternal: payload.is_internal ?? false,
      },
    );

    return toTicketComment(response.data.data);
  } catch (error) {
    console.error("[Ticket API] Failed to add comment", error);

    throw new Error(
      error instanceof Error ? error.message : "Failed to add ticket comment",
    );
  }
}