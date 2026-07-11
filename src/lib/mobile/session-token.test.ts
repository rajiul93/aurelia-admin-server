import { afterEach, describe, expect, it, vi } from "vitest";

import { createSessionToken, hashSessionToken } from "./session-token";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSessionToken", () => {
  it("produces a url-safe token", () => {
    const token = createSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThan(20);
  });

  it("produces a unique token each call", () => {
    expect(createSessionToken()).not.toBe(createSessionToken());
  });
});

describe("hashSessionToken", () => {
  it("is deterministic for the same token + pepper", () => {
    vi.stubEnv("MOBILE_SESSION_PEPPER", "pepper-1");
    expect(hashSessionToken("abc")).toBe(hashSessionToken("abc"));
    expect(hashSessionToken("abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when the pepper changes (peppered hash)", () => {
    vi.stubEnv("MOBILE_SESSION_PEPPER", "pepper-1");
    const withPepper1 = hashSessionToken("abc");

    vi.stubEnv("MOBILE_SESSION_PEPPER", "pepper-2");
    const withPepper2 = hashSessionToken("abc");

    expect(withPepper1).not.toBe(withPepper2);
  });

  it("does not leak the raw token", () => {
    vi.stubEnv("MOBILE_SESSION_PEPPER", "pepper-1");
    expect(hashSessionToken("super-secret-token")).not.toContain(
      "super-secret-token",
    );
  });
});
