import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
});

export const floorsService = {
  async listByTour(tourId: string) {
    const response = await api.get(`/tours/${tourId}/floors`);
    return response.data;
  },

  async getById(tourId: string, floorId: string) {
    const response = await api.get(`/tours/${tourId}/floors/${floorId}`);
    return response.data;
  },

  async create(tourId: string, data: { floorNo: number; mapTileUrl?: string }) {
    const response = await api.post(`/tours/${tourId}/floors`, data);
    return response.data;
  },

  async update(
    tourId: string,
    floorId: string,
    data: { floorNo?: number; mapTileUrl?: string | null },
  ) {
    const response = await api.patch(`/tours/${tourId}/floors/${floorId}`, data);
    return response.data;
  },

  async delete(tourId: string, floorId: string) {
    await api.delete(`/tours/${tourId}/floors/${floorId}`);
  },
};
