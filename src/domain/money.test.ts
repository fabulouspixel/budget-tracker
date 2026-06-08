import { describe, expect, it } from "vitest";
import { formatCents, parseEuroInput, parsePositiveEntryAmount } from "./money";

describe("money helpers", () => {
  it("formats cent values as German Euro currency", () => {
    expect(formatCents(1250)).toBe("12,50 €");
    expect(formatCents(-5000)).toBe("-50,00 €");
  });

  it("parses valid Euro input into cents", () => {
    expect(parseEuroInput("12,50")).toBe(1250);
    expect(parseEuroInput("12.50")).toBe(1250);
    expect(parseEuroInput("100 €")).toBe(10000);
  });

  it("allows negative values only when explicitly enabled", () => {
    expect(parseEuroInput("-50", { allowNegative: true })).toBe(-5000);
    expect(() => parseEuroInput("-50")).toThrow("Amount must not be negative.");
  });

  it("rejects invalid or non-positive entry amounts", () => {
    expect(() => parsePositiveEntryAmount("-12,50")).toThrow();
    expect(() => parsePositiveEntryAmount("0")).toThrow(
      "Entry amount must be greater than zero.",
    );
    expect(() => parsePositiveEntryAmount("abc")).toThrow();
  });
});

