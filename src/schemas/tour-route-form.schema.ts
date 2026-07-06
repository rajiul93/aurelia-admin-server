import { z } from "zod";

export const routeEdgeFormSchema = z
  .object({
    fromSpotId: z.string().trim().min(1, "From spot is required"),
    toSpotId: z.string().trim().min(1, "To spot is required"),
    sortOrder: z.number().int().min(0),
    footprintText: z.string(),
  })
  .refine((value) => value.fromSpotId !== value.toSpotId, {
    message: "From and to spots must be different",
    path: ["toSpotId"],
  });

export type RouteEdgeFormInput = z.infer<typeof routeEdgeFormSchema>;

export function parseFootprintText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const points = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [latRaw, lngRaw] = line.split(",").map((part) => part.trim());
      const lat = Number(latRaw);
      const lng = Number(lngRaw);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(
          `Invalid footprint line "${line}". Use "lat,lng" per line.`,
        );
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error(`Footprint point out of range: ${line}`);
      }

      return { lat, lng };
    });

  if (points.length === 1) {
    throw new Error("Footprint needs at least two points");
  }

  return points.length > 0 ? points : null;
}
