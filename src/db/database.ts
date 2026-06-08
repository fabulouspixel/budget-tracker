import Dexie, { type EntityTable } from "dexie";
import type { Entry, Period } from "../domain/types";

export class BudgetTrackerDatabase extends Dexie {
  periods!: EntityTable<Period, "id">;
  entries!: EntityTable<Entry, "id">;

  constructor(databaseName = "budget-tracker") {
    super(databaseName);

    this.version(1).stores({
      periods: "id, status, createdAt, archivedAt",
      entries: "id, periodId, type, date, createdAt, updatedAt, category",
    });
  }
}

export const db = new BudgetTrackerDatabase();
