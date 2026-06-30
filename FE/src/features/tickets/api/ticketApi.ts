
/*
|--------------------------------------------------------------------------
| Ticket API Service
|--------------------------------------------------------------------------
| Strongly typed, scalable, production-grade API layer
|--------------------------------------------------------------------------
*/

import { apiClient } from "@/lib/api/apiClient";

import type {
  CreateTicketPayload,
  Ticket,
  TicketFilters,
  TicketsResponse,
  UpdateTicketPayload,
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

/* -------------------------------------------------------------------------- */
/* Internal Helpers                                                         */
/* -------------------------------------------------------------------------- */

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

/* Centralized status updater */
function updateStatus(id: string, status: string) {
  return apiClient.patch<ApiResponse<Ticket>>(`/tickets/${id}`, {
    tkt_status: status,
  });
}

/* -------------------------------------------------------------------------- */
/* Ticket API Service                                                       */
/* -------------------------------------------------------------------------- */

class TicketApiService {
  /* ---------------------------------------------------------------------- */
  /* Get Ticket Count                                                     */
  /* ---------------------------------------------------------------------- */

  async getTicketCount(): Promise<{ count: number }> {
    const res =
      await apiClient.get<ApiResponse<{ count: number }>>("/tickets/count");

    return unwrap(res);
  }

  /* ---------------------------------------------------------------------- */
  /* Get Tickets                                                          */
  /* ---------------------------------------------------------------------- */

  async getTickets(filters?: TicketFilters): Promise<TicketsResponse> {
    const res = await apiClient.get<TicketsResponse>("/tickets", {
      params: filters,
    });

    return res.data;
  }

  /* ---------------------------------------------------------------------- */
  /* Get Ticket By ID                                                    */
  /* ---------------------------------------------------------------------- */

  async getTicketById(id: string): Promise<Ticket> {
    const res = await apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return unwrap(res);
  }

  /* ---------------------------------------------------------------------- */
  /* Create Ticket                                                       */
  /* ---------------------------------------------------------------------- */

  async createTicket(payload: CreateTicketPayload): Promise<Ticket> {
    const res = await apiClient.post<ApiResponse<Ticket>>("/tickets", payload);

    return unwrap(res);
  }

  /* ---------------------------------------------------------------------- */
  /* Update Ticket                                                       */
  /* ---------------------------------------------------------------------- */

  async updateTicket(
    id: string,
    payload: UpdateTicketPayload,
  ): Promise<Ticket> {
    const res = await apiClient.patch<ApiResponse<Ticket>>(
      `/tickets/${id}`,
      payload,
    );

    return unwrap(res);
  }

  /* ---------------------------------------------------------------------- */
  /* Delete Ticket                                                       */
  /* ---------------------------------------------------------------------- */

  async deleteTicket(id: string): Promise<void> {
    await apiClient.delete(`/tickets/${id}`);
  }

  /* ---------------------------------------------------------------------- */
  /* Status Actions (DRY + consistent)                                   */
  /* ---------------------------------------------------------------------- */

  async reopenTicket(id: string): Promise<Ticket> {
    const res = await updateStatus(id, "reopened");
    return unwrap(res);
  }

  async resolveTicket(id: string): Promise<Ticket> {
    const res = await updateStatus(id, "resolved");
    return unwrap(res);
  }

  async closeTicket(id: string): Promise<Ticket> {
    const res = await updateStatus(id, "closed");
    return unwrap(res);
  }

  /* ---------------------------------------------------------------------- */
  /* Merge Ticket                                                           */
  /* ---------------------------------------------------------------------- */
  async mergeTicket(sourceId: string, targetId: string): Promise<Ticket> {
    const res = await apiClient.post<ApiResponse<Ticket>>(
      `/tickets/${sourceId}/merge`,
      { targetId },
    );
    return unwrap(res);
  }

  /* ---------------------------------------------------------------------- */
  /* Get Ticket History                                                    */
  /* ---------------------------------------------------------------------- */
  async getTicketHistory(id: string): Promise<unknown[]> {
    const res = await apiClient.get<ApiResponse<unknown[]>>(
      `/tickets/${id}/history`,
    );
    return unwrap(res);
  }

  /* ---------------------------------------------------------------------- */
  /* Get Backlog                                                           */
  /* ---------------------------------------------------------------------- */
  async getBacklog(): Promise<unknown> {
    const res = await apiClient.get<ApiResponse<unknown>>(`/tickets/backlog`);
    return unwrap(res);
  }

  /* ---------------------------------------------------------------------- */
  /* Get Print Data                                                        */
  /* ---------------------------------------------------------------------- */
  async getPrintData(id: string): Promise<unknown> {
    const res = await apiClient.get<ApiResponse<unknown>>(
      `/tickets/${id}/print`,
    );
    return unwrap(res);
  }
}

/* -------------------------------------------------------------------------- */
/* Singleton Instance                                                       */
/* -------------------------------------------------------------------------- */

export const ticketApi = new TicketApiService();

/* -------------------------------------------------------------------------- */
/* Named Exports (React Query friendly)                                    */
/* -------------------------------------------------------------------------- */

export const getTickets = ticketApi.getTickets.bind(ticketApi);
export const getTicketById = ticketApi.getTicketById.bind(ticketApi);
export const createTicket = ticketApi.createTicket.bind(ticketApi);
export const updateTicket = ticketApi.updateTicket.bind(ticketApi);
export const deleteTicket = ticketApi.deleteTicket.bind(ticketApi);
export const reopenTicket = ticketApi.reopenTicket.bind(ticketApi);
export const resolveTicket = ticketApi.resolveTicket.bind(ticketApi);
export const closeTicket = ticketApi.closeTicket.bind(ticketApi);
export const mergeTicket = ticketApi.mergeTicket.bind(ticketApi);
export const getTicketHistory = ticketApi.getTicketHistory.bind(ticketApi);
export const getBacklog = ticketApi.getBacklog.bind(ticketApi);
export const getPrintData = ticketApi.getPrintData.bind(ticketApi);

/* -------------------------------------------------------------------------- */
/* Default Export                                                           */
/* -------------------------------------------------------------------------- */

export default ticketApi;