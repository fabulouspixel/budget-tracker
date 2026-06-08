export const EXPORT_FORMAT_VERSION = 1;

export type PeriodStatus = "active" | "archived";

export type EntryType = "income" | "expense";

export type ISODate = string;

export type Timestamp = string;

export interface Period {
  id: string;
  title: string;
  startingBudgetCents?: number;
  status: PeriodStatus;
  createdAt: Timestamp;
  archivedAt?: Timestamp;
}

export interface Entry {
  id: string;
  periodId: string;
  type: EntryType;
  amountCents: number;
  title?: string;
  date: ISODate;
  category?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BudgetTrackerExport {
  version: typeof EXPORT_FORMAT_VERSION;
  periods: Period[];
  entries: Entry[];
  categories: string[];
}
