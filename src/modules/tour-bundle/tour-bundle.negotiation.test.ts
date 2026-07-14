import { describe, it, expect } from "vitest";
import {
  getBundleFormatVersion,
  isFormatVersionSupported,
  getSupportedBundleVersions,
} from "./tour-bundle.negotiation";

describe("BundleFormatVersionNegotiation", () => {
  describe("getBundleFormatVersion", () => {
    it("should return v2 for no client version (default to latest)", () => {
      expect(getBundleFormatVersion()).toBe("2");
      expect(getBundleFormatVersion(undefined)).toBe("2");
      expect(getBundleFormatVersion("")).toBe("2");
    });

    it("should return v2 for v1.2.0 and above", () => {
      expect(getBundleFormatVersion("1.2.0")).toBe("2");
      expect(getBundleFormatVersion("1.2.1")).toBe("2");
      expect(getBundleFormatVersion("1.3.0")).toBe("2");
      expect(getBundleFormatVersion("2.0.0")).toBe("2");
    });

    it("should return v1 for v1.0.x and v1.1.x", () => {
      expect(getBundleFormatVersion("1.0.0")).toBe("1");
      expect(getBundleFormatVersion("1.0.5")).toBe("1");
      expect(getBundleFormatVersion("1.1.0")).toBe("1");
      expect(getBundleFormatVersion("1.1.99")).toBe("1");
    });

    it("should handle version strings with pre-release tags", () => {
      expect(getBundleFormatVersion("1.2.0-beta")).toBe("2");
      expect(getBundleFormatVersion("1.1.0-rc1")).toBe("1");
    });
  });

  describe("isFormatVersionSupported", () => {
    it("should support v1 bundles for v1.x clients", () => {
      expect(isFormatVersionSupported("1.0.0", "1")).toBe(true);
      expect(isFormatVersionSupported("1.1.0", "1")).toBe(true);
    });

    it("should not support v2 bundles for v1.0.x and v1.1.x clients", () => {
      expect(isFormatVersionSupported("1.0.0", "2")).toBe(false);
      expect(isFormatVersionSupported("1.1.0", "2")).toBe(false);
    });

    it("should support v2 bundles for v1.2.0+ clients", () => {
      expect(isFormatVersionSupported("1.2.0", "2")).toBe(true);
      expect(isFormatVersionSupported("1.3.0", "2")).toBe(true);
    });

    it("should support v1 bundles for v1.2.0+ clients (backward compat)", () => {
      expect(isFormatVersionSupported("1.2.0", "1")).toBe(true);
    });
  });

  describe("getSupportedBundleVersions", () => {
    it("should return all supported versions", () => {
      expect(getSupportedBundleVersions()).toEqual(["1", "2"]);
    });
  });
});
