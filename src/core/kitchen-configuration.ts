import { z } from "zod";
import { kitchenNeedsSchema } from "./kitchen-needs-schema.js";
import { kitchenProjectDetailsSchema } from "./kitchen-project-details.js";
import { KATALOG_MODULOW, domyslnaKonfiguracja } from "./catalog/modules.js";
import type { Modul, ModulKatalogowy } from "./types.js";
import { islandIssues } from "./kitchen-island.js";
import { kitchenCollisions, kitchenPlanningEnd } from "./kitchen-collisions.js";
import { architectFilesSchema } from "./architect-files.js";
import {
  kitchenLayoutSchema,
  kitchenLayoutWalls,
  kitchenWallStart,
  kitchenWallLength,
} from "./kitchen-layout.js";
import { drawerStackHeights } from "./drawer-front-layout.js";
import { USTAWIENIA_DOMYSLNE } from "./settings.js";
import { mebelZModulu } from "./silnik/adapter.js";
import { dodajUkrytaSzuflade } from "./silnik/polecenia.js";
import {
  kitchenApplianceSchema,
  kitchenApplianceFit,
} from "./kitchen-appliance-fit.js";
import { kitchenStandardsSchema, isStandardBase } from "./kitchen-standards.js";
import {
  kitchenFeatureSchema,
  featureRoomIssues,
  openingOverlaps,
} from "./kitchen-room.js";

