import type { TourAccessDto } from "@/modules/tour-access/tour-access.types";

export type TourAccessStatus = TourAccessDto["status"];

export type TourAccess = TourAccessDto;

export type CreateTourAccessPayload = {
  email: string;
  expiresAt: string;
  ticketCount: number;
  allowSubscriptionFeatures: boolean;
  notes?: string;
  tourIds: string[];
};

export type UpdateTourAccessPayload = Partial<CreateTourAccessPayload> & {
  status?: "ACTIVE" | "REVOKED";
};
