import type {
  Media,
  Spot,
  SpotFaq,
  SpotFaqTranslation,
  SpotTranslation,
  Tour,
  TourMedia,
  TourTranslation,
  Floor,
  FloorTranslation,
} from "@/generated/prisma/client";
import type { AppLanguage } from "@/lib/i18n/languages";
import type { AudienceType } from "@/lib/i18n/audiences";
import type { Media as MediaDto } from "@/types/media";
import type { QuillContentJson } from "./tour.quill";
import type { TourListRecord } from "./tour.repository";
import type {
  SpotFaqDto,
  SpotMediaDto,
  TourDto,
  TourListItemDto,
} from "./tour.types";

type TourWithRelations = Tour & {
  translations: TourTranslation[];
  coverMedia: Media | null;
  floors: Array<
    Floor & {
      translations: FloorTranslation[];
      spots: Array<
        Spot & {
          translations: SpotTranslation[];
          faqs: Array<SpotFaq & { translations: SpotFaqTranslation[] }>;
          media: Array<TourMedia & { media: Media; thumbnailMedia: Media | null }>;
        }
      >;
    }
  >;
};

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

function mapSpot(
  spot: Spot & {
    translations: SpotTranslation[];
    faqs: Array<SpotFaq & { translations: SpotFaqTranslation[] }>;
    media: Array<TourMedia & { media: Media; thumbnailMedia: Media | null }>;
  },
  floorNo: number,
) {
  return {
    id: spot.id,
    sortOrder: spot.sortOrder,
    latitude: spot.latitude ? Number(spot.latitude) : null,
    longitude: spot.longitude ? Number(spot.longitude) : null,
    floor: floorNo,
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
  };
}

export function toTourDto(
  tour: TourWithRelations,
  language?: AppLanguage,
): TourDto {
  const translations = tour.translations.map((entry) => ({
    language: entry.language as AppLanguage,
    audience: entry.audience as AudienceType,
    title: entry.title,
    description: entry.description,
    slug: entry.slug,
  }));

  const localized = language
    ? translations.find((entry) => entry.language === language)
    : undefined;

  const allSpots = tour.floors.flatMap((floor) =>
    floor.spots.map((spot) => mapSpot(spot, floor.floorNo)),
  );

  return {
    id: tour.id,
    slug: tour.slug,
    placeId: tour.placeId,
    coverMediaId: tour.coverMediaId,
    coverMedia: mapMedia(tour.coverMedia),
    publishStatus: tour.publishStatus,
    tourBundleVersion: tour.tourBundleVersion,
    mediaVersion: tour.mediaVersion,
    aiKnowledgeVersion: tour.aiKnowledgeVersion,
    routeVersion: tour.routeVersion,
    publishedAt: tour.publishedAt?.toISOString() ?? null,
    archivedAt: tour.archivedAt?.toISOString() ?? null,
    translations,
    spots: allSpots,
    ...(localized
      ? {
          language,
          title: localized.title,
          description: localized.description,
        }
      : {}),
    createdAt: tour.createdAt.toISOString(),
    updatedAt: tour.updatedAt.toISOString(),
  };
}

export function toTourListItemDto(
  tour: TourListRecord,
  language?: AppLanguage,
): TourListItemDto {
  const translations = tour.translations.map((entry) => ({
    language: entry.language as AppLanguage,
    audience: entry.audience as AudienceType,
    title: entry.title,
    description: entry.description,
    slug: entry.slug,
  }));

  const localized = language
    ? translations.find((entry) => entry.language === language)
    : undefined;

  return {
    id: tour.id,
    slug: tour.slug,
    placeId: tour.placeId,
    coverMediaId: tour.coverMediaId,
    coverMedia: mapMedia(tour.coverMedia),
    publishStatus: tour.publishStatus,
    tourBundleVersion: tour.tourBundleVersion,
    mediaVersion: tour.mediaVersion,
    aiKnowledgeVersion: tour.aiKnowledgeVersion,
    routeVersion: tour.routeVersion,
    publishedAt: tour.publishedAt?.toISOString() ?? null,
    archivedAt: tour.archivedAt?.toISOString() ?? null,
    translations,
    spotCount: tour.floors.reduce((total, floor) => total + floor._count.spots, 0),
    ...(localized
      ? {
          language,
          title: localized.title,
          description: localized.description,
        }
      : {}),
    createdAt: tour.createdAt.toISOString(),
    updatedAt: tour.updatedAt.toISOString(),
  };
}

export function toTourListItemDtoList(
  tours: TourListRecord[],
  language?: AppLanguage,
): TourListItemDto[] {
  return tours.map((tour) => toTourListItemDto(tour, language));
}