const fillers: ModulKatalogowy[] = (["base", "wall", "tall"] as const).map(
  (category) => {
    const source = KATALOG_MODULOW.find(
      (m) =>
        m.id ===
        (category === "tall" ? "tall-pantry-600" : `${category}-shelves-600`),
    )!;
    return {
      ...source,
      id: `${category}-filler-50`,
      name:
        category === "wall"
          ? "Blenda wisząca 50"
          : category === "tall"
            ? "Blenda wysoka 50"
            : "Blenda dolna 50",
      construction: "filler",
      widthMM: 50,
      tags: ["blenda"],
    };
  },
);
export const customerKitchenCatalog = [
  ...KATALOG_MODULOW.filter(
    (m) =>
      [
        "shelves",
        "drawers",
        "sink",
        "oven",
        "dishwasherFront",
        "refrigerator",
        "hood",
        "blindCorner",
      ].includes(m.construction) &&
      ["base", "wall", "tall", "appliance", "corner"].includes(m.category),
  ),
  ...fillers,
];
export const kitchenOptionsSchema = z.object({
  front: z.enum(["laminate", "lacquer", "fluted"]).default("laminate"),
  worktop: z.enum(["laminate", "compact"]).default("laminate"),
  drawers: z.enum(["amix", "blum"]).default("amix"),
  installation: z.boolean().default(true),
});
export const kitchenOptions = {
  front: {
    laminate: "Laminat matowy",
    lacquer: "MDF lakierowany mat",
    fluted: "MDF ryflowany lakierowany",
  },
  worktop: { laminate: "Blat laminowany", compact: "Blat kompaktowy HPL" },
  drawers: { amix: "AMIX + zawiasy Häfele", blum: "Blum + zawiasy Häfele" },
} as const;
export const kitchenFinishes = {
  white: "Biel matowa",
  oak: "Naturalny dąb",
  sage: "Szałwia",
  graphite: "Grafit",
  cashmere: "Kaszmir",
} as const;
export const kitchenItemSchema = z
  .object({
    id: z.string().uuid(),
    locked: z.boolean().optional(),
    catalogId: z
      .string()
      .refine((id) => customerKitchenCatalog.some((m) => m.id === id)),
    wall: z.enum(["a", "b", "c"]),
    width: z.number().int().min(20).max(1200).optional(),
    height: z.number().int().min(300).max(2600).optional(),
    depth: z.number().int().min(250).max(800).optional(),
    shelves: z.number().int().min(0).max(8).optional(),
    drawers: z.number().int().min(1).max(6).optional(),
    innerDrawers: z.number().int().min(0).max(3).optional(),
    appliance: kitchenApplianceSchema.optional(),
    gapBefore: z.number().int().min(0).max(4000).optional(),
    surround: z
      .object({
        left: z.boolean().optional(),
        right: z.boolean().optional(),
        top: z.boolean().optional(),
        bottom: z.boolean().optional(),
        projection: z.number().int().min(0).max(100).default(20),
      })
      .optional(),
    drawerFronts: z
      .object({
        mode: z.enum(["equal", "graduated", "custom"]),
        heightsFromTop: z
          .array(z.number().min(60).max(2600).nullable())
          .min(1)
          .max(6)
          .optional(),
      })
      .optional(),
  })
  .superRefine((i, ctx) => {
    const m = customerKitchenCatalog.find((m) => m.id === i.catalogId);
    if (!m) return;
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (i.surround) {
      if (m.construction === "filler")
        fail("surround", "Blenda nie otrzymuje obudowy szafki.");
      if (i.surround.top && domyslnaKonfiguracja(m).blat)
        fail(
          "surround",
          "Nad szafką jest już blat. Wieniec osłonowy dobierz do ciągu górnego lub wysokiego.",
        );
      if (i.surround.bottom && !isKitchenUpper(m))
        fail("surround", "Dolny wieniec osłonowy dotyczy ciągu wiszącego.");
    }
    if (
      i.width !== undefined &&
      (m.construction === "filler" ? i.width > 300 : i.width < 200)
    )
      fail(
        "width",
        m.construction === "filler"
          ? "Szerokość blendy: 20–300 mm."
          : "Szerokość szafki: 200–1200 mm.",
      );
    if (
      i.width !== undefined &&
      m.category === "appliance" &&
      i.width !== m.widthMM
    )
      fail(
        "width",
        "Szerokość zabudowy AGD zmienisz wybierając właściwy model szafki.",
      );
    if (
      i.height !== undefined &&
      ![m.heightMM, ...m.availableHeightsMM].includes(i.height)
    )
      fail("height", "Wybierz wysokość dostępną dla tej szafki.");
    if (
      i.depth !== undefined &&
      ![m.depthMM, ...m.availableDepthsMM].includes(i.depth)
    )
      fail("depth", "Wybierz głębokość dostępną dla tej szafki.");
    if (i.shelves !== undefined && m.construction !== "shelves")
      fail("shelves", "Półki można ustawiać w szafce półkowej.");
    if (i.appliance && m.category !== "appliance")
      fail("appliance", "Kartę urządzenia przypisz do zabudowy AGD.");
    if (i.drawers !== undefined && m.construction !== "drawers")
      fail("drawers", "Liczbę szuflad można ustawiać w szafce szufladowej.");
    if (
      i.innerDrawers &&
      (m.construction !== "drawers" ||
        i.drawers !== 1 ||
        (i.height ?? m.heightMM) < 600 ||
        (i.depth ?? m.depthMM) < 560)
    )
      fail(
        "innerDrawers",
        "Szuflady ukryte: wybierz jeden wspólny front, korpus wysokości co najmniej 600 mm i głębokości co najmniej 560 mm.",
      );
    if (i.drawerFronts !== undefined) {
      if (m.construction !== "drawers")
        fail("drawerFronts", "Podział frontów dotyczy szafki szufladowej.");
      else
        try {
          drawerStackHeights(
            i.height ?? m.heightMM,
            i.drawers ?? domyslnaKonfiguracja(m).liczbaSzuflad,
            USTAWIENIA_DOMYSLNE.konstrukcja.szczelinaFrontowMM,
            i.drawerFronts,
          );
        } catch (e) {
          fail(
            "drawerFronts",
            e instanceof Error ? e.message : "Niepoprawny podział frontów.",
          );
        }
    }
  });
