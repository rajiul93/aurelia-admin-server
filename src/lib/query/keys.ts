import type { ListParams } from "@/types/api";

export const queryKeys = {
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: ListParams & { role?: string }) =>
      [...queryKeys.users.lists(), params ?? {}] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  staffProfile: {
    all: ["staff-profile"] as const,
    me: ["staff-profile", "me"] as const,
  },
  faqs: {
    all: ["faqs"] as const,
    lists: () => [...queryKeys.faqs.all, "list"] as const,
    list: (params?: ListParams & { categoryId?: string; language?: string }) =>
      [...queryKeys.faqs.lists(), params ?? {}] as const,
    details: () => [...queryKeys.faqs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.faqs.details(), id] as const,
  },
  faqCategories: {
    all: ["faq-categories"] as const,
    lists: () => [...queryKeys.faqCategories.all, "list"] as const,
    list: (params?: ListParams & { language?: string }) =>
      [...queryKeys.faqCategories.lists(), params ?? {}] as const,
    details: () => [...queryKeys.faqCategories.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.faqCategories.details(), id] as const,
  },
} as const;
