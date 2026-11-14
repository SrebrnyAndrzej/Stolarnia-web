/** Net height is the space for front panels after all specified gaps. */
export function distributeDrawerFronts(
  total: number,
  fronts: ReadonlyArray<{
    id: string;
    height: number;
    drawerHeightLock?: number;
  }>,
  minimum = 60,
  rounding?: 1 | 1000,
) {
  if (
    !Number.isFinite(total) ||
    !Number.isFinite(minimum) ||
    minimum <= 0 ||
    !fronts.length ||
    fronts.length > 150 ||
    total < fronts.length * minimum - 1e-7
  )
    throw new Error(
      `Za mało miejsca na fronty: minimum ${minimum} mm na każdy front.`,
    );
  if (new Set(fronts.map((p) => p.id)).size !== fronts.length)
    throw new Error("Powtórzone identyfikatory frontów.");
  if (fronts.some((p) => !Number.isFinite(p.height) || p.height <= 0))
    throw new Error("Wysokości frontów muszą być dodatnie i skończone.");
  const locked = fronts.filter((p) => p.drawerHeightLock !== undefined),
    heights = new Map<string, number>();
  for (const p of locked) {
    if (!Number.isFinite(p.drawerHeightLock) || p.drawerHeightLock! < minimum)
      throw new Error(
        `Stała wysokość frontu musi wynosić co najmniej ${minimum} mm.`,
      );
    heights.set(p.id, p.drawerHeightLock!);
  }
  let active = fronts.filter((p) => p.drawerHeightLock === undefined);
  let budget = total - locked.reduce((s, p) => s + p.drawerHeightLock!, 0);
  if (
    budget < active.length * minimum - 1e-7 ||
    (!active.length && Math.abs(budget) > 1e-7)
  )
    throw new Error(
      "Stałe wysokości nie mieszczą się w komorze lub nie pozostawiają miejsca na automatyczne fronty. Zmień wysokość albo odblokuj front.",
    );
  while (active.length) {
    const weight = (p: (typeof active)[number]) =>
      locked.length ? 1 : Math.max(1, p.height);
    const sum = active.reduce((s, p) => s + weight(p), 0);
    const small = active.filter((p) => (budget * weight(p)) / sum < minimum);
    if (small.length) {
      small.forEach((p) => heights.set(p.id, minimum));
      budget -= small.length * minimum;
      active = active.filter((p) => !heights.has(p.id));
      continue;
    }
    let cumulative = 0,
      previous = 0;
    active.forEach((p, i) => {
      cumulative += weight(p);
      const precision =
        rounding ?? (locked.length || !Number.isInteger(budget) ? 1000 : 1);
      const raw =
        Math.round(((budget * cumulative) / sum) * precision) / precision;
      const share =
        i === active.length - 1
          ? budget
          : Math.max(
              previous + minimum,
              Math.min(raw, budget - (active.length - i - 1) * minimum),
            );
      heights.set(p.id, share - previous);
      previous = share;
    });
    break;
  }
  return heights;
}
