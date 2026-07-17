import { describe, it, expect } from "vitest";
import { computeIsAvailableNow } from "./host.availability";

// Every instant here is written as an absolute UTC "Z" timestamp, never a naive
// local one. A bare "2025-01-15T12:00:00" is parsed in the *runner's* zone, so
// it drifts with the machine and silently agrees with a function that reads the
// machine clock — which is exactly the bug these tests exist to catch.
const ROME = "Europe/Rome";

// Rome is UTC+1 in January (CET) and UTC+2 in July (CEST).
const JAN_12_00_ROME = new Date("2025-01-15T11:00:00Z");
const JAN_08_59_ROME = new Date("2025-01-15T07:59:00Z");
const JAN_09_00_ROME = new Date("2025-01-15T08:00:00Z");
const JAN_17_59_ROME = new Date("2025-01-15T16:59:00Z");
const JAN_18_00_ROME = new Date("2025-01-15T17:00:00Z");
const JAN_23_30_ROME = new Date("2025-01-15T22:30:00Z");
const JAN_01_30_ROME = new Date("2025-01-15T00:30:00Z");
const JAN_10_00_ROME = new Date("2025-01-15T09:00:00Z");

describe("computeIsAvailableNow", () => {
  it("returns false when isActive is false", () => {
    expect(
      computeIsAvailableNow(false, "09:00", "18:00", ROME, JAN_12_00_ROME),
    ).toBe(false);
  });

  it("returns true when isActive is true and no hours are set", () => {
    expect(computeIsAvailableNow(true, null, null, ROME, JAN_12_00_ROME)).toBe(
      true,
    );
  });

  it("returns true when isActive is true and only availableFrom is set", () => {
    expect(
      computeIsAvailableNow(true, "09:00", null, ROME, JAN_12_00_ROME),
    ).toBe(true);
  });

  it("returns true when isActive is true and only availableTo is set", () => {
    expect(
      computeIsAvailableNow(true, null, "18:00", ROME, JAN_12_00_ROME),
    ).toBe(true);
  });

  it("returns true when time is within a normal window (not crossing midnight)", () => {
    expect(
      computeIsAvailableNow(true, "09:00", "18:00", ROME, JAN_12_00_ROME),
    ).toBe(true);
  });

  it("returns false when time is outside a normal window (before start)", () => {
    expect(
      computeIsAvailableNow(true, "09:00", "18:00", ROME, JAN_08_59_ROME),
    ).toBe(false);
  });

  it("returns false when time is outside a normal window (at or after end)", () => {
    expect(
      computeIsAvailableNow(true, "09:00", "18:00", ROME, JAN_18_00_ROME),
    ).toBe(false);
  });

  it("handles overnight window (crosses midnight) - within window (after start)", () => {
    expect(
      computeIsAvailableNow(true, "22:00", "02:00", ROME, JAN_23_30_ROME),
    ).toBe(true);
  });

  it("handles overnight window (crosses midnight) - within window (before end)", () => {
    expect(
      computeIsAvailableNow(true, "22:00", "02:00", ROME, JAN_01_30_ROME),
    ).toBe(true);
  });

  it("handles overnight window (crosses midnight) - outside window (between end and start)", () => {
    expect(
      computeIsAvailableNow(true, "22:00", "02:00", ROME, JAN_10_00_ROME),
    ).toBe(false);
  });

  it("handles edge case: exact start time of window", () => {
    expect(
      computeIsAvailableNow(true, "09:00", "18:00", ROME, JAN_09_00_ROME),
    ).toBe(true);
  });

  it("handles edge case: one minute before end of window", () => {
    expect(
      computeIsAvailableNow(true, "09:00", "18:00", ROME, JAN_17_59_ROME),
    ).toBe(true);
  });

  describe("venue timezone", () => {
    // The regression. Production runs in UTC, so the old implementation read
    // 08:30 off the machine clock and reported this Rome host as off duty two
    // hours into their shift.
    it("reads the window on the venue's clock, not the server's (summer CEST)", () => {
      const tenThirtyInRome = new Date("2026-07-17T08:30:00Z");

      expect(
        computeIsAvailableNow(true, "09:00", "17:00", ROME, tenThirtyInRome),
      ).toBe(true);
    });

    it("gives different answers for the same instant in different venues", () => {
      const instant = new Date("2026-07-17T08:30:00Z"); // 10:30 Rome, 04:30 New York

      expect(
        computeIsAvailableNow(true, "09:00", "17:00", ROME, instant),
      ).toBe(true);
      expect(
        computeIsAvailableNow(
          true,
          "09:00",
          "17:00",
          "America/New_York",
          instant,
        ),
      ).toBe(false);
    });

    it("handles a DST transition without shifting the window", () => {
      // 2026-03-29 is Rome's spring-forward: 02:00 CET becomes 03:00 CEST.
      // Before the jump 09:30 Rome is 08:30Z; after it, 09:30 Rome is 07:30Z.
      const beforeDst = new Date("2026-03-28T08:30:00Z");
      const afterDst = new Date("2026-03-30T07:30:00Z");

      expect(
        computeIsAvailableNow(true, "09:00", "17:00", ROME, beforeDst),
      ).toBe(true);
      expect(computeIsAvailableNow(true, "09:00", "17:00", ROME, afterDst)).toBe(
        true,
      );
    });

    it("falls back to the default venue rather than throwing on a garbage zone", () => {
      const tenThirtyInRome = new Date("2026-07-17T08:30:00Z");

      expect(
        computeIsAvailableNow(
          true,
          "09:00",
          "17:00",
          "Not/AZone",
          tenThirtyInRome,
        ),
      ).toBe(true);
    });
  });
});
