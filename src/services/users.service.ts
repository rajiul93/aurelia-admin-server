import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
} from "@/types/user";

export const usersService = {
  list(params?: ListParams & { role?: string }) {
    return apiClient
      .get<ApiSuccess<User[]>>("/users", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<User>>(`/users/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateUserPayload) {
    return apiClient
      .post<ApiSuccess<User>>("/users", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateUserPayload) {
    return apiClient
      .patch<ApiSuccess<User>>(`/users/${id}`, payload)
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/users/${id}`)
      .then((response) => response.data);
  },
};
