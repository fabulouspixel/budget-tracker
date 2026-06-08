import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEntriesForPeriod } from "../db/entryService";
import { getArchivedPeriods } from "../db/periodService";
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

  useEffect(() => {
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

    void loadArchivedPeriods();
  }, []);

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
          <Link
            className="period-list-item period-list-link"
            key={period.id}
            to={`/archive/${period.id}`}
          >
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
        ))}
      </div>
    </section>
  );
}
