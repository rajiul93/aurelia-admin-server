export type FootprintPoint = {
  lat: number;
  lng: number;
};

export type RouteEdgeSpotSummary = {
  id: string;
  sortOrder: number;
  title: string;
};

export type RouteEdgeDto = {
  id: string;
  fromSpotId: string;
  toSpotId: string;
  fromSpot: RouteEdgeSpotSummary;
  toSpot: RouteEdgeSpotSummary;
  sortOrder: number;
  footprintGeo: FootprintPoint[] | null;
  createdAt: string;
  updatedAt: string;
};

export type TourRouteDto = {
  id: string | null;
  floorId: string;
  tourId: string | null;  // Deprecated: use floor.tourId instead
  edges: RouteEdgeDto[];
  createdAt: string | null;
  updatedAt: string | null;
};
