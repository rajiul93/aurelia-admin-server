import { afterEach, describe, expect, it, vi } from "vitest";

import { isTransientDbError, withDbRetry } from "./prisma-retry";

describe("isTransientDbError", () => {
  it("matches known transient Postgres/driver codes", () => {
    expect(isTransientDbError({ code: "XX000" })).toBe(true);
    expect(isTransientDbError({ code: "P1001" })).toBe(true);
    expect(isTransientDbError({ code: "ECONNRESET" })).toBe(true);
  });

  it("matches on the alternative originalCode field", () => {
    expect(isTransientDbError({ originalCode: "08006" })).toBe(true);
  });

  it("matches transient message fragments case-insensitively", () => {
    expect(
      isTransientDbError({ message: "Control plane request failed" }),
    ).toBe(true);
    expect(isTransientDbError({ message: "Connection terminated" })).toBe(true);
  });

  it("walks the cause chain", () => {
    const err = { message: "wrapper", cause: { cause: { code: "XX000" } } };
    expect(isTransientDbError(err)).toBe(true);
  });

  it("stops at the depth guard rather than recursing forever", () => {
    const deep = { code: "XX000" };
    const shallow = { cause: { cause: { cause: { cause: { cause: { cause: deep } } } } } };
    // deep is at depth 6, beyond the guard → not found.
    expect(isTransientDbError(shallow)).toBe(false);
  });

  it("returns false for non-transient errors and non-objects", () => {
    expect(isTransientDbError({ code: "P2002" })).toBe(false);
    expect(isTransientDbError(new Error("validation failed"))).toBe(false);
    expect(isTransientDbError(null)).toBe(false);
    expect(isTransientDbError("boom")).toBe(false);
  });
});

describe("withDbRetry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns immediately on first success", async () => {
    const op = vi.fn().mockResolvedValue("ok");
    await expect(withDbRetry(op)).resolves.toBe("ok");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures then succeeds", async () => {
    vi.useFakeTimers();
    const op = vi
      .fn()
      .mockRejectedValueOnce({ code: "XX000" })
      .mockRejectedValueOnce({ code: "XX000" })
      .mockResolvedValue("recovered");

    const promise = withDbRetry(op, { retries: 3, baseDelayMs: 10 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("recovered");
    expect(op).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non-transient error", async () => {
    const op = vi.fn().mockRejectedValue({ code: "P2002" });
    await expect(withDbRetry(op)).rejects.toEqual({ code: "P2002" });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting retries on persistent transient errors", async () => {
    vi.useFakeTimers();
    const op = vi.fn().mockRejectedValue({ code: "XX000" });

    const promise = withDbRetry(op, { retries: 2, baseDelayMs: 10 });
    const assertion = expect(promise).rejects.toEqual({ code: "XX000" });
    await vi.runAllTimersAsync();
    await assertion;

    expect(op).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});
