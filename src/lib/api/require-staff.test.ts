import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession: () => getSession(),
  },
}));

const { requireStaffRole, requireStaffSession } = await import(
  "./require-staff"
);

function sessionFor(role: string | null) {
  return {
    data: {
      user: {
        id: "staff-1",
        email: "staff@example.com",
        name: "Staff",
        role,
        emailVerified: true,
      },
      session: { token: "t", expiresAt: new Date() },
    },
  };
}

beforeEach(() => {
  getSession.mockReset();
});

describe("requireStaffSession", () => {
  it("rejects an anonymous request with 401", async () => {
    getSession.mockResolvedValue({ data: null });

    await expect(requireStaffSession()).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("rejects a signed-in non-staff user with 403", async () => {
    getSession.mockResolvedValue(sessionFor("CUSTOMER"));

    await expect(requireStaffSession()).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });
});

describe("requireStaffRole", () => {
  it("allows a role at the required level", async () => {
    getSession.mockResolvedValue(sessionFor("ADMIN"));

    await expect(requireStaffRole("ADMIN")).resolves.toMatchObject({
      role: "ADMIN",
    });
  });

  it("allows a role above the required level", async () => {
    getSession.mockResolvedValue(sessionFor("SUPERADMIN"));

    await expect(requireStaffRole("ADMIN")).resolves.toMatchObject({
      role: "SUPERADMIN",
    });
  });

  it("rejects a role below the required level with 403", async () => {
    // ROUTE_ACCESS_RULES has always said /access is SUPERADMIN/ADMIN only, but
    // nothing enforced it: canAccessRoute was reachable only for /dashboard*,
    // so a MANAGER could call the tour-access API directly.
    getSession.mockResolvedValue(sessionFor("MANAGER"));

    await expect(requireStaffRole("ADMIN")).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("rejects an anonymous request before considering the role", async () => {
    getSession.mockResolvedValue({ data: null });

    await expect(requireStaffRole("MANAGER")).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
