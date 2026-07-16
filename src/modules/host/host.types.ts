import type { AppLanguage } from "@/lib/i18n/languages";

export type HostDto = {
  id: string;
  tourId: string;
  name: string;
  role: string | null;
  photoMediaId: string | null;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  availableFrom: string | null;
  availableTo: string | null;
  isActive: boolean;
  isAvailableNow: boolean;
  sortOrder: number;
  translations: Array<{
    language: AppLanguage;
    bio: string;
  }>;
  createdAt: string;
  updatedAt: string;
};
