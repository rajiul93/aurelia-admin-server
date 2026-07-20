import { afterEach, describe, expect, it, vi } from "vitest";

import { requireMobileApiKey } from "./api-key";

afterEach(() => {
  vi.unstubAllEnvs();
});

function request(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as Parameters<typeof requireMobileApiKey>[0];
}

describe("requireMobileApiKey", () => {
  it("accepts a matching key", () => {
    vi.stubEnv("MOBILE_API_KEY", "secret-key");
    expect(() =>
      requireMobileApiKey(request({ "x-api-key": "secret-key" })),
    ).not.toThrow();
  });

  it("rejects a wrong key with 403", () => {
    vi.stubEnv("MOBILE_API_KEY", "secret-key");
    expect(() => requireMobileApiKey(request({ "x-api-key": "nope" }))).toThrow(
      /Invalid x-api-key/,
    );
  });

  it("rejects a key of a different length rather than crashing", () => {
    // Guards the timingSafeEqual path: comparing raw buffers of unequal length
    // throws a RangeError instead of returning a clean 403.
    vi.stubEnv("MOBILE_API_KEY", "secret-key");
    expect(() =>
      requireMobileApiKey(request({ "x-api-key": "x" })),
    ).toThrow(/Invalid x-api-key/);
  });

  it("rejects a missing header with 401", () => {
    vi.stubEnv("MOBILE_API_KEY", "secret-key");
    expect(() => requireMobileApiKey(request())).toThrow(
      /Missing x-api-key header/,
    );
  });

  describe("when MOBILE_API_KEY is not configured", () => {
    it("rejects outside production too, not just on it", () => {
      // The old behaviour keyed the bypass off NODE_ENV, so staging and preview
      // deployments served the whole mobile API unauthenticated.
      vi.stubEnv("MOBILE_API_KEY", "");
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOW_INSECURE_MOBILE_API", "");

      expect(() => requireMobileApiKey(request())).toThrow(
        /Mobile API key is not configured/,
      );
    });

    it("rejects in production", () => {
      vi.stubEnv("MOBILE_API_KEY", "");
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_INSECURE_MOBILE_API", "");

      expect(() => requireMobileApiKey(request())).toThrow(
        /Mobile API key is not configured/,
      );
    });

    it("only skips the check behind the explicit opt-in", () => {
      vi.stubEnv("MOBILE_API_KEY", "");
      vi.stubEnv("ALLOW_INSECURE_MOBILE_API", "1");

      expect(() => requireMobileApiKey(request())).not.toThrow();
    });
  });
});
