import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { knowledgeArticlesService } from "@/services/knowledge-articles.service";
import type { ListParams } from "@/types/api";
import type { KnowledgeCategory } from "@/types/knowledge-article";

export function useKnowledgeArticles(
  params?: ListParams & { category?: KnowledgeCategory; language?: string },
) {
  return useQuery({
    queryKey: queryKeys.knowledgeArticles.list(params),
    queryFn: () => knowledgeArticlesService.list(params),
  });
}

export function useKnowledgeArticle(id: string) {
  return useQuery({
    queryKey: queryKeys.knowledgeArticles.detail(id),
    queryFn: () => knowledgeArticlesService.getById(id),
    enabled: Boolean(id),
  });
}
