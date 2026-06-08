export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

