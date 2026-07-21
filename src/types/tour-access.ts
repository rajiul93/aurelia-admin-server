import type { AnalyticsRange } from "@/modules/tour-access/tour-access.schema";
import type {
  TourAccessAnalyticsSeriesDto,
  TourAccessAnalyticsSummaryDto,
  TourAccessDto,
} from "@/modules/tour-access/tour-access.types";

export type TourAccessStatus = TourAccessDto["status"];

export type TourAccess = TourAccessDto;

export type { AnalyticsRange };
export type TourAccessAnalyticsSeries = TourAccessAnalyticsSeriesDto;
export type TourAccessAnalyticsSummary = TourAccessAnalyticsSummaryDto;

export type TourAccessTourInput = {
  tourId: string;
  /** "YYYY-MM-DD" planned visit day, or null/omitted when not scheduled. */
  tourDate?: string | null;
  /** "HH:mm" 24h start time, or null/omitted. */
  startTime?: string | null;
};

export type CreateTourAccessPayload = {
  phone: string;
  pin: string;
  email?: string;
  activatedAt: string;
  expiresAt: string;
  maxDevices: number;
  allowSubscriptionFeatures: boolean;
  notes?: string;
  tours: TourAccessTourInput[];
};

/** `pin` here is a reset: send it only when the admin typed a new one. */
export type UpdateTourAccessPayload = Partial<CreateTourAccessPayload> & {
  status?: "ACTIVE" | "REVOKED";
};

export type DeviceSession = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  platform: string;
  lastVerifiedAt: string;
  createdAt: string;
};
