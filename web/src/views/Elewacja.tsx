import { useRef, useState } from "react";
import { mm, type Material, type Modul } from "../api";
import type {
  TechnicalAnalysis,
  VisualMaterial,
} from "../../../src/server/technical";
import {
  featureName,
  isKitchenOpening,
  type KitchenFeature,
} from "../../../src/core/kitchen-room";

interface ElewacjaProps {
  analiza: Pick<TechnicalAnalysis, "projekt" | "zbudowane">;
  scianaId: string;
  dlugosc: number;
  wysokosc: number;
  matMap: Map<string, Material | VisualMaterial>;
  blatId?: string;
  wybrany: string | null;
  onWybierz: (id: string | null) => void;
  onEditWidth?: (id: string) => void;
  canEditWidth?: (id: string) => boolean;
  focusSelected?: boolean;
  readOnly?: boolean;
  showFunctions?: boolean;
  onPrzesun?: (id: string, x: number) => void;
  onUpusc?: (katalogId: string, xMM: number) => void;
  onLuka?: (xMM: number, szerokoscMM: number, wiszacy: boolean) => void;
  roomFeatures?: KitchenFeature[];
  kitchenGaps?: { id: string; start: number; width: number; tier: string }[];
  onKitchenGap?: (id: string) => void;
  collisionIds?: string[];
}

/** Wolne odcinki w rzędzie dolnym lub wiszącym (słupki blokują oba rzędy). */
export function luki(
  moduly: Modul[],
  dlugosc: number,
  wiszacy: boolean,
): { x: number; szer: number }[] {
  const wRzedzie = moduly.filter(
    (m) => m.pozycjaYMM >= 1000 === wiszacy || m.wysokoscMM > 1400,
  );
  if (wiszacy && !moduly.some((m) => m.pozycjaYMM >= 1000)) return [];
  const odcinki = wRzedzie
    .map((m) => [m.pozycjaXMM, m.pozycjaXMM + m.szerokoscMM] as const)
    .sort((a, b) => a[0] - b[0]);
  const wynik: { x: number; szer: number }[] = [];
  let x = 0;
  for (const [a, b] of odcinki) {
    if (a - x >= 10) wynik.push({ x, szer: a - x });
    x = Math.max(x, b);
  }
  if (dlugosc - x >= 10) wynik.push({ x, szer: dlugosc - x });
  return wynik;
}

