
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "../api/ticketApi";
import { QUERY_ROOTS } from "@/lib/queryKeys";

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.tickets });
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.dashboard });
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.analytics });
    },
  });
}