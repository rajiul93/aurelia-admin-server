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

export type Tour = {
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
  translations: TourTranslation[];
  spots: Spot[];
  language?: AppLanguage;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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