export function Elewacja({
  readOnly = false,
  showFunctions = false,
  collisionIds = [],
  analiza,
  scianaId,
  dlugosc,
  wysokosc,
  matMap,
  blatId,
  wybrany,
  onWybierz,
  onEditWidth,
  canEditWidth,
  focusSelected = false,
  onPrzesun,
  onUpusc,
  onLuka,
  roomFeatures = [],
  kitchenGaps = [],
  onKitchenGap,
}: ElewacjaProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{
    id: string;
    start: number;
    x0: number;
    x: number;
  } | null>(null);
  const [cel, setCel] = useState<number | null>(null);
  const p = analiza.projekt;
  const pom = p.pomieszczenia.find((r) =>
    r.sciany.some((s) => s.id === scianaId),
  );
  const zbudowane = analiza.zbudowane.filter(
    (z) => z.modul.scianaId === scianaId,
  );
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
    const krawedzie = [
      0,
      dlugosc,
      ...zbudowane
        .filter((z) => z.modul.id !== id)
        .flatMap((z) => [
          z.modul.pozycjaXMM,
          z.modul.pozycjaXMM + z.modul.szerokoscMM,
        ]),
    ];
    let best = Math.round(x / 5) * 5;
    let d = 25;
    for (const k of krawedzie) {
      if (Math.abs(x - k) < d) {
        d = Math.abs(x - k);
        best = k;
      }
      if (Math.abs(x + w - k) < d) {
        d = Math.abs(x + w - k);
        best = k - w;
      }
    }
    return Math.max(0, best);
  };

  const kolorMat = (id?: string, fallback = "#ddd") =>
    (id && matMap.get(id)?.kolorHEX) || fallback;
  const focused = focusSelected
    ? zbudowane.find((z) => z.modul.id === wybrany)?.modul
    : undefined;
  const focusedTop = focused
    ? Y(focused.pozycjaYMM + focused.wysokoscMM) - M * 1.6
    : 0;
  const focusedBottom = focused
    ? Math.max(
        Y(focused.pozycjaYMM) + M,
        focused.pozycjaYMM < 1000 ? wysokosc + 200 : 0,
      )
    : 0;
  const frame = focused
    ? `${focused.pozycjaXMM - M} ${focusedTop} ${focused.szerokoscMM + 2 * M} ${focusedBottom - focusedTop}`
    : `${-M} ${-M * 1.6} ${dlugosc + 2 * M} ${wysokosc + M * 2.6}`;

  return (
    <svg
      ref={svg}
      className="elev"
      role={
        readOnly
          ? onEditWidth ||
            (onKitchenGap && kitchenGaps.some((g) => g.width >= 20))
            ? "group"
            : "img"
          : undefined
      }
      aria-label={
        readOnly ? "Widok ściany z wymiarami modułów w milimetrach" : undefined
      }
      viewBox={frame}
      onPointerMove={(e) => {
        if (readOnly || !drag) return;
        const z = zbudowane.find((q) => q.modul.id === drag.id)!;
        setDrag({
          ...drag,
          x: przyciagnij(
            drag.id,
            drag.x0 + doMM(e.clientX) - drag.start,
            z.modul.szerokoscMM,
          ),
        });
      }}
      onPointerUp={() => {
        if (!readOnly && drag && Math.abs(drag.x - drag.x0) > 0.5)
          onPrzesun?.(drag.id, drag.x);
        setDrag(null);
      }}
      onPointerDown={(e) => e.target === e.currentTarget && onWybierz(null)}
      onDragOver={(e) => {
        if (readOnly || !e.dataTransfer.types.includes("application/x-katalog"))
          return;
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
        <pattern
          id="kreski"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="40"
            stroke="var(--line-strong)"
            strokeWidth="6"
          />
        </pattern>
      </defs>
      <rect
        x={0}
        y={0}
        width={dlugosc}
        height={wysokosc}
        fill="var(--wall)"
        stroke="var(--line-strong)"
        strokeWidth={4}
        onPointerDown={() => onWybierz(null)}
      />
      {roomFeatures
        .filter((f) => f.wall === scianaId)
        .map((f) => (
          <g key={f.id} data-room-feature={f.id} pointerEvents="none">
            <title>
              {featureName[f.kind]} · {f.x / 10} cm od początku ściany
            </title>
            {isKitchenOpening(f) ? (
              <>
                <rect
                  x={f.x}
                  y={Y(f.bottom + f.height)}
                  width={f.width}
                  height={f.height}
                  fill="var(--panel-2)"
                  stroke="var(--muted)"
                  strokeWidth={6}
                  strokeDasharray={f.kind === "door" ? "24 12" : undefined}
                />
                <text
                  x={f.x + f.width / 2}
                  y={Y(f.bottom + f.height) + 70}
                  textAnchor="middle"
                  fontSize={52}
                  fill="var(--text)"
                >
                  {featureName[f.kind]}
                </text>
              </>
            ) : (
              <>
                <circle
                  cx={f.x}
                  cy={Y(f.bottom)}
                  r={30}
                  fill="var(--accent-soft)"
                  stroke="var(--text)"
                  strokeWidth={4}
                />
                <text
                  x={f.x + 40}
                  y={Y(f.bottom) - 30}
                  fontSize={45}
                  fill="var(--text)"
                >
                  {featureName[f.kind]}
                </text>
              </>
            )}
          </g>
        ))}
      {kitchenGaps
        .filter((g) => g.width >= 20)
        .map((g) => {
          const y = Y(g.tier === "wall" ? 2120 : 820);
          return (
            <g
              key={g.id}
              role="button"
              tabIndex={0}
              aria-label={`Dodaj w luce ${g.width / 10} cm, ${g.tier === "wall" ? "górne" : "dolne"}, od ${g.start / 10} cm`}
              data-kitchen-gap={g.id}
              className="kp-svg-gap"
              onClick={() => onKitchenGap?.(g.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onKitchenGap?.(g.id);
                }
              }}
            >
              <rect
                x={g.start + 3}
                y={y}
                width={Math.max(1, g.width - 6)}
                height={720}
                fill="var(--accent-soft)"
                fillOpacity={0.28}
                stroke="var(--line-strong)"
                strokeWidth={4}
                strokeDasharray="12 12"
              />
              <text
                x={g.start + g.width / 2}
                y={y + 380}
                textAnchor="middle"
                fontSize={Math.min(75, g.width)}
                fill="var(--text)"
              >
                +
              </text>
            </g>
          );
        })}
      <rect
        x={-M}
        y={wysokosc}
        width={dlugosc + 2 * M}
        height={40}
        fill="url(#kreski)"
      />
      <line
        x1={-M}
        x2={dlugosc + M}
        y1={wysokosc}
        y2={wysokosc}
        stroke="var(--floor)"
        strokeWidth={8}
      />
      <Wymiar x1={0} x2={dlugosc} y={-M * 1.1} tekst={`${mm(dlugosc)}`} gruby />
      {cel !== null && (
        <line
          x1={cel}
          x2={cel}
          y1={0}
          y2={wysokosc}
          stroke="var(--accent)"
          strokeWidth={8}
          strokeDasharray="30 20"
          pointerEvents="none"
        />
      )}

      {/* Luki w rzędach — klik domyka blendą lub szafką dopasowaną */}
      {!readOnly &&
        !drag &&
        ([false, true] as const).flatMap((wiszacy) =>
          luki(
            zbudowane.map((z) => z.modul),
            dlugosc,
            wiszacy,
          ).map((l) => {
            const yMid = wiszacy ? Y(1400 + 360) : Y(100 + 360);
            return (
              <g
                key={`${wiszacy}-${l.x}`}
                className="luka"
                onClick={() => onLuka?.(l.x, l.szer, wiszacy)}
                style={{ cursor: "pointer" }}
              >
                <title>{`Luka ${mm(l.szer)} mm — kliknij, aby domknąć ${l.szer < 150 ? "blendą" : "szafką dopasowaną"}`}</title>
                <rect
                  x={l.x}
                  y={yMid - 360}
                  width={l.szer}
                  height={720}
                  fill="var(--accent)"
                  opacity={0.06}
                  stroke="var(--accent)"
                  strokeDasharray="16 12"
                  strokeWidth={3}
                />
                <line
                  x1={l.x}
                  x2={l.x + l.szer}
                  y1={yMid}
                  y2={yMid}
                  stroke="var(--accent)"
                  strokeWidth={3}
                />
                <circle
                  cx={l.x + l.szer / 2}
                  cy={yMid}
                  r={Math.min(46, l.szer / 2 - 2)}
                  fill="var(--accent)"
                />
                {l.szer >= 60 && (
                  <text
                    x={l.x + l.szer / 2}
                    y={yMid + 18}
                    textAnchor="middle"
                    fontSize={56}
                    fill="var(--accent-text)"
                    fontWeight={700}
                  >
                    +
                  </text>
                )}
                {l.szer >= 160 && (
                  <text
                    x={l.x + l.szer / 2}
                    y={yMid - 70}
                    textAnchor="middle"
                    fontSize={52}
                    fill="var(--accent)"
                  >
                    {mm(l.szer)}
                  </text>
                )}
              </g>
            );
          }),
        )}

      {zbudowane.map(({ modul: m, elementy }) => {
        const x = drag?.id === m.id ? drag.x : m.pozycjaXMM;
        const sel = wybrany === m.id;
        const frontCol = kolorMat(
          m.materialFrontuId ?? pom?.materialFrontuId,
          "#e8e2d8",
        );
        const korpCol = kolorMat(
          m.materialKorpusuId ?? pom?.materialKorpusuId,
          "#f4f3ed",
        );
        const wiszacy = m.pozycjaYMM >= 1000;
        const bezKorpusu = m.konstrukcja === "dishwasherFront";
        return (
          <g
            key={m.id}
            data-kitchen-cabinet={m.id}
            data-kitchen-collision={
              collisionIds.includes(m.id) ? "true" : undefined
            }
            style={{
              cursor: readOnly
                ? "pointer"
                : drag?.id === m.id
                  ? "grabbing"
                  : "grab",
            }}
            onClick={
              readOnly
                ? (e) => {
                    e.stopPropagation();
                    onWybierz(m.id);
                  }
                : undefined
            }
            onPointerDown={(e) => {
              e.stopPropagation();
              if (readOnly) return;
              (
                e.currentTarget.ownerSVGElement as SVGSVGElement
              ).setPointerCapture(e.pointerId);
              onWybierz(m.id);
              setDrag({
                id: m.id,
                start: doMM(e.clientX),
                x0: m.pozycjaXMM,
                x: m.pozycjaXMM,
              });
            }}
          >
            {/* Cokół / nogi */}
            {m.konfiguracja.nogi && (
              <rect
                x={x + 5}
                y={Y(m.pozycjaYMM)}
                width={m.szerokoscMM - 10}
                height={m.pozycjaYMM}
                fill="var(--floor)"
                opacity={0.55}
              />
            )}
            {/* Korpus */}
            {!bezKorpusu && (
              <rect
                x={x}
                y={Y(m.pozycjaYMM + m.wysokoscMM)}
                width={m.szerokoscMM}
                height={m.wysokoscMM}
                fill={korpCol}
                stroke="#6b5a47"
                strokeWidth={3}
              />
            )}
            {/* Fronty */}
            {elementy
              .filter(
                (e) =>
                  e.kod !== "OSLONA-TYL" &&
                  (e.rola === "front" ||
                    e.rola === "filler" ||
                    e.kod.startsWith("OSLONA-")),
              )
              .map((e) => {
                const fx = x + e.x;
                const fy = Y(m.pozycjaYMM + e.y + e.wys);
                const drzwi = e.kod.startsWith("FRONT-D");
                const szuflada = e.kod.startsWith("FRONT-SZ");
                const lewy = drzwi && Number(e.kod.slice(-2)) % 2 === 1;
                return (
                  <g
                    key={e.kod}
                    data-kitchen-surround={
                      e.kod.startsWith("OSLONA-") ? e.kod : undefined
                    }
                  >
                    {e.kod.startsWith("OSLONA-") && (
                      <title>{`Płyta osłonowa · ${e.szer} × ${e.wys} × ${e.gl} mm`}</title>
                    )}
                    <rect
                      x={fx}
                      y={fy}
                      width={e.szer}
                      height={e.wys}
                      fill={frontCol}
                      stroke="#3b3128"
                      strokeWidth={3}
                    />
                    {drzwi && (
                      <polyline
                        points={
                          lewy
                            ? `${fx + e.szer},${fy} ${fx},${fy + e.wys / 2} ${fx + e.szer},${fy + e.wys}`
                            : `${fx},${fy} ${fx + e.szer},${fy + e.wys / 2} ${fx},${fy + e.wys}`
                        }
                        fill="none"
                        stroke="#3b3128"
                        strokeWidth={2}
                        strokeDasharray="14 10"
                        opacity={0.55}
                      />
                    )}
                    {szuflada && (
                      <line
                        x1={fx + e.szer * 0.35}
                        x2={fx + e.szer * 0.65}
                        y1={fy + 30}
                        y2={fy + 30}
                        stroke="#3b3128"
                        strokeWidth={8}
                        strokeLinecap="round"
                      />
                    )}
                    {e.kod === "FRONT-U01" && (
                      <line
                        x1={fx + e.szer * 0.35}
                        x2={fx + e.szer * 0.65}
                        y1={fy + e.wys - 30}
                        y2={fy + e.wys - 30}
                        stroke="#3b3128"
                        strokeWidth={8}
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              })}
            {/* Sanitariat: miska WC wisząca i przycisk (widok z przodu, poglądowo) */}
            {m.konfiguracja.sanitariat?.typ === "wcWiszace" &&
              (() => {
                const rant = m.konfiguracja.sanitariat.wysokoscMiskiMM ?? 400;
                const py = m.konfiguracja.sanitariat.przyciskYMM ?? 1000;
                const cx = x + m.szerokoscMM / 2;
                return (
                  <g pointerEvents="none">
                    <path
                      d={`M ${cx - 180} ${Y(rant)} L ${cx + 180} ${Y(rant)} L ${cx + 130} ${Y(rant - 300)} Q ${cx} ${Y(rant - 330)} ${cx - 130} ${Y(rant - 300)} Z`}
                      fill="#fbfbfa"
                      stroke="#3b3128"
                      strokeWidth={3}
                    />
                    <rect
                      x={cx - 185}
                      y={Y(rant + 25)}
                      width={370}
                      height={25}
                      rx={10}
                      fill="#fbfbfa"
                      stroke="#3b3128"
                      strokeWidth={3}
                    />
                    <rect
                      x={cx - 125}
                      y={Y(py + 82)}
                      width={250}
                      height={165}
                      rx={12}
                      fill="#d9dadc"
                      stroke="#3b3128"
                      strokeWidth={3}
                    />
                    <line
                      x1={cx}
                      x2={cx}
                      y1={Y(py + 70)}
                      y2={Y(py - 70)}
                      stroke="#3b3128"
                      strokeWidth={3}
                    />
                  </g>
                );
              })()}
            {/* Blat */}
            {m.konfiguracja.blat && (
              <rect
                x={x}
                y={Y(m.pozycjaYMM + m.wysokoscMM + 38)}
                width={m.szerokoscMM}
                height={38}
                fill={kolorMat(blatId, "#a98f6e")}
                stroke="#3b3128"
                strokeWidth={2}
              />
            )}
            {showFunctions && m.konstrukcja === "oven" && (
              <g
                pointerEvents="none"
                role="img"
                aria-label="Poglądowy piekarnik i płyta"
              >
                <rect
                  x={x + 22}
                  y={Y(m.pozycjaYMM + m.wysokoscMM - 18)}
                  width={m.szerokoscMM - 44}
                  height={550}
                  rx={12}
                  fill="var(--text)"
                />
                <line
                  x1={x + 90}
                  x2={x + m.szerokoscMM - 90}
                  y1={Y(m.pozycjaYMM + m.wysokoscMM - 100)}
                  y2={Y(m.pozycjaYMM + m.wysokoscMM - 100)}
                  stroke="var(--panel)"
                  strokeWidth={12}
                />
                <rect
                  x={x + 30}
                  y={Y(m.pozycjaYMM + m.wysokoscMM + 48)}
                  width={m.szerokoscMM - 60}
                  height={16}
                  fill="var(--text)"
                />
              </g>
            )}
            {showFunctions &&
              [
                "sink",
                "dishwasherFront",
                "oven",
                "refrigerator",
                "hood",
                "drawers",
              ].includes(m.konstrukcja) && (
                <g
                  pointerEvents="none"
                  role="group"
                  aria-label="Oznaczenie funkcji"
                >
                  <rect
                    x={x + 35}
                    y={Y(m.pozycjaYMM + m.wysokoscMM / 2) - 55}
                    width={m.szerokoscMM - 70}
                    height={110}
                    rx={10}
                    fill="var(--panel)"
                    opacity={0.94}
                  />
                  <text
                    x={x + m.szerokoscMM / 2}
                    y={Y(m.pozycjaYMM + m.wysokoscMM / 2) + 17}
                    textAnchor="middle"
                    fontSize={49}
                    fill="var(--text)"
                    fontWeight={600}
                  >
                    {m.konstrukcja === "sink"
                      ? "ZLEW"
                      : m.konstrukcja === "dishwasherFront"
                        ? "ZMYWARKA"
                        : m.konstrukcja === "oven"
                          ? "PIEKARNIK + PŁYTA"
                          : m.konstrukcja === "refrigerator"
                            ? "LODÓWKA"
                            : m.konstrukcja === "hood"
                              ? "OKAP"
                              : "PRZYGOTOWANIE"}
                  </text>
                </g>
              )}
            {/* Zaznaczenie */}
            {sel && (
              <rect
                x={x - 12}
                y={
                  Y(
                    m.pozycjaYMM +
                      m.wysokoscMM +
                      (m.konfiguracja.blat ? 38 : 0),
                  ) - 12
                }
                width={m.szerokoscMM + 24}
                height={m.wysokoscMM + (m.konfiguracja.blat ? 38 : 0) + 24}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={10}
                rx={8}
              />
            )}
            {collisionIds.includes(m.id) && (
              <rect
                x={x - 10}
                y={Y(m.pozycjaYMM + m.wysokoscMM) - 10}
                width={m.szerokoscMM + 20}
                height={m.wysokoscMM + 20}
                fill="none"
                stroke="var(--danger)"
                strokeWidth={12}
                pointerEvents="none"
              >
                <title>
                  Kolizja lub zablokowane otwieranie — sprawdź wskazane szafki.
                </title>
              </rect>
            )}
            <Wymiar
              x1={x}
              x2={x + m.szerokoscMM}
              y={wiszacy ? Y(m.pozycjaYMM + m.wysokoscMM) - 60 : wysokosc + 110}
              tekst={mm(m.szerokoscMM)}
              onEdit={
                onEditWidth &&
                (!canEditWidth || canEditWidth(m.id)) &&
                m.kategoria !== "appliance" &&
                m.kategoria !== "corner"
                  ? () => onEditWidth(m.id)
                  : undefined
              }
            />
          </g>
        );
      })}
    </svg>
  );
}

function Wymiar({
  x1,
  x2,
  y,
  tekst,
  gruby,
  onEdit,
}: {
  x1: number;
  x2: number;
  y: number;
  tekst: string;
  gruby?: boolean;
  onEdit?: () => void;
}) {
  const s = gruby ? 5 : 3;
  return (
    <g
      stroke={onEdit ? "var(--accent)" : "var(--muted)"}
      fill={onEdit ? "var(--accent)" : "var(--muted)"}
      pointerEvents={onEdit ? "auto" : "none"}
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      aria-label={onEdit ? `Edytuj szerokość ${tekst}` : undefined}
      onClick={
        onEdit
          ? (e) => {
              e.stopPropagation();
              onEdit();
            }
          : undefined
      }
      onKeyDown={
        onEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }
            }
          : undefined
      }
      style={onEdit ? { cursor: "pointer" } : undefined}
    >
      {onEdit && (
        <rect
          x={x1}
          y={y - 150}
          width={x2 - x1}
          height={200}
          fill="transparent"
          stroke="none"
        />
      )}
      <line x1={x1} x2={x2} y1={y} y2={y} strokeWidth={s} />
      <line x1={x1} x2={x1} y1={y - 25} y2={y + 25} strokeWidth={s} />
      <line x1={x2} x2={x2} y1={y - 25} y2={y + 25} strokeWidth={s} />
      <text
        x={(x1 + x2) / 2}
        y={y - 18}
        textAnchor="middle"
        fontSize={gruby ? 70 : 56}
        stroke="none"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {tekst}
      </text>
    </g>
  );
}
