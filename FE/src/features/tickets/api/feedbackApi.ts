
import { apiClient } from "@/lib/api/apiClient";

export interface TicketFeedback {
  _id: string;
  ticketId: string;
  ticketNumber: string;
  rating: number;
  description?: string;
  customerEmail: string;
  source: "email_reply" | "manual";
  requestedAt: string;
  respondedAt: string;
  createdAt: string;
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly message?: string;
  readonly data: T;
}

export async function getTicketFeedback(ticketId: string): Promise<TicketFeedback[]> {
  const res = await apiClient.get<ApiResponse<TicketFeedback[]>>(
    `/tickets/${ticketId}/feedback`,
  );
  return res.data;
}

export async function requestTicketFeedback(ticketId: string): Promise<void> {
  await apiClient.post(`/tickets/${ticketId}/feedback/request`, {});
}
