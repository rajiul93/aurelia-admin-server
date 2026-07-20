import { afterEach, describe, expect, it, vi } from "vitest";

import { requirePepper } from "./pepper";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requirePepper", () => {
  it("returns the configured value when set", () => {
    vi.stubEnv("TEST_PEPPER", "real-pepper");
    expect(requirePepper("TEST_PEPPER", "dev-fallback")).toBe("real-pepper");
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("TEST_PEPPER", "  real-pepper  ");
    expect(requirePepper("TEST_PEPPER", "dev-fallback")).toBe("real-pepper");
  });

  it("falls back off production so local work needs no env setup", () => {
    vi.stubEnv("TEST_PEPPER", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(requirePepper("TEST_PEPPER", "dev-fallback")).toBe("dev-fallback");
  });

  it("throws in production instead of hashing with a committed constant", () => {
    // A pepper baked into the repo gives anyone with a DB dump everything they
    // need to forge session tokens, so an unset value must fail loudly.
    vi.stubEnv("TEST_PEPPER", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => requirePepper("TEST_PEPPER", "dev-fallback")).toThrow(
      /TEST_PEPPER is not configured/,
    );
  });
});
