
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTicket } from "../api/ticketApi";
import type { UpdateTicketPayload } from "../types/ticket.types";
import { QUERY_KEYS, QUERY_ROOTS } from "@/lib/queryKeys";

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTicketPayload;
    }) => updateTicket(id, payload),

    onSuccess: (_data, { id }) => {
      // Bust the specific ticket detail AND the list
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(id) });
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.tickets });
      // Status changes (resolve/close/reopen) move resolved_date/closed_date,
      // which feed the dashboard trend graphs and analytics metrics directly.
      // Without this, those only catch up on the next 60s poll instead of
      // reflecting the change immediately.
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.dashboard });
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.analytics });
    },
  });
}