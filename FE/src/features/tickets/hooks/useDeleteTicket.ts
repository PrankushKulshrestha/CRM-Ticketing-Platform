
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTicket } from "../api/ticketApi";
import { QUERY_KEYS, QUERY_ROOTS } from "@/lib/queryKeys";

export function useDeleteTicket(onSuccessNavigate?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTicket(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.tickets });
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.dashboard });
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.analytics });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.ticket(id) });
      onSuccessNavigate?.();
    },
  });
}