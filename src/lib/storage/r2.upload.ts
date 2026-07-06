import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import type { ValidatedMediaFile } from "@/lib/media/validation";
import { buildPublicUrl, getR2Config } from "./r2.config";
import { getR2Client } from "./r2.client";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
};

function sanitizeFileName(originalName: string) {
  return originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function generateObjectKey(originalName: string, mimeType: string) {
  const extensionFromName = path.extname(originalName).slice(1).toLowerCase();
  const extension =
    extensionFromName || MIME_EXTENSION_MAP[mimeType] || "bin";
  const datePrefix = new Date().toISOString().slice(0, 10);
  const safeName = sanitizeFileName(
    path.basename(originalName, path.extname(originalName)),
  );

  return `media/${datePrefix}/${randomUUID()}-${safeName}.${extension}`;
}

export async function uploadToR2(file: ValidatedMediaFile) {
  const config = getR2Config();
  const key = generateObjectKey(file.originalName, file.mimeType);
  const fileName = path.basename(key);

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimeType,
      ContentLength: file.size,
    }),
  );

  return {
    key,
    fileName,
    url: buildPublicUrl(config.bucketUrl, key),
  };
}
