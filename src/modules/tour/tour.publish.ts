import type { PublishStatus } from "@/generated/prisma/client";
import { ValidationError } from "@/lib/api/errors";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { APP_LANGUAGES } from "@/lib/i18n/languages";

export const TOUR_LIFECYCLE_ACTIONS = [
  "submit_review",
  "approve_publish",
  "archive",
  "return_to_draft",
  "rollback",
] as const;

export type TourLifecycleAction = (typeof TOUR_LIFECYCLE_ACTIONS)[number];

export type TourReadinessCheck = {
  id: string;
  label: string;
  ok: boolean;
};

export type TourReadiness = {
  ready: boolean;
  checks: TourReadinessCheck[];
};

type TranslationEntry = {
  language: string;
  audience: string;
  title?: string;
  descriptionText?: string;
  description?: string;
  question?: string;
  answerText?: string;
  content?: string;
};

type TourForReadiness = {
  coverMediaId: string | null;
  translations: TranslationEntry[];
  spots: Array<{
    id: string;
    latitude: number | null;
    longitude: number | null;
    translations: TranslationEntry[];
    media: unknown[];
    faqs: Array<{ translations: TranslationEntry[] }>;
  }>;
  route: {
    edges: Array<{ footprintGeo?: unknown }>;
  } | null;
  aiKnowledge: Array<{ translations: TranslationEntry[] }>;
};

const TRANSITIONS: Record<
  TourLifecycleAction,
  { from: PublishStatus[]; to: PublishStatus; requiresReady?: boolean }
> = {
  submit_review: {
    from: ["DRAFT"],
    to: "REVIEW",
    requiresReady: true,
  },
  approve_publish: {
    from: ["REVIEW"],
    to: "PUBLISHED",
    requiresReady: true,
  },
  archive: {
    from: ["PUBLISHED", "REVIEW"],
    to: "ARCHIVED",
  },
  return_to_draft: {
    from: ["REVIEW", "ARCHIVED"],
    to: "DRAFT",
  },
  rollback: {
    from: ["PUBLISHED"],
    to: "REVIEW",
  },
};

function hasCompleteTitles(translations: TranslationEntry[]) {
  return AUDIENCE_TYPES.every((audience) =>
    APP_LANGUAGES.every((language) =>
      translations.some(
        (entry) =>
          entry.audience === audience &&
          entry.language === language &&
          (entry.title?.trim().length ?? entry.question?.trim().length ?? 0) >
            0,
      ),
    ),
  );
}

function hasCompleteTextField(
  translations: TranslationEntry[],
  field: "descriptionText" | "content" | "answerText",
) {
  return AUDIENCE_TYPES.every((audience) =>
    APP_LANGUAGES.every((language) =>
      translations.some(
        (entry) =>
          entry.audience === audience &&
          entry.language === language &&
          (entry[field]?.trim().length ?? 0) > 0,
      ),
    ),
  );
}

function hasCompleteFaqs(
  faqs: Array<{ translations: TranslationEntry[] }>,
) {
  if (faqs.length === 0) {
    return true;
  }

  return faqs.every(
    (faq) =>
      hasCompleteTitles(faq.translations) &&
      hasCompleteTextField(faq.translations, "answerText"),
  );
}

function hasValidFootprintGeo(value: unknown) {
  if (!Array.isArray(value) || value.length < 2) {
    return false;
  }

  return value.every(
    (point) =>
      point &&
      typeof point === "object" &&
      "lat" in point &&
      "lng" in point &&
      typeof point.lat === "number" &&
      typeof point.lng === "number" &&
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lng),
  );
}

function hasCompleteAiKnowledge(
  entries: Array<{ translations: TranslationEntry[] }>,
) {
  if (entries.length === 0) {
    return true;
  }

  return entries.every((entry) =>
    hasCompleteTextField(entry.translations, "content"),
  );
}

export function getTourReadiness(tour: TourForReadiness): TourReadiness {
  const spotCount = tour.spots.length;
  const expectedEdges = spotCount > 1 ? spotCount - 1 : 0;
  const edgeCount = tour.route?.edges.length ?? 0;
  const edges = tour.route?.edges ?? [];

  const checks: TourReadinessCheck[] = [
    {
      id: "cover",
      label: "Cover image is set",
      ok: Boolean(tour.coverMediaId),
    },
    {
      id: "translations",
      label: "Tour titles exist for every audience and language",
      ok: hasCompleteTitles(tour.translations),
    },
    {
      id: "spots",
      label: "At least one spot exists",
      ok: spotCount > 0,
    },
    {
      id: "spot-translations",
      label: "Every spot has titles for every audience and language",
      ok:
        spotCount > 0 &&
        tour.spots.every((spot) => hasCompleteTitles(spot.translations)),
    },
    {
      id: "spot-descriptions",
      label: "Every spot has description text for every audience and language",
      ok:
        spotCount > 0 &&
        tour.spots.every((spot) =>
          hasCompleteTextField(spot.translations, "descriptionText"),
        ),
    },
    {
      id: "spot-coordinates",
      label: "Every spot has latitude and longitude",
      ok:
        spotCount > 0 &&
        tour.spots.every(
          (spot) =>
            spot.latitude !== null &&
            spot.longitude !== null &&
            Number.isFinite(spot.latitude) &&
            Number.isFinite(spot.longitude),
        ),
    },
    {
      id: "route",
      label:
        spotCount > 1
          ? `Route has at least ${expectedEdges} edge(s) between spots`
          : "Route is optional for a single-spot tour",
      ok: spotCount <= 1 || edgeCount >= expectedEdges,
    },
    {
      id: "route-footprints",
      label:
        spotCount > 1
          ? "Every route edge has a footprint polyline for offline GPS navigation"
          : "Route footprints are optional for a single-spot tour",
      ok:
        spotCount <= 1 ||
        (edgeCount >= expectedEdges &&
          edges.every((edge) => hasValidFootprintGeo(edge.footprintGeo))),
    },
    {
      id: "spot-media",
      label: "Every spot has at least one media file (audio/image/video)",
      ok:
        spotCount > 0 &&
        tour.spots.every((spot) => spot.media.length > 0),
    },
    {
      id: "spot-faqs",
      label: "All spot FAQs have complete Q&A for every audience and language",
      ok: tour.spots.every((spot) => hasCompleteFaqs(spot.faqs)),
    },
    {
      id: "ai-knowledge",
      label:
        "All AI knowledge entries have content for every audience and language",
      ok: hasCompleteAiKnowledge(tour.aiKnowledge),
    },
  ];

  return {
    ready: checks.every((check) => check.ok),
    checks,
  };
}

export function resolveLifecycleTransition(
  currentStatus: PublishStatus,
  action: TourLifecycleAction,
) {
  const rule = TRANSITIONS[action];

  if (!rule.from.includes(currentStatus)) {
    throw new ValidationError(
      `Cannot ${action.replaceAll("_", " ")} from ${currentStatus}`,
    );
  }

  return rule;
}

export function getAvailableLifecycleActions(
  currentStatus: PublishStatus,
): TourLifecycleAction[] {
  return TOUR_LIFECYCLE_ACTIONS.filter((action) =>
    TRANSITIONS[action].from.includes(currentStatus),
  );
}

export function resolveLifecycleAuditAction(
  action: TourLifecycleAction,
): "PUBLISH" | "ARCHIVE" | "ROLLBACK" | "UPDATE" {
  switch (action) {
    case "approve_publish":
      return "PUBLISH";
    case "archive":
      return "ARCHIVE";
    case "rollback":
      return "ROLLBACK";
    default:
      return "UPDATE";
  }
}
