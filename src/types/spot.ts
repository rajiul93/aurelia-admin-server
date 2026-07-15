import type { AudienceType } from "@/lib/i18n/audiences";
import type { AppLanguage } from "@/lib/i18n/languages";
import type { Media } from "@/types/media";
import type { QuillContentJson } from "@/modules/tour/tour.quill";

export type TourMediaType = "IMAGE" | "VIDEO" | "AUDIO";

export type SpotTranslation = {
  language: AppLanguage;
  audience: AudienceType;
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
  language: AppLanguage;
  audience: AudienceType;
  includedInQuickTour: boolean;
  url: string;
  thumbnail: string | null;
};

export type SpotFaqTranslation = {
  language: AppLanguage;
  audience: AudienceType;
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
  tourId: string | null;
  floorId: string;
  sortOrder: number;
  latitude: number | null;
  longitude: number | null;
  includedInQuickTour: boolean;
  translations: SpotTranslation[];
  medias: SpotMedia[];
  faqs: SpotFaq[];
  createdAt: string;
  updatedAt: string;
};

export type SpotTranslationPayload = {
  title: string;
  shortDesc?: string;
  quill_html: string;
};

export type AudienceLanguageTranslations<T> = Record<
  AudienceType,
  Record<AppLanguage, T>
>;

export type CreateSpotPayload = {
  // Omit to place the spot on the tour's lowest floor.
  floorId?: string;
  sortOrder: number;
  latitude?: number | null;
  longitude?: number | null;
  includedInQuickTour?: boolean;
  translations: AudienceLanguageTranslations<SpotTranslationPayload>;
};

export type UpdateSpotPayload = Partial<CreateSpotPayload>;

export type CreateSpotMediaPayload = {
  type: TourMediaType;
  mediaId: string;
  thumbnailMediaId?: string | null;
  sortOrder: number;
  language: AppLanguage;
  audience: AudienceType;
  includedInQuickTour: boolean;
};

export type SpotFaqTranslationPayload = {
  question: string;
  answer_html: string;
};

export type CreateSpotFaqPayload = {
  sortOrder: number;
  translations: AudienceLanguageTranslations<SpotFaqTranslationPayload>;
};

export type UpdateSpotFaqPayload = Partial<CreateSpotFaqPayload>;
