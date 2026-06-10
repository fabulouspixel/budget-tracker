import { formatCents } from "../domain/money";
import type { Entry } from "../domain/types";
import { formatDate } from "../utils/format";

interface EditableEntryListProps {
  entries: Entry[];
  onDelete: (entry: Entry) => Promise<void>;
  onEdit: (entry: Entry) => void;
  periodCreatedAt?: string;
  startingBudgetCents?: number;
}

export function EditableEntryList({
  entries,
  onDelete,
  onEdit,
  periodCreatedAt,
  startingBudgetCents,
}: EditableEntryListProps) {
  const hasStartingBudget = startingBudgetCents !== undefined;

  if (entries.length === 0 && !hasStartingBudget) {
    return <p className="muted">No entries yet. Add income or an expense to start.</p>;
  }

  return (
    <div className="entry-list">
      {hasStartingBudget ? (
        <StartingBudgetEntry
          createdAt={periodCreatedAt}
          startingBudgetCents={startingBudgetCents}
        />
      ) : null}
      {entries.map((entry) => (
        <article className="entry-list-item" key={entry.id}>
          <EntrySummary entry={entry} />
          <div className="entry-actions">
            <button
              aria-label="Delete entry"
              className="icon-action danger-icon-action"
              type="button"
              onClick={() => void onDelete(entry)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M5 7h14" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M6 7l1 14h10l1-14" />
                <path d="M9 7V4h6v3" />
              </svg>
            </button>
            <button
              aria-label="Edit entry"
              className="icon-action"
              type="button"
              onClick={() => onEdit(entry)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 20h4l11-11-4-4L4 16v4Z" />
                <path d="m14 6 4 4" />
              </svg>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

interface ReadOnlyEntryListProps {
  entries: Entry[];
  periodCreatedAt?: string;
  startingBudgetCents?: number;
}

export function ReadOnlyEntryList({
  entries,
  periodCreatedAt,
  startingBudgetCents,
}: ReadOnlyEntryListProps) {
  const hasStartingBudget = startingBudgetCents !== undefined;

  if (entries.length === 0 && !hasStartingBudget) {
    return <p className="muted">No entries were recorded in this period.</p>;
  }

  return (
    <div className="entry-list">
      {hasStartingBudget ? (
        <StartingBudgetEntry
          createdAt={periodCreatedAt}
          startingBudgetCents={startingBudgetCents}
        />
      ) : null}
      {entries.map((entry) => (
        <article className="entry-list-item" key={entry.id}>
          <EntrySummary entry={entry} />
        </article>
      ))}
    </div>
  );
}

function StartingBudgetEntry({
  createdAt,
  startingBudgetCents,
}: {
  createdAt?: string;
  startingBudgetCents: number;
}) {
  const isNegative = startingBudgetCents < 0;

  return (
    <article className="entry-list-item entry-list-item-muted">
      <div>
        <p className={`entry-amount entry-amount-${isNegative ? "expense" : "income"}`}>
          {isNegative ? "-" : "+"}
          {formatCents(Math.abs(startingBudgetCents))}
        </p>
        <h2>Starting budget</h2>
        <p className="muted">
          {createdAt ? formatDate(createdAt) : "Period opening balance"}
        </p>
      </div>
    </article>
  );
}

function EntrySummary({ entry }: { entry: Entry }) {
  return (
    <div>
      <p className={`entry-amount entry-amount-${entry.type}`}>
        {entry.type === "income" ? "+" : "-"}
        {formatCents(entry.amountCents)}
      </p>
      <h2>{entry.title ?? (entry.type === "income" ? "Income" : "Expense")}</h2>
      <p className="muted">
        {formatDate(entry.date)}
        {entry.category ? ` - ${entry.category}` : ""}
      </p>
    </div>
  );
}
