
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSLAPolicy, updateSLAPolicy } from "../api/slaPolicyApi";
import { QUERY_KEYS } from "@/lib/queryKeys";

export function useSLAPolicy() {
  return useQuery({
    queryKey: QUERY_KEYS.slaPolicy(),
    queryFn: getSLAPolicy,
  });
}

export function useUpdateSLAPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSLAPolicy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.slaPolicy() });
    },
  });
}
