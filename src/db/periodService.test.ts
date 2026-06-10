import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { BudgetTrackerDatabase } from "./database";
import { createEntry, getEntriesForPeriod } from "./entryService";
import {
  archiveActivePeriod,
  createNewActivePeriod,
  createPeriod,
  deleteArchivedPeriod,
  getActivePeriod,
  getArchivedPeriods,
} from "./periodService";

let database: BudgetTrackerDatabase | undefined;

function createTestDatabase() {
  database = new BudgetTrackerDatabase(`budget-tracker-test-${crypto.randomUUID()}`);
  return database;
}

afterEach(async () => {
  if (database) {
    await database.delete();
    database.close();
    database = undefined;
  }
});

describe("period service", () => {
  it("creates the first active period when none exists", async () => {
    const testDatabase = createTestDatabase();

    const period = await createNewActivePeriod(
      { title: "June Budget" },
      testDatabase,
    );

    await expect(getActivePeriod(testDatabase)).resolves.toEqual(period);
    expect(period.status).toBe("active");
    expect(period.title).toBe("June Budget");
  });

  it("rejects empty period titles", async () => {
    const testDatabase = createTestDatabase();

    await expect(
      createNewActivePeriod({ title: "   " }, testDatabase),
    ).rejects.toThrow("Period title is required.");
  });

  it("creates periods with omitted, zero, positive, and negative starting budgets", async () => {
    const testDatabase = createTestDatabase();

    await expect(
      createPeriod({ title: "Omitted" }, testDatabase),
    ).resolves.toMatchObject({ startingBudgetCents: undefined });
    await expect(
      createPeriod({ title: "Zero", startingBudgetCents: 0 }, testDatabase),
    ).resolves.toMatchObject({ startingBudgetCents: 0 });
    await expect(
      createPeriod({ title: "Positive", startingBudgetCents: 10000 }, testDatabase),
    ).resolves.toMatchObject({ startingBudgetCents: 10000 });
    await expect(
      createPeriod({ title: "Negative", startingBudgetCents: -5000 }, testDatabase),
    ).resolves.toMatchObject({ startingBudgetCents: -5000 });
  });

  it("archives the existing active period before creating a new one", async () => {
    const testDatabase = createTestDatabase();

    const firstPeriod = await createNewActivePeriod(
      { title: "First" },
      testDatabase,
    );
    const secondPeriod = await createNewActivePeriod(
      { title: "Second" },
      testDatabase,
    );

    const archivedPeriods = await getArchivedPeriods(testDatabase);

    expect(secondPeriod.status).toBe("active");
    expect(archivedPeriods).toHaveLength(1);
    expect(archivedPeriods[0]).toMatchObject({
      id: firstPeriod.id,
      status: "archived",
    });
    expect(archivedPeriods[0].archivedAt).toEqual(expect.any(String));
  });

  it("sets archivedAt when archiving the active period", async () => {
    const testDatabase = createTestDatabase();

    await createNewActivePeriod({ title: "Active" }, testDatabase);
    const archivedPeriod = await archiveActivePeriod(testDatabase);

    expect(archivedPeriod?.status).toBe("archived");
    expect(archivedPeriod?.archivedAt).toEqual(expect.any(String));
  });

  it("keeps exactly one active period after replacement", async () => {
    const testDatabase = createTestDatabase();

    await createNewActivePeriod({ title: "First" }, testDatabase);
    await createNewActivePeriod({ title: "Second" }, testDatabase);
    await createNewActivePeriod({ title: "Third" }, testDatabase);

    const activePeriods = await testDatabase.periods
      .where("status")
      .equals("active")
      .toArray();

    expect(activePeriods).toHaveLength(1);
    expect(activePeriods[0].title).toBe("Third");
  });

  it("deletes archived periods and their entries", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Archived" }, testDatabase);
    await createEntry(
      {
        periodId: period.id,
        type: "income",
        amountCents: 1200,
      },
      testDatabase,
    );
    const archivedPeriod = await archiveActivePeriod(testDatabase);

    await expect(
      deleteArchivedPeriod(archivedPeriod?.id ?? "", testDatabase),
    ).resolves.toBe(true);

    await expect(getArchivedPeriods(testDatabase)).resolves.toEqual([]);
    await expect(getEntriesForPeriod(period.id, testDatabase)).resolves.toEqual([]);
  });

  it("does not delete active periods", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);

    await expect(deleteArchivedPeriod(period.id, testDatabase)).rejects.toThrow(
      "Only archived periods can be deleted.",
    );
    await expect(getActivePeriod(testDatabase)).resolves.toMatchObject({
      id: period.id,
    });
  });
});
