import type { BudgetTrackerDatabase } from "./database";
import { ensureCategoryByName, getCategorySuggestions } from "./categoryService";
import { db } from "./database";
import {
  normalizeEntryDate,
  normalizeOptionalText,
  validateEntryAmountCents,
  validateEntryType,
} from "../domain/entry";
import { createId, createTimestamp } from "../domain/period";
import type { Entry, EntryType, ISODate } from "../domain/types";

export interface CreateEntryInput {
  periodId: string;
  type: EntryType;
  amountCents: number;
  title?: string;
  date?: string;
  category?: string;
}

export interface UpdateEntryInput {
  type: EntryType;
  amountCents: number;
  title?: string;
  date?: string;
  category?: string;
}

export async function getEntriesForPeriod(
  periodId: string,
  database: BudgetTrackerDatabase = db,
): Promise<Entry[]> {
  const entries = await database.entries.where("periodId").equals(periodId).toArray();
  return sortEntriesNewestFirst(entries);
}

export async function createEntry(
  input: CreateEntryInput,
  database: BudgetTrackerDatabase = db,
): Promise<Entry> {
  const timestamp = createTimestamp();
  const category = normalizeOptionalText(input.category);

  if (category) {
    await ensureCategoryByName(category, database);
  }

  const entry: Entry = {
    id: createId(),
    periodId: input.periodId,
    type: validateEntryType(input.type),
    amountCents: validateEntryAmountCents(input.amountCents),
    title: normalizeOptionalText(input.title),
    date: normalizeEntryDate(input.date),
    category,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await database.entries.add(entry);

  return entry;
}

export async function updateEntry(
  entryId: string,
  input: UpdateEntryInput,
  database: BudgetTrackerDatabase = db,
): Promise<Entry> {
  const existingEntry = await database.entries.get(entryId);

  if (!existingEntry) {
    throw new Error("Entry was not found.");
  }

  const category = normalizeOptionalText(input.category);

  if (category) {
    await ensureCategoryByName(category, database);
  }

  const updatedEntry: Entry = {
    ...existingEntry,
    type: validateEntryType(input.type),
    amountCents: validateEntryAmountCents(input.amountCents),
    title: normalizeOptionalText(input.title),
    date: normalizeEntryDate(input.date),
    category,
    updatedAt: createTimestamp(),
  };

  await database.entries.put(updatedEntry);

  return updatedEntry;
}

export async function deleteEntry(
  entryId: string,
  database: BudgetTrackerDatabase = db,
): Promise<void> {
  await database.entries.delete(entryId);
}

export async function getCategoriesFromEntries(
  database: BudgetTrackerDatabase = db,
): Promise<string[]> {
  return getCategorySuggestions(database);
}

export function sortEntriesNewestFirst(entries: Entry[]): Entry[] {
  return [...entries].sort((left, right) => {
    const dateComparison = right.date.localeCompare(left.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function getEntryDateForInput(entry: Pick<Entry, "date">): ISODate {
  return entry.date;
}
