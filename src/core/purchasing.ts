export const PURCHASE_UNITS = [
  "arkusz",
  "szt",
  "kpl",
  "mb",
  "m2",
  "opak",
] as const;
export type PurchaseUnit = (typeof PURCHASE_UNITS)[number];
export interface PurchaseLine {
  id: string;
  label: string;
  sku: string;
  quantity: number;
  unit: PurchaseUnit;
  notes: string;
}
export interface PurchaseOrder {
  id: string;
  version: number;
  title: string;
  projectId: string | null;
  projectRevision: number | null;
  lines: PurchaseLine[];
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
  status: "draft";
}
export const MUSSI_CONNECTION = {
  automaticSendingAvailable: false,
  code: "receiver_not_durable",
  message:
    "Projekt Mussi ma API, ale nie zapisuje jeszcze zamówień trwale. Automatyczne składanie zamówień jest wyłączone.",
  endpoint: "/api/v1/zamowienia",
  format: "CSV: indeks;ilosc;jednostka;uwagi",
} as const;
export function purchaseIssues(order: Pick<PurchaseOrder, "lines">): string[] {
  const issues: string[] = [];
  if (!order.lines.length) issues.push("Dodaj co najmniej jedną pozycję.");
  const units = new Map<string, string>();
  order.lines.forEach((line, i) => {
    const name = `Pozycja ${i + 1} (${line.label})`;
    if (!line.sku.trim())
      issues.push(
        `${name}: brakuje indeksu Mussi. Kod dekoru ani nazwa materiału nie zastępują indeksu dostawcy.`,
      );
    else if (!/^[\p{L}\p{N}][\p{L}\p{N} ._\/-]{0,99}$/u.test(line.sku))
      issues.push(`${name}: niepoprawny indeks.`);
    if (
      !Number.isFinite(line.quantity) ||
      line.quantity <= 0 ||
      line.quantity > 1_000_000
    )
      issues.push(`${name}: wpisz dodatnią ilość do 1 000 000.`);
    if (
      ["arkusz", "szt", "kpl", "opak"].includes(line.unit) &&
      !Number.isInteger(line.quantity)
    )
      issues.push(`${name}: jednostka ${line.unit} wymaga całkowitej ilości.`);
    if (
      Math.abs(line.quantity * 1000 - Math.round(line.quantity * 1000)) >
      0.00001
    )
      issues.push(`${name}: maksymalnie trzy miejsca po przecinku.`);
    const previous = units.get(line.sku);
    if (previous && previous !== line.unit)
      issues.push(`${name}: ten sam indeks ma różne jednostki.`);
    units.set(line.sku, line.unit);
  });
  return issues;
}
/** RFC4180 escaping and spreadsheet formula protection. Values are never inferred from labels. */
const csvCell = (value: string) =>
  `"${(/^[\s]*[=+@-]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
export function mussiOrderCsv(order: Pick<PurchaseOrder, "lines">): string {
  const issues = purchaseIssues(order);
  if (issues.length) throw new Error(issues.join(" "));
  // Exact SKU and unit only. Do not silently merge distinct notes or variants.
  return (
    "\uFEFFindeks;ilosc;jednostka;uwagi\r\n" +
    order.lines
      .map((l) =>
        [
          csvCell(l.sku),
          String(l.quantity),
          csvCell(l.unit),
          csvCell(l.notes),
        ].join(";"),
      )
      .join("\r\n") +
    "\r\n"
  );
}
