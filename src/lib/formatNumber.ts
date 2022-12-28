export function formatMoney(value?: number | null, lang?: string) {
  const f = new Intl.NumberFormat(lang ?? "fr-fr", {
    currency: "EUR",
    style: "currency",
  });
  return f.format(value ?? 0);
}
