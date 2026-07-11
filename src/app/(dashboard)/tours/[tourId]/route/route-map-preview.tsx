"use client";

import type { RouteEdge } from "@/types/tour-route";
import type { Spot } from "@/types/spot";

type RouteMapPreviewProps = {
  spots: Spot[];
  edges: RouteEdge[];
};

type Point = { lat: number; lng: number };

function collectPoints(spots: Spot[], edges: RouteEdge[]) {
  const points: Point[] = [];

  for (const spot of spots) {
    if (spot.latitude !== null && spot.longitude !== null) {
      points.push({
        lat: Number(spot.latitude),
        lng: Number(spot.longitude),
      });
    }
  }

  for (const edge of edges) {
    for (const point of edge.footprintGeo ?? []) {
      points.push(point);
    }
  }

  return points;
}

function projectPoint(
  point: Point,
  bounds: { north: number; south: number; east: number; west: number },
  width: number,
  height: number,
) {
  const x = ((point.lng - bounds.west) / (bounds.east - bounds.west)) * width;
  const y =
    ((bounds.north - point.lat) / (bounds.north - bounds.south)) * height;

  return { x, y };
}

export function RouteMapPreview({ spots, edges }: RouteMapPreviewProps) {
  const points = collectPoints(spots, edges);

  if (points.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Add spot coordinates to preview the route map.
      </p>
    );
  }

  const bounds = {
    north: Math.max(...points.map((point) => point.lat)) + 0.001,
    south: Math.min(...points.map((point) => point.lat)) - 0.001,
    east: Math.max(...points.map((point) => point.lng)) + 0.001,
    west: Math.min(...points.map((point) => point.lng)) - 0.001,
  };
  const width = 640;
  const height = 320;
  const spotById = new Map(spots.map((spot) => [spot.id, spot]));

  return (
    <div className="overflow-hidden rounded-lg border bg-stone-950">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Route map preview"
      >
        <rect width={width} height={height} fill="#541a1a" />

        {edges.map((edge) => {
          const polyline =
            edge.footprintGeo && edge.footprintGeo.length >= 2
              ? edge.footprintGeo
              : (() => {
                  const fromSpot = spotById.get(edge.fromSpotId);
                  const toSpot = spotById.get(edge.toSpotId);

                  if (
                    !fromSpot?.latitude ||
                    !fromSpot.longitude ||
                    !toSpot?.latitude ||
                    !toSpot.longitude
                  ) {
                    return [];
                  }

                  return [
                    {
                      lat: Number(fromSpot.latitude),
                      lng: Number(fromSpot.longitude),
                    },
                    {
                      lat: Number(toSpot.latitude),
                      lng: Number(toSpot.longitude),
                    },
                  ];
                })();

          if (polyline.length < 2) {
            return null;
          }

          const path = polyline
            .map((point, index) => {
              const projected = projectPoint(point, bounds, width, height);
              return `${index === 0 ? "M" : "L"} ${projected.x} ${projected.y}`;
            })
            .join(" ");

          return (
            <path
              key={edge.id}
              d={path}
              fill="none"
              stroke="#dcc3aa"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {spots.map((spot, index) => {
          if (spot.latitude === null || spot.longitude === null) {
            return null;
          }

          const projected = projectPoint(
            {
              lat: Number(spot.latitude),
              lng: Number(spot.longitude),
            },
            bounds,
            width,
            height,
          );

          return (
            <g key={spot.id}>
              <circle
                cx={projected.x}
                cy={projected.y}
                r={10}
                fill="#810b38"
                stroke="#dcc3aa"
                strokeWidth={2}
              />
              <text
                x={projected.x}
                y={projected.y + 4}
                textAnchor="middle"
                fill="#f1e2d1"
                fontSize="11"
                fontWeight="600"
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
