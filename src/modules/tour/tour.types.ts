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
