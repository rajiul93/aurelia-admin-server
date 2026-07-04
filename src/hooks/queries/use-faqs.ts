import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { faqsService } from "@/services/faqs.service";
import type { ListParams } from "@/types/api";

export function useFaqs(
  params?: ListParams & { categoryId?: string; language?: string },
) {
  return useQuery({
    queryKey: queryKeys.faqs.list(params),
    queryFn: () => faqsService.list(params),
  });
}

export function useFaq(id: string) {
  return useQuery({
    queryKey: queryKeys.faqs.detail(id),
    queryFn: () => faqsService.getById(id),
    enabled: Boolean(id),
  });
}
