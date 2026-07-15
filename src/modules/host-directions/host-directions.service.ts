import { AppError } from "@/lib/api/errors";
import { hostRepository } from "@/modules/host/host.repository";
import { fetchWalkingRoute } from "@/lib/routing/osrm";
import type { RequestDirectionsInput } from "./host-directions.schema";

async function ensureHost(tourId: string, hostId: string) {
  const host = await hostRepository.findById(tourId, hostId);
  if (!host) {
    throw new AppError(
      404,
      "HOST_NOT_FOUND",
      "Host not found"
    );
  }
  return host;
}

export const hostDirectionsService = {
  async getDirections(
    tourId: string,
    hostId: string,
    input: RequestDirectionsInput
  ) {
    const host = await ensureHost(tourId, hostId);

    try {
      const route = await fetchWalkingRoute(
        { lat: input.latitude, lng: input.longitude },
        { lat: Number(host.latitude), lng: Number(host.longitude) }
      );

      return {
        distanceM: route.distanceM,
        durationS: route.durationS,
        polyline: route.points,
      };
    } catch {
      throw new AppError(
        502,
        "ROUTING_UNAVAILABLE",
        "Unable to calculate walking route at this moment"
      );
    }
  },
};
