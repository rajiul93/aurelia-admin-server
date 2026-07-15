import { z } from "zod";

export const requestDirectionsSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export type RequestDirectionsInput = z.infer<typeof requestDirectionsSchema>;

export const directionsResponseSchema = z.object({
  distanceM: z.number(),
  durationS: z.number(),
  polyline: z.array(
    z.object({
      lat: z.number(),
      lng: z.number(),
    })
  ),
});

export type DirectionsResponse = z.infer<typeof directionsResponseSchema>;
