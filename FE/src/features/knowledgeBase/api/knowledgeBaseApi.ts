import { apiClient } from "@/lib/api/apiClient";

export interface KBArticle {
  _id: string;
  title: string;
  keywords: string[];
  category: string;
  sub_category?: string;
  solution: string;
  summary?: string;
  article_type: "faq" | "how-to" | "troubleshooting" | "policy" | "other";
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KBSearchParams {
  query?: string;
  category?: string;
  article_type?: string;
  page?: number;
  limit?: number;
}

export interface KBSearchResult {
  articles: KBArticle[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const knowledgeBaseApi = {
  search: (params: KBSearchParams) =>
    apiClient.get<{ success: boolean; data: KBSearchResult }>("/knowledge-base", { params }),

  getById: (id: string) =>
    apiClient.get<{ success: boolean; data: KBArticle }>(`/knowledge-base/${id}`),

  create: (data: Partial<KBArticle>) =>
    apiClient.post<{ success: boolean; data: KBArticle }>("/knowledge-base", data),

  update: (id: string, data: Partial<KBArticle>) =>
    apiClient.put<{ success: boolean; data: KBArticle }>(`/knowledge-base/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/knowledge-base/${id}`),

  vote: (id: string, vote: "helpful" | "not_helpful") =>
    apiClient.post<{ success: boolean; data: KBArticle }>(`/knowledge-base/${id}/vote`, { vote }),

  getCategories: () =>
    apiClient.get<{ success: boolean; data: string[] }>("/knowledge-base/categories"),

  getStats: () =>
    apiClient.get<{ success: boolean; data: { total: number; published: number; byType: { _id: string; count: number }[] } }>("/knowledge-base/stats"),
};
