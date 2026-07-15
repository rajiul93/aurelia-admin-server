import { apiClient } from "@/lib/axios/client";
import type { Host, CreateHostPayload, UpdateHostPayload } from "@/types/host";

export const hostsService = {
  async list(tourId: string): Promise<Host[]> {
    const { data } = await apiClient.get<{ data: Host[] }>(`/tours/${tourId}/hosts`);
    return data.data;
  },

  async getById(tourId: string, hostId: string): Promise<Host> {
    const { data } = await apiClient.get<{ data: Host }>(`/tours/${tourId}/hosts/${hostId}`);
    return data.data;
  },

  async create(tourId: string, payload: CreateHostPayload): Promise<Host> {
    const { data } = await apiClient.post<{ data: Host }>(`/tours/${tourId}/hosts`, payload);
    return data.data;
  },

  async update(tourId: string, hostId: string, payload: UpdateHostPayload): Promise<Host> {
    const { data } = await apiClient.patch<{ data: Host }>(`/tours/${tourId}/hosts/${hostId}`, payload);
    return data.data;
  },

  async delete(tourId: string, hostId: string): Promise<void> {
    await apiClient.delete(`/tours/${tourId}/hosts/${hostId}`);
  },
};
