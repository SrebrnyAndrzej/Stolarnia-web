import {
  customerKitchenCatalog,
  isKitchenUpper,
  kitchenItemSchema,
  kitchenIssues,
  kitchenModules,
  kitchenOuterBounds,
  kitchenWalls,
  type KitchenGeometryInput,
  type KitchenItem,
} from "./kitchen-configuration.js";
import type { Modul } from "./types.js";
import { isKitchenOpening } from "./kitchen-room.js";
import { kitchenPlanningEnd } from "./kitchen-collisions.js";

export type KitchenTier = "base" | "wall" | "tall";
export const kitchenTierName = {
  base: "Dolny",
  wall: "Górny",
  tall: "Wysoki",
} as const;
export const kitchenTier = (m: Modul): KitchenTier =>
  m.kategoria === "wall" || m.konstrukcja === "hood"
    ? "wall"
    : m.kategoria === "tall" ||
        m.konstrukcja === "refrigerator" ||
        m.wysokoscMM > 1500
      ? "tall"
      : "base";
const wallStart = (d: KitchenGeometryInput, wall: string) =>
  d.layout !== "straight" && wall !== "a" ? 650 : 0;
const wallLength = (d: KitchenGeometryInput, wall: string) =>
  wall === "a" ? d.width : wall === "b" ? d.depth : d.returnLength;
const track = (m: Modul, tier: KitchenTier) =>
  (kitchenTier(m) === "wall") === (tier === "wall");

export interface KitchenRun {
  id: string;
  wall: KitchenItem["wall"];
  tier: KitchenTier;
  modules: Modul[];
  start: number;
  end: number;
  height: number;
  depth: number;
  bottom: number;
  leftExposed: boolean;
  rightExposed: boolean;
}
/** Physical continuity, not item order or the mere existence of a type. */
export function detectKitchenRuns(d: KitchenGeometryInput): KitchenRun[] {
  const modules = kitchenModules(d),
    runs: KitchenRun[] = [];
  for (const wall of kitchenWalls(d))
    for (const tier of ["base", "wall", "tall"] as const) {
      const candidates = modules
        .filter(
          (m) =>
            m.scianaId === wall &&
            kitchenTier(m) === tier &&
            m.konstrukcja !== "filler",
        )
        .sort((a, b) => a.pozycjaXMM - b.pozycjaXMM);
      let current: KitchenRun | undefined;
      for (const m of candidates) {
        const bounds = kitchenOuterBounds(m);
        if (
          !current ||
          bounds.start !== current.end ||
          m.wysokoscMM !== current.height ||
          m.pozycjaYMM !== current.bottom ||
          m.glebokoscMM !== current.depth
        ) {
          current = {
            id: `${wall}:${tier}:${m.id}`,
            wall,
            tier,
            modules: [],
            start: bounds.start,
            end: bounds.end,
            height: m.wysokoscMM,
            depth: m.glebokoscMM,
            bottom: m.pozycjaYMM,
            leftExposed: true,
            rightExposed: true,
          };
          runs.push(current);
        }
        current.modules.push(m);
        current.end = bounds.end;
      }
    }
  for (const run of runs) {
    const covers = modules.filter(
      (m) =>
        m.scianaId === run.wall &&
        !run.modules.some((n) => n.id === m.id) &&
        m.konstrukcja !== "filler" &&
        m.pozycjaYMM <= run.bottom &&
        m.pozycjaYMM + m.wysokoscMM >= run.bottom + run.height &&
        m.glebokoscMM >= run.depth,
    );
    run.leftExposed = !covers.some(
      (m) => kitchenOuterBounds(m).end === run.start,
    );
    run.rightExposed = !covers.some(
      (m) => kitchenOuterBounds(m).start === run.end,
    );
  }
  return runs;
}

export interface KitchenGap {
  id: string;
  wall: KitchenItem["wall"];
  tier: KitchenTier;
  start: number;
  end: number;
  width: number;
}
/** Upper rows also reserve the footprint of tall units. Adjacent intervals are merged. */
export function kitchenFreeGaps(
  d: KitchenGeometryInput,
  wall: KitchenItem["wall"],
  tier: KitchenTier,
): KitchenGap[] {
  if (!kitchenWalls(d).includes(wall))
    throw new Error("Wybierz ścianę należącą do układu kuchni.");
  const modules = kitchenModules(d).filter((m) => m.scianaId === wall),
    start = wallStart(d, wall),
    end = kitchenPlanningEnd(d, wall);
  const upperBottom = Math.min(
    1400,
    ...modules
      .filter((m) => kitchenTier(m) === "wall")
      .map((m) => m.pozycjaYMM),
  );
  const occupied = modules
    .filter(
      (m) =>
        track(m, tier) ||
        (tier === "wall" &&
          kitchenTier(m) === "tall" &&
          m.pozycjaYMM + m.wysokoscMM > upperBottom),
    )
    .map(kitchenOuterBounds)
    .concat(
      (d.features ?? [])
        .filter(
          (f) =>
            f.wall === wall &&
            isKitchenOpening(f) &&
            f.bottom <
              Math.max(
                tier === "wall" ? 2120 : tier === "tall" ? 2170 : 858,
                ...modules
                  .filter((m) => kitchenTier(m) === tier)
                  .map(
                    (m) =>
                      m.pozycjaYMM +
                      m.wysokoscMM +
                      (m.konfiguracja.blat
                        ? d.quote?.worktop === "compact"
                          ? 12
                          : 38
                        : 0),
                  ),
              ) &&
            f.bottom + f.height > (tier === "wall" ? upperBottom : 0),
        )
        .map((f) => ({ start: f.x, end: f.x + f.width })),
    )
    .sort((a, b) => a.start - b.start);
  const gaps: KitchenGap[] = [];
  const add = (from: number, to: number) => {
    if (to > from)
      gaps.push({
        id: `${wall}:${tier}:${from}:${to}`,
        wall,
        tier,
        start: from,
        end: to,
        width: to - from,
      });
  };
  let at = start;
  for (const interval of occupied) {
    add(at, Math.min(end, interval.start));
    at = Math.min(end, Math.max(at, interval.end));
  }
  add(at, end);
  return gaps;
}

