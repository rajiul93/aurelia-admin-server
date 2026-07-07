import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  CreateKnowledgeArticlePayload,
  KnowledgeArticle,
  KnowledgeCategory,
  UpdateKnowledgeArticlePayload,
} from "@/types/knowledge-article";

type ListParamsExtra = ListParams & {
  category?: KnowledgeCategory;
  language?: string;
};

export const knowledgeArticlesService = {
  list(params?: ListParamsExtra) {
    return apiClient
      .get<ApiSuccess<KnowledgeArticle[]>>("/knowledge-articles", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<KnowledgeArticle>>(`/knowledge-articles/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateKnowledgeArticlePayload) {
    return apiClient
      .post<ApiSuccess<KnowledgeArticle>>("/knowledge-articles", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateKnowledgeArticlePayload) {
    return apiClient
      .patch<ApiSuccess<KnowledgeArticle>>(
        `/knowledge-articles/${id}`,
        payload,
      )
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/knowledge-articles/${id}`)
      .then((response) => response.data);
  },
};
