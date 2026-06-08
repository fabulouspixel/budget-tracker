import { parsePositiveEntryAmount } from "./money";
import type { EntryType, ISODate } from "./types";

export function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

export function createLocalDate(): ISODate {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeEntryDate(date: string | undefined): ISODate {
  const normalizedDate = date?.trim();

  if (!normalizedDate) {
    return createLocalDate();
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    throw new Error("Entry date must use YYYY-MM-DD format.");
  }

  return normalizedDate as ISODate;
}

export function validateEntryType(type: EntryType): EntryType {
  if (type !== "income" && type !== "expense") {
    throw new Error("Entry type is invalid.");
  }

  return type;
}

export function parseEntryAmount(value: string): number {
  return parsePositiveEntryAmount(value);
}

export function validateEntryAmountCents(amountCents: number): number {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Entry amount must be greater than zero.");
  }

  return amountCents;
}

