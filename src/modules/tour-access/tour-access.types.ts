export type TourAccessStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type TourAccessTourSummary = {
  id: string;
  slug: string;
  title: string;
};

export type TourAccessDto = {
  id: string;
  email: string;
  expiresAt: string;
  status: TourAccessStatus;
  effectiveStatus: TourAccessStatus;
  ticketCount: number;
  allowSubscriptionFeatures: boolean;
  notes: string | null;
  activatedById: string | null;
  tours: TourAccessTourSummary[];
  activeDeviceCount: number;
  createdAt: string;
  updatedAt: string;
};
