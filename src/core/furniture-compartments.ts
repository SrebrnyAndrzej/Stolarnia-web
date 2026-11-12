import { z } from "zod";
import {
  backDepth,
  deskCabinetWidth,
  deskWorktopHeight,
  freshPlateSpecification,
  isDeskVariant,
  standardPlateSpecification,
  layoutCeiling,
  type FurnitureModel,
  type FurniturePlate,
} from "./furniture.js";

export const compartmentNodeSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(80),
    size: z.number().finite().min(60).max(10000).optional(),
    split: z
      .object({
        axis: z.enum(["x", "y"]),
        children: z.array(z.string().uuid()).min(2).max(8),
      })
      .strict()
      .optional(),
    interior: z.enum(["open", "shelves", "drawers"]),
    count: z.number().int().min(1).max(12),
    front: z.enum(["none", "door", "pair", "drawers"]),
    hinge: z.enum(["left", "right"]),
    mount: z.enum(["inset", "overlay"]),
  })
  .strict();
export const compartmentSchema = z
  .object({
    version: z.literal(1),
    roots: z
      .array(
        z
          .object({
            region: z.enum(["body", "desk-left", "desk-right", "hutch"]),
            nodeId: z.string().uuid(),
          })
          .strict(),
      )
      .min(1)
      .max(4),
    nodes: z.array(compartmentNodeSchema).min(1).max(60),
  })
  .strict();
export type CompartmentNode = z.infer<typeof compartmentNodeSchema>;
export type CompartmentLayout = z.infer<typeof compartmentSchema>;
export type CompartmentBox = {
  node: CompartmentNode;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  depth: number;
  level: number;
};
export const freshCompartment = (
  id: () => string,
  name = "Komora",
): CompartmentNode => ({
  id: id(),
  name,
  interior: "open",
  count: 3,
  front: "none",
  hinge: "left",
  mount: "inset",
});
export const compartmentStructurePlate = (p: FurniturePlate) =>
  !!p.anchor ||
  !p.layoutSlot ||
  !!(
    p.layoutSlot?.startsWith("desk/") &&
    !/\/(drawer\/\d+|door|shelf|divider)$/.test(p.layoutSlot)
  );
