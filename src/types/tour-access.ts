import type { TourAccessDto } from "@/modules/tour-access/tour-access.types";

export type TourAccessStatus = TourAccessDto["status"];

export type TourAccess = TourAccessDto;

export type CreateTourAccessPayload = {
  phone: string;
  pin: string;
  email?: string;
  activatedAt: string;
  expiresAt: string;
  maxDevices: number;
  allowSubscriptionFeatures: boolean;
  notes?: string;
  tourIds: string[];
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
