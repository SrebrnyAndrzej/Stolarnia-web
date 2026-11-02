/** Parametric library models in millimetres; both views consume these polygons. */
export type Point = [number, number];
/** Local U/V axes belong to the explicitly selected broad face, not the screen. */
export interface PlateSpecification {
  material: string;
  decor: string;
  face: "unset" | "xy" | "xz" | "yz" | "slope";
  grain: "unset" | "none" | "u" | "v";
  edges: Record<
    "u0" | "u1" | "v0" | "v1",
    {
      state: "unset" | "none" | "band";
      material: string;
      thickness: number;
    }
  >;
}
export interface FurniturePlate {
  id: string;
  name: string;
  kind: "board" | "drawer" | "cap";
  anchor?: "left" | "right" | "bottom" | "top" | "back";
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  specification?: PlateSpecification;
  layoutSlot?: string;
  layoutCustomized?: boolean;
}
export function freshPlateSpecification(): PlateSpecification {
  return {
    material: "",
    decor: "",
    face: "unset",
    grain: "unset",
    edges: Object.fromEntries(
      ["u0", "u1", "v0", "v1"].map((k) => [
        k,
        { state: "unset", material: "", thickness: 1 },
      ]),
    ) as PlateSpecification["edges"],
  };
}
export function plateThickness(
  m: FurnitureModel,
  p: FurniturePlate,
): number | null {
  const face = p.specification?.face;
  if (p.kind === "cap") return face === "slope" ? m.thickness : null;
  return face === "xy"
    ? p.depth
    : face === "xz"
      ? p.height
      : face === "yz"
        ? p.width
        : null;
}
export function plateSpecificationIssues(
  m: FurnitureModel,
  p: FurniturePlate,
): string[] {
  const s = p.specification;
  const issues: string[] = [];
  if (!s?.material.trim()) issues.push("brak materiału");
  if (!s?.decor.trim()) issues.push("brak dekoru / oznaczenia powierzchni");
  const thickness = plateThickness(m, p);
  if (thickness === null) issues.push("wybierz płaszczyznę płyty");
  else if (thickness > 100)
    issues.push("grubość powyżej 100 mm — sprawdź płaszczyznę lub geometrię");
  if (!s || s.grain === "unset") issues.push("brak decyzji o usłojeniu");
  if (s?.face === "xy" && platePolygon(m, p).length > 4)
    issues.push(
      "obrys wielokrawędziowy wymaga indywidualnego opisu krawędzi w technologii",
    );
  for (const key of ["u0", "u1", "v0", "v1"] as const) {
    const edge = s?.edges[key];
    if (!edge || edge.state === "unset")
      issues.push(`${key.toUpperCase()}: brak decyzji o obrzeżu`);
    else if (edge.state === "band" && !edge.material.trim())
      issues.push(`${key.toUpperCase()}: brak oznaczenia obrzeża`);
  }
  return issues;
}
/** Rebuild only generated members; preserve IDs and annotations for surviving slots. */
export function resizeFurniture(
  m: FurnitureModel,
  patch: Partial<FurnitureModel>,
  id: () => string,
): FurnitureModel {
  const next = { ...m, ...patch };
  const used = new Set<string>();
  next.plates = [
    ...carcass(next, id).map((generated): FurniturePlate => {
      const old = m.plates.find(
        (p) => p.anchor === generated.anchor && !used.has(p.id),
      );
      if (!old) return generated;
      used.add(old.id);
      return {
        ...generated,
        id: old.id,
        name: old.kind === generated.kind ? old.name : generated.name,
        specification:
          old.kind === generated.kind
            ? old.specification
            : old.specification
              ? {
                  ...old.specification,
                  face: generated.kind === "cap" ? "slope" : "xz",
                  grain: "unset",
                  edges: freshPlateSpecification().edges,
                }
              : generated.specification,
      };
    }),
    ...m.plates.filter((p) => !p.anchor && p.kind !== "cap"),
  ];
  return next.suggestion ? refreshSuggestedLayout(next, id) : next;
}
export interface FurnitureModel {
  name: string;
  width: number;
  height: number;
  depth: number;
  thickness: number;
  shape: "rectangle" | "slope" | "stairs";
  lowHeight: number;
  steps: number;
  reverse: boolean;
  plates: FurniturePlate[];
  construction?: ConstructionStandard;
  drawerAssemblies?: DrawerAssembly[];
  suggestion?: { variant: LayoutVariant; excludedSlots: string[] };
}
export type LayoutVariant =
  "auto" | "wardrobe" | "shelves" | "drawers" | "mixed" | "desk" | "empty";
