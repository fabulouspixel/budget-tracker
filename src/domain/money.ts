const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function parseEuroInput(
  value: string,
  options: { allowNegative?: boolean } = {},
): number {
  const normalized = value.trim().replace(/\s/g, "").replaceAll("\u20ac", "");

  if (normalized.length === 0) {
    throw new Error("Amount is required.");
  }

  const hasNegativeSign = normalized.startsWith("-");

  if (hasNegativeSign && !options.allowNegative) {
    throw new Error("Amount must not be negative.");
  }

  const unsignedValue = hasNegativeSign ? normalized.slice(1) : normalized;

  if (!/^\d+([,.]\d{1,2})?$/.test(unsignedValue)) {
    throw new Error("Amount must be a valid Euro value.");
  }

  const [euros, cents = ""] = unsignedValue.replace(",", ".").split(".");
  const parsedCents = Number(euros) * 100 + Number(cents.padEnd(2, "0"));
  const result = hasNegativeSign ? -parsedCents : parsedCents;

  if (!Number.isSafeInteger(result)) {
    throw new Error("Amount is too large.");
  }

  return result;
}

export function parsePositiveEntryAmount(value: string): number {
  const cents = parseEuroInput(value);

  if (cents <= 0) {
    throw new Error("Entry amount must be greater than zero.");
  }

  return cents;
}
