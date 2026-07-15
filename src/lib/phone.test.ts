import { describe, expect, it } from "vitest";

import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("strips the formatting a human types", () => {
    // The admin types it one way, the buyer another. Both must land on the same
    // string or the number simply never matches and nobody can tell why.
    for (const written of [
      "+880 1712-345678",
      "+8801712345678",
      " +880 (1712) 345 678 ",
      "+880-1712-345678",
    ]) {
      expect(normalizePhone(written)).toBe("+8801712345678");
    }
  });

  it("treats a 00 prefix as +", () => {
    expect(normalizePhone("008801712345678")).toBe("+8801712345678");
  });

  it("leaves a local number without a country code alone", () => {
    expect(normalizePhone("01712-345678")).toBe("01712345678");
  });

  it("keeps a local and an international number distinct", () => {
    // They are different strings, so they are different grants. That is correct:
    // guessing that one is the other would hand a buyer someone else's tour.
    expect(normalizePhone("01712345678")).not.toBe(
      normalizePhone("+8801712345678"),
    );
  });
});
