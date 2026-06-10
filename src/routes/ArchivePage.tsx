import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEntriesForPeriod } from "../db/entryService";
import { deleteArchivedPeriod, getArchivedPeriods } from "../db/periodService";
import { calculateBalanceCents } from "../domain/balance";
import { formatCents } from "../domain/money";
import type { Entry, Period } from "../domain/types";
import { formatDate } from "../utils/format";

export function ArchivePage() {
  const [archivedPeriods, setArchivedPeriods] = useState<Period[]>([]);
  const [entriesByPeriodId, setEntriesByPeriodId] = useState<Record<string, Entry[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function loadArchivedPeriods() {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const loadedPeriods = await getArchivedPeriods();
      const entriesPairs = await Promise.all(
        loadedPeriods.map(async (period) => [
          period.id,
          await getEntriesForPeriod(period.id),
        ] as const),
      );

      setArchivedPeriods(loadedPeriods);
      setEntriesByPeriodId(Object.fromEntries(entriesPairs));
    } catch {
      setErrorMessage("The archive could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadArchivedPeriods();
  }, []);

  async function handleDeleteArchivedPeriod(period: Period) {
    const canDelete = window.confirm(
      "Delete this archived period? Its entries will also be deleted.",
    );

    if (!canDelete) {
      return;
    }

    setErrorMessage(undefined);

    try {
      await deleteArchivedPeriod(period.id);
      await loadArchivedPeriods();
    } catch {
      setErrorMessage("The archived period could not be deleted.");
    }
  }

  return (
    <section className="page-section" aria-labelledby="archive-title">
      <h1 className="compact-title" id="archive-title">
        Archived periods
      </h1>
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      {isLoading ? <p className="muted">Loading archive.</p> : null}

      {!isLoading && archivedPeriods.length === 0 ? (
        <p className="muted">
          Completed budget periods will appear here as read-only records.
        </p>
      ) : null}

      <div className="period-list">
        {archivedPeriods.map((period) => (
          <article className="period-list-item" key={period.id}>
            <Link className="period-list-content period-list-link" to={`/archive/${period.id}`}>
              <div>
                <h2>{period.title}</h2>
                <p className="muted">
                  {formatDate(period.createdAt)} to{" "}
                  {period.archivedAt ? formatDate(period.archivedAt) : "Unknown"}
                </p>
              </div>
              <dl>
                <div>
                  <dt>Starting budget</dt>
                  <dd>{formatCents(period.startingBudgetCents ?? 0)}</dd>
                </div>
                <div>
                  <dt>Final balance</dt>
                  <dd>
                    {formatCents(
                      calculateBalanceCents(
                        period.startingBudgetCents,
                        entriesByPeriodId[period.id] ?? [],
                      ),
                    )}
                  </dd>
                </div>
              </dl>
            </Link>
            <button
              aria-label="Delete archived period"
              className="icon-action danger-icon-action period-delete-action"
              type="button"
              onClick={() => void handleDeleteArchivedPeriod(period)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M5 7h14" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M6 7l1 14h10l1-14" />
                <path d="M9 7V4h6v3" />
              </svg>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