export type KitchenItem = z.infer<typeof kitchenItemSchema>;
export const kitchenIslandSchema = z
  .object({
    x: z.number().int().min(0).max(8000),
    y: z.number().int().min(0).max(8000),
    rotation: z.union([z.literal(0), z.literal(90)]).default(0),
    depth: z.number().int().min(600).max(1200).default(900),
    items: z.array(kitchenItemSchema).min(1).max(8),
  })
  .superRefine((island, ctx) => {
    for (const item of island.items) {
      const m = customerKitchenCatalog.find((m) => m.id === item.catalogId);
      if (
        !m ||
        m.category !== "base" ||
        !["shelves", "drawers"].includes(m.construction) ||
        item.wall !== "a" ||
        item.gapBefore ||
        item.surround ||
        (item.height ?? m.heightMM) !== 720 ||
        (item.depth ?? m.depthMM) !== 560
      )
        ctx.addIssue({
          code: "custom",
          message:
            "Wyspa: szafki dolne półkowe lub szufladowe 720 × 560 mm, bez przerw i indywidualnych osłon.",
        });
    }
  });
export type KitchenIsland = z.infer<typeof kitchenIslandSchema>;
export const kitchenPlanningSchema = z.object({
  waterWall: z.enum(["auto", "a", "b", "c"]).default("auto"),
  sinkCenter: z.number().int().min(300).max(7700).optional(),
  dishwasher: z.enum(["600", "450", "none"]).default("600"),
});
export const kitchenInputSchema = z
  .object({
    layout: kitchenLayoutSchema,
    width: z.number().int().min(1800).max(8000),
    depth: z.number().int().min(1800).max(8000),
    returnLength: z.number().int().min(1800).max(8000).default(3600),
    height: z.number().int().min(2300).max(3500),
    finish: z
      .enum(["white", "oak", "sage", "graphite", "cashmere"])
      .default("oak"),
    decor: z
      .object({
        name: z.string().max(200),
        id: z.string().max(120),
        manufacturer: z.enum(["Egger", "Kronospan"]),
      })
      .optional(),
    items: z.array(kitchenItemSchema).max(24),
    planning: kitchenPlanningSchema.optional(),
    needs: kitchenNeedsSchema.optional(),
    projectDetails: kitchenProjectDetailsSchema,
    features: z.array(kitchenFeatureSchema).max(20).optional(),
    island: kitchenIslandSchema.optional(),
    architectFiles: architectFilesSchema.optional(),
    quote: kitchenOptionsSchema.default({}),
    standards: kitchenStandardsSchema.optional(),
  })
  .superRefine((d, ctx) => {
    for (const message of featureRoomIssues(d, kitchenWalls(d)))
      ctx.addIssue({ code: "custom", path: ["features"], message });
    const allItems = [...d.items, ...(d.island?.items ?? [])];
    if (new Set(allItems.map((i) => i.id)).size !== allItems.length)
      ctx.addIssue({
        code: "custom",
        message: "Powtarzające się identyfikatory szafek.",
      });
    if (d.items.some((i) => !kitchenWalls(d).includes(i.wall)))
      ctx.addIssue({
        code: "custom",
        message: "Szafka na nieużywanej ścianie.",
      });
    if (
      d.planning?.waterWall &&
      d.planning.waterWall !== "auto" &&
      !kitchenWalls(d).includes(d.planning.waterWall)
    )
      ctx.addIssue({
        code: "custom",
        path: ["planning", "waterWall"],
        message: "Ściana zlewu nie należy do wybranego układu.",
      });
  });
