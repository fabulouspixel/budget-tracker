import { parseEuroInput } from "./money";

export function createId(): string {
  return crypto.randomUUID();
}

export function createTimestamp(): string {
  return new Date().toISOString();
}

export function normalizePeriodTitle(title: string): string {
  const normalizedTitle = title.trim();

  if (normalizedTitle.length === 0) {
    throw new Error("Period title is required.");
  }

  return normalizedTitle;
}

export function parseOptionalStartingBudget(value: string): number | undefined {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return undefined;
  }

  return parseEuroInput(trimmedValue, { allowNegative: true });
}

export function shouldCreateNewPeriod(
  hasActivePeriod: boolean,
  confirmReplacement: () => boolean,
): boolean {
  return !hasActivePeriod || confirmReplacement();
}