export const layoutVariants: { value: LayoutVariant; label: string }[] = [
  { value: "auto", label: "Automatycznie do obrysu" },
  { value: "wardrobe", label: "Szafa — półki i wysoka komora" },
  { value: "shelves", label: "Regał z półkami" },
  { value: "drawers", label: "Komoda z szufladami" },
  { value: "mixed", label: "Półki i szuflady" },
  { value: "desk", label: "Biurko" },
  { value: "empty", label: "Sam korpus" },
];
export interface DrawerAssembly {
  frontId: string;
  profileId: string;
  variant: string;
  nominalLength: number | null;
  leftBoundaryId?: string;
  rightBoundaryId?: string;
}
export interface ConstructionStandard {
  version: 1;
  back: "none" | "applied";
  backThickness: number;
  dimensionMode: "unset" | "finished" | "substrate";
  bodyMaterial: string;
  bodyDecor: string;
  frontMaterial: string;
  frontDecor: string;
  backMaterial: string;
  backDecor: string;
  edgeMaterial: string;
  edgeThickness: number;
}
export const freshConstructionStandard = (): ConstructionStandard => ({
  version: 1,
  back: "none",
  backThickness: 3,
  dimensionMode: "unset",
  bodyMaterial: "",
  bodyDecor: "",
  frontMaterial: "",
  frontDecor: "",
  backMaterial: "",
  backDecor: "",
  edgeMaterial: "",
  edgeThickness: 1,
});
export const backDepth = (m: FurnitureModel) =>
  m.construction?.back === "applied" ? m.construction.backThickness : 0;
