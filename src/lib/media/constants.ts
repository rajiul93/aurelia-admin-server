export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];
export type AllowedAudioMimeType = (typeof ALLOWED_AUDIO_MIME_TYPES)[number];
export type AllowedMediaMimeType =
  | AllowedImageMimeType
  | AllowedVideoMimeType
  | AllowedAudioMimeType;

export type MediaKind = "image" | "video" | "audio";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024;

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
export const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];
export const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "m4a", "wav", "ogg", "webm"];

export const IMAGE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");
export const VIDEO_ACCEPT = ALLOWED_VIDEO_MIME_TYPES.join(",");
export const AUDIO_ACCEPT = ALLOWED_AUDIO_MIME_TYPES.join(",");
export const MEDIA_ACCEPT = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_AUDIO_MIME_TYPES,
].join(",");

export const MAX_IMAGE_SIZE_LABEL = "5 MB";
export const MAX_VIDEO_SIZE_LABEL = "100 MB";
export const MAX_AUDIO_SIZE_LABEL = "100 MB";
