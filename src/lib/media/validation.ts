import { ValidationError } from "@/lib/api/errors";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  type AllowedImageMimeType,
} from "./constants";

export type ValidatedImageFile = {
  buffer: Buffer;
  mimeType: AllowedImageMimeType;
  size: number;
  originalName: string;
};

function isAllowedMimeType(mimeType: string): mimeType is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export async function validateImageFileFromBuffer(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  size: number,
): Promise<ValidatedImageFile> {
  if (!isAllowedMimeType(mimeType)) {
    throw new ValidationError(
      "Only JPEG, PNG, WebP, and GIF images are allowed.",
    );
  }

  if (size > MAX_IMAGE_SIZE_BYTES) {
    throw new ValidationError("Image must be 5 MB or smaller.");
  }

  if (size === 0 || buffer.length === 0) {
    throw new ValidationError("Image file is empty.");
  }

  if (buffer.length !== size) {
    throw new ValidationError("Uploaded file size mismatch.");
  }

  return {
    buffer,
    mimeType,
    size,
    originalName,
  };
}

export function validateClientImageFile(file: File): string | null {
  if (!isAllowedMimeType(file.type)) {
    return "Only JPEG, PNG, WebP, and GIF images are allowed.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }

  if (file.size === 0) {
    return "Image file is empty.";
  }

  return null;
}
