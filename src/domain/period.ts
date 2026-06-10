import { parseEuroInput } from "./money";

export function createId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));

    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
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
