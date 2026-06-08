import { type FormEvent, useState } from "react";
import { parseOptionalStartingBudget } from "../domain/period";

export interface PeriodFormValues {
  title: string;
  startingBudgetCents?: number;
}

interface PeriodFormProps {
  submitLabel: string;
  onSubmit: (values: PeriodFormValues) => Promise<void>;
}

export function PeriodForm({ submitLabel, onSubmit }: PeriodFormProps) {
  const [title, setTitle] = useState("");
  const [startingBudget, setStartingBudget] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        startingBudgetCents: parseOptionalStartingBudget(startingBudget),
      });
      setTitle("");
      setStartingBudget("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The period could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="stacked-form" onSubmit={handleSubmit}>
      <label>
        <span>Title</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Monthly budget"
        />
      </label>

      <label>
        <span>Starting budget</span>
        <input
          inputMode="decimal"
          value={startingBudget}
          onChange={(event) => setStartingBudget(event.target.value)}
          placeholder="0,00"
        />
      </label>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <button className="primary-action" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

