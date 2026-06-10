import { describe, expect, it, vi } from "vitest";
import {
  createId,
  normalizePeriodTitle,
  parseOptionalStartingBudget,
  shouldCreateNewPeriod,
} from "./period";

describe("period helpers", () => {
  it("normalizes and validates period titles", () => {
    expect(normalizePeriodTitle("  June Budget  ")).toBe("June Budget");
    expect(() => normalizePeriodTitle("   ")).toThrow("Period title is required.");
  });

  it("parses optional starting budgets", () => {
    expect(parseOptionalStartingBudget("")).toBeUndefined();
    expect(parseOptionalStartingBudget("0")).toBe(0);
    expect(parseOptionalStartingBudget("100,50")).toBe(10050);
    expect(parseOptionalStartingBudget("-25")).toBe(-2500);
  });

  it("does not replace an active period when confirmation is cancelled", () => {
    const confirmReplacement = vi.fn(() => false);

    expect(shouldCreateNewPeriod(true, confirmReplacement)).toBe(false);
    expect(confirmReplacement).toHaveBeenCalledOnce();
  });

  it("creates an id without requiring crypto.randomUUID", () => {
    expect(createId()).toMatch(/.+/);
  });
});
