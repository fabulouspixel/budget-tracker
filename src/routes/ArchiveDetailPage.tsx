import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ReadOnlyEntryList } from "../components/EntryLists";
import { getEntriesForPeriod } from "../db/entryService";
import { getPeriodById } from "../db/periodService";
import { calculateBalanceCents } from "../domain/balance";
import { formatCents } from "../domain/money";
import type { Entry, Period } from "../domain/types";
import { formatDate } from "../utils/format";

export function ArchiveDetailPage() {
  const { periodId } = useParams();
  const [period, setPeriod] = useState<Period | undefined>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    async function loadArchiveDetail() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        if (!periodId) {
          setPeriod(undefined);
          return;
        }

        const loadedPeriod = await getPeriodById(periodId);
        setPeriod(loadedPeriod);
        setEntries(loadedPeriod ? await getEntriesForPeriod(loadedPeriod.id) : []);
      } catch {
        setErrorMessage("The archive detail could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadArchiveDetail();
  }, [periodId]);

  if (isLoading) {
    return (
      <section className="page-section" aria-labelledby="archive-detail-title">
        <h1 className="compact-title" id="archive-detail-title">
          Loading period
        </h1>
      </section>
    );
  }

  if (!period) {
    return (
      <section className="page-section" aria-labelledby="archive-detail-title">
        <h1 className="compact-title" id="archive-detail-title">
          Period not found
        </h1>
        <p className="muted">This period does not exist in local storage.</p>
        <Link className="secondary-link" to="/archive">
          Back to archive
        </Link>
      </section>
    );
  }

  const finalBalanceCents = calculateBalanceCents(
    period.startingBudgetCents,
    entries,
  );

  return (
    <section className="page-section" aria-labelledby="archive-detail-title">
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      <div className="section-heading">
        <div>
          <h1 className="compact-title" id="archive-detail-title">
            {period.title}
          </h1>
          <p className="muted">
            {period.status === "archived"
              ? `Archived ${
                  period.archivedAt ? formatDate(period.archivedAt) : "date unknown"
                }`
              : "Active period shown read-only"}
          </p>
        </div>
        <Link className="secondary-link" to="/archive">
          Back to archive
        </Link>
      </div>

      <dl className="summary-grid">
        <div>
          <dt>Final balance</dt>
          <dd>{formatCents(finalBalanceCents)}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(period.createdAt)}</dd>
        </div>
        <div>
          <dt>Entries</dt>
          <dd>{entries.length}</dd>
        </div>
      </dl>

      <ReadOnlyEntryList
        entries={entries}
        periodCreatedAt={period.createdAt}
        startingBudgetCents={period.startingBudgetCents}
      />
    </section>
  );
}
