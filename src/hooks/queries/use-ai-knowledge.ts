import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { aiKnowledgeService } from "@/services/ai-knowledge.service";

export function useAiKnowledgeList(tourId: string) {
  return useQuery({
    queryKey: queryKeys.aiKnowledge.list(tourId),
    queryFn: () => aiKnowledgeService.list(tourId),
    enabled: Boolean(tourId),
  });
}

export function useAiKnowledge(tourId: string, knowledgeId: string) {
  return useQuery({
    queryKey: queryKeys.aiKnowledge.detail(tourId, knowledgeId),
    queryFn: () => aiKnowledgeService.getById(tourId, knowledgeId),
    enabled: Boolean(tourId && knowledgeId),
  });
}
