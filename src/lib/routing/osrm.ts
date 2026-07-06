type OsrmRouteResponse = {
  routes?: Array<{
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
  code?: string;
};

export async function fetchWalkingFootprint(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const baseUrl =
    process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org";
  const url = `${baseUrl}/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`OSRM request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OsrmRouteResponse;

  if (payload.code !== "Ok" || !payload.routes?.[0]?.geometry?.coordinates) {
    throw new Error("OSRM did not return a walking route for this edge");
  }

  return payload.routes[0].geometry.coordinates.map(([lng, lat]) => ({
    lat,
    lng,
  }));
}
