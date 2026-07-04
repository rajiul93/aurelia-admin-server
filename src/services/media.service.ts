import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type { Media, MediaUploadOptions } from "@/types/media";

function buildFormData(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

export const mediaService = {
  getById(id: string) {
    return apiClient
      .get<ApiSuccess<Media>>(`/media/${id}`)
      .then((response) => response.data);
  },

  upload(file: File, options?: MediaUploadOptions) {
    return apiClient
      .post<ApiSuccess<Media>>("/media", buildFormData(file), {
        onUploadProgress: (event) => {
          if (!options?.onProgress || !event.total) {
            return;
          }

          options.onProgress(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then((response) => response.data);
  },

  replace(id: string, file: File, options?: MediaUploadOptions) {
    return apiClient
      .put<ApiSuccess<Media>>(`/media/${id}`, buildFormData(file), {
        onUploadProgress: (event) => {
          if (!options?.onProgress || !event.total) {
            return;
          }

          options.onProgress(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/media/${id}`)
      .then((response) => response.data);
  },
};
