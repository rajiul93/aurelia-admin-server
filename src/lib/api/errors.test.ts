import { describe, expect, it } from "vitest";

import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("AppError subclasses", () => {
  it("maps each subclass to the right status and code", () => {
    expect(new NotFoundError()).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    expect(new ConflictError()).toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
    expect(new ValidationError()).toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
    expect(new UnauthorizedError()).toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
    expect(new ForbiddenError()).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("are instances of AppError and Error", () => {
    const err = new NotFoundError();
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it("carries custom messages and validation details", () => {
    const err = new ValidationError("bad field", { field: "email" });
    expect(err.message).toBe("bad field");
    expect(err.details).toEqual({ field: "email" });
  });

  it("exposes retryAfterSeconds and details on TooManyRequestsError", () => {
    const err = new TooManyRequestsError("slow down", 30);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.retryAfterSeconds).toBe(30);
    expect(err.details).toEqual({ retryAfter: 30 });
  });

  it("defaults TooManyRequestsError retry to 60 seconds", () => {
    expect(new TooManyRequestsError().retryAfterSeconds).toBe(60);
  });
});
