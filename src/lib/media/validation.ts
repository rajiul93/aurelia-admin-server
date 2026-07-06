import { ValidationError } from "@/lib/api/errors";
import {
  ALLOWED_AUDIO_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_AUDIO_SIZE_BYTES,
  MAX_AUDIO_SIZE_LABEL,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_LABEL,
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_SIZE_LABEL,
  type AllowedMediaMimeType,
  type MediaKind,
} from "./constants";

export type ValidatedMediaFile = {
  buffer: Buffer;
  mimeType: AllowedMediaMimeType;
  kind: MediaKind;
  size: number;
  originalName: string;
};

/** @deprecated Use ValidatedMediaFile */
export type ValidatedImageFile = ValidatedMediaFile & {
  mimeType: (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
  kind: "image";
};

function resolveMediaKind(mimeType: string): MediaKind | null {
  if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return "image";
  }

  if ((ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return "video";
  }

  if ((ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return "audio";
  }

  return null;
}

function isAllowedMediaMimeType(
  mimeType: string,
): mimeType is AllowedMediaMimeType {
  return resolveMediaKind(mimeType) !== null;
}

function maxSizeForKind(kind: MediaKind) {
  switch (kind) {
    case "image":
      return MAX_IMAGE_SIZE_BYTES;
    case "video":
      return MAX_VIDEO_SIZE_BYTES;
    case "audio":
      return MAX_AUDIO_SIZE_BYTES;
  }
}

function sizeLimitMessage(kind: MediaKind) {
  switch (kind) {
    case "image":
      return `Image must be ${MAX_IMAGE_SIZE_LABEL} or smaller.`;
    case "video":
      return `Video must be ${MAX_VIDEO_SIZE_LABEL} or smaller.`;
    case "audio":
      return `Audio must be ${MAX_AUDIO_SIZE_LABEL} or smaller.`;
  }
}

function allowedTypesMessage(kind: MediaKind) {
  switch (kind) {
    case "image":
      return "Only JPEG, PNG, WebP, and GIF images are allowed.";
    case "video":
      return "Only MP4, WebM, and MOV videos are allowed.";
    case "audio":
      return "Only MP3, M4A, WAV, OGG, and WebM audio files are allowed.";
  }
}

function validateMediaSize(kind: MediaKind, size: number) {
  if (size > maxSizeForKind(kind)) {
    throw new ValidationError(sizeLimitMessage(kind));
  }

  if (size === 0) {
    throw new ValidationError("File is empty.");
  }
}

export async function validateMediaFileFromBuffer(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  size: number,
  expectedKind?: MediaKind,
): Promise<ValidatedMediaFile> {
  const kind = resolveMediaKind(mimeType);

  if (!kind || !isAllowedMediaMimeType(mimeType)) {
    throw new ValidationError(
      expectedKind
        ? allowedTypesMessage(expectedKind)
        : "Unsupported media file type.",
    );
  }

  if (expectedKind && kind !== expectedKind) {
    throw new ValidationError(allowedTypesMessage(expectedKind));
  }

  validateMediaSize(kind, size);

  if (buffer.length !== size) {
    throw new ValidationError("Uploaded file size mismatch.");
  }

  return {
    buffer,
    mimeType,
    kind,
    size,
    originalName,
  };
}

export async function validateImageFileFromBuffer(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  size: number,
): Promise<ValidatedImageFile> {
  const file = await validateMediaFileFromBuffer(
    buffer,
    mimeType,
    originalName,
    size,
    "image",
  );

  return file as ValidatedImageFile;
}

export function validateClientMediaFile(
  file: File,
  expectedKind?: MediaKind,
): string | null {
  const kind = resolveMediaKind(file.type);

  if (!kind) {
    return expectedKind
      ? allowedTypesMessage(expectedKind)
      : "Unsupported media file type.";
  }

  if (expectedKind && kind !== expectedKind) {
    return allowedTypesMessage(expectedKind);
  }

  if (file.size > maxSizeForKind(kind)) {
    return sizeLimitMessage(kind);
  }

  if (file.size === 0) {
    return "File is empty.";
  }

  return null;
}

export function validateClientImageFile(file: File): string | null {
  return validateClientMediaFile(file, "image");
}
