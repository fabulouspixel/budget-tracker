import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createCategory,
  deleteCategory,
  ensureCategoryByName,
  getCategories,
  renameCategory,
} from "./categoryService";
import { BudgetTrackerDatabase } from "./database";
import { createEntry, getEntriesForPeriod } from "./entryService";
import { createNewActivePeriod } from "./periodService";

let database: BudgetTrackerDatabase | undefined;

function createTestDatabase() {
  database = new BudgetTrackerDatabase(`budget-tracker-category-test-${crypto.randomUUID()}`);
  return database;
}

afterEach(async () => {
  if (database) {
    await database.delete();
    database.close();
    database = undefined;
  }
});

describe("category service", () => {
  it("creates categories", async () => {
    const testDatabase = createTestDatabase();

    await expect(createCategory(" Food ", testDatabase)).resolves.toMatchObject({
      name: "Food",
    });
  });

  it("rejects empty and duplicate category names case-insensitively", async () => {
    const testDatabase = createTestDatabase();
    await createCategory("Food", testDatabase);

    await expect(createCategory(" ", testDatabase)).rejects.toThrow(
      "Category name is required.",
    );
    await expect(createCategory("food", testDatabase)).rejects.toThrow(
      "Category already exists.",
    );
  });

  it("lists categories alphabetically", async () => {
    const testDatabase = createTestDatabase();
    await createCategory("Rent", testDatabase);
    await createCategory("Food", testDatabase);

    await expect(getCategories(testDatabase)).resolves.toMatchObject([
      { name: "Food" },
      { name: "Rent" },
    ]);
  });

  it("renames categories and updates matching entries", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);
    const category = await createCategory("Food", testDatabase);
    await createEntry(
      {
        periodId: period.id,
        type: "expense",
        amountCents: 1000,
        category: "Food",
      },
      testDatabase,
    );

    await renameCategory(category.id, "Groceries", testDatabase);

    await expect(getCategories(testDatabase)).resolves.toMatchObject([
      { name: "Groceries" },
    ]);
    await expect(getEntriesForPeriod(period.id, testDatabase)).resolves.toMatchObject([
      { category: "Groceries" },
    ]);
  });

  it("deletes categories and clears matching entry categories", async () => {
    const testDatabase = createTestDatabase();
    const period = await createNewActivePeriod({ title: "Active" }, testDatabase);
    const category = await createCategory("Food", testDatabase);
    await createEntry(
      {
        periodId: period.id,
        type: "expense",
        amountCents: 1000,
        category: "Food",
      },
      testDatabase,
    );

    await deleteCategory(category.id, testDatabase);

    await expect(getCategories(testDatabase)).resolves.toEqual([]);
    await expect(getEntriesForPeriod(period.id, testDatabase)).resolves.toMatchObject([
      { category: undefined },
    ]);
  });

  it("reuses existing categories when ensuring by name", async () => {
    const testDatabase = createTestDatabase();
    const category = await ensureCategoryByName("Food", testDatabase);

    await expect(ensureCategoryByName("food", testDatabase)).resolves.toMatchObject({
      id: category?.id,
    });
    await expect(getCategories(testDatabase)).resolves.toHaveLength(1);
  });
});

