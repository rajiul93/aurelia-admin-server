import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { knowledgeArticlesService } from "@/services/knowledge-articles.service";
import type {
  CreateKnowledgeArticlePayload,
  UpdateKnowledgeArticlePayload,
} from "@/types/knowledge-article";

export function useCreateKnowledgeArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateKnowledgeArticlePayload) =>
      knowledgeArticlesService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeArticles.lists(),
      });
    },
  });
}

export function useUpdateKnowledgeArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateKnowledgeArticlePayload;
    }) => knowledgeArticlesService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeArticles.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeArticles.detail(variables.id),
      });
    },
  });
}

export function useDeleteKnowledgeArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => knowledgeArticlesService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeArticles.lists(),
      });
    },
  });
}