export function fillKitchenGap(
  d: KitchenGeometryInput,
  wall: KitchenItem["wall"],
  tier: KitchenTier,
  gapId: string,
  id: () => string,
  purpose: "storage" | "preparation" = "storage",
  selectedCatalogId?: string,
): KitchenItem[] {
  const problems = kitchenIssues(d);
  if (problems.length) throw new Error(problems[0]);
  const gap = kitchenFreeGaps(d, wall, tier).find((g) => g.id === gapId);
  if (!gap)
    throw new Error("Ta luka zmieniła się. Wybierz aktualne wolne miejsce.");
  if (gap.width < 20)
    throw new Error(
      "Pozostaje mniej niż 20 mm. Zmień szerokość sąsiedniej szafki albo pozostaw luz.",
    );
  const selected = selectedCatalogId
    ? customerKitchenCatalog.find((m) => m.id === selectedCatalogId)
    : undefined;
  if (
    selectedCatalogId &&
    (!selected ||
      selected.construction === "blindCorner" ||
      isKitchenUpper(selected) !== (tier === "wall") ||
      ((selected.category === "tall" ||
        selected.construction === "refrigerator") !==
        (tier === "tall") &&
        !isKitchenUpper(selected)))
  )
    throw new Error("Ten wariant nie pasuje do wybranego rzędu.");
  if (selected?.category === "appliance" && selected.widthMM > gap.width)
    throw new Error(
      "Zabudowa AGD nie mieści się w tej luce. Szerokość urządzenia pozostaje stała.",
    );
  const usedWidth = selected
    ? Math.min(
        gap.width,
        selected.construction === "filler" ? 300 : selected.widthMM,
      )
    : gap.width;
  if (selected && selected.construction !== "filler" && usedWidth < 200)
    throw new Error("W tej luce mieści się tylko blenda.");
  const filler = gap.width < 200,
    count = selected ? 1 : filler ? 1 : Math.ceil(gap.width / 600);
  if (d.items.length + count > 24)
    throw new Error(
      `Dopełnienie wymaga ${count} elementów. Szkic mieści maksymalnie 24; usuń elementy lub zmień układ.`,
    );
  const catalogId =
    selectedCatalogId ??
    (filler
      ? `${tier}-filler-50`
      : tier === "tall"
        ? "tall-pantry-600"
        : tier === "base" && purpose === "preparation"
          ? "base-drawers-600"
          : `${tier}-shelves-600`);
  const entry = customerKitchenCatalog.find((m) => m.id === catalogId);
  if (!entry) throw new Error("Brak zgodnego wariantu w katalogu.");
  const modules = kitchenModules(d).filter((m) => m.scianaId === wall),
    peers = modules.filter((m) => track(m, tier));
  const priorEnd = Math.max(
    wallStart(d, wall),
    ...peers
      .filter((m) => kitchenOuterBounds(m).end <= gap.start)
      .map((m) => kitchenOuterBounds(m).end),
  );
  const right = peers
    .filter((m) => kitchenOuterBounds(m).start >= gap.end)
    .sort((a, b) => a.pozycjaXMM - b.pozycjaXMM)[0];
  const neighbor = modules
    .filter((m) => kitchenTier(m) === tier && m.konstrukcja !== "filler")
    .sort(
      (a, b) =>
        Math.abs(kitchenOuterBounds(a).end - gap.start) -
        Math.abs(kitchenOuterBounds(b).end - gap.start),
    )[0];
  let used = 0;
  const additions = Array.from({ length: count }, (_, index) => {
    const end = Math.round((usedWidth * (index + 1)) / count),
      width = end - used;
    used = end;
    return kitchenItemSchema.parse({
      id: id(),
      catalogId,
      wall,
      width,
      ...(index === 0 && gap.start > priorEnd
        ? { gapBefore: gap.start - priorEnd }
        : {}),
      height:
        neighbor &&
        [entry.heightMM, ...entry.availableHeightsMM].includes(
          neighbor.wysokoscMM,
        )
          ? neighbor.wysokoscMM
          : entry.heightMM,
      depth:
        neighbor &&
        [entry.depthMM, ...entry.availableDepthsMM].includes(
          neighbor.glebokoscMM,
        )
          ? neighbor.glebokoscMM
          : entry.depthMM,
    });
  });
  const index = right
    ? d.items.findIndex((i) => i.id === right.id)
    : d.items.length;
  const items = d.items.map((i) =>
    i.id === right?.id
      ? {
          ...i,
          gapBefore: kitchenOuterBounds(right).start - gap.start - usedWidth,
        }
      : i,
  );
  items.splice(index, 0, ...additions);
  if (new Set(items.map((i) => i.id)).size !== items.length)
    throw new Error(
      "Powtarzające się identyfikatory szafek. Spróbuj ponownie.",
    );
  const resultIssues = kitchenIssues({ ...d, items });
  if (resultIssues.length) throw new Error(resultIssues[0]);
  return items;
}