export function standardPlateSpecification(
  m: FurnitureModel,
  p: FurniturePlate,
): PlateSpecification {
  const s = m.construction ?? freshConstructionStandard();
  const result = freshPlateSpecification();
  const back = p.anchor === "back",
    front = p.kind === "drawer";
  result.material = back
    ? s.backMaterial
    : front
      ? s.frontMaterial
      : s.bodyMaterial;
  result.decor = back ? s.backDecor : front ? s.frontDecor : s.bodyDecor;
  result.face =
    back || front
      ? "xy"
      : p.kind === "cap"
        ? "slope"
        : p.anchor === "left" ||
            p.anchor === "right" ||
            p.specification?.face === "yz"
          ? "yz"
          : p.specification?.face === "xy"
            ? "xy"
            : "xz";
  // Grain is intentionally not guessed from a free-text decor name.
  for (const [key, edge] of Object.entries(result.edges)) {
    const exposed =
      !back &&
      (front ||
        (m.suggestion?.variant === "desk" && p.anchor === "top") ||
        key === (result.face === "yz" ? "u1" : "v1"));
    edge.state = exposed ? "band" : "none";
    edge.material = exposed ? s.edgeMaterial : "";
    edge.thickness = s.edgeThickness;
  }
  return result;
}
export function applyConstructionStandard(
  m: FurnitureModel,
  standard: ConstructionStandard,
  id: () => string,
  replace: boolean,
): FurnitureModel {
  const next = resizeFurniture(
    m,
    { construction: structuredClone(standard) },
    id,
  );
  next.plates = next.plates.map((p) => {
    if (!p.anchor && p.kind !== "drawer" && !p.layoutSlot) return p;
    const defaults = standardPlateSpecification(next, p),
      old = p.specification;
    if (replace || !old) return { ...p, specification: defaults };
    return {
      ...p,
      specification: {
        ...old,
        material: old.material.trim() ? old.material : defaults.material,
        decor: old.decor.trim() ? old.decor : defaults.decor,
        face: old.face === "unset" ? defaults.face : old.face,
        edges: Object.fromEntries(
          Object.entries(old.edges).map(([k, e]) => [
            k,
            e.state === "unset"
              ? defaults.edges[k as keyof typeof defaults.edges]
              : e,
          ]),
        ) as PlateSpecification["edges"],
      },
    };
  });
  return next;
}
export interface FurnitureEntry {
  id: string;
  version: number;
  model: FurnitureModel;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
  drawerCalculations?: import("./furniture-drawers.js").FurnitureDrawerCalculation[];
}
export const freshFurniture = (): FurnitureModel => ({
  name: "Nowy mebel",
  width: 1000,
  height: 2000,
  depth: 560,
  thickness: 18,
  shape: "rectangle",
  lowHeight: 900,
  steps: 4,
  reverse: false,
  plates: [],
});
export function topSegments(m: FurnitureModel) {
  const n = m.shape === "stairs" ? m.steps : 1;
  return Array.from({ length: n }, (_, i) => {
    const a =
      m.shape === "rectangle"
        ? m.height
        : m.shape === "slope"
          ? m.lowHeight
          : m.lowHeight + ((m.height - m.lowHeight) * i) / (n - 1);
    const b = m.shape === "slope" ? m.height : a;
    const s = { x: (m.width * i) / n, end: (m.width * (i + 1)) / n, a, b };
    return m.reverse
      ? { x: m.width - s.end, end: m.width - s.x, a: b, b: a }
      : s;
  }).sort((a, b) => a.x - b.x);
}
export function furnitureOutline(m: FurnitureModel): Point[] {
  return [
    [0, 0],
    [m.width, 0],
    ...topSegments(m)
      .reverse()
      .flatMap(
        (s) =>
          [
            [s.end, s.b],
            [s.x, s.a],
          ] as Point[],
      ),
  ];
}
export function availableHeight(m: FurnitureModel, x: number) {
  const segments = topSegments(m).filter(
    (s) => x >= s.x - 0.001 && x <= s.end + 0.001,
  );
  return segments.length
    ? Math.min(
        ...segments.map((s) => s.a + ((s.b - s.a) * (x - s.x)) / (s.end - s.x)),
      )
    : 0;
}
export function platePolygon(m: FurnitureModel, p: FurniturePlate): Point[] {
  let poly = furnitureOutline(m);
  const clip = (axis: 0 | 1, bound: number, greater: boolean) => {
    const out: Point[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length];
      const ain = greater ? a[axis] >= bound : a[axis] <= bound;
      const bin = greater ? b[axis] >= bound : b[axis] <= bound;
      if (ain) out.push(a);
      if (ain !== bin) {
        const t = (bound - a[axis]) / (b[axis] - a[axis]);
        out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    }
    poly = out;
  };
  clip(0, p.x, true);
  clip(0, p.x + p.width, false);
  clip(1, p.y, true);
  clip(1, p.y + p.height, false);
  if (p.kind === "cap") {
    const x = Math.max(m.thickness, p.x);
    const end = Math.min(m.width - m.thickness, p.x + p.width);
    const s = topSegments(m).find((s) => x >= s.x - 0.1 && end <= s.end + 0.1);
    if (s) {
      const gradient = (s.b - s.a) / (s.end - s.x);
      const a = s.a + gradient * (x - s.x);
      const b = s.a + gradient * (end - s.x);
      const t = m.thickness * Math.sqrt(1 + gradient ** 2);
      poly = [
        [x, Math.max(0, a - t)],
        [end, Math.max(0, b - t)],
        [end, b],
        [x, a],
      ];
    }
  }
  return poly;
}
export function polygonArea(p: Point[]) {
  return (
    Math.abs(
      p.reduce((sum, a, i) => {
        const b = p[(i + 1) % p.length];
        return sum + a[0] * b[1] - b[0] * a[1];
      }, 0),
    ) / 2
  );
}
export function furnitureIssues(m: FurnitureModel): string[] {
  const issues: string[] = [];
  if (
    m.suggestion?.variant === "desk" &&
    (m.shape !== "rectangle" || backDepth(m) > 0)
  )
    issues.push("Biurko wymaga poziomego blatu i wyłączonych pełnych pleców.");
  if (m.width <= 2 * m.thickness || m.height <= 2 * m.thickness)
    issues.push("Gabaryty muszą być większe niż dwie grubości płyty.");
  if (!m.plates.length) issues.push("Dodaj co najmniej jedną płytę.");
  if (m.lowHeight > m.height && m.shape !== "rectangle")
    issues.push("Dolna wysokość obrysu nie może przekraczać wysokości mebla.");
  for (const p of m.plates) {
    if (p.anchor !== "back" && p.z < backDepth(m) - 0.01)
      issues.push(
        `${p.name}: nachodzi na plecy. Ustaw Z co najmniej ${backDepth(m)} mm.`,
      );
    if (polygonArea(platePolygon(m, p)) < 1)
      issues.push(`${p.name}: płyta znajduje się poza obrysem.`);
    if (p.z < 0 || p.z + p.depth > m.depth + m.thickness + 0.1)
      issues.push(`${p.name}: płyta wychodzi poza głębokość mebla.`);
    if (p.kind === "drawer") {
      const top = Math.min(
        ...topSegments(m)
          .filter((s) => s.end > p.x && s.x < p.x + p.width)
          .flatMap((s) => [
            availableHeight(m, Math.max(s.x, p.x)),
            availableHeight(m, Math.min(s.end, p.x + p.width)),
          ]),
      );
      if (p.y + p.height > top + 0.1 || p.x < 0 || p.x + p.width > m.width)
        issues.push(`${p.name}: front nie mieści się pod skosem lub schodami.`);
    }
  }
  return [...new Set(issues)];
}
export function carcass(m: FurnitureModel, id: () => string): FurniturePlate[] {
  const t = m.thickness;
  if (m.suggestion?.variant === "desk") {
    const parts: FurniturePlate[] = [
      {
        id: id(),
        name: "Bok lewy biurka",
        kind: "board",
        anchor: "left",
        x: 0,
        y: 0,
        z: 0,
        width: t,
        height: m.height - t,
        depth: m.depth,
      },
      {
        id: id(),
        name: "Bok prawy biurka",
        kind: "board",
        anchor: "right",
        x: m.width - t,
        y: 0,
        z: 0,
        width: t,
        height: m.height - t,
        depth: m.depth,
      },
      {
        id: id(),
        name: "Blat biurka",
        kind: "board",
        anchor: "top",
        x: 0,
        y: m.height - t,
        z: 0,
        width: m.width,
        height: t,
        depth: m.depth,
      },
    ];
    return parts.map((p) => ({
      ...p,
      specification: m.construction
        ? standardPlateSpecification(m, p)
        : {
            ...freshPlateSpecification(),
            face: p.anchor === "top" ? "xz" : "yz",
          },
    }));
  }
  const b = backDepth(m);
  const generated: FurniturePlate[] = [
    {
      id: id(),
      name: "Bok lewy",
      kind: "board",
      anchor: "left",
      x: 0,
      y: 0,
      z: b,
      width: t,
      height: m.height,
      depth: m.depth - b,
    },
    {
      id: id(),
      name: "Bok prawy",
      kind: "board",
      anchor: "right",
      x: m.width - t,
      y: 0,
      z: b,
      width: t,
      height: m.height,
      depth: m.depth - b,
    },
    {
      id: id(),
      name: "Dno",
      kind: "board",
      anchor: "bottom",
      x: t,
      y: 0,
      z: b,
      width: m.width - 2 * t,
      height: t,
      depth: m.depth - b,
    },
    ...topSegments(m).map((s) => ({
      id: id(),
      name: "Wieniec górny",
      kind: "cap" as const,
      anchor: "top" as const,
      x: Math.max(t, s.x),
      y: Math.min(s.a, s.b) - t,
      z: b,
      width: Math.min(m.width - t, s.end) - Math.max(t, s.x),
      height: Math.abs(s.b - s.a) + t,
      depth: m.depth - b,
    })),
  ];
  if (b > 0)
    generated.push({
      id: id(),
      name: "Plecy nakładane",
      kind: "board",
      anchor: "back",
      x: 0,
      y: 0,
      z: 0,
      width: m.width,
      height: m.height,
      depth: b,
    });
  return m.construction
    ? generated.map((p) => ({
        ...p,
        specification: standardPlateSpecification(m, p),
      }))
    : generated;
}

