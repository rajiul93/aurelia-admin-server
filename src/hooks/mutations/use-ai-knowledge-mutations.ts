import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { aiKnowledgeService } from "@/services/ai-knowledge.service";
import type {
  CreateAiKnowledgePayload,
  UpdateAiKnowledgePayload,
} from "@/types/ai-knowledge";

function invalidateKnowledge(
  queryClient: ReturnType<typeof useQueryClient>,
  tourId: string,
  knowledgeId?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.aiKnowledge.list(tourId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tours.detail(tourId),
  });

  if (knowledgeId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.aiKnowledge.detail(tourId, knowledgeId),
    });
  }
}

export function useCreateAiKnowledge(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "AI knowledge entry created" },
    mutationFn: (payload: CreateAiKnowledgePayload) =>
      aiKnowledgeService.create(tourId, payload),
    onSuccess: () => invalidateKnowledge(queryClient, tourId),
  });
}

export function useUpdateAiKnowledge(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "AI knowledge entry updated" },
    mutationFn: ({
      knowledgeId,
      payload,
    }: {
      knowledgeId: string;
      payload: UpdateAiKnowledgePayload;
    }) => aiKnowledgeService.update(tourId, knowledgeId, payload),
    onSuccess: (_data, variables) =>
      invalidateKnowledge(queryClient, tourId, variables.knowledgeId),
  });
}

export function useDeleteAiKnowledge(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "AI knowledge entry deleted" },
    mutationFn: (knowledgeId: string) =>
      aiKnowledgeService.remove(tourId, knowledgeId),
    onSuccess: () => invalidateKnowledge(queryClient, tourId),
  });
}
