import { useMemo } from "react";
import { granice, obrysModulu, scianyNaRzucie } from "../../../src/core/geometry";
import { mm, type Analiza, type Material } from "../api";

interface Props {
  analiza: Analiza;
  pomieszczenieId: string;
  scianaId: string;
  wybrany: string | null;
  matMap: Map<string, Material>;
  onSciana: (id: string) => void;
  onWybierz: (id: string | null) => void;
}

/** Rzut pomieszczenia z góry: lica ścian, szafki dolne pełne, wiszące kreskowane. */
export function Rzut({ analiza, pomieszczenieId, scianaId, wybrany, matMap, onSciana, onWybierz }: Props) {
  const p = analiza.projekt;
  const pom = p.pomieszczenia.find((r) => r.id === pomieszczenieId) ?? p.pomieszczenia[0];
  const sciany = useMemo(() => scianyNaRzucie(pom), [pom]);
  const g = granice(sciany, 600);
  const GR = 120; // grubość ściany na rysunku

  const moduly = p.moduly
    .filter((m) => sciany.some((s) => s.sciana.id === m.scianaId))
    .sort((a, b) => a.pozycjaYMM - b.pozycjaYMM); // wiszące na wierzchu

  return (
    <svg className="elev" viewBox={`${g.x} ${g.y} ${g.w} ${g.h}`} onPointerDown={(e) => e.target === e.currentTarget && onWybierz(null)}>
      <rect x={g.x} y={g.y} width={g.w} height={g.h} fill="transparent" onPointerDown={() => onWybierz(null)} />
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
          <g key={w.sciana.id} onClick={() => onSciana(w.sciana.id)} style={{ cursor: "pointer" }}>
            {w.sciana.wirtualna ? (
              <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={aktywna ? "var(--accent)" : "var(--line-strong)"} strokeWidth={14} strokeDasharray="60 40" />
            ) : (
              <polygon points={pts.map((q) => q.join(",")).join(" ")} fill={aktywna ? "var(--accent)" : "var(--line-strong)"} />
            )}
            <text x={sx} y={sy} transform={`rotate(${kat} ${sx} ${sy})`} textAnchor="middle" dominantBaseline="middle" fontSize={120} fill={aktywna ? "var(--accent)" : "var(--muted)"} fontWeight={600}>
              {w.sciana.nazwa} · {mm(w.sciana.dlugoscMM)}
            </text>
          </g>
        );
      })}

      {moduly.map((m) => {
        const w = sciany.find((s) => s.sciana.id === m.scianaId)!;
        const pts = obrysModulu(w, m);
        const wiszacy = m.pozycjaYMM >= 1000;
        const kolor = (m.materialFrontuId && matMap.get(m.materialFrontuId)?.kolorHEX) || (pom.materialFrontuId && matMap.get(pom.materialFrontuId)?.kolorHEX) || "#c9b28f";
        const sel = m.id === wybrany;
        // Linia frontu (krawędź od strony pomieszczenia)
        const [f1, f2] = [pts[3], pts[2]];
        const cx = pts.reduce((s, q) => s + q[0], 0) / 4;
        const cy = pts.reduce((s, q) => s + q[1], 0) / 4;
        return (
          <g
            key={m.id}
            onPointerDown={(e) => {
              e.stopPropagation();
              onWybierz(m.id);
            }}
            style={{ cursor: "pointer" }}
          >
            <polygon
              points={pts.map((q) => q.join(",")).join(" ")}
              fill={wiszacy ? "none" : kolor}
              fillOpacity={wiszacy ? 0 : 0.85}
              stroke={sel ? "var(--accent)" : wiszacy ? "var(--muted)" : "#3b3128"}
              strokeWidth={sel ? 30 : wiszacy ? 10 : 8}
              strokeDasharray={wiszacy ? "40 30" : undefined}
            />
            {!wiszacy && <line x1={f1[0]} y1={f1[1]} x2={f2[0]} y2={f2[1]} stroke="#3b3128" strokeWidth={22} />}
            {!wiszacy && m.szerokoscMM >= 300 && (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={90} fill="#1d1812" pointerEvents="none">
                {mm(m.szerokoscMM)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
