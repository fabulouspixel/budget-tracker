import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createBackup,
  deleteAllLocalData,
  parseBackupJson,
  replaceDataFromBackup,
} from "./backupService";
import { createCategory, getCategories } from "./categoryService";
import { BudgetTrackerDatabase } from "./database";
import { createEntry, getEntriesForPeriod } from "./entryService";
import {
  createNewActivePeriod,
  getActivePeriod,
  getPeriodById,
} from "./periodService";
import { EXPORT_FORMAT_VERSION, type BudgetTrackerExport } from "../domain/types";

let database: BudgetTrackerDatabase | undefined;

function createTestDatabase() {
  database = new BudgetTrackerDatabase(`budget-tracker-backup-test-${crypto.randomUUID()}`);
  return database;
}

afterEach(async () => {
  if (database) {
    await database.delete();
    database.close();
    database = undefined;
  }
});

describe("backup service", () => {
  it("exports all periods and entries with version and derived categories", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);
    await createCategory("Food", testDatabase);
    await createEntry(
      {
        periodId: period.id,
        type: "expense",
        amountCents: 1200,
        category: "Food",
      },
      testDatabase,
    );

    const backup = await createBackup(testDatabase);

    expect(backup.version).toBe(EXPORT_FORMAT_VERSION);
    expect(backup.periods).toHaveLength(1);
    expect(backup.entries).toHaveLength(1);
    expect(backup.categories).toMatchObject([{ name: "Food" }]);
  });

  it("rejects invalid backup shapes", () => {
    expect(() => parseBackupJson("[]")).toThrow("Backup must be a JSON object.");
    expect(() => parseBackupJson("{")).toThrow("Backup file is not valid JSON.");
    expect(() =>
      parseBackupJson(JSON.stringify({ version: 999, periods: [], entries: [] })),
    ).toThrow("Backup version is not supported.");
    expect(() =>
      parseBackupJson(JSON.stringify({ version: 1, periods: {}, entries: [] })),
    ).toThrow("Backup must contain periods and entries arrays.");
  });

  it("rejects entries referencing missing periods", () => {
    const backup: BudgetTrackerExport = {
      version: 1,
      periods: [],
      entries: [
        {
          id: "entry-1",
          periodId: "missing",
          type: "income",
          amountCents: 100,
          date: "2026-06-08",
          createdAt: "2026-06-08T00:00:00.000Z",
          updatedAt: "2026-06-08T00:00:00.000Z",
        },
      ],
      categories: [],
    };

    expect(() => parseBackupJson(JSON.stringify(backup))).toThrow(
      "Backup contains entries for missing periods.",
    );
  });

  it("rejects more than one active period", () => {
    const backup: BudgetTrackerExport = {
      version: 1,
      periods: [
        {
          id: "period-1",
          title: "One",
          status: "active",
          createdAt: "2026-06-08T00:00:00.000Z",
        },
        {
          id: "period-2",
          title: "Two",
          status: "active",
          createdAt: "2026-06-08T00:00:00.000Z",
        },
      ],
      entries: [],
      categories: [],
    };

    expect(() => parseBackupJson(JSON.stringify(backup))).toThrow(
      "Backup must not contain more than one active period.",
    );
  });

  it("replaces existing data on valid import", async () => {
    const testDatabase = createTestDatabase();
    await createNewActivePeriod({ title: "Existing" }, testDatabase);

    const backup: BudgetTrackerExport = {
      version: 1,
      periods: [
        {
          id: "period-imported",
          title: "Imported",
          status: "active",
          createdAt: "2026-06-08T00:00:00.000Z",
        },
      ],
      entries: [
        {
          id: "entry-imported",
          periodId: "period-imported",
          type: "income",
          amountCents: 5000,
          date: "2026-06-08",
          createdAt: "2026-06-08T00:00:00.000Z",
          updatedAt: "2026-06-08T00:00:00.000Z",
        },
      ],
      categories: [],
    };

    await replaceDataFromBackup(backup, testDatabase);

    await expect(getActivePeriod(testDatabase)).resolves.toMatchObject({
      id: "period-imported",
    });
    await expect(getEntriesForPeriod("period-imported", testDatabase)).resolves.toHaveLength(
      1,
    );
    await expect(getPeriodById("period-imported", testDatabase)).resolves.toMatchObject({
      title: "Imported",
    });
  });

  it("allows importing empty arrays", async () => {
    const testDatabase = createTestDatabase();
    await createNewActivePeriod({ title: "Existing" }, testDatabase);

    await replaceDataFromBackup(
      { version: 1, periods: [], entries: [], categories: [] },
      testDatabase,
    );

    await expect(getActivePeriod(testDatabase)).resolves.toBeUndefined();
    await expect(createBackup(testDatabase)).resolves.toMatchObject({
      periods: [],
      entries: [],
    });
  });

  it("imports category records", async () => {
    const testDatabase = createTestDatabase();
    const backup: BudgetTrackerExport = {
      version: 1,
      periods: [],
      entries: [],
      categories: [
        {
          id: "category-imported",
          name: "Imported",
          createdAt: "2026-06-08T00:00:00.000Z",
          updatedAt: "2026-06-08T00:00:00.000Z",
        },
      ],
    };

    await replaceDataFromBackup(backup, testDatabase);

    await expect(getCategories(testDatabase)).resolves.toMatchObject([
      { id: "category-imported", name: "Imported" },
    ]);
  });

  it("imports legacy string categories", async () => {
    const testDatabase = createTestDatabase();
    const backup = parseBackupJson(
      JSON.stringify({
        version: 1,
        periods: [],
        entries: [],
        categories: ["Food"],
      }),
    );

    await replaceDataFromBackup(backup, testDatabase);

    await expect(getCategories(testDatabase)).resolves.toMatchObject([
      { name: "Food" },
    ]);
  });

  it("deletes all local periods, entries, and categories", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);
    await createCategory("Food", testDatabase);
    await createEntry(
      {
        periodId: period.id,
        type: "income",
        amountCents: 1000,
        category: "Food",
      },
      testDatabase,
    );

    await deleteAllLocalData(testDatabase);

    await expect(createBackup(testDatabase)).resolves.toMatchObject({
      periods: [],
      entries: [],
      categories: [],
    });
    await expect(getActivePeriod(testDatabase)).resolves.toBeUndefined();
    await expect(getCategories(testDatabase)).resolves.toEqual([]);
  });
});
