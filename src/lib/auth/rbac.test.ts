import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  getRequiredRolesForRoute,
  hasMinimumRole,
  normalizeStaffRole,
} from "./rbac";

describe("normalizeStaffRole", () => {
  it("normalizes case, spaces, and dashes to a canonical staff role", () => {
    expect(normalizeStaffRole("admin")).toBe("ADMIN");
    expect(normalizeStaffRole("Super-Admin")).toBe("SUPERADMIN");
    expect(normalizeStaffRole("super admin")).toBe("SUPERADMIN");
    expect(normalizeStaffRole("MANAGER")).toBe("MANAGER");
  });

  it("returns null for non-staff / unknown / empty roles", () => {
    expect(normalizeStaffRole("USER")).toBeNull();
    expect(normalizeStaffRole("guest")).toBeNull();
    expect(normalizeStaffRole(null)).toBeNull();
    expect(normalizeStaffRole(undefined)).toBeNull();
    expect(normalizeStaffRole("")).toBeNull();
  });
});

describe("hasMinimumRole", () => {
  it("respects the SUPERADMIN > ADMIN > MANAGER hierarchy", () => {
    expect(hasMinimumRole("SUPERADMIN", "ADMIN")).toBe(true);
    expect(hasMinimumRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasMinimumRole("MANAGER", "ADMIN")).toBe(false);
    expect(hasMinimumRole("ADMIN", "SUPERADMIN")).toBe(false);
  });
});

describe("canAccessRoute", () => {
  it("allows staff roles on shared routes", () => {
    expect(canAccessRoute("/dashboard", "MANAGER")).toBe(true);
    expect(canAccessRoute("/tours/123/edit", "MANAGER")).toBe(true);
  });

  it("restricts /access to SUPERADMIN and ADMIN", () => {
    expect(canAccessRoute("/access", "ADMIN")).toBe(true);
    expect(canAccessRoute("/access", "SUPERADMIN")).toBe(true);
    expect(canAccessRoute("/access/new", "MANAGER")).toBe(false);
  });

  it("denies when there is no role", () => {
    expect(canAccessRoute("/dashboard", null)).toBe(false);
  });

  it("allows unlisted routes by default for any staff role", () => {
    expect(canAccessRoute("/some/unlisted/path", "MANAGER")).toBe(true);
  });
});

describe("getRequiredRolesForRoute", () => {
  it("returns the matching rule's roles", () => {
    expect(getRequiredRolesForRoute("/access")).toEqual(["SUPERADMIN", "ADMIN"]);
  });

  it("returns null for unlisted routes", () => {
    expect(getRequiredRolesForRoute("/nope")).toBeNull();
  });
});
