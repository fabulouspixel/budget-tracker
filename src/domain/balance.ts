import type { Entry } from "./types";

export function calculateBalanceCents(
  startingBudgetCents: number | undefined,
  entries: Pick<Entry, "type" | "amountCents">[],
): number {
  return entries.reduce((balance, entry) => {
    if (entry.type === "income") {
      return balance + entry.amountCents;
    }

    return balance - entry.amountCents;
  }, startingBudgetCents ?? 0);
}

