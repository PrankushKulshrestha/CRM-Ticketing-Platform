
import { apiClient } from "@/lib/api/apiClient";

export interface PriorityLimits {
  responseMinutes: number;
  resolutionMinutes: number;
}

export interface SLAPolicy {
  _id?: string;
  isActive: boolean;
  /** Keyed by numeric color_code as a string: "1" (low) .. "4" (urgent). */
  byPriority: Record<string, PriorityLimits>;
  /** Keyed by level as a string: "2".."5". Level 1 comes from byPriority. */
  escalationMinutes: Record<string, number>;
  updatedAt?: string;
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly message?: string;
  readonly data: T;
}

export async function getSLAPolicy(): Promise<SLAPolicy> {
  const res = await apiClient.get<ApiResponse<SLAPolicy>>("/sla/policy");
  return res.data.data;
}

export async function updateSLAPolicy(
  payload: Partial<Pick<SLAPolicy, "byPriority" | "escalationMinutes">>,
): Promise<SLAPolicy> {
  const res = await apiClient.patch<ApiResponse<SLAPolicy>>("/sla/policy", payload);
  return res.data.data;
}
