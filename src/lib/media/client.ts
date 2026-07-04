import { mediaService } from "@/services/media.service";
import type { MediaFieldValue, MediaUploadOptions } from "@/types/media";

export async function resolveMediaUpload(
  value: MediaFieldValue | undefined,
  existingMediaId?: string | null,
  options?: MediaUploadOptions,
): Promise<string | null | undefined> {
  if (!value) {
    return existingMediaId;
  }

  if (value.removeExisting) {
    if (existingMediaId) {
      await mediaService.remove(existingMediaId);
    }

    return null;
  }

  if (value.file) {
    if (existingMediaId) {
      const response = await mediaService.replace(
        existingMediaId,
        value.file,
        options,
      );
      return response.data.id;
    }

    const response = await mediaService.upload(value.file, options);
    return response.data.id;
  }

  return existingMediaId;
}
