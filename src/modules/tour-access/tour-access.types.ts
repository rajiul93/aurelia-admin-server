export type TourAccessStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type TourAccessTourSummary = {
  id: string;
  slug: string;
  title: string;
  /** Planned visit day as "YYYY-MM-DD", or null when not scheduled yet. */
  tourDate: string | null;
  /** Optional "HH:mm" start time used in reminder copy. */
  startTime: string | null;
};

export type DeviceSessionDto = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  platform: string;
  lastVerifiedAt: string;
  createdAt: string;
};

export type TourAccessDto = {
  id: string;
  phone: string;
  email: string | null;
  activatedAt: string;
  expiresAt: string;
  status: TourAccessStatus;
  /** PENDING = dated to open in the future. Never stored, only derived. */
  effectiveStatus: TourAccessStatus | "PENDING";
  maxDevices: number;
  /** Set while the buyer is locked out after too many wrong PINs. */
  pinLockedUntil: string | null;
  allowSubscriptionFeatures: boolean;
  notes: string | null;
  activatedById: string | null;
  tours: TourAccessTourSummary[];
  activeDeviceCount: number;
  createdAt: string;
  updatedAt: string;
};
