import { describe, expect, it } from "vitest";

import {
  canAccessDashboard,
  getSessionExpiry,
  isStaffUser,
  mapNeonUserToAuthUser,
} from "./session";

function neonSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: "u1",
      email: "staff@example.com",
      name: "Staff",
      role: "admin",
      emailVerified: true,
      ...overrides,
    },
    session: { token: "t", expiresAt: "2099-01-01T00:00:00.000Z" },
  };
}

describe("mapNeonUserToAuthUser", () => {
  it("maps a staff session to an AuthUser with a normalized role", () => {
    expect(mapNeonUserToAuthUser(neonSession())).toEqual({
      id: "u1",
      name: "Staff",
      email: "staff@example.com",
      role: "ADMIN",
      emailVerified: true,
    });
  });

  it("returns null when the user is not a staff role", () => {
    expect(mapNeonUserToAuthUser(neonSession({ role: "USER" }))).toBeNull();
  });

  it("coerces a missing emailVerified to false", () => {
    const mapped = mapNeonUserToAuthUser(
      neonSession({ emailVerified: undefined }),
    );
    expect(mapped?.emailVerified).toBe(false);
  });
});

describe("canAccessDashboard", () => {
  it("requires both a staff role and a verified email", () => {
    expect(canAccessDashboard(neonSession())).toBe(true);
    expect(canAccessDashboard(neonSession({ emailVerified: false }))).toBe(false);
    expect(canAccessDashboard(neonSession({ role: "USER" }))).toBe(false);
  });

  it("denies null / userless sessions", () => {
    expect(canAccessDashboard(null)).toBe(false);
    expect(canAccessDashboard({})).toBe(false);
  });
});

describe("isStaffUser", () => {
  it("narrows non-null roles", () => {
    expect(isStaffUser("ADMIN")).toBe(true);
    expect(isStaffUser(null)).toBe(false);
  });
});

describe("getSessionExpiry", () => {
  it("returns epoch millis for a date or ISO string", () => {
    const iso = "2030-06-01T00:00:00.000Z";
    expect(getSessionExpiry(iso)).toBe(new Date(iso).getTime());
    expect(getSessionExpiry(new Date(iso))).toBe(new Date(iso).getTime());
  });
});
