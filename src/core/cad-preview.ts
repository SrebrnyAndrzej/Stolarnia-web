import parserModule, { type IDxf } from "dxf-parser";
import { CAD_PREVIEW_LIMIT, type CadUnit } from "./project-files.js";
const DxfParser = ((parserModule as unknown as { default?: unknown }).default ??
  parserModule) as new () => { parseSync(text: string): IDxf | null };
export interface CadPreview {
  unit: CadUnit | null;
  paths: { layer: string; points: [number, number][] }[];
  skipped: number;
  entities: number;
  warnings: string[];
}
/** Bounded, model-space 2D reference only. Never imports furniture or executes CAD content. */
export function cadPreview(text: string): CadPreview {
  if (text.length > CAD_PREVIEW_LIMIT)
    throw new Error(
      "Podgląd DXF obsługuje do 1 MiB. Oryginał nadal możesz pobrać.",
    );
  if (text.startsWith("AutoCAD Binary DXF"))
    throw new Error(
      "Podgląd wymaga tekstowego DXF. Poproś architekta o eksport ASCII DXF.",
    );
  const data = new DxfParser().parseSync(text.replace(/^\uFEFF/, ""));
  if (!data)
    throw new Error(
      "Nie udało się odczytać DXF. Pobierz oryginał lub wyeksportuj ASCII DXF ponownie.",
    );
  const unit =
    ({ 1: "in", 2: "ft", 4: "mm", 5: "cm", 6: "m" } as Record<number, CadUnit>)[
      Number(data.header?.$INSUNITS)
    ] ?? null;
  const paths: CadPreview["paths"] = [];
  let skipped = 0;
  let pointsCount = 0;
  const limit = data.entities.length > 20000;
  for (const entity of data.entities.slice(0, 20000)) {
    const e = entity as unknown as {
      type: string;
      layer?: string;
      inPaperSpace?: boolean;
      shape?: boolean;
      vertices?: { x: number; y: number; z?: number; bulge?: number }[];
      center?: { x: number; y: number; z?: number };
      radius?: number;
      startAngle?: number;
      endAngle?: number;
      extrusionDirection?: { x: number; y: number; z: number };
    };
    let points: [number, number][] = [];
    const tilted =
      e.extrusionDirection &&
      (Math.abs(e.extrusionDirection.x) > 0.000001 ||
        Math.abs(e.extrusionDirection.y) > 0.000001 ||
        e.extrusionDirection.z < 0);
    const ocs = entity as unknown as {
      extrusionDirectionX?: number;
      extrusionDirectionY?: number;
      extrusionDirectionZ?: number;
      elevation?: number;
    };
    if (
      e.inPaperSpace ||
      tilted ||
      Math.abs(ocs.extrusionDirectionX ?? 0) > 0.000001 ||
      Math.abs(ocs.extrusionDirectionY ?? 0) > 0.000001 ||
      (ocs.extrusionDirectionZ ?? 1) < 0 ||
      Math.abs(ocs.elevation ?? 0) > 0.000001 ||
      (e.vertices?.length ?? 0) > 10000
    ) {
      skipped++;
      continue;
    }
    if (
      ["LINE", "LWPOLYLINE", "POLYLINE"].includes(e.type) &&
      e.vertices &&
      !e.vertices.some((v) => v.bulge || (v.z && Math.abs(v.z) > 0.000001))
    ) {
      points = e.vertices
        .slice(0, e.type === "LINE" ? 2 : 10001)
        .map((v) => [v.x, -v.y]);
      if (e.shape && points.length) points.push(points[0]);
    } else if (
      ["CIRCLE", "ARC"].includes(e.type) &&
      e.center &&
      e.radius &&
      e.radius > 0 &&
      !e.center.z
    ) {
      const start = e.type === "CIRCLE" ? 0 : (e.startAngle ?? 0);
      let end = e.type === "CIRCLE" ? Math.PI * 2 : (e.endAngle ?? 0);
      if (end <= start) end += Math.PI * 2;
      points = Array.from({ length: 65 }, (_, i) => {
        const a = start + ((end - start) * i) / 64;
        return [
          e.center!.x + e.radius! * Math.cos(a),
          -e.center!.y - e.radius! * Math.sin(a),
        ];
      });
    }
    if (
      points.length < 2 ||
      points.some((p) =>
        p.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e9),
      ) ||
      paths.length >= 5000 ||
      pointsCount + points.length > 50000
    ) {
      skipped++;
      continue;
    }
    paths.push({ layer: (e.layer ?? "0").slice(0, 180), points });
    pointsCount += points.length;
  }
  skipped += Math.max(0, data.entities.length - 20000);
  return {
    unit,
    paths,
    skipped,
    entities: data.entities.length,
    warnings: [
      "Podgląd przestrzeni modelu 2D. Linie, proste polilinie, koła i łuki; łuki są przybliżone odcinkami. Bez opisów, wymiarowania, bloków, XREF, splajnów i geometrii 3D.",
      ...(skipped
        ? [
            `Pominięto ${skipped} elementów. Podgląd może być niepełny — sprawdź oryginał w CAD.`,
          ]
        : []),
      ...(limit ? ["Rysunek przekracza limit 20 000 elementów analizy."] : []),
    ],
  };
}
