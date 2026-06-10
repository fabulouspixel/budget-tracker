import type { BudgetTrackerDatabase } from "./database";
import { db } from "./database";
import {
  EXPORT_FORMAT_VERSION,
  type BudgetTrackerExport,
  type Category,
  type Entry,
  type EntryType,
  type Period,
  type PeriodStatus,
} from "../domain/types";

export const BACKUP_FILE_NAME = "budget-tracker-backup.json";

export async function createBackup(
  database: BudgetTrackerDatabase = db,
): Promise<BudgetTrackerExport> {
  const [periods, entries, categories] = await Promise.all([
    database.periods.toArray(),
    database.entries.toArray(),
    database.categories.toArray(),
  ]);

  return {
    version: EXPORT_FORMAT_VERSION,
    periods,
    entries,
    categories,
  };
}

export function serializeBackup(backup: BudgetTrackerExport): string {
  return JSON.stringify(backup, null, 2);
}

export function parseBackupJson(json: string): BudgetTrackerExport {
  let parsedBackup: unknown;

  try {
    parsedBackup = JSON.parse(json);
  } catch {
    throw new Error("Backup file is not valid JSON.");
  }

  return validateBackup(parsedBackup);
}

export async function replaceDataFromBackup(
  backup: BudgetTrackerExport,
  database: BudgetTrackerDatabase = db,
): Promise<void> {
  const validatedBackup = validateBackup(backup);

  await database.transaction(
    "rw",
    database.periods,
    database.entries,
    database.categories,
    async () => {
      await database.entries.clear();
      await database.periods.clear();
      await database.categories.clear();
      await database.periods.bulkAdd(validatedBackup.periods);
      await database.entries.bulkAdd(validatedBackup.entries);
      await database.categories.bulkAdd(validatedBackup.categories);
    },
  );
}

export async function deleteAllLocalData(
  database: BudgetTrackerDatabase = db,
): Promise<void> {
  await database.transaction(
    "rw",
    database.periods,
    database.entries,
    database.categories,
    async () => {
      await database.entries.clear();
      await database.periods.clear();
      await database.categories.clear();
    },
  );
}

export function validateBackup(value: unknown): BudgetTrackerExport {
  if (!isRecord(value)) {
    throw new Error("Backup must be a JSON object.");
  }

  if (value.version !== EXPORT_FORMAT_VERSION) {
    throw new Error("Backup version is not supported.");
  }

  if (!Array.isArray(value.periods) || !Array.isArray(value.entries)) {
    throw new Error("Backup must contain periods and entries arrays.");
  }

  const periods = value.periods.map(validatePeriod);
  const entries = value.entries.map(validateEntry);
  const categories = Array.isArray(value.categories)
    ? value.categories.map(validateCategory)
    : [];
  const periodIds = new Set(periods.map((period) => period.id));
  const activePeriodCount = periods.filter(
    (period) => period.status === "active",
  ).length;

  if (activePeriodCount > 1) {
    throw new Error("Backup must not contain more than one active period.");
  }

  for (const entry of entries) {
    if (!periodIds.has(entry.periodId)) {
      throw new Error("Backup contains entries for missing periods.");
    }
  }

  return {
    version: EXPORT_FORMAT_VERSION,
    periods,
    entries,
    categories,
  };
}

function validatePeriod(value: unknown): Period {
  if (!isRecord(value)) {
    throw new Error("Backup contains an invalid period.");
  }

  const status = value.status;

  if (status !== "active" && status !== "archived") {
    throw new Error("Backup contains an invalid period status.");
  }

  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.createdAt !== "string" ||
    !isOptionalNumber(value.startingBudgetCents) ||
    !isOptionalString(value.archivedAt)
  ) {
    throw new Error("Backup contains an invalid period.");
  }

  return {
    id: value.id,
    title: value.title,
    startingBudgetCents: value.startingBudgetCents,
    status: status satisfies PeriodStatus,
    createdAt: value.createdAt,
    archivedAt: value.archivedAt,
  };
}

function validateEntry(value: unknown): Entry {
  if (!isRecord(value)) {
    throw new Error("Backup contains an invalid entry.");
  }

  const type = value.type;
  const amountCents = value.amountCents;

  if (type !== "income" && type !== "expense") {
    throw new Error("Backup contains an invalid entry type.");
  }

  if (
    typeof value.id !== "string" ||
    typeof value.periodId !== "string" ||
    typeof amountCents !== "number" ||
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    typeof value.date !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    !isOptionalString(value.title) ||
    !isOptionalString(value.category)
  ) {
    throw new Error("Backup contains an invalid entry.");
  }

  return {
    id: value.id,
    periodId: value.periodId,
    type: type satisfies EntryType,
    amountCents,
    title: value.title,
    date: value.date,
    category: value.category,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function validateCategory(value: unknown): Category {
  if (typeof value === "string") {
    const timestamp = new Date().toISOString();

    return {
      id: `legacy-category-${value.toLocaleLowerCase()}`,
      name: value,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  if (!isRecord(value)) {
    throw new Error("Backup contains an invalid category.");
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    throw new Error("Backup contains an invalid category.");
  }

  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || Number.isSafeInteger(value);
}
