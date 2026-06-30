
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicketComments, addTicketComment } from "../api/ticketCommentApi";
import { QUERY_KEYS, QUERY_ROOTS } from "@/lib/queryKeys";
import type { AddCommentPayload } from "../types/ticket.types";

export function useTicketComments(ticketId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ticketComments(ticketId ?? ""),
    queryFn: () => getTicketComments(ticketId as string),
    enabled: Boolean(ticketId),
    staleTime: 15 * 1000,
  });
}

export function useAddTicketComment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddCommentPayload) =>
      addTicketComment(ticketId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketComments(ticketId),
      });
      // The first non-internal reply also stamps first_response_at on the
      // ticket itself, so refresh the ticket detail too.
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticket(ticketId),
      });
      // ...and the FRT/FCR analytics, which are derived from
      // first_response_at / resolved_date across all tickets. Invalidate
      // broadly (all analytics queries, regardless of query params) rather
      // than trying to guess which exact key is cached.
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.analytics });
      // ...and the dashboard, whose summary cards/trends also reflect
      // first_response_at-derived state once a reply lands.
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.dashboard });
    },
  });
}
