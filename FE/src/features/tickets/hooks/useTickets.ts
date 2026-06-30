
import { useQuery } from "@tanstack/react-query";
import { getTickets, getTicketById } from "../api/ticketApi";
import type { TicketFilters } from "../types/ticket.types";
import { QUERY_KEYS } from "@/lib/queryKeys";

const DEFAULT_FILTERS: TicketFilters = {
  page: 1,
  limit: 10,
  search: "",
};

export function useTickets(filters?: TicketFilters) {
  const mergedFilters = { ...DEFAULT_FILTERS, ...filters };
  return useQuery({
    queryKey: QUERY_KEYS.tickets(mergedFilters),
    queryFn: () => getTickets(mergedFilters),
  });
}

export function useTicketDetails(id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ticket(id ?? ""),
    queryFn: () => getTicketById(id as string),
    enabled: Boolean(id),
  });
}