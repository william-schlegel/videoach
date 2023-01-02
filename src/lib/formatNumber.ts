export function formatMoney(value?: number | null, lang?: string) {
  const f = new Intl.NumberFormat(lang ?? "fr-fr", {
    currency: "EUR",
    style: "currency",
  });
  return f.format(value ?? 0);
}

export function formatSize(value?: number | null, lang?: string) {
  const f = new Intl.NumberFormat(lang ?? "fr-fr", {
    notation: "compact",
    compactDisplay: "short",
    style: "unit",
    unit: "byte",
    unitDisplay: "narrow",
  });
  return f.format(value ?? 0);
}
