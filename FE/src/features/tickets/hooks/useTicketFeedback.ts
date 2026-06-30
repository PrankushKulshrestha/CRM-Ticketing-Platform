
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicketFeedback, requestTicketFeedback } from "../api/feedbackApi";
import { QUERY_KEYS } from "@/lib/queryKeys";

export function useTicketFeedback(ticketId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ticketFeedback(ticketId ?? ""),
    queryFn: () => getTicketFeedback(ticketId as string),
    enabled: Boolean(ticketId),
  });
}

export function useRequestFeedback(ticketId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => requestTicketFeedback(ticketId as string),
    onSuccess: () => {
      // Refetch feedback list so UI reflects the pending request immediately
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketFeedback(ticketId ?? "") });
    },
  });
}
