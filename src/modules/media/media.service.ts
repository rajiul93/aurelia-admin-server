import { AppError, NotFoundError } from "@/lib/api/errors";
import type { ValidatedMediaFile } from "@/lib/media/validation";
import { deleteFromR2, uploadToR2 } from "@/lib/storage";
import { toMediaDto } from "./media.mapper";
import { mediaRepository } from "./media.repository";
import type { MediaDto } from "./media.types";

export const mediaService = {
  async getById(id: string): Promise<MediaDto> {
    const media = await mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundError("Media not found");
    }

    return toMediaDto(media);
  },

  async create(file: ValidatedMediaFile): Promise<MediaDto> {
    const uploaded = await uploadToR2(file);

    try {
      const media = await mediaRepository.create({
        fileName: uploaded.fileName,
        originalName: file.originalName,
        url: uploaded.url,
        key: uploaded.key,
        mimeType: file.mimeType,
        size: file.size,
      });

      return toMediaDto(media);
    } catch (error) {
      await deleteFromR2(uploaded.key).catch((cleanupError) => {
        console.error("[media] Failed to clean up R2 object after DB error", {
          key: uploaded.key,
          cleanupError,
        });
      });

      throw error;
    }
  },

  async replace(id: string, file: ValidatedMediaFile): Promise<MediaDto> {
    const existing = await mediaRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Media not found");
    }

    const oldKey = existing.key;
    const uploaded = await uploadToR2(file);

    try {
      const media = await mediaRepository.update(id, {
        fileName: uploaded.fileName,
        originalName: file.originalName,
        url: uploaded.url,
        key: uploaded.key,
        mimeType: file.mimeType,
        size: file.size,
      });

      if (oldKey !== uploaded.key) {
        await deleteFromR2(oldKey).catch((cleanupError) => {
          console.error("[media] Failed to delete replaced R2 object", {
            key: oldKey,
            cleanupError,
          });
        });
      }

      return toMediaDto(media);
    } catch (error) {
      await deleteFromR2(uploaded.key).catch((cleanupError) => {
        console.error("[media] Failed to clean up R2 object after replace error", {
          key: uploaded.key,
          cleanupError,
        });
      });

      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    const existing = await mediaRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Media not found");
    }

    try {
      await deleteFromR2(existing.key);
    } catch (error) {
      console.error("[media] Failed to delete R2 object", {
        key: existing.key,
        error,
      });
      throw new AppError(
        502,
        "STORAGE_DELETE_FAILED",
        "Failed to delete file from storage.",
      );
    }

    await mediaRepository.delete(id);
  },
};
