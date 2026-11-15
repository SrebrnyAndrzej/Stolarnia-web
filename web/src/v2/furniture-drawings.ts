import {
  availableHeight,
  type FurnitureModel,
  type Point,
} from "../../../src/core/furniture";
import {
  assemblyDrawing,
  drawingParts,
  drawingOpenings,
} from "../../../src/core/furniture-drawings";
import { furnitureOpenings } from "../../../src/core/furniture-openings";
import { verticalSection } from "../../../src/core/technical-openings";
export const drawingEscape = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const drawingMM = (v: number) =>
  v.toLocaleString("pl-PL", { maximumFractionDigits: 1 });
const esc = drawingEscape,
  mm = drawingMM;
const W = 520,
  H = 356;
const path = (points: Point[], cls = "board") =>
  `<polygon class="${cls}" points="${points.map((p) => p.join(",")).join(" ")}"/>`;
const text = (x: number, y: number, label: string, attrs = "") =>
  `<text x="${x}" y="${y}" ${attrs}>${esc(label)}</text>`;
/** Dimension and extension lines with oblique end ticks, all in drawing-space pixels. */
function dimension(
  a: Point,
  b: Point,
  label: string,
  offset: number,
  vertical = false,
) {
  const start: Point = vertical ? [a[0] + offset, a[1]] : [a[0], a[1] + offset];
  const end: Point = vertical ? [b[0] + offset, b[1]] : [b[0], b[1] + offset];
  const [x, y] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  return `<g class="dimension"><path d="M${a.join(" ")}L${start.join(" ")}M${b.join(" ")}L${end.join(" ")}" class="extension"/><path d="M${start.join(" ")}L${end.join(" ")}M${start[0] - 3} ${start[1] + 3}l6 -6M${end[0] - 3} ${end[1] + 3}l6 -6"/>${text(vertical ? x - 5 : x, vertical ? y : y - 5, label, `text-anchor="middle"${vertical ? ` transform="rotate(-90 ${x - 5} ${y})"` : ""}`)}</g>`;
}
export function technicalDrawingSvgs(model: FurnitureModel) {
  const { geometry, openings: allOpenings } = furnitureOpenings(model),
    openings = drawingOpenings(model, 16),
    parts = drawingParts(model);
  const s = Math.min(
    (W - 112) / Math.max(1, model.width),
    (H - 102) / Math.max(1, model.height),
  );
  const ox = (W - model.width * s) / 2,
    oy = H - 56;
  const point = ([x, y]: Point): Point => [ox + x * s, oy - y * s];
  const ref = (id: string) => parts.find((p) => p.plate.id === id)?.label ?? "";
  const labelled = new Set(
    parts
      .filter((p) => p.plate.kind !== "door" && p.plate.kind !== "drawer")
      .slice(0, 16)
      .map((p) => p.plate.id),
  );
  let front = geometry.map((p) => path(p.polygon.map(point))).join("");
  front += dimension(
    point([0, 0]),
    point([model.width, 0]),
    mm(model.width),
    30,
  );
  front += dimension(
    point([0, 0]),
    point([0, availableHeight(model, 0)]),
    mm(availableHeight(model, 0)),
    -30,
    true,
  );
  if (model.shape !== "rectangle")
    front += dimension(
      point([model.width, 0]),
      point([model.width, availableHeight(model, model.width)]),
      mm(availableHeight(model, model.width)),
      30,
      true,
    );
  front += openings
    .map((o) => {
      const a = point([o.probeX, o.y]),
        b = point([o.probeX, o.y + o.height]);
      const height = Math.abs(a[1] - b[1]);
      return height >= `${o.label}: ${mm(o.height)}`.length * 9 + 12
        ? dimension(a, b, `${o.label}: ${mm(o.height)}`, 0, true)
        : height >= 30
          ? dimension(a, b, o.label, 0, true)
          : "";
    })
    .join("");
  front += geometry
    .filter((p) => labelled.has(p.id))
    .map((p) => {
      const px = p.polygon.map((q) => q[0]),
        py = p.polygon.map((q) => q[1]);
      const a = point([
        (Math.min(...px) + Math.max(...px)) / 2,
        (Math.min(...py) + Math.max(...py)) / 2,
      ]);
      const vertical =
        Math.max(...py) - Math.min(...py) > Math.max(...px) - Math.min(...px);
      return text(
        a[0],
        a[1] + 3,
        ref(p.id),
        `class="part-label" text-anchor="middle"${vertical ? ` transform="rotate(-90 ${a[0]} ${a[1]})"` : ""}`,
      );
    })
    .join("");
  const probe = model.width / 2,
    ss = Math.min(
      (W - 112) / Math.max(1, model.depth),
      (H - 102) / Math.max(1, model.height),
    );
  const left = (W - model.depth * ss) / 2,
    base = H - 56;
  let side = parts
    .filter(({ plate: p }) => p.kind !== "door" && p.kind !== "drawer")
    .map(({ plate: p, polygon }) => {
      const range = verticalSection(polygon, probe);
      return range
        ? `<rect class="section-board" x="${left + p.z * ss}" y="${base - range[1] * ss}" width="${p.depth * ss}" height="${(range[1] - range[0]) * ss}"/>`
        : "";
    })
    .join("");
  side += dimension(
    [left, base],
    [left + model.depth * ss, base],
    mm(model.depth),
    30,
  );
  side += text(
    W / 2,
    18,
    `X = ${mm(probe)} mm od lewej`,
    'text-anchor="middle"',
  );
  side += text(left, base - 5, "TYŁ", 'text-anchor="end"');
  side += text(left + model.depth * ss + 4, base - 5, "PRZÓD");
  const svg = (label: string, content: string, section = false) =>
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${section ? '<defs><pattern id="section-hatch" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M-1 1L1 -1M0 5L5 0M4 6L6 4" stroke="#a5ada8" stroke-width=".7"/></pattern></defs>' : ""}${content}</svg>`;
  return {
    front: svg("Wnętrze i światło między półkami", front),
    side: svg("Przekrój boczny w osi mebla", side, true),
    openings,
    openingCount: allOpenings.length,
  };
}
export function assemblyDrawingSvg(model: FurnitureModel) {
  const scene = assemblyDrawing(model),
    { bounds } = scene;
  const s = Math.min(
    (W - 112) / Math.max(1, bounds.right - bounds.left),
    (H - 48) / Math.max(1, bounds.bottom - bounds.top),
  );
  const X = (x: number) =>
    (W - (bounds.right - bounds.left) * s) / 2 + (x - bounds.left) * s;
  const Y = (y: number) => 24 + (y - bounds.top) * s;
  const labels = [false, true]
    .flatMap((right) =>
      scene.parts
        .slice(0, 16)
        .filter((p) => X(p.point[0]) >= W / 2 === right)
        .sort((a, b) => a.point[1] - b.point[1])
        .map((p, i, group) => {
          const y =
              group.length === 1
                ? H / 2
                : 32 + (i * (H - 64)) / (group.length - 1),
            x = right ? W - 12 : 12;
          return `<path class="leader" d="M${X(p.point[0])} ${Y(p.point[1])}L${right ? W - 54 : 54} ${y - 4}L${right ? W - 34 : 34} ${y - 4}"/>${text(x, y, p.label, `text-anchor="${right ? "end" : "start"}" class="part-label"`)}`;
        }),
    )
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Widok rozstrzelony korpusu z oznaczeniami części">${scene.faces
    .map((f) =>
      path(
        f.points.map(([x, y]) => [X(x), Y(y)]),
        f.tone === "edge" ? "assembly-edge" : "assembly-face",
      ),
    )
    .join("")}${labels}</svg>`;
}
