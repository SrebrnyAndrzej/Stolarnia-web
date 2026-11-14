import { distributeDrawerFronts } from "./drawer-front-layout.js";

/** Opening dimension includes both optional edge gaps and all gaps between panels. */
export function splitFronts(
  total: number,
  count: number,
  gap: number,
  edge: number,
) {
  if (
    ![total, count, gap, edge].every(Number.isFinite) ||
    total <= 0 ||
    total > 10000 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 12 ||
    gap < 0 ||
    gap > 20 ||
    edge < 0 ||
    edge > 20
  )
    throw new Error(
      "Podaj wymiar do 10000 mm, od 1 do 12 frontów i szczeliny 0–20 mm.",
    );
  const net = total - 2 * edge - (count - 1) * gap;
  const pieces = Array.from({ length: count }, (_, i) => ({
    id: String(i),
    height: 1,
  }));
  const values = distributeDrawerFronts(net, pieces, 60, 1000);
  let offset = edge;
  return pieces.map((p) => {
    const size = values.get(p.id)!;
    const start = offset;
    offset += size + gap;
    return { size, start };
  });
}
