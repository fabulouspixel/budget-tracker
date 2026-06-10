import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { BudgetTrackerDatabase } from "./database";
import {
  createEntry,
  deleteEntry,
  getCategoriesFromEntries,
  getEntriesForPeriod,
  updateEntry,
} from "./entryService";
import { createNewActivePeriod } from "./periodService";
import { calculateBalanceCents } from "../domain/balance";

let database: BudgetTrackerDatabase | undefined;

function createTestDatabase() {
  database = new BudgetTrackerDatabase(`budget-tracker-entry-test-${crypto.randomUUID()}`);
  return database;
}

afterEach(async () => {
  if (database) {
    await database.delete();
    database.close();
    database = undefined;
  }
});

describe("entry service", () => {
  it("creates income and expense entries for a period", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);

    await createEntry(
      { periodId: period.id, type: "income", amountCents: 5000 },
      testDatabase,
    );
    await createEntry(
      { periodId: period.id, type: "expense", amountCents: 1299 },
      testDatabase,
    );

    const entries = await getEntriesForPeriod(period.id, testDatabase);

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.type).sort()).toEqual(["expense", "income"]);
  });

  it("rejects zero, negative, and invalid amounts before persistence", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);

    await expect(
      createEntry(
        { periodId: period.id, type: "income", amountCents: 0 },
        testDatabase,
      ),
    ).rejects.toThrow("Entry amount must be greater than zero.");
    await expect(
      createEntry(
        { periodId: period.id, type: "income", amountCents: -1 },
        testDatabase,
      ),
    ).rejects.toThrow("Entry amount must be greater than zero.");
    await expect(
      createEntry(
        { periodId: period.id, type: "income", amountCents: 1.5 },
        testDatabase,
      ),
    ).rejects.toThrow("Entry amount must be greater than zero.");

    await expect(getEntriesForPeriod(period.id, testDatabase)).resolves.toHaveLength(0);
  });

  it("defaults a missing date to today", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);

    const entry = await createEntry(
      { periodId: period.id, type: "income", amountCents: 500 },
      testDatabase,
    );

    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("updates editable fields and preserves createdAt", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);
    const entry = await createEntry(
      {
        periodId: period.id,
        type: "income",
        amountCents: 500,
        title: "Old",
        date: "2026-06-01",
      },
      testDatabase,
    );

    const updatedEntry = await updateEntry(
      entry.id,
      {
        type: "expense",
        amountCents: 250,
        title: "New",
        date: "2026-06-02",
        category: "Food",
      },
      testDatabase,
    );

    expect(updatedEntry).toMatchObject({
      id: entry.id,
      type: "expense",
      amountCents: 250,
      title: "New",
      date: "2026-06-02",
      category: "Food",
      createdAt: entry.createdAt,
    });
    expect(updatedEntry.updatedAt).toEqual(expect.any(String));
  });

  it("deletes entries", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);
    const entry = await createEntry(
      { periodId: period.id, type: "income", amountCents: 500 },
      testDatabase,
    );

    await deleteEntry(entry.id, testDatabase);

    await expect(getEntriesForPeriod(period.id, testDatabase)).resolves.toHaveLength(0);
  });

  it("derives unique sorted categories from entries", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);

    await createEntry(
      { periodId: period.id, type: "expense", amountCents: 500, category: "Food" },
      testDatabase,
    );
    await createEntry(
      { periodId: period.id, type: "expense", amountCents: 600, category: "Rent" },
      testDatabase,
    );
    await createEntry(
      { periodId: period.id, type: "income", amountCents: 700, category: " Food " },
      testDatabase,
    );

    await expect(getCategoriesFromEntries(testDatabase)).resolves.toEqual([
      "Food",
      "Rent",
    ]);
  });

  it("saves new entry categories as managed suggestions", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);

    await createEntry(
      {
        periodId: period.id,
        type: "expense",
        amountCents: 500,
        category: "Utilities",
      },
      testDatabase,
    );

    await expect(getCategoriesFromEntries(testDatabase)).resolves.toEqual([
      "Utilities",
    ]);
  });

  it("sorts entries newest first by date and createdAt", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);

    const oldEntry = await createEntry(
      {
        periodId: period.id,
        type: "expense",
        amountCents: 100,
        title: "Old",
        date: "2026-06-01",
      },
      testDatabase,
    );
    const newEntry = await createEntry(
      {
        periodId: period.id,
        type: "income",
        amountCents: 200,
        title: "New",
        date: "2026-06-02",
      },
      testDatabase,
    );

    const entries = await getEntriesForPeriod(period.id, testDatabase);

    expect(entries.map((entry) => entry.id)).toEqual([newEntry.id, oldEntry.id]);
  });

  it("supports balance calculations from persisted entries", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod(
      { title: "Active", startingBudgetCents: -1000 },
      testDatabase,
    );

    await createEntry(
      { periodId: period.id, type: "income", amountCents: 5000 },
      testDatabase,
    );
    await createEntry(
      { periodId: period.id, type: "expense", amountCents: 6000 },
      testDatabase,
    );

    const entries = await getEntriesForPeriod(period.id, testDatabase);

    expect(calculateBalanceCents(period.startingBudgetCents, entries)).toBe(-2000);
  });

  it("supports archived final balance calculations from persisted entries", async () => {
    const testDatabase = createTestDatabase();
    const archivedPeriod = await createNewActivePeriod(
      { title: "Archived", startingBudgetCents: 10000 },
      testDatabase,
    );

    await createEntry(
      { periodId: archivedPeriod.id, type: "income", amountCents: 5000 },
      testDatabase,
    );
    await createEntry(
      { periodId: archivedPeriod.id, type: "expense", amountCents: 3000 },
      testDatabase,
    );
    await createNewActivePeriod({ title: "Current" }, testDatabase);

    const entries = await getEntriesForPeriod(archivedPeriod.id, testDatabase);

    expect(calculateBalanceCents(archivedPeriod.startingBudgetCents, entries)).toBe(
      12000,
    );
  });
});
