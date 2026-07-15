import type { AppLanguage } from "@/lib/i18n/languages";
import type { AudienceType } from "@/lib/i18n/audiences";
import type { FloorDto, TransitionPointDto } from "@/modules/floor";

export type Floor = FloorDto;
export type TransitionPoint = TransitionPointDto;

export type TransitionType = TransitionPoint["type"];

export const TRANSITION_TYPE_OPTIONS: TransitionType[] = [
  "STAIRS",
  "ELEVATOR",
  "LIFT",
  "RAMP",
  "ESCALATOR",
];

export type FloorTranslationPayload = {
  name: string;
};

export type CreateFloorPayload = {
  floorNo: number;
  mapTileUrl?: string | null;
  coverMediaId?: string | null;
  sortOrder?: number;
  translations?: Record<
    AudienceType,
    Record<AppLanguage, FloorTranslationPayload>
  >;
};

export type UpdateFloorPayload = Partial<CreateFloorPayload>;

export type CreateTransitionPointPayload = {
  type: TransitionType;
  latitude: number;
  longitude: number;
  connectsToFloorId?: string | null;
  sortOrder?: number;
};

export type UpdateTransitionPointPayload =
  Partial<CreateTransitionPointPayload>;
