import { type FormEvent, useState } from "react";
import { CategoryCombobox } from "./CategoryCombobox";
import { createLocalDate, parseEntryAmount } from "../domain/entry";
import type { Entry, EntryType } from "../domain/types";
import { centsToInputValue } from "../utils/format";

export type EntryFormMode =
  | { type: "create"; entryType: EntryType }
  | { type: "edit"; entry: Entry };

export interface EntryFormValues {
  type: EntryType;
  amountCents: number;
  title?: string;
  date?: string;
  category?: string;
}

interface EntryFormProps {
  categories: string[];
  mode: EntryFormMode;
  onCancel: () => void;
  onSubmit: (values: EntryFormValues) => Promise<void>;
}

export function EntryForm({ categories, mode, onCancel, onSubmit }: EntryFormProps) {
  const entry = mode.type === "edit" ? mode.entry : undefined;
  const [type, setType] = useState<EntryType>(
    entry?.type ?? (mode.type === "create" ? mode.entryType : "expense"),
  );
  const [amount, setAmount] = useState(entry ? centsToInputValue(entry.amountCents) : "");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [date, setDate] = useState(entry?.date ?? createLocalDate());
  const [category, setCategory] = useState(entry?.category ?? "");
  const [isDetailsVisible, setIsDetailsVisible] = useState(
    Boolean(entry?.title || (entry && entry.date !== createLocalDate())),
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      await onSubmit({
        type,
        amountCents: parseEntryAmount(amount),
        title,
        date,
        category,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The entry could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="stacked-form" onSubmit={handleSubmit}>
      <div className="segmented-control" aria-label="Entry type">
        <label>
          <input
            checked={type === "income"}
            name="entry-type"
            type="radio"
            onChange={() => setType("income")}
          />
          <span>Income</span>
        </label>
        <label>
          <input
            checked={type === "expense"}
            name="entry-type"
            type="radio"
            onChange={() => setType("expense")}
          />
          <span>Expense</span>
        </label>
      </div>

      <label>
        <span>Amount</span>
        <input
          required
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="12,50"
        />
      </label>

      <CategoryCombobox
        categories={categories.map((categoryName) => ({ name: categoryName }))}
        label="Category"
        value={category}
        onChange={setCategory}
      />

      <button
        className="details-toggle"
        type="button"
        onClick={() => setIsDetailsVisible((current) => !current)}
      >
        {isDetailsVisible ? "Hide details" : "More details"}
      </button>

      {isDetailsVisible ? (
        <div className="entry-details">
          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional description"
            />
          </label>

          <label>
            <span>Date</span>
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>
      ) : null}

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <div className="form-actions">
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode.type === "edit" ? "Save Entry" : "Add Entry"}
        </button>
        <button className="secondary-action" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
