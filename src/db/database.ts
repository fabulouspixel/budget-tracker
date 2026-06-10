import Dexie, { type EntityTable } from "dexie";
import type { Category, Entry, Period } from "../domain/types";

export class BudgetTrackerDatabase extends Dexie {
  periods!: EntityTable<Period, "id">;
  entries!: EntityTable<Entry, "id">;
  categories!: EntityTable<Category, "id">;

  constructor(databaseName = "budget-tracker") {
    super(databaseName);

    this.version(1).stores({
      periods: "id, status, createdAt, archivedAt",
      entries: "id, periodId, type, date, createdAt, updatedAt, category",
    });

    this.version(2).stores({
      periods: "id, status, createdAt, archivedAt",
      entries: "id, periodId, type, date, createdAt, updatedAt, category",
      categories: "id, &name, createdAt, updatedAt",
    });
  }
}

export const db = new BudgetTrackerDatabase();
