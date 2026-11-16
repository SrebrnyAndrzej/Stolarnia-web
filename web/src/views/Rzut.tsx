import { useMemo } from "react";
import {
  imageReferenceSize,
  type ArchitectImage,
} from "../../../src/core/architect-files";
import {
  granice,
  obrysModulu,
  punktNaRzucie,
  scianyNaRzucie,
} from "../../../src/core/geometry";
import { mm, type Analiza, type Material } from "../api";
import type {
  TechnicalAnalysis,
  VisualMaterial,
} from "../../../src/server/technical";
import {
  featureName,
  isKitchenOpening,
  type KitchenFeature,
} from "../../../src/core/kitchen-room";

interface Props {
  analiza: Pick<TechnicalAnalysis, "projekt" | "zbudowane">;
  pomieszczenieId: string;
  scianaId: string;
  wybrany: string | null;
  matMap: Map<string, VisualMaterial | Material>;
  onSciana: (id: string) => void;
  onWybierz: (id: string | null) => void;
  roomFeatures?: KitchenFeature[];
  architectPaths?: { layer: string; points: [number, number][] }[];
  architectImages?: ArchitectImage[];
  roomFootprint?: { width: number; depth: number };
  collisionIds?: string[];
}

/** Rzut pomieszczenia z góry: lica ścian, szafki dolne pełne, wiszące kreskowane. */
export function Rzut({
  analiza,
  pomieszczenieId,
  scianaId,
  wybrany,
  matMap,
  onSciana,
  onWybierz,
  roomFeatures = [],
  architectPaths = [],
  architectImages = [],
  roomFootprint,
  collisionIds = [],
}: Props) {
  const p = analiza.projekt;
  const pom =
    p.pomieszczenia.find((r) => r.id === pomieszczenieId) ?? p.pomieszczenia[0];
  const sciany = useMemo(() => scianyNaRzucie(pom), [pom]);
  const roomBounds = granice(sciany, 600);
  // Decorative plates can extend beyond the historical 600 mm plan margin.
  const coverPoints = analiza.zbudowane.flatMap(({ modul: m, elementy }) => {
    const wall = sciany.find((s) => s.sciana.id === m.scianaId);
    if (!wall) return [];
    return elementy
      .filter(
        (e) =>
          e.kod.startsWith("OSLONA-") ||
          (wall.sciana.wirtualna && e.rola === "worktop"),
      )
      .flatMap((e) => {
        const a = m.pozycjaXMM + e.x,
          b = a + e.szer;
        const near = m.glebokoscMM - e.z - e.gl,
          far = m.glebokoscMM - e.z;
        return [
          punktNaRzucie(wall, a, near),
          punktNaRzucie(wall, b, near),
          punktNaRzucie(wall, b, far),
          punktNaRzucie(wall, a, far),
        ];
      });
  });
  if (roomFootprint)
    coverPoints.push([0, 0], [roomFootprint.width, roomFootprint.depth]);
  for (const { reference: r } of architectImages) {
    const size = imageReferenceSize(r);
    coverPoints.push([r.x, r.y], [r.x + size.width, r.y + size.depth]);
  }
  if (architectPaths.length) {
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    for (const p of architectPaths)
      for (const [x, y] of p.points) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    if (Number.isFinite(left)) coverPoints.push([left, top], [right, bottom]);
  }
  const minX = Math.min(roomBounds.x, ...coverPoints.map(([x]) => x - 100));
  const minY = Math.min(roomBounds.y, ...coverPoints.map(([, y]) => y - 100));
  const g = {
    x: minX,
    y: minY,
    w:
      Math.max(
        roomBounds.x + roomBounds.w,
        ...coverPoints.map(([x]) => x + 100),
      ) - minX,
    h:
      Math.max(
        roomBounds.y + roomBounds.h,
        ...coverPoints.map(([, y]) => y + 100),
      ) - minY,
  };
  const GR = 120; // grubość ściany na rysunku

  const moduly = p.moduly
    .filter((m) => sciany.some((s) => s.sciana.id === m.scianaId))
    .sort((a, b) => a.pozycjaYMM - b.pozycjaYMM); // wiszące na wierzchu

  return (
    <svg
      className="elev"
      viewBox={`${g.x} ${g.y} ${g.w} ${g.h}`}
      onPointerDown={(e) => e.target === e.currentTarget && onWybierz(null)}
    >
      <rect
        x={g.x}
        y={g.y}
        width={g.w}
        height={g.h}
        fill="transparent"
        onPointerDown={() => onWybierz(null)}
      />
      <g data-architect-underlay pointerEvents="none" opacity="0.45">
        {architectImages.map(({ url, reference: r }) => {
          const w = r.crop.width * r.mmPerPixel,
            h = r.crop.height * r.mmPerPixel;
          const transform =
            r.rotation === 90
              ? `translate(${r.x + h} ${r.y}) rotate(90)`
              : r.rotation === 180
                ? `translate(${r.x + w} ${r.y + h}) rotate(180)`
                : r.rotation === 270
                  ? `translate(${r.x} ${r.y + w}) rotate(270)`
                  : `translate(${r.x} ${r.y})`;
          return (
            <g key={url} data-architect-image transform={transform}>
              <svg
                width={w}
                height={h}
                viewBox={`${r.crop.x} ${r.crop.y} ${r.crop.width} ${r.crop.height}`}
                overflow="hidden"
              >
                <image href={url} width={r.pixelWidth} height={r.pixelHeight} />
              </svg>
            </g>
          );
        })}
        {architectPaths.map((p, n) => (
          <polyline
            key={n}
            points={p.points.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {/* Ściany: pas po zewnętrznej stronie lica */}
      {sciany.map((w) => {
        const aktywna = w.sciana.id === scianaId;
        const pts = [
          [w.x1, w.y1],
          [w.x2, w.y2],
          [w.x2 - w.nx * GR, w.y2 - w.ny * GR],
          [w.x1 - w.nx * GR, w.y1 - w.ny * GR],
        ];
        const sx = (w.x1 + w.x2) / 2 - w.nx * (GR + 140);
        const sy = (w.y1 + w.y2) / 2 - w.ny * (GR + 140);
        // Napis wzdłuż ściany, nigdy do góry nogami
        let kat = (Math.atan2(w.dy, w.dx) * 180) / Math.PI;
        if (kat > 90) kat -= 180;
        if (kat <= -90) kat += 180;
        return (
          <g
            key={w.sciana.id}
            onClick={() => onSciana(w.sciana.id)}
            style={{ cursor: "pointer" }}
          >
            {w.sciana.wirtualna ? (
              <line
                x1={w.x1}
                y1={w.y1}
                x2={w.x2}
                y2={w.y2}
                stroke={aktywna ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth={14}
                strokeDasharray="60 40"
              />
            ) : (
              <polygon
                points={pts.map((q) => q.join(",")).join(" ")}
                fill={aktywna ? "var(--accent)" : "var(--line-strong)"}
              />
            )}
            <text
              x={sx}
              y={sy}
              transform={`rotate(${kat} ${sx} ${sy})`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={120}
              fill={aktywna ? "var(--accent)" : "var(--muted)"}
              fontWeight={600}
            >
              {w.sciana.nazwa} · {mm(w.sciana.dlugoscMM)}
            </text>
          </g>
        );
      })}

      {roomFeatures.map((f) => {
        const w = sciany.find((s) => s.sciana.id === f.wall);
        if (!w) return null;
        const a = punktNaRzucie(w, f.x, 0),
          b = punktNaRzucie(w, f.x + f.width, 0);
        return (
          <g key={f.id} data-room-feature={f.id} pointerEvents="none">
            <title>
              {featureName[f.kind]} · {f.x / 10} cm
            </title>
            {isKitchenOpening(f) ? (
              <line
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke="var(--muted)"
                strokeWidth={45}
                strokeDasharray="30 15"
              />
            ) : (
              <circle
                cx={a[0]}
                cy={a[1]}
                r={30}
                fill="var(--accent-soft)"
                stroke="var(--text)"
                strokeWidth={6}
              />
            )}
          </g>
        );
      })}
      {analiza.zbudowane.flatMap(({ modul: m, elementy }) => {
        const wall = sciany.find(
          (w) => w.sciana.id === m.scianaId && w.sciana.wirtualna,
        );
        if (!wall) return [];
        return elementy
          .filter((e) => e.rola === "worktop")
          .map((e) => {
            const a = m.pozycjaXMM + e.x,
              b = a + e.szer,
              near = m.glebokoscMM - e.z - e.gl,
              far = m.glebokoscMM - e.z;
            const points = [
              punktNaRzucie(wall, a, near),
              punktNaRzucie(wall, b, near),
              punktNaRzucie(wall, b, far),
              punktNaRzucie(wall, a, far),
            ];
            return (
              <polygon
                data-island-worktop
                key={`${m.id}-${e.kod}`}
                points={points.map((p) => p.join(",")).join(" ")}
                fill="#b58c5e"
                fillOpacity="0.55"
                stroke="var(--text)"
                strokeWidth="4"
                pointerEvents="none"
              >
                <title>
                  Blat wyspy · {e.szer} × {e.gl} mm
                </title>
              </polygon>
            );
          });
      })}
      {moduly.map((m) => {
        const w = sciany.find((s) => s.sciana.id === m.scianaId)!;
        const pts = obrysModulu(w, m);
        const wiszacy = m.pozycjaYMM >= 1000;
        const kolor =
          (m.materialFrontuId && matMap.get(m.materialFrontuId)?.kolorHEX) ||
          (pom.materialFrontuId &&
            matMap.get(pom.materialFrontuId)?.kolorHEX) ||
          "#c9b28f";
        const sel = m.id === wybrany;
        // Linia frontu (krawędź od strony pomieszczenia)
        const [f1, f2] = [pts[3], pts[2]];
        const cx = pts.reduce((s, q) => s + q[0], 0) / 4;
        const cy = pts.reduce((s, q) => s + q[1], 0) / 4;
        return (
          <g
            key={m.id}
            data-kitchen-cabinet={m.id}
            data-kitchen-collision={
              collisionIds.includes(m.id) ? "true" : undefined
            }
            onClick={(e) => {
              e.stopPropagation();
              onWybierz(m.id);
            }}
            style={{ cursor: "pointer" }}
          >
            <polygon
              points={pts.map((q) => q.join(",")).join(" ")}
              fill={wiszacy ? "none" : kolor}
              fillOpacity={wiszacy ? 0 : 0.85}
              stroke={
                collisionIds.includes(m.id)
                  ? "var(--danger)"
                  : sel
                    ? "var(--accent)"
                    : wiszacy
                      ? "var(--muted)"
                      : "#3b3128"
              }
              strokeWidth={
                collisionIds.includes(m.id) ? 28 : sel ? 30 : wiszacy ? 10 : 8
              }
              strokeDasharray={wiszacy ? "40 30" : undefined}
            />
            {analiza.zbudowane
              .find((b) => b.modul.id === m.id)
              ?.elementy.filter((e) => e.kod.startsWith("OSLONA-"))
              .map((e) => {
                const a = m.pozycjaXMM + e.x,
                  b = a + e.szer;
                const near = m.glebokoscMM - (e.z + e.gl),
                  far = m.glebokoscMM - e.z;
                const points = [
                  punktNaRzucie(w, a, near),
                  punktNaRzucie(w, b, near),
                  punktNaRzucie(w, b, far),
                  punktNaRzucie(w, a, far),
                ];
                return (
                  <polygon
                    key={e.kod}
                    data-kitchen-surround={e.kod}
                    points={points.map((p) => p.join(",")).join(" ")}
                    fill={kolor}
                    fillOpacity={0.25}
                    stroke={sel ? "var(--accent)" : "var(--muted)"}
                    strokeWidth={8}
                  >
                    <title>
                      {e.kod} · {e.szer} × {e.gl} mm
                    </title>
                  </polygon>
                );
              })}
            {!wiszacy && (
              <line
                x1={f1[0]}
                y1={f1[1]}
                x2={f2[0]}
                y2={f2[1]}
                stroke="#3b3128"
                strokeWidth={22}
              />
            )}
            {!wiszacy && m.szerokoscMM >= 300 && (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={90}
                fill="#1d1812"
                pointerEvents="none"
              >
                {mm(m.szerokoscMM)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
