import type { HostDto } from "@/modules/host";

export type Host = HostDto;

export type CreateHostPayload = {
  name: string;
  role?: string | null;
  photoMediaId?: string | null;
  latitude: number;
  longitude: number;
  availableFrom?: string | null;
  availableTo?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  translations: {
    en: { bio: string };
    es: { bio: string };
    fr: { bio: string };
  };
};

export type UpdateHostPayload = Partial<CreateHostPayload>;