export type KitchenInput = z.infer<typeof kitchenInputSchema>;
export type KitchenQuoteOptions = z.infer<typeof kitchenOptionsSchema>;
export const kitchenWalls = (d: {
  layout: KitchenInput["layout"];
}): ("a" | "b" | "c")[] => kitchenLayoutWalls(d);
export const isKitchenUpper = (
  m: Pick<ModulKatalogowy, "category" | "construction">,
) => m.category === "wall" || m.construction === "hood";
export type KitchenGeometryInput = Omit<KitchenInput, "quote"> & {
  quote?: KitchenQuoteOptions;
};
export const kitchenPanelThickness = (d: KitchenGeometryInput) =>
  d.quote?.front === "lacquer" ? 19 : 18;
export function kitchenOuterBounds(m: Modul) {
  const s = m.konfiguracja.obudowaZewnetrzna;
  return {
    start: m.pozycjaXMM - (s?.lewy ? s.gruboscMM : 0),
    end: m.pozycjaXMM + m.szerokoscMM + (s?.prawy ? s.gruboscMM : 0),
  };
}
export function kitchenModules(d: KitchenGeometryInput): Modul[] {
  const ends: Record<string, number> = {};
  const result: Modul[] = d.items.map((i) => {
    const m = customerKitchenCatalog.find((m) => m.id === i.catalogId)!;
    const key = `${i.wall}-${isKitchenUpper(m) ? "upper" : "base"}`;
    const thickness = kitchenPanelThickness(d);
    const x =
      (ends[key] ?? kitchenWallStart(d, i.wall)) +
      (i.gapBefore ?? 0) +
      (i.surround?.left ? thickness : 0);
    const width = i.width ?? m.widthMM,
      height =
        i.height ??
        (d.standards && isStandardBase(m)
          ? d.standards.baseHeight
          : m.heightMM),
      depth = i.depth ?? m.depthMM;
    const config = domyslnaKonfiguracja({
      ...m,
      widthMM: width,
      heightMM: height,
    });
    if (i.shelves !== undefined) config.liczbaPolek = i.shelves;
    if (i.drawers !== undefined) config.liczbaSzuflad = i.drawers;
    if (i.drawerFronts !== undefined)
      config.podzialFrontowSzuflad = i.drawerFronts;
    if (i.innerDrawers) {
      config.szufladySystemowe = true;
      config.profilSzuflad =
        d.quote?.drawers === "blum"
          ? "blum-legrabox-m-wood"
          : "amix-elite-standard";
    }
    if (m.construction === "blindCorner") {
      config.stronaDrzwiNaroznika = "lewa";
      config.szerokoscDrzwiNaroznikaMM = 450;
    }
    if (i.surround)
      config.obudowaZewnetrzna = {
        lewy: i.surround.left,
        prawy: i.surround.right,
        gora: i.surround.top,
        dol: i.surround.bottom,
        wysuniecieMM: i.surround.projection,
        gruboscMM: thickness,
      };
    ends[key] = x + width + (i.surround?.right ? thickness : 0);
    const module: Modul = {
      id: i.id,
      katalogId: m.id,
      nazwa: m.name.replace(/\s+\d+$/, ` ${width}`),
      scianaId: i.wall,
      kategoria: m.category,
      konstrukcja: m.construction,
      pozycjaXMM: x,
      pozycjaYMM: isKitchenUpper(m)
        ? (d.standards?.upperBottom ?? m.bottomOffsetMM)
        : (d.standards?.plinth ?? 100),
      szerokoscMM: width,
      wysokoscMM: height,
      glebokoscMM: depth,
      konfiguracja: config,
      materialFrontuId: d.finish,
    };
    if (i.innerDrawers) {
      // One common external front; the engine lays out every hidden runner and box.
      config.podzialFrontowSzuflad = { mode: "equal" };
      let tree = mebelZModulu(module, USTAWIENIA_DOMYSLNE.konstrukcja);
      for (let n = 0; n < i.innerDrawers; n++)
        tree = dodajUkrytaSzuflade(tree, USTAWIENIA_DOMYSLNE.konstrukcja, {
          sprzezona: false,
        }).mebel;
      module.drzewo = tree;
    }
    return module;
  });
  if (d.island) {
    const islandModules = kitchenModules({
      ...d,
      island: undefined,
      layout: "straight",
      items: d.island.items,
      standards: d.standards ? { ...d.standards, baseHeight: 720 } : undefined,
    });
    const thickness = kitchenPanelThickness(d);
    islandModules.forEach((m, n) => {
      m.scianaId = "island";
      m.nazwa = `Wyspa · ${m.nazwa}`;
      m.konfiguracja.plecyDekoracyjne = { gruboscMM: thickness };
      m.konfiguracja.obudowaZewnetrzna = {
        lewy: n === 0,
        prawy: n === islandModules.length - 1,
        gruboscMM: thickness,
        wysuniecieMM: 0,
      };
      m.konfiguracja.blatWymiar = {
        szerokoscMM:
          m.szerokoscMM +
          (n === 0 ? thickness : 0) +
          (n === islandModules.length - 1 ? thickness : 0),
        glebokoscMM: d.island!.depth,
        xMM: n === 0 ? -thickness : 0,
        zMM: -21,
      };
    });
    result.push(...islandModules);
  }
  return result;
}
export function kitchenIssues(d: KitchenGeometryInput): string[] {
  const modules = kitchenModules(d),
    issues: string[] = [];
  issues.push(...featureRoomIssues(d, kitchenWalls(d)));
  issues.push(...islandIssues(d, modules));
  issues.push(...kitchenCollisions(d, modules).map((c) => c.message));
  for (const m of modules) {
    const catalog = customerKitchenCatalog.find((c) => c.id === m.katalogId)!;
    if (
      ![catalog.heightMM, ...catalog.availableHeightsMM].includes(m.wysokoscMM)
    )
      issues.push(
        `${m.nazwa}: wysokość ciągu nie jest dostępna dla tego modelu.`,
      );
    if (
      m.konfiguracja.blat &&
      m.pozycjaYMM + m.wysokoscMM + (d.quote?.worktop === "compact" ? 12 : 38) >
        d.height
    )
      issues.push(`${m.nazwa}: blat przekracza wysokość pomieszczenia.`);
  }
  for (const item of d.items) {
    if (!item.appliance) continue;
    const module = modules.find((m) => m.id === item.id)!;
    issues.push(
      ...kitchenApplianceFit(module, item.appliance).issues.map(
        (message) => `${module.nazwa}: ${message}`,
      ),
    );
  }
  for (const m of modules)
    for (const f of d.features ?? [])
      if (openingOverlaps(m, f, d.quote?.worktop === "compact" ? 12 : 38))
        issues.push(
          `${m.nazwa} koliduje z ${f.kind === "window" ? "oknem" : "drzwiami"} na ścianie ${f.wall.toUpperCase()}.`,
        );
  for (const m of modules.filter((m) => m.konstrukcja === "blindCorner")) {
    const next =
      m.scianaId === "a" && (d.layout === "l" || d.layout === "u")
        ? "b"
        : m.scianaId === "b" && d.layout === "u"
          ? "c"
          : undefined;
    const length = m.scianaId === "a" ? d.width : d.depth;
    if (
      !next ||
      m.szerokoscMM !== 1100 ||
      m.pozycjaXMM + m.szerokoscMM !== length ||
      m.konfiguracja.obudowaZewnetrzna
    )
      issues.push(
        "Szafka narożna ślepa 1100 musi kończyć ścianę poprzedzającą zakręt L/U, bez dodatkowych osłon.",
      );
  }
  for (const wall of kitchenWalls(d)) {
    const len = kitchenWallLength(d, wall);
    if (
      modules.some(
        (m) => m.scianaId === wall && kitchenOuterBounds(m).end > len,
      )
    )
      issues.push(
        `Szafki wychodzą poza ścianę ${wall.toUpperCase()}. Usuń szafkę lub zwiększ wymiar.`,
      );
  }
  if (
    modules.some(
      (m) =>
        m.pozycjaYMM +
          m.wysokoscMM +
          (m.konfiguracja.obudowaZewnetrzna?.gora
            ? m.konfiguracja.obudowaZewnetrzna.gruboscMM
            : 0) >
        d.height,
    )
  )
    issues.push(
      "Szafka przekracza wysokość pomieszczenia. Zmień jej wysokość.",
    );
  if (modules.some((m) => m.konfiguracja.liczbaPolek * 18 >= m.wysokoscMM - 36))
    issues.push("W szafce brakuje miejsca na wybraną liczbę półek.");
  if (
    modules.some(
      (a) =>
        a.wysokoscMM > 1500 &&
        a.kategoria !== "wall" &&
        a.konstrukcja !== "hood" &&
        modules.some(
          (b) =>
            (b.kategoria === "wall" || b.konstrukcja === "hood") &&
            a.scianaId === b.scianaId &&
            kitchenOuterBounds(a).start < kitchenOuterBounds(b).end &&
            kitchenOuterBounds(b).start < kitchenOuterBounds(a).end,
        ),
    )
  )
    issues.push(
      "Szafka wisząca nakłada się na słupek. Usuń lub przestaw szafki w tej ścianie.",
    );
  return issues;
}

