import { useEffect, useState } from "react";
import { EditableEntryList } from "../components/EntryLists";
import { EntryForm, type EntryFormMode, type EntryFormValues } from "../components/EntryForm";
import { PeriodForm, type PeriodFormValues } from "../components/PeriodForm";
import {
  createEntry,
  deleteEntry,
  getCategoriesFromEntries,
  getEntriesForPeriod,
  updateEntry,
} from "../db/entryService";
import { createNewActivePeriod, getActivePeriod } from "../db/periodService";
import { calculateBalanceCents } from "../domain/balance";
import { formatCents } from "../domain/money";
import { shouldCreateNewPeriod } from "../domain/period";
import type { Entry, Period } from "../domain/types";
import { formatDate } from "../utils/format";

export function ActivePeriodPage() {
  const [activePeriod, setActivePeriod] = useState<Period | undefined>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPeriodFormVisible, setIsPeriodFormVisible] = useState(false);
  const [entryFormMode, setEntryFormMode] = useState<EntryFormMode | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function loadActivePeriodData() {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const loadedPeriod = await getActivePeriod();
      setActivePeriod(loadedPeriod);
      setEntries(loadedPeriod ? await getEntriesForPeriod(loadedPeriod.id) : []);
      setCategories(await getCategoriesFromEntries());
    } catch {
      setErrorMessage("The active period could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadActivePeriodData();
  }, []);

  async function handleCreatePeriod(input: PeriodFormValues) {
    const canCreatePeriod = shouldCreateNewPeriod(activePeriod !== undefined, () =>
      window.confirm(
        "The current active period will be archived before creating a new one.",
      ),
    );

    if (!canCreatePeriod) {
      return;
    }

    await createNewActivePeriod(input);
    setIsPeriodFormVisible(false);
    setEntryFormMode(undefined);
    await loadActivePeriodData();
  }

  async function handleSubmitEntry(input: EntryFormValues) {
    if (!activePeriod) {
      throw new Error("Create an active period before adding entries.");
    }

    if (entryFormMode?.type === "edit") {
      await updateEntry(entryFormMode.entry.id, input);
    } else {
      await createEntry({ ...input, periodId: activePeriod.id });
    }

    setEntryFormMode(undefined);
    await loadActivePeriodData();
  }

  async function handleDeleteEntry(entry: Entry) {
    const canDeleteEntry = window.confirm("Delete this entry?");

    if (!canDeleteEntry) {
      return;
    }

    await deleteEntry(entry.id);
    await loadActivePeriodData();
  }

  if (isLoading) {
    return (
      <section className="page-section" aria-labelledby="active-period-title">
        <h1 className="compact-title" id="active-period-title">
          Loading budget period
        </h1>
      </section>
    );
  }

  const balanceCents = calculateBalanceCents(
    activePeriod?.startingBudgetCents,
    entries,
  );

  return (
    <section className="page-section" aria-labelledby="active-period-title">
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      {!activePeriod ? (
        <>
          <h1 className="compact-title" id="active-period-title">
            No active period yet
          </h1>
          <p className="muted">
            Create your first budget period to start tracking income and expenses.
          </p>
          <PeriodForm submitLabel="Create Period" onSubmit={handleCreatePeriod} />
        </>
      ) : (
        <>
          {!isPeriodFormVisible ? (
            <dl className="summary-grid">
              <div>
                <dt>Current balance</dt>
                <dd>{formatCents(balanceCents)}</dd>
              </div>
            </dl>
          ) : null}

          <div className="section-heading">
            <div>
              <h1 className="compact-title" id="active-period-title">
                {activePeriod.title}
              </h1>
              <p className="muted">Created {formatDate(activePeriod.createdAt)}</p>
            </div>
            {!entryFormMode && !isPeriodFormVisible ? (
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  setEntryFormMode(undefined);
                  setIsPeriodFormVisible(true);
                }}
              >
                New Period
              </button>
            ) : null}
          </div>

          {isPeriodFormVisible ? (
            <PeriodForm
              onCancel={() => setIsPeriodFormVisible(false)}
              submitLabel="Create New Period"
              onSubmit={handleCreatePeriod}
            />
          ) : null}

          {!isPeriodFormVisible && !entryFormMode ? (
            <>
              <div className="entry-toolbar" aria-label="Entry actions">
                <button
                  className="primary-action"
                  type="button"
                  onClick={() =>
                    setEntryFormMode({ type: "create", entryType: "income" })
                  }
                >
                  Add Income
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() =>
                    setEntryFormMode({ type: "create", entryType: "expense" })
                  }
                >
                  Add Expense
                </button>
              </div>
            </>
          ) : null}

          {!isPeriodFormVisible && entryFormMode ? (
            <EntryForm
              categories={categories}
              mode={entryFormMode}
              onCancel={() => setEntryFormMode(undefined)}
              onSubmit={handleSubmitEntry}
            />
          ) : null}

          {!isPeriodFormVisible ? (
            <EditableEntryList
              entries={entries}
              onDelete={handleDeleteEntry}
              onEdit={(entry) => setEntryFormMode({ type: "edit", entry })}
              periodCreatedAt={activePeriod.createdAt}
              startingBudgetCents={activePeriod.startingBudgetCents}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
