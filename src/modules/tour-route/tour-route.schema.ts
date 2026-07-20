import { z } from "zod";

const footprintPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const footprintGeoSchema = z
  .array(footprintPointSchema)
  .min(2, "Footprint needs at least two points")
  .nullable()
  .optional();

export const createRouteEdgeSchema = z
  .object({
    fromSpotId: z.string().trim().min(1, "From spot is required"),
    toSpotId: z.string().trim().min(1, "To spot is required"),
    sortOrder: z.coerce.number().int().min(0).default(0),
    footprintGeo: footprintGeoSchema,
  })
  .refine((value) => value.fromSpotId !== value.toSpotId, {
    message: "From and to spots must be different",
    path: ["toSpotId"],
  });

export const updateRouteEdgeSchema = z
  .object({
    fromSpotId: z.string().trim().min(1).optional(),
    toSpotId: z.string().trim().min(1).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    footprintGeo: footprintGeoSchema,
  })
  .refine(
    (value) =>
      value.fromSpotId !== undefined ||
      value.toSpotId !== undefined ||
      value.sortOrder !== undefined ||
      value.footprintGeo !== undefined,
    { message: "At least one field is required" },
  )
  .refine(
    (value) =>
      !value.fromSpotId ||
      !value.toSpotId ||
      value.fromSpotId !== value.toSpotId,
    {
      message: "From and to spots must be different",
      path: ["toSpotId"],
    },
  );

export const replaceTourRouteSchema = z.object({
  edges: z.array(
    z
      .object({
        fromSpotId: z.string().trim().min(1),
        toSpotId: z.string().trim().min(1),
        sortOrder: z.coerce.number().int().min(0).default(0),
        footprintGeo: footprintGeoSchema,
      })
      .refine((value) => value.fromSpotId !== value.toSpotId, {
        message: "From and to spots must be different",
        path: ["toSpotId"],
      }),
  )
    // Capped because replaceByFloor validates edges in a sequential loop
    // (tour-route.service.ts) and each iteration costs four queries — an
    // uncapped array is an easy way to tie up a connection. A floor with more
    // than 200 edges is not a real tour. If this endpoint ever gets a caller,
    // batch the validation into one findMany first and the cap can go.
    .max(200, "A floor route cannot have more than 200 edges"),
});

export const floorIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
  floorId: z.string().trim().min(1),
});

export const routeEdgeIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
  floorId: z.string().trim().min(1),
  edgeId: z.string().trim().min(1),
});

export type CreateRouteEdgeInput = z.output<typeof createRouteEdgeSchema>;
export type UpdateRouteEdgeInput = z.output<typeof updateRouteEdgeSchema>;
export type ReplaceTourRouteInput = z.output<typeof replaceTourRouteSchema>;
