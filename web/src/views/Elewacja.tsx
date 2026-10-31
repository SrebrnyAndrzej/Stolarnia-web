import { useRef, useState } from "react";
import { mm, type Material, type Modul } from "../api";
import type { TechnicalAnalysis, VisualMaterial } from "../../../src/server/technical";

interface ElewacjaProps {
  analiza: Pick<TechnicalAnalysis, "projekt" | "zbudowane">;
  scianaId: string;
  dlugosc: number;
  wysokosc: number;
  matMap: Map<string, Material | VisualMaterial>;
  blatId?: string;
  wybrany: string | null;
  onWybierz: (id: string | null) => void;
  readOnly?: boolean;
  onPrzesun?: (id: string, x: number) => void;
  onUpusc?: (katalogId: string, xMM: number) => void;
  onLuka?: (xMM: number, szerokoscMM: number, wiszacy: boolean) => void;
}

/** Wolne odcinki w rzędzie dolnym lub wiszącym (słupki blokują oba rzędy). */
function luki(moduly: Modul[], dlugosc: number, wiszacy: boolean): { x: number; szer: number }[] {
  const wRzedzie = moduly.filter((m) => (m.pozycjaYMM >= 1000) === wiszacy || m.wysokoscMM > 1400);
  if (wiszacy && !moduly.some((m) => m.pozycjaYMM >= 1000)) return [];
  const odcinki = wRzedzie.map((m) => [m.pozycjaXMM, m.pozycjaXMM + m.szerokoscMM] as const).sort((a, b) => a[0] - b[0]);
  const wynik: { x: number; szer: number }[] = [];
  let x = 0;
  for (const [a, b] of odcinki) {
    if (a - x >= 10) wynik.push({ x, szer: a - x });
    x = Math.max(x, b);
  }
  if (dlugosc - x >= 10) wynik.push({ x, szer: dlugosc - x });
  return wynik;
}

