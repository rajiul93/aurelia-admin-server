import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams } from "@/lib/api/validate";
import {
  createSpotFaqSchema,
  createSpotMediaSchema,
  createSpotSchema,
  spotFaqIdParamSchema,
  spotIdParamSchema,
  spotMediaIdParamSchema,
  tourIdParamSchema,
  updateSpotFaqSchema,
  updateSpotSchema,
} from "./spot.schema";
import { spotService } from "./spot.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const spotController = {
  async list(_req: NextRequest, tourId: string) {
    const spots = await spotService.listByTour(tourId);
    return success(spots);
  },

  async create(req: NextRequest, tourId: string, staffAuthUserId: string) {
    const body = await parseBody(req, createSpotSchema);
    const spot = await spotService.create(
      tourId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(spot, { status: 201 });
  },

  async getById(_req: NextRequest, tourId: string, spotId: string) {
    const spot = await spotService.getById(tourId, spotId);
    return success(spot);
  },

  async update(
    req: NextRequest,
    tourId: string,
    spotId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, updateSpotSchema);
    const spot = await spotService.update(
      tourId,
      spotId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(spot);
  },

  async delete(
    req: NextRequest,
    tourId: string,
    spotId: string,
    staffAuthUserId: string,
  ) {
    await spotService.delete(
      tourId,
      spotId,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  async createMedia(
    req: NextRequest,
    tourId: string,
    spotId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, createSpotMediaSchema);
    const media = await spotService.createMedia(
      tourId,
      spotId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(media, { status: 201 });
  },

  async deleteMedia(
    req: NextRequest,
    tourId: string,
    spotId: string,
    mediaId: string,
    staffAuthUserId: string,
  ) {
    await spotService.deleteMedia(
      tourId,
      spotId,
      mediaId,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  async createFaq(
    req: NextRequest,
    tourId: string,
    spotId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, createSpotFaqSchema);
    const faq = await spotService.createFaq(
      tourId,
      spotId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(faq, { status: 201 });
  },

  async updateFaq(
    req: NextRequest,
    tourId: string,
    spotId: string,
    faqId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, updateSpotFaqSchema);
    const faq = await spotService.updateFaq(
      tourId,
      spotId,
      faqId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(faq);
  },

  async deleteFaq(
    req: NextRequest,
    tourId: string,
    spotId: string,
    faqId: string,
    staffAuthUserId: string,
  ) {
    await spotService.deleteFaq(
      tourId,
      spotId,
      faqId,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },

  parseSpotParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, spotIdParamSchema);
  },

  parseMediaParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, spotMediaIdParamSchema);
  },

  parseFaqParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, spotFaqIdParamSchema);
  },
};
