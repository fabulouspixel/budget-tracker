import type { BudgetTrackerDatabase } from "./database";
import { db } from "./database";
import { createId, createTimestamp, normalizePeriodTitle } from "../domain/period";
import type { Period } from "../domain/types";

export interface CreatePeriodInput {
  title: string;
  startingBudgetCents?: number;
}

export async function getActivePeriod(
  database: BudgetTrackerDatabase = db,
): Promise<Period | undefined> {
  return database.periods.where("status").equals("active").first();
}

export async function getPeriodById(
  periodId: string,
  database: BudgetTrackerDatabase = db,
): Promise<Period | undefined> {
  return database.periods.get(periodId);
}

export async function getArchivedPeriods(
  database: BudgetTrackerDatabase = db,
): Promise<Period[]> {
  const archivedPeriods = await database.periods
    .where("status")
    .equals("archived")
    .toArray();

  return archivedPeriods.sort((left, right) =>
    (right.archivedAt ?? "").localeCompare(left.archivedAt ?? ""),
  );
}

export async function deleteArchivedPeriod(
  periodId: string,
  database: BudgetTrackerDatabase = db,
): Promise<boolean> {
  return database.transaction("rw", database.periods, database.entries, async () => {
    const period = await database.periods.get(periodId);

    if (!period) {
      return false;
    }

    if (period.status !== "archived") {
      throw new Error("Only archived periods can be deleted.");
    }

    await database.entries.where("periodId").equals(periodId).delete();
    await database.periods.delete(periodId);

    return true;
  });
}

export async function createPeriod(
  input: CreatePeriodInput,
  database: BudgetTrackerDatabase = db,
): Promise<Period> {
  const period: Period = {
    id: createId(),
    title: normalizePeriodTitle(input.title),
    startingBudgetCents: input.startingBudgetCents,
    status: "active",
    createdAt: createTimestamp(),
  };

  await database.periods.add(period);

  return period;
}

export async function archiveActivePeriod(
  database: BudgetTrackerDatabase = db,
): Promise<Period | undefined> {
  const activePeriod = await getActivePeriod(database);

  if (!activePeriod) {
    return undefined;
  }

  const archivedPeriod: Period = {
    ...activePeriod,
    status: "archived",
    archivedAt: createTimestamp(),
  };

  await database.periods.put(archivedPeriod);

  return archivedPeriod;
}

export async function createNewActivePeriod(
  input: CreatePeriodInput,
  database: BudgetTrackerDatabase = db,
): Promise<Period> {
  normalizePeriodTitle(input.title);

  return database.transaction("rw", database.periods, async () => {
    const activePeriod = await getActivePeriod(database);

    if (activePeriod) {
      await database.periods.put({
        ...activePeriod,
        status: "archived",
        archivedAt: createTimestamp(),
      });
    }

    return createPeriod(input, database);
  });
}
