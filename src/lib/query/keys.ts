import type { ListParams } from "@/types/api";
import type { AnalyticsRange } from "@/types/tour-access";

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
  tours: {
    all: ["tours"] as const,
    lists: () => [...queryKeys.tours.all, "list"] as const,
    list: (params?: ListParams & { publishStatus?: string; language?: string }) =>
      [...queryKeys.tours.lists(), params ?? {}] as const,
    details: () => [...queryKeys.tours.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tours.details(), id] as const,
  },
  tourLifecycle: {
    all: ["tour-lifecycle"] as const,
    details: () => [...queryKeys.tourLifecycle.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.tourLifecycle.details(), id] as const,
  },
  tourBundles: {
    all: ["tour-bundles"] as const,
    latest: (tourId: string) =>
      [...queryKeys.tourBundles.all, "latest", tourId] as const,
  },
  floors: {
    all: ["floors"] as const,
    lists: () => [...queryKeys.floors.all, "list"] as const,
    list: (tourId: string) => [...queryKeys.floors.lists(), tourId] as const,
    details: () => [...queryKeys.floors.all, "detail"] as const,
    detail: (tourId: string, floorId: string) =>
      [...queryKeys.floors.details(), tourId, floorId] as const,
    byTour: (tourId: string) => [...queryKeys.floors.lists(), tourId] as const,
  },
  spots: {
    all: ["spots"] as const,
    lists: () => [...queryKeys.spots.all, "list"] as const,
    list: (tourId: string) => [...queryKeys.spots.lists(), tourId] as const,
    details: () => [...queryKeys.spots.all, "detail"] as const,
    detail: (tourId: string, spotId: string) =>
      [...queryKeys.spots.details(), tourId, spotId] as const,
  },
  tourAccess: {
    all: ["tour-access"] as const,
    lists: () => [...queryKeys.tourAccess.all, "list"] as const,
    list: (params?: ListParams & { status?: string; search?: string }) =>
      [...queryKeys.tourAccess.lists(), params ?? {}] as const,
    details: () => [...queryKeys.tourAccess.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tourAccess.details(), id] as const,
    sessions: (id: string) =>
      [...queryKeys.tourAccess.all, "sessions", id] as const,
    analyticsSeries: (range: AnalyticsRange) =>
      [...queryKeys.tourAccess.all, "analytics", "series", range] as const,
    analyticsSummary: () =>
      [...queryKeys.tourAccess.all, "analytics", "summary"] as const,
  },
  tourRoute: {
    all: ["tour-route"] as const,
    details: () => [...queryKeys.tourRoute.all, "detail"] as const,
    detail: (tourId: string, floorId: string) =>
      [...queryKeys.tourRoute.details(), tourId, floorId] as const,
    byTour: (tourId: string) =>
      [...queryKeys.tourRoute.details(), tourId] as const,
  },
  aiKnowledge: {
    all: ["ai-knowledge"] as const,
    lists: () => [...queryKeys.aiKnowledge.all, "list"] as const,
    list: (tourId: string) => [...queryKeys.aiKnowledge.lists(), tourId] as const,
    details: () => [...queryKeys.aiKnowledge.all, "detail"] as const,
    detail: (tourId: string, knowledgeId: string) =>
      [...queryKeys.aiKnowledge.details(), tourId, knowledgeId] as const,
  },
  appUiStrings: {
    all: ["app-ui-strings"] as const,
    lists: () => [...queryKeys.appUiStrings.all, "list"] as const,
    list: (params?: ListParams & { lifecycle?: string; search?: string }) =>
      [...queryKeys.appUiStrings.lists(), params ?? {}] as const,
    details: () => [...queryKeys.appUiStrings.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.appUiStrings.details(), id] as const,
  },
  appAssets: {
    all: ["app-assets"] as const,
    lists: () => [...queryKeys.appAssets.all, "list"] as const,
    list: (
      params?: ListParams & {
        lifecycle?: string;
        timeOfDay?: string;
        search?: string;
      },
    ) => [...queryKeys.appAssets.lists(), params ?? {}] as const,
    details: () => [...queryKeys.appAssets.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.appAssets.details(), id] as const,
  },
  appReleaseConfig: {
    all: ["app-release-config"] as const,
  },
  knowledgeArticles: {
    all: ["knowledge-articles"] as const,
    lists: () => [...queryKeys.knowledgeArticles.all, "list"] as const,
    list: (params?: ListParams & { category?: string; language?: string }) =>
      [...queryKeys.knowledgeArticles.lists(), params ?? {}] as const,
    details: () => [...queryKeys.knowledgeArticles.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.knowledgeArticles.details(), id] as const,
  },
  subscriptionPlans: {
    all: ["subscription-plans"] as const,
    lists: () => [...queryKeys.subscriptionPlans.all, "list"] as const,
    details: () => [...queryKeys.subscriptionPlans.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.subscriptionPlans.details(), id] as const,
  },
  devicePricingTiers: {
    all: ["device-pricing-tiers"] as const,
    lists: () => [...queryKeys.devicePricingTiers.all, "list"] as const,
    details: () => [...queryKeys.devicePricingTiers.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.devicePricingTiers.details(), id] as const,
  },
  subscriptionPricingSettings: {
    all: ["subscription-pricing-settings"] as const,
  },
  subscriptionPurchases: {
    all: ["subscription-purchases"] as const,
    lists: () => [...queryKeys.subscriptionPurchases.all, "list"] as const,
    list: (params?: ListParams & { status?: string; email?: string }) =>
      [...queryKeys.subscriptionPurchases.lists(), params ?? {}] as const,
  },
  auditLogs: {
    all: ["audit-logs"] as const,
    lists: () => [...queryKeys.auditLogs.all, "list"] as const,
    list: (params?: ListParams & {
      module?: string;
      actionType?: string;
      entityId?: string;
      staffAuthUserId?: string;
    }) => [...queryKeys.auditLogs.lists(), params ?? {}] as const,
  },
  hosts: {
    all: ["hosts"] as const,
    byTour: (tourId: string) =>
      [...queryKeys.hosts.all, "by-tour", tourId] as const,
    lists: () => [...queryKeys.hosts.all, "list"] as const,
    list: (tourId: string, params?: ListParams) =>
      [...queryKeys.hosts.lists(), tourId, params ?? {}] as const,
    details: () => [...queryKeys.hosts.all, "detail"] as const,
    detail: (tourId: string, hostId: string) =>
      [...queryKeys.hosts.details(), tourId, hostId] as const,
  },
} as const;
