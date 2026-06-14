const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return dateFormatter.format(new Date(value));
}

export function formatPercent(value: number) {
  return percentFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}