/** Fit just the selected cabinet to its current row; appliances keep catalog sizes. */
export function kitchenFitWidth(
  d: Omit<KitchenInput, "quote">,
  id: string,
): number {
  const modules = kitchenModules(d),
    selected = modules.find((m) => m.id === id);
  if (!selected) throw new Error("Wybierz szafkę do dopasowania.");
  if (selected.kategoria === "appliance")
    throw new Error("Szerokość zabudowy AGD wynika z wybranego wariantu.");
  const length = kitchenPlanningEnd(
    d,
    selected.scianaId as KitchenItem["wall"],
  );
  const start = kitchenWallStart(d, selected.scianaId);
  const others = modules.filter(
    (m) =>
      m.id !== id &&
      m.scianaId === selected.scianaId &&
      (m.kategoria === "wall" || m.konstrukcja === "hood") ===
        (selected.kategoria === "wall" || selected.konstrukcja === "hood"),
  );
  const gaps = d.items
    .filter(
      (i) =>
        i.wall === selected.scianaId &&
        isKitchenUpper(
          customerKitchenCatalog.find((m) => m.id === i.catalogId)!,
        ) ===
          (selected.kategoria === "wall" || selected.konstrukcja === "hood"),
    )
    .reduce((sum, i) => sum + (i.gapBefore ?? 0), 0);
  const width =
    length -
    start -
    gaps -
    modules
      .filter(
        (m) =>
          m.scianaId === selected.scianaId &&
          (m.kategoria === "wall" || m.konstrukcja === "hood") ===
            (selected.kategoria === "wall" || selected.konstrukcja === "hood"),
      )
      .reduce(
        (sum, m) =>
          sum +
          kitchenOuterBounds(m).end -
          kitchenOuterBounds(m).start -
          m.szerokoscMM,
        0,
      ) -
    others.reduce((sum, m) => sum + m.szerokoscMM, 0);
  const min = selected.konstrukcja === "filler" ? 20 : 200;
  const max = selected.konstrukcja === "filler" ? 300 : 1200;
  if (width < min || width > max)
    throw new Error(
      `Dla tego elementu pozostaje ${width} mm. Zakres szerokości wynosi ${min}–${max} mm; zmień układ pozostałych szafek.`,
    );
  return width;
}

export { suggestKitchen } from "./kitchen-suggestion.js";
export interface KitchenEstimate {
  version: "oferta-2-a4-v1";
  basis: string;
  status: "estimated" | "blocked";
  gross: number | null;
  groups: { label: string; gross: number }[];
  scope: { label: string; description: string }[];
  notes: string[];
  issues: string[];
}
