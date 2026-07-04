import type { NextRequest } from "next/server";
import { ValidationError } from "@/lib/api/errors";
import { validateImageFileFromBuffer } from "@/lib/media/validation";
import { success } from "@/lib/api/response";
import { parseParams } from "@/lib/api/validate";
import { mediaIdParamSchema } from "./media.schema";
import { mediaService } from "./media.service";

async function parseImageUpload(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    throw new ValidationError(
      "Expected a multipart/form-data image upload.",
    );
  }

  const formData = await req.formData();
  const fileEntry = formData.get("file");

  if (!(fileEntry instanceof File)) {
    throw new ValidationError("An image file is required.");
  }

  const buffer = Buffer.from(await fileEntry.arrayBuffer());

  return validateImageFileFromBuffer(
    buffer,
    fileEntry.type,
    fileEntry.name,
    fileEntry.size,
  );
}

export const mediaController = {
  async upload(req: NextRequest) {
    const file = await parseImageUpload(req);
    const media = await mediaService.create(file);
    return success(media, { status: 201 });
  },

  async getById(id: string) {
    const media = await mediaService.getById(id);
    return success(media);
  },

  async replace(req: NextRequest, id: string) {
    const file = await parseImageUpload(req);
    const media = await mediaService.replace(id, file);
    return success(media);
  },

  async delete(id: string) {
    await mediaService.delete(id);
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, mediaIdParamSchema).id;
  },
};
