import type { PublishStatus, TourMediaType } from "@/generated/prisma/client";
import type { AudienceType } from "@/lib/i18n/audiences";
import type { AppLanguage } from "@/lib/i18n/languages";
import type { Media } from "@/types/media";
import type { QuillContentJson } from "./tour.quill";

export type TourTranslationDto = {
  language: AppLanguage;
  audience: AudienceType;
  title: string;
  description: string;
  slug: string;
};

export type SpotTranslationDto = {
  language: AppLanguage;
  audience: AudienceType;
  title: string;
  shortDesc: string;
  quillJson: QuillContentJson;
  descriptionHtml: string;
  descriptionText: string;
};

export type SpotMediaDto = {
  id: string;
  type: TourMediaType;
  sortOrder: number;
  mediaId: string;
  media: Media;
  thumbnailMediaId: string | null;
  thumbnailMedia: Media | null;
  audience: AudienceType;
  language: AppLanguage;
  includedInQuickTour: boolean;
  url: string;
  thumbnail: string | null;
};

export type SpotFaqTranslationDto = {
  language: AppLanguage;
  audience: AudienceType;
  question: string;
  answerText: string;
  answerHtml: string;
  answerJson: QuillContentJson;
};

export type SpotFaqDto = {
  id: string;
  sortOrder: number;
  translations: SpotFaqTranslationDto[];
};

export type SpotDto = {
  id: string;
  sortOrder: number;
  latitude: number | null;
  longitude: number | null;
  floor: number;
  includedInQuickTour: boolean;
  translations: SpotTranslationDto[];
  medias: SpotMediaDto[];
  faqs: SpotFaqDto[];
};

export type TourDto = {
  id: string;
  slug: string;
  placeId: string | null;
  coverMediaId: string | null;
  coverMedia: Media | null;
  publishStatus: PublishStatus;
  tourBundleVersion: number;
  mediaVersion: number;
  aiKnowledgeVersion: number;
  routeVersion: number;
  publishedAt: string | null;
  archivedAt: string | null;
  translations: TourTranslationDto[];
  spots: SpotDto[];
  language?: AppLanguage;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

/** What the admin actually needs of a cover image: enough to render it. */
export type TourCoverMediaDto = {
  id: string;
  url: string;
};

/**
 * The shape both admin responses share.
 *
 * Written out rather than derived from TourDto with Omit, because TourDto also
 * feeds the offline mobile bundle (tour-bundle.builder.ts). A field added there
 * for the bundle's sake would otherwise appear in the admin responses by
 * accident — and the two are not the same contract. Note coverMedia is already
 * narrower here than TourDto's: the admin renders a url, not the storage key.
 */
type TourSummaryFields = {
  id: string;
  slug: string;
  placeId: string | null;
  coverMediaId: string | null;
  coverMedia: TourCoverMediaDto | null;
  publishStatus: PublishStatus;
  tourBundleVersion: number;
  mediaVersion: number;
  aiKnowledgeVersion: number;
  routeVersion: number;
  publishedAt: string | null;
  archivedAt: string | null;
  translations: TourTranslationDto[];
  language?: AppLanguage;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * The detail response for GET /tours/[id].
 *
 * Deliberately carries no spots/floors/route/aiKnowledge. All six pages that
 * read this endpoint (edit, spots, floors, route, ai-knowledge, ai-knowledge/new)
 * take their content from their own dedicated hooks; five of them use this
 * response for nothing but the title in an <h1>. Loading the content graph here
 * was pure waste.
 */
export type TourDetailDto = TourSummaryFields;

/**
 * The list row. Carries a spot *count* rather than the spots themselves —
 * no list consumer has ever read the spot bodies, and loading them made the
 * page fetch the whole content graph.
 */
export type TourListItemDto = TourSummaryFields & {
  spotCount: number;
};
