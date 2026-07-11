import { beforeEach, vi } from "vitest";
import {
  mockDeep,
  mockReset,
  type DeepMockProxy,
} from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Typed deep mock of the Prisma client, shared by service/API unit tests.
 *
 * Usage: import this module **first** in a test file so the `vi.mock` below is
 * registered before the module-under-test loads `@/lib/prisma`:
 *
 *   import { prismaMock } from "@/test/prisma-mock";
 *   import { mobileAuthService } from "@/modules/mobile-auth/mobile-auth.service";
 *
 *   prismaMock.tourAccess.findFirst.mockResolvedValue(null);
 *
 * The mock is reset before every test.
 */
export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});