/** Calculate the whole change before publishing it to history or storage. */
export function fillKitchenTier(
  d: KitchenGeometryInput,
  wall: KitchenItem["wall"],
  tier: KitchenTier,
  id: () => string,
  purpose: "storage" | "preparation" = "storage",
) {
  const gaps = kitchenFreeGaps(d, wall, tier);
  const fillable = gaps.filter((g) => g.width >= 20);
  if (!fillable.length)
    throw new Error(
      "Brak luk od 20 mm w tym rzędzie. Mniejsze luzy pozostają do dopasowania.",
    );
  let items = d.items;
  for (const gap of [...fillable].reverse())
    items = fillKitchenGap({ ...d, items }, wall, tier, gap.id, id, purpose);
  return { items, skipped: gaps.length - fillable.length };
}

export interface SurroundOptions {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
  projection: number;
  keepWidth: boolean;
}
export function planKitchenSurround(
  d: KitchenGeometryInput,
  runId: string,
  options: SurroundOptions,
) {
  if (
    !Number.isInteger(options.projection) ||
    options.projection < 0 ||
    options.projection > 100
  )
    throw new Error(
      "Wysunięcie przed lico frontów: 0–100 mm, w całych milimetrach.",
    );
  const run = detectKitchenRuns(d).find((r) => r.id === runId);
  if (!run) throw new Error("Ciąg zmienił się. Wybierz go ponownie.");
  if (run.tier === "base" && options.top)
    throw new Error("Dolny ciąg ma już blat. Wybierz boki osłonowe.");
  if (run.tier !== "wall" && options.bottom)
    throw new Error("Dolny wieniec osłonowy dotyczy szafek wiszących.");
  const first = run.modules[0].id,
    last = run.modules.at(-1)!.id;
  let items = d.items.map((i) => {
    if (!run.modules.some((m) => m.id === i.id)) return i;
    const surround = {
      ...i.surround,
      left: i.id === first ? options.left : i.surround?.left,
      right: i.id === last ? options.right : i.surround?.right,
      top: options.top,
      bottom: options.bottom,
      projection: options.projection,
    };
    return kitchenItemSchema.parse({
      ...i,
      surround:
        surround.left || surround.right || surround.top || surround.bottom
          ? surround
          : undefined,
    });
  });
  const previousWidth = run.end - run.start;
  const updated = kitchenModules({ ...d, items }).filter((m) =>
    run.modules.some((n) => n.id === m.id),
  );
  const nextWidth =
    kitchenOuterBounds(updated.at(-1)!).end -
    kitchenOuterBounds(updated[0]).start;
  const delta = nextWidth - previousWidth;
  const changes: string[] = [];
  if (options.keepWidth && delta !== 0) {
    let remaining = delta;
    for (const m of [...run.modules].reverse()) {
      const entry = customerKitchenCatalog.find((e) => e.id === m.katalogId)!;
      if (entry.category === "appliance") continue;
      const amount =
        remaining > 0
          ? Math.min(remaining, m.szerokoscMM - 200)
          : Math.max(remaining, m.szerokoscMM - 1200);
      if (!amount) continue;
      items = items.map((i) =>
        i.id === m.id
          ? kitchenItemSchema.parse({ ...i, width: m.szerokoscMM - amount })
          : i,
      );
      changes.push(
        `${m.nazwa}: ${m.szerokoscMM} → ${m.szerokoscMM - amount} mm`,
      );
      remaining -= amount;
      if (remaining === 0) break;
    }
    if (remaining)
      throw new Error(
        `Brakuje ${Math.abs(remaining)} mm na obudowę w obecnym obrysie. Nie zmieniamy szerokości AGD. Pozostaw wolne miejsce lub odznacz zachowanie szerokości ciągu.`,
      );
  }
  const issues = kitchenIssues({ ...d, items });
  if (issues.length) throw new Error(issues[0]);
  return { items, changes, run };
}
