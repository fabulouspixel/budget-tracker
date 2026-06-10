import type { BudgetTrackerDatabase } from "./database";
import { db } from "./database";
import { normalizeOptionalText } from "../domain/entry";
import { createId, createTimestamp } from "../domain/period";
import type { Category } from "../domain/types";

export function normalizeCategoryName(name: string): string {
  const normalizedName = normalizeOptionalText(name);

  if (!normalizedName) {
    throw new Error("Category name is required.");
  }

  return normalizedName;
}

export async function getCategories(
  database: BudgetTrackerDatabase = db,
): Promise<Category[]> {
  const categories = await database.categories.toArray();
  return sortCategories(categories);
}

export async function getCategorySuggestions(
  database: BudgetTrackerDatabase = db,
): Promise<string[]> {
  const [managedCategories, entries] = await Promise.all([
    getCategories(database),
    database.entries.toArray(),
  ]);
  const suggestions = new Map<string, string>();

  for (const category of managedCategories) {
    suggestions.set(category.name.toLocaleLowerCase(), category.name);
  }

  for (const entry of entries) {
    const categoryName = normalizeOptionalText(entry.category);

    if (categoryName) {
      suggestions.set(categoryName.toLocaleLowerCase(), categoryName);
    }
  }

  return [...suggestions.values()].sort((left, right) => left.localeCompare(right));
}

export async function createCategory(
  name: string,
  database: BudgetTrackerDatabase = db,
): Promise<Category> {
  const normalizedName = normalizeCategoryName(name);
  await assertUniqueCategoryName(normalizedName, undefined, database);

  const timestamp = createTimestamp();
  const category: Category = {
    id: createId(),
    name: normalizedName,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await database.categories.add(category);

  return category;
}

export async function ensureCategoryByName(
  name: string,
  database: BudgetTrackerDatabase = db,
): Promise<Category | undefined> {
  const normalizedName = normalizeOptionalText(name);

  if (!normalizedName) {
    return undefined;
  }

  const existingCategory = await findCategoryByName(normalizedName, database);

  if (existingCategory) {
    return existingCategory;
  }

  return createCategory(normalizedName, database);
}

export async function renameCategory(
  categoryId: string,
  newName: string,
  database: BudgetTrackerDatabase = db,
): Promise<Category> {
  const normalizedName = normalizeCategoryName(newName);

  return database.transaction("rw", database.categories, database.entries, async () => {
    const category = await database.categories.get(categoryId);

    if (!category) {
      throw new Error("Category was not found.");
    }

    await assertUniqueCategoryName(normalizedName, categoryId, database);

    const oldName = category.name;
    const updatedCategory: Category = {
      ...category,
      name: normalizedName,
      updatedAt: createTimestamp(),
    };
    const affectedEntries = await database.entries
      .where("category")
      .equals(oldName)
      .toArray();

    await database.categories.put(updatedCategory);
    await Promise.all(
      affectedEntries.map((entry) =>
        database.entries.put({
          ...entry,
          category: normalizedName,
          updatedAt: createTimestamp(),
        }),
      ),
    );

    return updatedCategory;
  });
}

export async function deleteCategory(
  categoryId: string,
  database: BudgetTrackerDatabase = db,
): Promise<void> {
  await database.transaction("rw", database.categories, database.entries, async () => {
    const category = await database.categories.get(categoryId);

    if (!category) {
      return;
    }

    const affectedEntries = await database.entries
      .where("category")
      .equals(category.name)
      .toArray();

    await database.categories.delete(categoryId);
    await Promise.all(
      affectedEntries.map((entry) =>
        database.entries.put({
          ...entry,
          category: undefined,
          updatedAt: createTimestamp(),
        }),
      ),
    );
  });
}

async function assertUniqueCategoryName(
  name: string,
  ignoredCategoryId: string | undefined,
  database: BudgetTrackerDatabase,
): Promise<void> {
  const existingCategory = await findCategoryByName(name, database);

  if (existingCategory && existingCategory.id !== ignoredCategoryId) {
    throw new Error("Category already exists.");
  }
}

async function findCategoryByName(
  name: string,
  database: BudgetTrackerDatabase,
): Promise<Category | undefined> {
  const normalizedName = normalizeCategoryName(name);
  const categories = await database.categories.toArray();

  return categories.find(
    (category) =>
      category.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase(),
  );
}

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => left.name.localeCompare(right.name));
}

