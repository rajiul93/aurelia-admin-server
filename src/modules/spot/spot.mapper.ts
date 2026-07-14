import type {
  Media,
  Spot,
  SpotFaq,
  SpotFaqTranslation,
  SpotTranslation,
  TourMedia,
} from "@/generated/prisma/client";
import type { AudienceType } from "@/lib/i18n/audiences";
import type { AppLanguage } from "@/lib/i18n/languages";
import type { Media as MediaDto } from "@/types/media";
import type { QuillContentJson } from "@/modules/tour/tour.quill";
import type { SpotDto, SpotFaqDto, SpotMediaDto } from "./spot.types";

type SpotWithRelations = Spot & {
  translations: SpotTranslation[];
  faqs: Array<SpotFaq & { translations: SpotFaqTranslation[] }>;
  media: Array<TourMedia & { media: Media; thumbnailMedia: Media | null }>;
};

function parseQuillJson(value: unknown): QuillContentJson {
  if (
    typeof value === "object" &&
    value !== null &&
    "html" in value &&
    typeof value.html === "string"
  ) {
    return {
      html: value.html,
      text:
        "text" in value && typeof value.text === "string" ? value.text : "",
    };
  }

  return { html: "", text: "" };
}

function mapMedia(media: Media | null): MediaDto | null {
  if (!media) {
    return null;
  }

  return {
    id: media.id,
    fileName: media.fileName,
    originalName: media.originalName,
    url: media.url,
    key: media.key,
    mimeType: media.mimeType,
    size: media.size,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
  };
}

function mapSpotMedia(
  entry: TourMedia & { media: Media; thumbnailMedia: Media | null },
): SpotMediaDto {
  const media = mapMedia(entry.media)!;

  return {
    id: entry.id,
    type: entry.type,
    sortOrder: entry.sortOrder,
    mediaId: entry.mediaId,
    media,
    thumbnailMediaId: entry.thumbnailMediaId,
    thumbnailMedia: mapMedia(entry.thumbnailMedia),
    audience: entry.audience as AudienceType,
    language: entry.language as AppLanguage,
    includedInQuickTour: entry.includedInQuickTour,
    url: media.url,
    thumbnail: entry.thumbnailMedia?.url ?? null,
  };
}

function mapSpotFaq(
  faq: SpotFaq & { translations: SpotFaqTranslation[] },
): SpotFaqDto {
  return {
    id: faq.id,
    sortOrder: faq.sortOrder,
    translations: faq.translations.map((translation) => ({
      language: translation.language as AppLanguage,
      audience: translation.audience as AudienceType,
      question: translation.question,
      answerText: translation.answerText,
      answerHtml: translation.answerHtml,
      answerJson: parseQuillJson(translation.answerJson),
    })),
  };
}

export function toSpotDto(spot: SpotWithRelations): SpotDto {
  return {
    id: spot.id,
    floorId: spot.floorId,
    tourId: spot.tourId,
    sortOrder: spot.sortOrder,
    latitude: spot.latitude ? Number(spot.latitude) : null,
    longitude: spot.longitude ? Number(spot.longitude) : null,
    includedInQuickTour: spot.includedInQuickTour,
    translations: spot.translations.map((translation) => ({
      language: translation.language as AppLanguage,
      audience: translation.audience as AudienceType,
      title: translation.title,
      shortDesc: translation.shortDesc,
      quillJson: parseQuillJson(translation.quillJson),
      descriptionHtml: translation.descriptionHtml,
      descriptionText: translation.descriptionText,
    })),
    medias: spot.media.map(mapSpotMedia),
    faqs: spot.faqs.map(mapSpotFaq),
    createdAt: spot.createdAt.toISOString(),
    updatedAt: spot.updatedAt.toISOString(),
  };
}

export function toSpotDtoList(spots: SpotWithRelations[]): SpotDto[] {
  return spots.map(toSpotDto);
}
