import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type { TourBundle, TourBundleDetail } from "@/types/tour-bundle";

export const tourBundlesService = {
  getLatest(tourId: string) {
    return apiClient
      .get<ApiSuccess<TourBundle>>(`/tours/${tourId}/bundles/latest`)
      .then((response) => response.data);
  },

  getLatestDetail(tourId: string) {
    return apiClient
      .get<ApiSuccess<TourBundleDetail>>(
        `/tours/${tourId}/bundles/latest/download`,
      )
      .then((response) => response.data);
  },

  build(tourId: string) {
    return apiClient
      .post<ApiSuccess<TourBundle>>(`/tours/${tourId}/bundles/build`)
      .then((response) => response.data);
  },
};
