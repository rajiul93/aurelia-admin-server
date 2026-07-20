import type { AudienceType } from "@/lib/i18n/audiences";
import type { AppLanguage } from "@/lib/i18n/languages";
import type { Media } from "@/types/media";
import type { QuillContentJson } from "@/modules/tour/tour.quill";

export type PublishStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
export type TourMediaType = "IMAGE" | "VIDEO" | "AUDIO";

export type TourTranslation = {
  language: AppLanguage;
  audience: AudienceType;
  title: string;
  description: string;
  slug: string;
};

export type SpotTranslation = {
  language: AppLanguage;
  title: string;
  shortDesc: string;
  quillJson: QuillContentJson;
  descriptionHtml: string;
  descriptionText: string;
};

export type SpotMedia = {
  id: string;
  type: TourMediaType;
  sortOrder: number;
  mediaId: string;
  media: Media;
  thumbnailMediaId: string | null;
  thumbnailMedia: Media | null;
  url: string;
  thumbnail: string | null;
};

export type SpotFaqTranslation = {
  language: AppLanguage;
  question: string;
  answerText: string;
  answerHtml: string;
  answerJson: QuillContentJson;
};

export type SpotFaq = {
  id: string;
  sortOrder: number;
  translations: SpotFaqTranslation[];
};

export type Spot = {
  id: string;
  sortOrder: number;
  latitude: number | null;
  longitude: number | null;
  floor: number;
  translations: SpotTranslation[];
  medias: SpotMedia[];
  faqs: SpotFaq[];
};

/** The cover as the admin API returns it — a url to render, nothing more. */
export type TourCoverMedia = {
  id: string;
  url: string;
};

/** Mirrors TourSummaryFields in src/modules/tour/tour.types.ts. */
type TourSummary = {
  id: string;
  slug: string;
  placeId: string | null;
  coverMediaId: string | null;
  coverMedia: TourCoverMedia | null;
  publishStatus: PublishStatus;
  tourBundleVersion: number;
  mediaVersion: number;
  aiKnowledgeVersion: number;
  routeVersion: number;
  publishedAt: string | null;
  archivedAt: string | null;
  translations: TourTranslation[];
  language?: AppLanguage;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * What GET /tours/[id] returns. No spots, floors, route or aiKnowledge — those
 * have their own endpoints and hooks (useSpots, useFloors, useTourRoute). If a
 * page needs tour content, fetch it from the endpoint that owns it rather than
 * widening this.
 */
export type TourDetail = TourSummary;

/**
 * What GET /tours returns per row. The list carries a spot count, not the
 * spots.
 */
export type TourListItem = TourSummary & {
  spotCount: number;
};

/**
 * The full shape, still returned by create/update/lifecycle mutations. Reading
 * `spots` off a GET /tours/[id] response will not work — see TourDetail.
 */
export type Tour = TourSummary & {
  spots: Spot[];
};

export type CreateTourPayload = {
  slug?: string;
  coverMediaId: string;
  translations: Record<
    AudienceType,
    Record<
      AppLanguage,
      {
        title: string;
        description: string;
        slug?: string;
      }
    >
  >;
};

export type UpdateTourPayload = Partial<CreateTourPayload>;

export type TourLifecycleAction =
  | "submit_review"
  | "approve_publish"
  | "archive"
  | "return_to_draft"
  | "rollback";

export type TourReadiness = {
  ready: boolean;
  publishStatus: PublishStatus;
  availableActions: TourLifecycleAction[];
  checks: Array<{
    id: string;
    label: string;
    ok: boolean;
  }>;
};
