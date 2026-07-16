import { describe, it, expect } from "vitest";
import { computeIsAvailableNow } from "./host.availability";

describe("computeIsAvailableNow", () => {
  it("returns false when isActive is false", () => {
    const result = computeIsAvailableNow(false, "09:00", "18:00", new Date("2025-01-15T12:00:00"));
    expect(result).toBe(false);
  });

  it("returns true when isActive is true and no hours are set", () => {
    const result = computeIsAvailableNow(true, null, null, new Date("2025-01-15T12:00:00"));
    expect(result).toBe(true);
  });

  it("returns true when isActive is true and only availableFrom is set", () => {
    const result = computeIsAvailableNow(true, "09:00", null, new Date("2025-01-15T12:00:00"));
    expect(result).toBe(true);
  });

  it("returns true when isActive is true and only availableTo is set", () => {
    const result = computeIsAvailableNow(true, null, "18:00", new Date("2025-01-15T12:00:00"));
    expect(result).toBe(true);
  });

  it("returns true when time is within a normal window (not crossing midnight)", () => {
    const result = computeIsAvailableNow(true, "09:00", "18:00", new Date("2025-01-15T12:00:00"));
    expect(result).toBe(true);
  });

  it("returns false when time is outside a normal window (before start)", () => {
    const result = computeIsAvailableNow(true, "09:00", "18:00", new Date("2025-01-15T08:59:00"));
    expect(result).toBe(false);
  });

  it("returns false when time is outside a normal window (at or after end)", () => {
    const result = computeIsAvailableNow(true, "09:00", "18:00", new Date("2025-01-15T18:00:00"));
    expect(result).toBe(false);
  });

  it("handles overnight window (crosses midnight) - within window (after start)", () => {
    const result = computeIsAvailableNow(true, "22:00", "02:00", new Date("2025-01-15T23:30:00"));
    expect(result).toBe(true);
  });

  it("handles overnight window (crosses midnight) - within window (before end)", () => {
    const result = computeIsAvailableNow(true, "22:00", "02:00", new Date("2025-01-15T01:30:00"));
    expect(result).toBe(true);
  });

  it("handles overnight window (crosses midnight) - outside window (between end and start)", () => {
    const result = computeIsAvailableNow(true, "22:00", "02:00", new Date("2025-01-15T10:00:00"));
    expect(result).toBe(false);
  });

  it("handles edge case: exact start time of window", () => {
    const result = computeIsAvailableNow(true, "09:00", "18:00", new Date("2025-01-15T09:00:00"));
    expect(result).toBe(true);
  });

  it("handles edge case: one minute before end of window", () => {
    const result = computeIsAvailableNow(true, "09:00", "18:00", new Date("2025-01-15T17:59:00"));
    expect(result).toBe(true);
  });
});
