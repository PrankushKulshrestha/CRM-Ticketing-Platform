import { apiClient } from "@/lib/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SystemSettings {
  new_ticket_window_hours: number;
  updatedAt?: string;
}

export const systemSettingsApi = {
  get: () =>
    apiClient.get<{ success: boolean; data: SystemSettings }>("/system-settings"),

  update: (data: Partial<SystemSettings>) =>
    apiClient.put<{ success: boolean; data: SystemSettings }>("/system-settings", data),
};

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: () => systemSettingsApi.get(),
    staleTime: 60_000,
    select: (res) => res.data,
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: systemSettingsApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-settings"] }),
  });
}
