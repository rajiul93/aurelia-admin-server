import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type { Spot, SpotFaq, SpotMedia } from "@/types/spot";
import type {
  CreateSpotFaqPayload,
  CreateSpotMediaPayload,
  CreateSpotPayload,
  UpdateSpotFaqPayload,
  UpdateSpotPayload,
} from "@/types/spot";

export const spotsService = {
  list(tourId: string) {
    return apiClient
      .get<ApiSuccess<Spot[]>>(`/tours/${tourId}/spots`)
      .then((response) => response.data);
  },

  getById(tourId: string, spotId: string) {
    return apiClient
      .get<ApiSuccess<Spot>>(`/tours/${tourId}/spots/${spotId}`)
      .then((response) => response.data);
  },

  create(tourId: string, payload: CreateSpotPayload) {
    return apiClient
      .post<ApiSuccess<Spot>>(`/tours/${tourId}/spots`, payload)
      .then((response) => response.data);
  },

  update(tourId: string, spotId: string, payload: UpdateSpotPayload) {
    return apiClient
      .patch<ApiSuccess<Spot>>(`/tours/${tourId}/spots/${spotId}`, payload)
      .then((response) => response.data);
  },

  remove(tourId: string, spotId: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(
        `/tours/${tourId}/spots/${spotId}`,
      )
      .then((response) => response.data);
  },

  createMedia(tourId: string, spotId: string, payload: CreateSpotMediaPayload) {
    return apiClient
      .post<ApiSuccess<SpotMedia>>(
        `/tours/${tourId}/spots/${spotId}/media`,
        payload,
      )
      .then((response) => response.data);
  },

  removeMedia(tourId: string, spotId: string, mediaId: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(
        `/tours/${tourId}/spots/${spotId}/media/${mediaId}`,
      )
      .then((response) => response.data);
  },

  createFaq(tourId: string, spotId: string, payload: CreateSpotFaqPayload) {
    return apiClient
      .post<ApiSuccess<SpotFaq>>(`/tours/${tourId}/spots/${spotId}/faqs`, payload)
      .then((response) => response.data);
  },

  updateFaq(
    tourId: string,
    spotId: string,
    faqId: string,
    payload: UpdateSpotFaqPayload,
  ) {
    return apiClient
      .patch<ApiSuccess<SpotFaq>>(
        `/tours/${tourId}/spots/${spotId}/faqs/${faqId}`,
        payload,
      )
      .then((response) => response.data);
  },

  removeFaq(tourId: string, spotId: string, faqId: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(
        `/tours/${tourId}/spots/${spotId}/faqs/${faqId}`,
      )
      .then((response) => response.data);
  },
};
