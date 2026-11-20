import {
  kitchenModules,
  kitchenIssues,
  type KitchenGeometryInput,
  type KitchenItem,
} from "./kitchen-configuration.js";

const geometry = (m: ReturnType<typeof kitchenModules>[number]) =>
  JSON.stringify([
    m.scianaId,
    m.pozycjaXMM,
    m.pozycjaYMM,
    m.szerokoscMM,
    m.wysokoscMM,
    m.glebokoscMM,
  ]);
/** Explicit unlock is required before a locked cabinet, its position or its equipment can change. */
export function kitchenLockProblem(
  before: KitchenGeometryInput,
  after: KitchenGeometryInput,
) {
  const old = kitchenModules(before),
    next = kitchenModules(after);
  for (const item of [...before.items, ...(before.island?.items ?? [])].filter(
    (i) => i.locked,
  )) {
    const candidate = [...after.items, ...(after.island?.items ?? [])].find(
      (i) => i.id === item.id,
    );
    if (candidate && !candidate.locked) continue;
    const a = old.find((m) => m.id === item.id),
      b = next.find((m) => m.id === item.id);
    const config = (i: KitchenItem) => {
      const { gapBefore: _gap, ...rest } = i;
      return JSON.stringify(rest);
    };
    if (
      !candidate ||
      !a ||
      !b ||
      geometry(a) !== geometry(b) ||
      config(item) !== config(candidate)
    )
      return `Najpierw odblokuj: ${a?.nazwa ?? "szafka"}. Zmiana przesunęłaby zaakceptowany element lub zmieniła jego wyposażenie.`;
  }
  return "";
}
/** Keep exact accepted positions and interiors in a newly generated layout, or fail without mutation. */
export function retainKitchenLocks(
  source: KitchenGeometryInput,
  candidate: KitchenItem[],
) {
  const accepted = source.items.filter((i) => i.locked);
  if (!accepted.length) return candidate;
  const old = kitchenModules(source),
    fresh = kitchenModules({ ...source, items: candidate });
  const replacements = new Map<string, KitchenItem>();
  for (const item of accepted) {
    const m = old.find((m) => m.id === item.id)!;
    const fit = fresh.find(
      (n) =>
        geometry(n) === geometry(m) &&
        n.konstrukcja === m.konstrukcja &&
        !replacements.has(n.id),
    );
    if (!fit)
      throw new Error(
        `Nie znaleziono układu zachowującego blokadę: ${m.nazwa}. Odblokuj ten element albo uzupełnij istniejący ciąg. Projekt pozostaje bez zmian.`,
      );
    replacements.set(fit.id, {
      ...item,
      gapBefore: candidate.find((i) => i.id === fit.id)?.gapBefore,
    });
  }
  const items = candidate.map((i) => replacements.get(i.id) ?? i);
  const problem = kitchenLockProblem(source, { ...source, items });
  if (problem) throw new Error(problem);
  const issue = kitchenIssues({ ...source, items })[0];
  if (issue)
    throw new Error(
      `Zachowanie blokad wymaga korekty układu: ${issue} Projekt pozostaje bez zmian.`,
    );
  return items;
}