/** Conservative inner ceiling, accounting for the normal thickness of each cap. */
function layoutCeiling(m: FurnitureModel, x: number, end: number) {
  return Math.min(
    ...topSegments(m)
      .filter((s) => s.end > x + 0.001 && s.x < end - 0.001)
      .map((s) => {
        const g = (s.b - s.a) / (s.end - s.x);
        const a = s.a + g * (Math.max(x, s.x) - s.x),
          b = s.a + g * (Math.min(end, s.end) - s.x);
        return Math.min(a, b) - m.thickness * Math.sqrt(1 + g * g);
      }),
  );
}
function suggestedInterior(
  m: FurnitureModel,
  id: () => string,
): FurniturePlate[] {
  const choice = m.suggestion?.variant ?? "empty";
  if (choice === "empty") return [];
  const t = m.thickness,
    b = backDepth(m),
    parts: FurniturePlate[] = [];
  if (choice === "desk") {
    const h = Math.min(150, m.height - 3 * t);
    if (h > 0 && m.width > 2 * t)
      parts.push({
        id: id(),
        name: "Tylna poprzeczka biurka",
        kind: "board",
        layoutSlot: "desk/apron",
        x: t,
        y: m.height - t - h,
        z: 0,
        width: m.width - 2 * t,
        height: h,
        depth: t,
        specification: {
          ...freshPlateSpecification(),
          face: "xy",
          material: m.construction?.bodyMaterial ?? "",
          decor: m.construction?.bodyDecor ?? "",
        },
      });
    return parts;
  }
  const kind =
    choice === "auto"
      ? m.shape === "rectangle"
        ? "wardrobe"
        : "shelves"
      : choice;
  const n =
    choice === "auto" && m.shape === "stairs"
      ? m.steps
      : kind === "wardrobe" || kind === "mixed" || m.shape === "slope"
        ? 2
        : 1;
  const inner = m.width - 2 * t;
  if (inner <= n * 64 + (n - 1) * t || m.depth - b <= t) return [];
  const cw = (inner - (n - 1) * t) / n;
  const add = (
    slot: string,
    name: string,
    vertical: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
    drawer = false,
  ) => {
    if (width <= 0 || height <= 0) return;
    const p: FurniturePlate = {
      id: id(),
      layoutSlot: `${kind}/${slot}`,
      name,
      kind: drawer ? "drawer" : "board",
      x,
      y,
      z: drawer ? m.depth : b,
      width,
      height,
      depth: drawer ? t : m.depth - b,
    };
    p.specification = m.construction
      ? standardPlateSpecification(m, {
          ...p,
          anchor: drawer ? undefined : vertical ? "left" : "bottom",
        })
      : {
          ...freshPlateSpecification(),
          face: drawer ? "xy" : vertical ? "yz" : "xz",
        };
    parts.push(p);
  };
  for (let i = 1; i < n; i++) {
    const x = t + i * cw + (i - 1) * t,
      h = layoutCeiling(m, x, x + t) - t;
    if (h > t)
      add(`divider/${i}`, `Przegroda sugerowana ${i}`, true, x, t, t, h);
  }
  for (let i = 0; i < n; i++) {
    const x = t + i * (cw + t),
      end = x + cw,
      top = layoutCeiling(m, x, end),
      clear = top - t;
    if (!Number.isFinite(clear) || clear < 64) continue;
    const drawers = kind === "drawers" || (kind === "mixed" && i === 0);
    if (drawers) {
      const zoneClear = kind === "mixed" ? Math.min(clear, 688) : clear,
        zoneTop = t + zoneClear;
      const count =
          kind === "drawers"
            ? Math.min(8, Math.max(1, Math.round(clear / 240)))
            : zoneClear >= 310
              ? 3
              : zoneClear >= 180
                ? 2
                : 1,
        ratios =
          count === 3
            ? kind === "mixed"
              ? [140 / 680, 220 / 680, 320 / 680]
              : [0.22, 0.33, 0.45]
            : count === 2
              ? [0.4, 0.6]
              : Array.from({ length: count }, () => 1 / count);
      const total = zoneClear - 4 - (count - 1) * 2;
      let y = t + 2;
      if (total / count < 60) continue;
      ratios.forEach((r, j) => {
        const h =
          j === count - 1
            ? zoneTop - 2 - y
            : Math.max(60, Math.floor(total * r));
        if (h >= 60) {
          add(
            `front/${i}/${j}`,
            `Front sugerowany ${i + 1}.${j + 1}`,
            false,
            x + 2,
            y,
            cw - 4,
            h,
            true,
          );
          y += h + 2;
        }
      });
      if (kind === "mixed" && top - zoneTop >= t + 100)
        add(
          `drawer-shelf/${i}`,
          `Półka nad szufladami ${i + 1}`,
          false,
          x,
          zoneTop,
          cw,
          t,
        );
    } else {
      const count =
        kind === "wardrobe" && i === n - 1
          ? 1
          : Math.min(3, Math.floor(clear / 180));
      for (let j = 1; j <= count; j++) {
        const ratio =
            kind === "wardrobe" && i === n - 1 ? 0.8 : j / (count + 1),
          y = t + Math.floor((clear - t) * ratio);
        if (y + t <= top)
          add(
            `shelf/${i}/${j}`,
            `Półka sugerowana ${i + 1}.${j}`,
            false,
            x,
            y,
            cw,
            t,
          );
      }
    }
  }
  return parts;
}
export function refreshSuggestedLayout(
  m: FurnitureModel,
  id: () => string,
): FurnitureModel {
  const generated = suggestedInterior(m, id),
    slots = new Set(generated.map((p) => p.layoutSlot));
  const retained = m.plates
    .filter(
      (p) => !p.layoutSlot || (p.layoutCustomized && !slots.has(p.layoutSlot)),
    )
    .map((p) =>
      p.layoutSlot && !slots.has(p.layoutSlot)
        ? { ...p, layoutSlot: undefined, layoutCustomized: undefined }
        : p,
    );
  const parts = generated
    .filter((p) => !m.suggestion?.excludedSlots.includes(p.layoutSlot!))
    .map((p) => {
      const old = m.plates.find((o) => o.layoutSlot === p.layoutSlot);
      return old?.layoutCustomized
        ? old
        : old
          ? {
              ...p,
              id: old.id,
              name: old.name,
              specification: old.specification ?? p.specification,
            }
          : p;
    });
  const plates = [...retained, ...parts];
  return {
    ...m,
    plates,
    drawerAssemblies: m.drawerAssemblies?.filter((a) =>
      plates.some((p) => p.id === a.frontId && p.kind === "drawer"),
    ),
  };
}
export function applySuggestedLayout(
  m: FurnitureModel,
  variant: LayoutVariant,
  id: () => string,
): FurnitureModel {
  const suggestion = { variant, excludedSlots: [] as string[] };
  const target = {
    ...m,
    shape: variant === "desk" ? ("rectangle" as const) : m.shape,
    construction:
      variant === "desk" && m.construction
        ? { ...m.construction, back: "none" as const }
        : m.construction,
  };
  const base = resizeFurniture(
    { ...target, suggestion: undefined },
    { suggestion },
    id,
  );
  return refreshSuggestedLayout(
    {
      ...base,
      plates: base.plates.filter((p) => !!p.anchor),
      drawerAssemblies: [],
      suggestion: { variant, excludedSlots: [] },
    },
    id,
  );
}
/** Project starting dimensions, not a declaration of standard compliance. */
export function deskStartingModel(
  m: FurnitureModel,
  id: () => string,
  width = 1600,
): FurnitureModel {
  return applySuggestedLayout(
    { ...m, width, height: 740, depth: 800, thickness: 28 },
    "desk",
    id,
  );
}
