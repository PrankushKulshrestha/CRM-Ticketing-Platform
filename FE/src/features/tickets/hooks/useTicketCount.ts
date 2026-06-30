
import { useQuery } from "@tanstack/react-query";
import { ticketApi } from "../api/ticketApi";

export function useTicketCount() {
  return useQuery({
    queryKey: ["ticket-count"],
    // Arrow function required — ticketApi is a class instance;
    // passing ticketApi.getTicketCount directly loses `this` binding.
    queryFn: () => ticketApi.getTicketCount(),
  });
}