import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { faqCategoriesService } from "@/services/faq-categories.service";
import type { ListParams } from "@/types/api";

export function useFaqCategories(params?: ListParams & { language?: string }) {
  return useQuery({
    queryKey: queryKeys.faqCategories.list(params),
    queryFn: () => faqCategoriesService.list(params),
  });
}
