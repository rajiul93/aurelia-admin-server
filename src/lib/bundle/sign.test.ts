import { generateKeyPairSync } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checksumJson,
  sha256Hex,
  signCanonicalPayload,
  signManifestBody,
} from "./sign";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sha256Hex / checksumJson", () => {
  it("hashes deterministically", () => {
    expect(sha256Hex("abc")).toBe(sha256Hex("abc"));
    expect(sha256Hex("abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("checksums canonical JSON independent of key order", () => {
    expect(checksumJson({ a: 1, b: 2 })).toBe(checksumJson({ b: 2, a: 1 }));
  });
});

describe("signCanonicalPayload", () => {
  it("uses HMAC-SHA256 when a shared secret is configured", () => {
    vi.stubEnv("BUNDLE_SIGNING_PRIVATE_KEY", "");
    vi.stubEnv("BUNDLE_SIGNING_SECRET", "top-secret");

    const first = signCanonicalPayload('{"a":1}');
    const second = signCanonicalPayload('{"a":1}');

    expect(first.algorithm).toBe("HMAC-SHA256");
    expect(first.signature).toBe(second.signature); // deterministic
    expect(first.signature.length).toBeGreaterThan(0);
  });

  it("prefers an RSA private key over the HMAC secret", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

    vi.stubEnv("BUNDLE_SIGNING_PRIVATE_KEY", pem);
    vi.stubEnv("BUNDLE_SIGNING_SECRET", "ignored");

    const result = signCanonicalPayload('{"a":1}');

    expect(result.algorithm).toBe("RSA-SHA256");
    expect(result.signature.length).toBeGreaterThan(0);
  });

  it("falls back to a dev HMAC secret outside production when nothing is set", () => {
    vi.stubEnv("BUNDLE_SIGNING_PRIVATE_KEY", "");
    vi.stubEnv("BUNDLE_SIGNING_SECRET", "");
    vi.stubEnv("NODE_ENV", "test");

    const result = signCanonicalPayload('{"a":1}');
    expect(result.algorithm).toBe("HMAC-SHA256");
  });

  it("throws in production when no signing material is configured", () => {
    vi.stubEnv("BUNDLE_SIGNING_PRIVATE_KEY", "");
    vi.stubEnv("BUNDLE_SIGNING_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => signCanonicalPayload('{"a":1}')).toThrow(
      /signing is not configured/i,
    );
  });
});

describe("signManifestBody", () => {
  it("signs canonically, so key order does not change the signature", () => {
    vi.stubEnv("BUNDLE_SIGNING_PRIVATE_KEY", "");
    vi.stubEnv("BUNDLE_SIGNING_SECRET", "secret");

    expect(signManifestBody({ a: 1, b: 2 }).signature).toBe(
      signManifestBody({ b: 2, a: 1 }).signature,
    );
  });
});
