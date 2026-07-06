import type {
  FootprintPoint,
  RouteEdgeDto,
  TourRouteDto,
} from "@/modules/tour-route/tour-route.types";

export type { FootprintPoint, RouteEdgeDto as RouteEdge, TourRouteDto as TourRoute };

export type CreateRouteEdgePayload = {
  fromSpotId: string;
  toSpotId: string;
  sortOrder: number;
  footprintGeo?: FootprintPoint[] | null;
};

export type UpdateRouteEdgePayload = Partial<CreateRouteEdgePayload>;

export type ReplaceTourRoutePayload = {
  edges: CreateRouteEdgePayload[];
};
