import type {
  Tour,
  TourAccess,
  TourAccessTour,
  TourTranslation,
} from "@/generated/prisma/client";
import { DEFAULT_LANGUAGE } from "@/lib/i18n/languages";
import { utcNoonToTourDate } from "@/lib/tour-date";
import type {
  TourAccessDto,
  TourAccessStatus,
  TourAccessTourSummary,
} from "./tour-access.types";

type TourAccessWithRelations = TourAccess & {
  tours: Array<
    TourAccessTour & {
      tour: Tour & { translations: TourTranslation[] };
    }
  >;
  deviceSessions: Array<{ id: string }>;
};

function getTourTitle(tour: Tour & { translations: TourTranslation[] }) {
  const preferred =
    tour.translations.find((entry) => entry.language === DEFAULT_LANGUAGE) ??
    tour.translations[0];

  return preferred?.title ?? tour.slug;
}

function resolveEffectiveStatus(
  access: TourAccess,
): TourAccessStatus | "PENDING" {
  if (access.status === "REVOKED") {
    return "REVOKED";
  }

  if (access.expiresAt.getTime() < Date.now()) {
    return "EXPIRED";
  }

  // Dated to open in the future: the buyer has their PIN but cannot unlock yet.
  if (access.activatedAt.getTime() > Date.now()) {
    return "PENDING";
  }

  return "ACTIVE";
}

function mapTourSummary(
  entry: TourAccessWithRelations["tours"][number],
): TourAccessTourSummary {
  return {
    id: entry.tour.id,
    slug: entry.tour.slug,
    title: getTourTitle(entry.tour),
    tourDate: utcNoonToTourDate(entry.tourDate),
    startTime: entry.startTime,
  };
}

export function toTourAccessDto(
  access: TourAccessWithRelations,
): TourAccessDto {
  const effectiveStatus = resolveEffectiveStatus(access);

  // pinHash is deliberately absent: it must never leave the server.
  return {
    id: access.id,
    phone: access.phone,
    email: access.email,
    activatedAt: access.activatedAt.toISOString(),
    expiresAt: access.expiresAt.toISOString(),
    status: access.status,
    effectiveStatus,
    maxDevices: access.maxDevices,
    pinLockedUntil: access.pinLockedUntil?.toISOString() ?? null,
    allowSubscriptionFeatures: access.allowSubscriptionFeatures,
    notes: access.notes,
    activatedById: access.activatedById,
    tours: access.tours.map(mapTourSummary),
    activeDeviceCount: access.deviceSessions.length,
    createdAt: access.createdAt.toISOString(),
    updatedAt: access.updatedAt.toISOString(),
  };
}

export function toTourAccessDtoList(records: TourAccessWithRelations[]) {
  return records.map(toTourAccessDto);
}
