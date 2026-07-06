import { Prisma } from "@/generated/prisma/client";
import type { NextRequest } from "next/server";
import { AppError, TooManyRequestsError } from "./errors";
import { error } from "./response";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

type RouteHandler = (
  req: NextRequest,
  context: RouteContext,
) => Promise<Response>;

export function withErrorHandler(handler: RouteHandler) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      return await handler(req, context);
    } catch (err) {
      if (err instanceof AppError) {
        const response = error(err.code, err.message, {
          status: err.statusCode,
          details: err.details,
        });

        if (err instanceof TooManyRequestsError) {
          response.headers.set(
            "Retry-After",
            String(err.retryAfterSeconds),
          );
        }

        return response;
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return error("CONFLICT", "A record with this value already exists", {
          status: 409,
        });
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        return error("NOT_FOUND", "Resource not found", { status: 404 });
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "ECONNREFUSED" || err.code === "P1001")
      ) {
        return error(
          "DATABASE_UNAVAILABLE",
          "Database connection failed. Check DATABASE_URL and restart the dev server.",
          { status: 503 },
        );
      }

      console.error(err);
      return error("INTERNAL_ERROR", "Something went wrong", { status: 500 });
    }
  };
}
