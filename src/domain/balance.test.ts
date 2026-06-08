import { describe, expect, it } from "vitest";
import { calculateBalanceCents } from "./balance";

describe("balance helpers", () => {
  it("calculates balance from starting budget, income, and expenses", () => {
    expect(
      calculateBalanceCents(10000, [
        { type: "income", amountCents: 5000 },
        { type: "expense", amountCents: 20000 },
      ]),
    ).toBe(-5000);
  });

  it("supports negative starting budgets", () => {
    expect(
      calculateBalanceCents(-2500, [
        { type: "income", amountCents: 1000 },
        { type: "expense", amountCents: 500 },
      ]),
    ).toBe(-2000);
  });

  it("returns the starting budget when no entries exist", () => {
    expect(calculateBalanceCents(4200, [])).toBe(4200);
    expect(calculateBalanceCents(undefined, [])).toBe(0);
  });
});

