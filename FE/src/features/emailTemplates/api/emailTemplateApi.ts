import { apiClient } from "@/lib/api/apiClient";

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  description?: string;
  category: "reply" | "resolution" | "escalation" | "follow-up" | "custom";
  is_active: boolean;
  use_count: number;
  createdAt: string;
  updatedAt: string;
}

export const emailTemplateApi = {
  list: (category?: string) =>
    apiClient.get<{ success: boolean; data: EmailTemplate[] }>("/email-templates", {
      params: category ? { category } : undefined,
    }),

  getById: (id: string) =>
    apiClient.get<{ success: boolean; data: EmailTemplate }>(`/email-templates/${id}`),

  create: (data: Partial<EmailTemplate>) =>
    apiClient.post<{ success: boolean; data: EmailTemplate }>("/email-templates", data),

  update: (id: string, data: Partial<EmailTemplate>) =>
    apiClient.put<{ success: boolean; data: EmailTemplate }>(`/email-templates/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/email-templates/${id}`),

  use: (
    id: string,
    context: {
      ticket?: Record<string, unknown>;
      customer?: Record<string, unknown>;
      agent?: Record<string, unknown>;
    }
  ) =>
    apiClient.post<{ success: boolean; data: { subject: string; body: string } }>(
      `/email-templates/${id}/use`,
      context
    ),
};