export function Elewacja({ readOnly = false, analiza, scianaId, dlugosc, wysokosc, matMap, blatId, wybrany, onWybierz, onPrzesun, onUpusc, onLuka }: ElewacjaProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ id: string; start: number; x0: number; x: number } | null>(null);
  const [cel, setCel] = useState<number | null>(null);
  const p = analiza.projekt;
  const pom = p.pomieszczenia.find((r) => r.sciany.some((s) => s.id === scianaId));
  const zbudowane = analiza.zbudowane.filter((z) => z.modul.scianaId === scianaId);
  const M = 160;
  const Y = (y: number) => wysokosc - y; // oś Y w górę

  const doMM = (clientX: number) => {
    const s = svg.current!;
    const pt = s.createSVGPoint();
    pt.x = clientX;
    pt.y = 0;
    return pt.matrixTransform(s.getScreenCTM()!.inverse()).x;
  };

  const przyciagnij = (id: string, x: number, w: number) => {
    const krawedzie = [0, dlugosc, ...zbudowane.filter((z) => z.modul.id !== id).flatMap((z) => [z.modul.pozycjaXMM, z.modul.pozycjaXMM + z.modul.szerokoscMM])];
    let best = Math.round(x / 5) * 5;
    let d = 25;
    for (const k of krawedzie) {
      if (Math.abs(x - k) < d) { d = Math.abs(x - k); best = k; }
      if (Math.abs(x + w - k) < d) { d = Math.abs(x + w - k); best = k - w; }
    }
    return Math.max(0, best);
  };

  const kolorMat = (id?: string, fallback = "#ddd") => (id && matMap.get(id)?.kolorHEX) || fallback;

  return (
    <svg
      ref={svg}
      className="elev"
      role={readOnly ? "img" : undefined}
      aria-label={readOnly ? "Widok ściany z wymiarami modułów w milimetrach" : undefined}
      viewBox={`${-M} ${-M * 1.6} ${dlugosc + 2 * M} ${wysokosc + M * 2.6}`}
      onPointerMove={(e) => {
        if (readOnly || !drag) return;
        const z = zbudowane.find((q) => q.modul.id === drag.id)!;
        setDrag({ ...drag, x: przyciagnij(drag.id, drag.x0 + doMM(e.clientX) - drag.start, z.modul.szerokoscMM) });
      }}
      onPointerUp={() => {
        if (!readOnly && drag && Math.abs(drag.x - drag.x0) > 0.5) onPrzesun?.(drag.id, drag.x);
        setDrag(null);
      }}
      onPointerDown={(e) => e.target === e.currentTarget && onWybierz(null)}
      onDragOver={(e) => {
        if (readOnly || !e.dataTransfer.types.includes("application/x-katalog")) return;
        e.preventDefault();
        setCel(doMM(e.clientX));
      }}
      onDragLeave={() => setCel(null)}
      onDrop={(e) => {
        if (readOnly) return;
        const id = e.dataTransfer.getData("application/x-katalog");
        setCel(null);
        if (id) {
          e.preventDefault();
          onUpusc?.(id, doMM(e.clientX));
        }
      }}
    >
      <defs>
        <pattern id="kreski" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="var(--line-strong)" strokeWidth="6" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={dlugosc} height={wysokosc} fill="var(--wall)" stroke="var(--line-strong)" strokeWidth={4} onPointerDown={() => onWybierz(null)} />
      <rect x={-M} y={wysokosc} width={dlugosc + 2 * M} height={40} fill="url(#kreski)" />
      <line x1={-M} x2={dlugosc + M} y1={wysokosc} y2={wysokosc} stroke="var(--floor)" strokeWidth={8} />
      <Wymiar x1={0} x2={dlugosc} y={-M * 1.1} tekst={`${mm(dlugosc)}`} gruby />
      {cel !== null && <line x1={cel} x2={cel} y1={0} y2={wysokosc} stroke="var(--accent)" strokeWidth={8} strokeDasharray="30 20" pointerEvents="none" />}

      {/* Luki w rzędach — klik domyka blendą lub szafką dopasowaną */}
      {!readOnly && !drag &&
        ([false, true] as const).flatMap((wiszacy) =>
          luki(zbudowane.map((z) => z.modul), dlugosc, wiszacy).map((l) => {
            const yMid = wiszacy ? Y(1400 + 360) : Y(100 + 360);
            return (
              <g key={`${wiszacy}-${l.x}`} className="luka" onClick={() => onLuka?.(l.x, l.szer, wiszacy)} style={{ cursor: "pointer" }}>
                <title>{`Luka ${mm(l.szer)} mm — kliknij, aby domknąć ${l.szer < 150 ? "blendą" : "szafką dopasowaną"}`}</title>
                <rect x={l.x} y={yMid - 360} width={l.szer} height={720} fill="var(--accent)" opacity={0.06} stroke="var(--accent)" strokeDasharray="16 12" strokeWidth={3} />
                <line x1={l.x} x2={l.x + l.szer} y1={yMid} y2={yMid} stroke="var(--accent)" strokeWidth={3} />
                <circle cx={l.x + l.szer / 2} cy={yMid} r={Math.min(46, l.szer / 2 - 2)} fill="var(--accent)" />
                {l.szer >= 60 && <text x={l.x + l.szer / 2} y={yMid + 18} textAnchor="middle" fontSize={56} fill="var(--accent-text)" fontWeight={700}>+</text>}
                {l.szer >= 160 && <text x={l.x + l.szer / 2} y={yMid - 70} textAnchor="middle" fontSize={52} fill="var(--accent)">{mm(l.szer)}</text>}
              </g>
            );
          }),
        )}

      {zbudowane.map(({ modul: m, elementy }) => {
        const x = drag?.id === m.id ? drag.x : m.pozycjaXMM;
        const sel = wybrany === m.id;
        const frontCol = kolorMat(m.materialFrontuId ?? pom?.materialFrontuId, "#e8e2d8");
        const korpCol = kolorMat(m.materialKorpusuId ?? pom?.materialKorpusuId, "#f4f3ed");
        const wiszacy = m.pozycjaYMM >= 1000;
        const bezKorpusu = m.konstrukcja === "dishwasherFront";
        return (
          <g
            key={m.id}
            style={{ cursor: readOnly ? "pointer" : drag?.id === m.id ? "grabbing" : "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (!readOnly) (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId);
              onWybierz(m.id);
              if (!readOnly) setDrag({ id: m.id, start: doMM(e.clientX), x0: m.pozycjaXMM, x: m.pozycjaXMM });
            }}
          >
            {/* Cokół / nogi */}
            {m.konfiguracja.nogi && <rect x={x + 5} y={Y(m.pozycjaYMM)} width={m.szerokoscMM - 10} height={m.pozycjaYMM} fill="var(--floor)" opacity={0.55} />}
            {/* Korpus */}
            {!bezKorpusu && <rect x={x} y={Y(m.pozycjaYMM + m.wysokoscMM)} width={m.szerokoscMM} height={m.wysokoscMM} fill={korpCol} stroke="#6b5a47" strokeWidth={3} />}
            {/* Fronty */}
            {elementy
              .filter((e) => e.rola === "front" || e.rola === "filler")
              .map((e) => {
                const fx = x + e.x;
                const fy = Y(m.pozycjaYMM + e.y + e.wys);
                const drzwi = e.kod.startsWith("FRONT-D");
                const szuflada = e.kod.startsWith("FRONT-SZ");
                const lewy = drzwi && Number(e.kod.slice(-2)) % 2 === 1;
                return (
                  <g key={e.kod}>
                    <rect x={fx} y={fy} width={e.szer} height={e.wys} fill={frontCol} stroke="#3b3128" strokeWidth={3} />
                    {drzwi && (
                      <polyline
                        points={lewy ? `${fx + e.szer},${fy} ${fx},${fy + e.wys / 2} ${fx + e.szer},${fy + e.wys}` : `${fx},${fy} ${fx + e.szer},${fy + e.wys / 2} ${fx},${fy + e.wys}`}
                        fill="none"
                        stroke="#3b3128"
                        strokeWidth={2}
                        strokeDasharray="14 10"
                        opacity={0.55}
                      />
                    )}
                    {szuflada && <line x1={fx + e.szer * 0.35} x2={fx + e.szer * 0.65} y1={fy + 30} y2={fy + 30} stroke="#3b3128" strokeWidth={8} strokeLinecap="round" />}
                    {e.kod === "FRONT-U01" && <line x1={fx + e.szer * 0.35} x2={fx + e.szer * 0.65} y1={fy + e.wys - 30} y2={fy + e.wys - 30} stroke="#3b3128" strokeWidth={8} strokeLinecap="round" />}
                  </g>
                );
              })}
            {/* Sanitariat: miska WC wisząca i przycisk (widok z przodu, poglądowo) */}
            {m.konfiguracja.sanitariat?.typ === "wcWiszace" && (() => {
              const rant = m.konfiguracja.sanitariat.wysokoscMiskiMM ?? 400;
              const py = m.konfiguracja.sanitariat.przyciskYMM ?? 1000;
              const cx = x + m.szerokoscMM / 2;
              return (
                <g pointerEvents="none">
                  <path d={`M ${cx - 180} ${Y(rant)} L ${cx + 180} ${Y(rant)} L ${cx + 130} ${Y(rant - 300)} Q ${cx} ${Y(rant - 330)} ${cx - 130} ${Y(rant - 300)} Z`} fill="#fbfbfa" stroke="#3b3128" strokeWidth={3} />
                  <rect x={cx - 185} y={Y(rant + 25)} width={370} height={25} rx={10} fill="#fbfbfa" stroke="#3b3128" strokeWidth={3} />
                  <rect x={cx - 125} y={Y(py + 82)} width={250} height={165} rx={12} fill="#d9dadc" stroke="#3b3128" strokeWidth={3} />
                  <line x1={cx} x2={cx} y1={Y(py + 70)} y2={Y(py - 70)} stroke="#3b3128" strokeWidth={3} />
                </g>
              );
            })()}
            {/* Blat */}
            {m.konfiguracja.blat && (
              <rect x={x} y={Y(m.pozycjaYMM + m.wysokoscMM + 38)} width={m.szerokoscMM} height={38} fill={kolorMat(blatId, "#a98f6e")} stroke="#3b3128" strokeWidth={2} />
            )}
            {/* Zaznaczenie */}
            {sel && (
              <rect
                x={x - 12}
                y={Y(m.pozycjaYMM + m.wysokoscMM + (m.konfiguracja.blat ? 38 : 0)) - 12}
                width={m.szerokoscMM + 24}
                height={m.wysokoscMM + (m.konfiguracja.blat ? 38 : 0) + 24}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={10}
                rx={8}
              />
            )}
            <Wymiar x1={x} x2={x + m.szerokoscMM} y={wiszacy ? Y(m.pozycjaYMM + m.wysokoscMM) - 60 : wysokosc + 110} tekst={mm(m.szerokoscMM)} />
          </g>
        );
      })}
    </svg>
  );
}

function Wymiar({ x1, x2, y, tekst, gruby }: { x1: number; x2: number; y: number; tekst: string; gruby?: boolean }) {
  const s = gruby ? 5 : 3;
  return (
    <g stroke="var(--muted)" fill="var(--muted)" pointerEvents="none">
      <line x1={x1} x2={x2} y1={y} y2={y} strokeWidth={s} />
      <line x1={x1} x2={x1} y1={y - 25} y2={y + 25} strokeWidth={s} />
      <line x1={x2} x2={x2} y1={y - 25} y2={y + 25} strokeWidth={s} />
      <text x={(x1 + x2) / 2} y={y - 18} textAnchor="middle" fontSize={gruby ? 70 : 56} stroke="none" style={{ fontVariantNumeric: "tabular-nums" }}>
        {tekst}
      </text>
    </g>
  );
}