export function compartmentGraphIssues(layout: CompartmentLayout): string[] {
  const map = new Map(layout.nodes.map((n) => [n.id, n]));
  if (map.size !== layout.nodes.length)
    return ["Komory muszą mieć różne identyfikatory."];
  if (new Set(layout.roots.map((r) => r.region)).size !== layout.roots.length)
    return ["Obszar mebla może mieć tylko jedną komorę główną."];
  const visited = new Set<string>(),
    active = new Set<string>();
  const walk = (id: string, depth: number): boolean => {
    if (depth > 12 || active.has(id) || visited.has(id) || !map.has(id))
      return false;
    active.add(id);
    visited.add(id);
    for (const child of map.get(id)!.split?.children ?? [])
      if (!walk(child, depth + 1)) return false;
    active.delete(id);
    return true;
  };
  return layout.roots.every((r) => walk(r.nodeId, 0)) &&
    visited.size === map.size
    ? []
    : [
        "Podziały komór zawierają brakujące, powtórzone lub zapętlone powiązanie.",
      ];
}
export function compartmentBoxes(m: FurnitureModel): {
  boxes: CompartmentBox[];
  issues: string[];
} {
  const layout = m.compartments;
  if (!layout) return { boxes: [], issues: [] };
  const issues = compartmentGraphIssues(layout),
    boxes: CompartmentBox[] = [];
  if (issues.length) return { boxes, issues };
  const nodes = new Map(layout.nodes.map((n) => [n.id, n])),
    t = m.thickness;
  function walk(
    id: string,
    box: Omit<CompartmentBox, "node" | "level">,
    level: number,
  ) {
    const node = nodes.get(id)!;
    const current = { ...box, node, level };
    boxes.push(current);
    if (box.width < 60 || box.height < 60 || box.depth < 50) {
      issues.push(
        `${node.name}: za mało miejsca — zmień gabaryty lub blokady.`,
      );
      return;
    }
    if (!node.split) return;
    const axis = node.split.axis,
      children = node.split.children.map((id) => nodes.get(id)!);
    const available =
      (axis === "x" ? box.width : box.height) - (children.length - 1) * t;
    const locked = children.reduce((s, n) => s + (n.size ?? 0), 0),
      automatic = children.filter((n) => n.size === undefined).length;
    if (
      available < locked ||
      (!automatic && Math.abs(available - locked) > 0.1) ||
      (automatic && (available - locked) / automatic < 60)
    ) {
      issues.push(
        `${node.name}: zablokowane wymiary nie pasują do dostępnego miejsca. Zostaw co najmniej jeden wymiar automatyczny.`,
      );
      return;
    }
    let cursor = axis === "x" ? box.x : box.y;
    for (const child of children) {
      const size = child.size ?? (available - locked) / automatic;
      walk(
        child.id,
        {
          ...box,
          ...(axis === "x"
            ? { x: cursor, width: size }
            : { y: cursor, height: size }),
        },
        level + 1,
      );
      cursor += size + t;
    }
  }
  for (const root of layout.roots) {
    let x = t,
      y = t,
      width = m.width - 2 * t,
      height = m.height - 2 * t,
      z = backDepth(m),
      depth = m.depth - z;
    const cw = deskCabinetWidth(m),
      worktop = deskWorktopHeight(m);
    if (root.region === "desk-left" || root.region === "desk-right") {
      x = root.region === "desk-left" ? t : m.width - cw + t;
      width = cw - 2 * t;
      height = worktop - 2 * t;
      z = 3;
      depth = m.depth - 3;
      if (
        !isDeskVariant(m.suggestion?.variant) ||
        m.suggestion?.variant === "desk" ||
        (m.desk?.side !== "both" &&
          (root.region === "desk-left") !== (m.desk?.side === "left"))
      )
        issues.push(
          "Konfiguracja komór nie odpowiada stronie szafek biurka. Utwórz układ komór ponownie.",
        );
    } else if (root.region === "hutch") {
      y = worktop;
      height = m.height - worktop - t;
      z = 0;
      depth = m.desk?.hutchDepth ?? 300;
      if (m.suggestion?.variant !== "desk-hutch")
        issues.push("Komora nadstawki wymaga biurka z nadstawką.");
    } else if (isDeskVariant(m.suggestion?.variant)) {
      y = 0;
      height = worktop - t;
    }
    walk(root.nodeId, { x, y, width, height, z, depth }, 0);
  }
  return { boxes, issues };
}
export function startCompartments(
  m: FurnitureModel,
  id: () => string,
): FurnitureModel {
  const regions: CompartmentLayout["roots"][number]["region"][] =
    !isDeskVariant(m.suggestion?.variant) || m.suggestion?.variant === "desk"
      ? ["body"]
      : m.desk?.side === "both"
        ? ["desk-left", "desk-right"]
        : m.desk?.side === "left"
          ? ["desk-left"]
          : ["desk-right"];
  if (m.suggestion?.variant === "desk-hutch") regions.push("hutch");
  const names = {
    body: "Główna komora",
    "desk-left": "Lewa szafka",
    "desk-right": "Prawa szafka",
    hutch: "Nadstawka",
  };
  const nodes = regions.map((r) => freshCompartment(id, names[r]));
  const keep = (p: FurniturePlate) =>
    p.anchor ||
    (p.layoutSlot?.startsWith("desk/") &&
      !/\/(drawer\/\d+|door|shelf|divider)$/.test(p.layoutSlot));
  return rebuildCompartments(
    {
      ...m,
      compartments: {
        version: 1,
        roots: regions.map((region, i) => ({ region, nodeId: nodes[i].id })),
        nodes,
      },
      plates: m.plates.filter(keep),
      drawerAssemblies: [],
      customDrawerSet: false,
    },
    id,
  );
}
export function changeCompartment(
  m: FurnitureModel,
  nodeId: string,
  patch: Partial<CompartmentNode>,
  id: () => string,
): FurnitureModel {
  if (!m.compartments) return m;
  return rebuildCompartments(
    {
      ...m,
      compartments: {
        ...m.compartments,
        nodes: m.compartments.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...patch } : n,
        ),
      },
    },
    id,
  );
}
export function splitCompartment(
  m: FurnitureModel,
  nodeId: string,
  axis: "x" | "y",
  count: number,
  id: () => string,
): FurnitureModel {
  if (!m.compartments) return m;
  const node = m.compartments.nodes.find((n) => n.id === nodeId);
  if (!node || node.split || count < 2 || count > 8 || !Number.isInteger(count))
    return m;
  const children = Array.from({ length: count }, (_, i) =>
    freshCompartment(id, `${node.name.slice(0, 60)}.${i + 1}`),
  );
  return rebuildCompartments(
    {
      ...m,
      compartments: {
        ...m.compartments,
        nodes: [
          ...m.compartments.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  interior: "open" as const,
                  front: "none" as const,
                  split: { axis, children: children.map((c) => c.id) },
                }
              : n,
          ),
          ...children,
        ],
      },
    },
    id,
  );
}
export function mergeCompartment(
  m: FurnitureModel,
  nodeId: string,
  id: () => string,
): FurnitureModel {
  if (!m.compartments) return m;
  const remove = new Set<string>();
  const visit = (nid: string) => {
    for (const c of m.compartments!.nodes.find((n) => n.id === nid)?.split
      ?.children ?? []) {
      remove.add(c);
      visit(c);
    }
  };
  visit(nodeId);
  return rebuildCompartments(
    {
      ...m,
      compartments: {
        ...m.compartments,
        nodes: m.compartments.nodes
          .filter((n) => !remove.has(n.id))
          .map((n) => (n.id === nodeId ? { ...n, split: undefined } : n)),
      },
    },
    id,
  );
}
export function copyCompartment(
  m: FurnitureModel,
  from: string,
  to: string,
  id: () => string,
): FurnitureModel {
  if (from === to || !m.compartments) return m;
  const source = m.compartments.nodes.find((n) => n.id === from);
  const target = m.compartments.nodes.find((n) => n.id === to);
  if (!source || !target || source.split || target.split) return m;
  return changeCompartment(
    m,
    to,
    {
      interior: source.interior,
      front: source.front,
      count: source.count,
      hinge: source.hinge,
      mount: source.mount,
    },
    id,
  );
}
export function rebuildCompartments(
  m: FurnitureModel,
  id: () => string,
): FurnitureModel {
  if (!m.compartments) return m;
  const { boxes, issues } = compartmentBoxes(m);
  if (issues.length) return m;
  const generated: FurniturePlate[] = [],
    t = m.thickness;
  const add = (
    box: CompartmentBox,
    slot: string,
    name: string,
    kind: FurniturePlate["kind"],
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    face: "xy" | "xz" | "yz",
  ) => {
    if (width <= 0 || height <= 0 || depth <= 0) return;
    const layoutSlot = `compartment/${box.node.id}/${slot}`;
    const old = m.plates.find((p) => p.layoutSlot === layoutSlot);
    const plate: FurniturePlate = {
      id: old?.id ?? id(),
      layoutSlot,
      name: old?.name ?? `${box.node.name}: ${name}`,
      frontHardware: old?.kind === kind ? old.frontHardware : undefined,
      kind,
      x,
      y,
      z,
      width,
      height,
      depth,
    };
    plate.specification =
      old?.specification ??
      (m.construction
        ? standardPlateSpecification(m, plate)
        : { ...freshPlateSpecification(), face });
    if (m.construction && !old?.specification)
      plate.specification = { ...plate.specification, face };
    generated.push(old?.layoutCustomized ? old : plate);
  };
  for (const box of boxes) {
    const { node, x, y, width, height, z, depth } = box;
    if (node.split) {
      const children = boxes.filter((b) =>
        node.split!.children.includes(b.node.id),
      );
      children.slice(0, -1).forEach((child, i) => {
        if (node.split!.axis === "x") {
          const px = child.x + child.width;
          const top = Math.min(y + height, layoutCeiling(m, px, px + t));
          add(
            box,
            `divider/${i}`,
            "Przegroda",
            "board",
            px,
            y,
            z,
            t,
            top - y,
            depth,
            "yz",
          );
        } else
          add(
            box,
            `divider/${i}`,
            "Półka podziałowa",
            "board",
            x,
            child.y + child.height,
            z,
            width,
            t,
            depth,
            "xz",
          );
      });
    }
    const top = Math.min(y + height, layoutCeiling(m, x, x + width)),
      clear = top - y;
    if (!node.split && node.interior === "shelves")
      for (let i = 1; i <= node.count; i++)
        add(
          box,
          `shelf/${i}`,
          `Półka ${i}`,
          "board",
          x,
          y + ((clear - node.count * t) * i) / (node.count + 1) + (i - 1) * t,
          z,
          width,
          t,
          depth,
          "xz",
        );
    const drawers =
      !node.split && (node.interior === "drawers" || node.front === "drawers");
    if (drawers) {
      const available = clear - 4 - (node.count - 1) * 2;
      for (let i = 0; i < node.count; i++) {
        const start = Math.round((available * i) / node.count),
          end = Math.round((available * (i + 1)) / node.count);
        add(
          box,
          `drawer/${i}`,
          `Szuflada ${i + 1}`,
          "drawer",
          x + 2,
          y + 2 + start + i * 2,
          z + depth,
          width - 4,
          end - start,
          t,
          "xy",
        );
      }
    } else if (node.front === "door" || node.front === "pair") {
      const overlap = node.mount === "overlay" ? Math.max(0, t / 2 - 2) : 0;
      const fx = Math.max(0, x + 2 - overlap),
        fw = Math.min(m.width - fx, width - 4 + 2 * overlap),
        fy = Math.max(0, y + 2 - overlap),
        fh = Math.min(m.height - fy, clear - 4 + 2 * overlap);
      const n = node.front === "pair" ? 2 : 1,
        doorWidth = (fw - (n - 1) * 2) / n;
      for (let i = 0; i < n; i++)
        add(
          box,
          `door/${i}`,
          n === 2 ? `Drzwi ${i === 0 ? "lewe" : "prawe"}` : "Drzwi",
          "door",
          fx + i * (doorWidth + 2),
          fy,
          z + depth,
          doorWidth,
          fh,
          t,
          "xy",
        );
    }
  }
  const plates = [
    ...m.plates.filter((p) => !p.layoutSlot?.startsWith("compartment/")),
    ...generated,
  ];
  return {
    ...m,
    plates,
    drawerAssemblies: m.drawerAssemblies?.filter((a) =>
      plates.some((p) => p.id === a.frontId && p.kind === "drawer"),
    ),
  };
}
export function compartmentIssues(m: FurnitureModel): string[] {
  if (!m.compartments) return [];
  const { boxes, issues } = compartmentBoxes(m);
  for (const b of boxes)
    if (!b.node.split) {
      const top = Math.min(
        b.y + b.height,
        layoutCeiling(m, b.x, b.x + b.width),
      );
      if (top - b.y < 60)
        issues.push(
          `${b.node.name}: komora nie mieści się pod skosem lub schodami.`,
        );
      if (
        b.node.interior === "shelves" &&
        (top - b.y - b.node.count * m.thickness) / (b.node.count + 1) < 30
      )
        issues.push(`${b.node.name}: za dużo półek.`);
      if (
        (b.node.interior === "drawers" || b.node.front === "drawers") &&
        (top - b.y - 4 - (b.node.count - 1) * 2) / b.node.count < 60
      )
        issues.push(`${b.node.name}: za dużo szuflad — minimalny front 60 mm.`);
      if (
        b.node.interior === "drawers" &&
        b.node.front !== "none" &&
        b.node.front !== "drawers"
      )
        issues.push(
          `${b.node.name}: dla szuflad za drzwiami potrzebny jest zweryfikowany system szuflad wewnętrznych. Wybierz otwarty front lub fronty szuflad.`,
        );
    }
  if (m.plates.length > 150)
    issues.push("Model przekracza limit 150 płyt. Zmniejsz liczbę podziałów.");
  return issues;
}
