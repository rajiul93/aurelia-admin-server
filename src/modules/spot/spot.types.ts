import type { TourMediaType } from "@/generated/prisma/client";
import type { AudienceType } from "@/lib/i18n/audiences";
import type { AppLanguage } from "@/lib/i18n/languages";
import type { Media } from "@/types/media";
import type { QuillContentJson } from "@/modules/tour/tour.quill";

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
  floorId: string;
  tourId: string | null;  // Deprecated: use floor.tourId instead
  sortOrder: number;
  latitude: number | null;
  longitude: number | null;
  includedInQuickTour: boolean;
  translations: SpotTranslationDto[];
  medias: SpotMediaDto[];
  faqs: SpotFaqDto[];
  createdAt: string;
  updatedAt: string;
};
