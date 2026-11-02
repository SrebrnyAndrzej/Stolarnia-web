import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ModulUkladu, OpcjaOkucia, RolaStylu } from "../../api";
import { currency } from "../api";

export type Kind = "I" | "L" | "U";

export interface Decor {
  key: string;
  id: string;
  name: string;
  manufacturer: string;
  obraz: string;
  surface_label?: string;
  textures?: string[];
  maBlat?: boolean;
}

export const ROLES: { rola: RolaStylu; nazwa: string; opis: string }[] = [
  { rola: "korpus", nazwa: "Korpus", opis: "płyta szafek" },
  { rola: "front", nazwa: "Fronty", opis: "drzwi i szuflady" },
  { rola: "blat", nazwa: "Blat", opis: "blat roboczy" },
];

export const num = (s: string) => {
  const n = Number(s.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
};
export const mm = (v: number) => `${Math.round(v * 10) / 10}`.replace(".", ",");

const ROLE_COLOR: Record<string, string> = {
  szafka: "#d9c4a3",
  dopasowana: "#cdb68f",
  naroznik: "#c6a77a",
  zlew: "#9fc1d6",
  zmywarka: "#a9bfcf",
  plyta: "#d6a09a",
  lodowka: "#c9d3d9",
  slupek: "#b9a384",
  okap: "#c7c0b4",
  blenda: "#9c8f7c",
  blendaNarozna: "#9c8f7c",
};
const ROLE_NAME: Record<string, string> = {
  szafka: "szafka",
  dopasowana: "dopasowana",
  naroznik: "narożnik",
  zlew: "zlew",
  zmywarka: "zmywarka",
  plyta: "płyta",
  lodowka: "lodówka",
  slupek: "słupek",
  okap: "okap",
  blenda: "blenda",
  blendaNarozna: "blenda narożna",
};

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="qp-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

/** Pole liczbowe z przyciskami +/- (dotyk) i klawiaturą numeryczną. */
export function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step: number;
}) {
  const change = (d: number) =>
    onChange(String(Math.max(0, Math.round(num(value) + d))));
  return (
    <div className="qp-field" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="qp-num">
        <button
          type="button"
          className="qp-btn secondary"
          aria-label={`${label}: mniej`}
          onClick={() => change(-step)}
        >
          −
        </button>
        <input
          className="qp-input"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        />
        <button
          type="button"
          className="qp-btn secondary"
          aria-label={`${label}: więcej`}
          onClick={() => change(step)}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Choice({
  label,
  value,
  options,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="qp-field">
      <span>{label}</span>
      <div className="qp-seg" role="group" aria-label={label}>
        {options.map(([v, t]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            disabled={disabled}
            onClick={() => onChange(v)}
          >
            {t}
          </button>
        ))}
      </div>
      {hint && <small className="qp-muted">{hint}</small>}
    </div>
  );
}

export function ShapeIcon({ kind }: { kind: Kind }) {
  const d =
    kind === "I"
      ? "M10 14 H110"
      : kind === "L"
        ? "M10 14 H110 M10 14 V74"
        : "M10 74 V14 H110 V74";
  return (
    <svg viewBox="0 0 120 84" className="qp-shape" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="square"
        opacity="0.85"
      />
      <rect
        x="2"
        y="2"
        width="116"
        height="80"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.35"
      />
    </svg>
  );
}

export function Notes({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "warn" | "info" | "error";
}) {
  if (!items.length) return null;
  return (
    <div
      className={`qp-note ${tone === "info" ? "" : (tone ?? "warn")}`}
      role={tone === "error" ? "alert" : undefined}
    >
      <b>{title}</b>
      <ul>
        {items.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>
    </div>
  );
}

export function Elevation({
  wall,
  modules,
  reserves,
}: {
  wall: { id: string; nazwa: string; dlugoscMM: number; wysokoscMM: number };
  modules: ModulUkladu[];
  reserves: { rzad: string; odMM: number; doMM: number; opis: string }[];
}) {
  const L = wall.dlugoscMM;
  const H = wall.wysokoscMM;
  const M = 120;
  const Y = (y: number) => H - y;
  return (
    <figure className="qp-elev">
      <figcaption>
        <b>{wall.nazwa}</b> · {mm(L)} × {mm(H)} mm
      </figcaption>
      <svg
        viewBox={`${-M} ${-M / 2} ${L + 2 * M} ${H + 2.2 * M}`}
        role="img"
        aria-label={`Elewacja: ${wall.nazwa}`}
      >
        <rect
          x={0}
          y={0}
          width={L}
          height={H}
          fill="var(--panel)"
          stroke="var(--line-strong)"
          strokeWidth={8}
        />
        <line
          x1={0}
          y1={Y(0)}
          x2={L}
          y2={Y(0)}
          stroke="var(--muted)"
          strokeWidth={16}
        />
        {reserves.map((r, i) => {
          const hang = r.rzad === "wiszacy";
          // Opis rezerwacji mieści się w jej szerokości (~0,55 em na znak); za wąski — tylko podpowiedź (title).
          const width = r.doMM - r.odMM;
          const fits = (t: string) => Math.min(70, (width * 0.9) / (t.length * 0.55));
          const label = fits(r.opis) >= 30 ? r.opis : "zajęte";
          const fontSize = fits(label);
          return (
            <g key={i}>
              <title>{r.opis}</title>
              <rect
                x={r.odMM}
                y={hang ? Y(2120) : Y(900)}
                width={r.doMM - r.odMM}
                height={hang ? 720 : 900}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={8}
                strokeDasharray="40 30"
              />
              {fontSize >= 30 && (
                <text
                  x={(r.odMM + r.doMM) / 2}
                  y={hang ? Y(1760) : Y(450)}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill="var(--muted)"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
        {modules.map((m) => (
          <g key={m.id}>
            <rect
              x={m.pozycjaXMM}
              y={Y(m.pozycjaYMM + m.wysokoscMM)}
              width={m.szerokoscMM}
              height={m.wysokoscMM}
              fill={ROLE_COLOR[m.rola] ?? "#d9c4a3"}
              stroke="#3b3128"
              strokeWidth={8}
              fillOpacity={m.pozycjaYMM >= 1000 ? 0.75 : 1}
            />
            {m.szerokoscMM >= 280 && (
              <text
                x={m.pozycjaXMM + m.szerokoscMM / 2}
                y={Y(m.pozycjaYMM + m.wysokoscMM / 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(95, m.szerokoscMM / 4.5)}
                fill="#1d1812"
              >
                {mm(m.szerokoscMM)}
              </text>
            )}
          </g>
        ))}
        <g stroke="var(--muted)" strokeWidth={6} fill="var(--muted)">
          <line x1={0} y1={H + 70} x2={L} y2={H + 70} />
          <line x1={0} y1={H + 45} x2={0} y2={H + 95} />
          <line x1={L} y1={H + 45} x2={L} y2={H + 95} />
          <text
            x={L / 2}
            y={H + 160}
            textAnchor="middle"
            fontSize={85}
            stroke="none"
          >
            {mm(L)} mm
          </text>
        </g>
      </svg>
    </figure>
  );
}

export function Legend({ modules }: { modules: ModulUkladu[] }) {
  const roles = [...new Set(modules.map((m) => m.rola))];
  return (
    <ul className="qp-legend" aria-label="Legenda">
      {roles.map((r) => (
        <li key={r}>
          <span style={{ background: ROLE_COLOR[r] ?? "#d9c4a3" }} />{" "}
          {ROLE_NAME[r] ?? r} ({modules.filter((m) => m.rola === r).length})
        </li>
      ))}
    </ul>
  );
}

/** Pola do ręcznego wpisu, gdy producent nie podaje grubości i formatu. Niczego nie zgadujemy. */
export function MissingData({
  role,
  message,
  decor,
  values,
  onValue,
}: {
  role: RolaStylu;
  message: string;
  decor?: Decor;
  values: Record<string, string>;
  onValue: (k: string, v: string) => void;
}) {
  const fields: [string, string][] =
    role === "blat"
      ? [
          ["gruboscMM", "Grubość [mm]"],
          ["glebokoscMM", "Głębokość [mm]"],
          ["dlugoscMM", "Długość [mm]"],
        ]
      : [
          ["gruboscMM", "Grubość [mm]"],
          ["szerokoscArkuszaMM", "Szerokość arkusza [mm]"],
          ["wysokoscArkuszaMM", "Wysokość arkusza [mm]"],
        ];
  const name = ROLES.find((r) => r.rola === role)!.nazwa;
  return (
    <div className="qp-note error" role="alert">
      <b>{name}: brak danych producenta</b>
      <p>{message}</p>
      <p>Wpisz dane potwierdzone u dostawcy. Niczego nie zgadujemy.</p>
      <div className="qp-grid-auto" style={{ marginTop: 10 }}>
        {fields.map(([k, l]) => (
          <Field key={k} label={l}>
            <input
              className="qp-input"
              inputMode="decimal"
              value={values[`${role}.${k}`] ?? ""}
              onChange={(e) =>
                onValue(`${role}.${k}`, e.target.value.replace(/[^\d.,]/g, ""))
              }
            />
          </Field>
        ))}
        {(decor?.textures?.length ?? 0) > 1 && !decor?.surface_label && (
          <Field label="Struktura">
            <select
              className="qp-input"
              value={values[`${role}.struktura`] ?? ""}
              onChange={(e) => onValue(`${role}.struktura`, e.target.value)}
            >
              <option value="">Wybierz…</option>
              {decor!.textures!.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </div>
  );
}

export function HardwareGroup({
  name,
  list,
  value,
  onChange,
  hidePrices,
}: {
  name: string;
  list: OpcjaOkucia[];
  value?: string;
  onChange: (v: string | undefined) => void;
  /** Tryb „przy kliencie”: bez cen zakupu. */
  hidePrices?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <h3>{name}</h3>
      <div className="qp-options">
        <button
          type="button"
          className="qp-option"
          aria-pressed={!value}
          onClick={() => onChange(undefined)}
        >
          <b>Automatycznie</b>
          <span className="qp-muted">dobór wg wariantu wyceny</span>
        </button>
        {list.map((o) => (
          <button
            key={o.id}
            type="button"
            className="qp-option"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
          >
            <b>{o.nazwa}</b>
            <span className="qp-muted">
              {o.producent} · {o.system}
            </span>
            {o.maCene ? (
              !hidePrices &&
              typeof o.cenaNetto === "number" && (
                <span className="qp-muted">{currency(o.cenaNetto)} netto</span>
              )
            ) : (
              <span className="qp-tag error">Brak ceny w cenniku</span>
            )}
            {!o.aktywne && <span className="qp-tag warn">nieaktywne</span>}
          </button>
        ))}
        {list.length === 0 && (
          <span className="qp-muted">Brak pozycji w bazie okuć.</span>
        )}
      </div>
    </div>
  );
}

const PAGE = 48;

export function DecorPicker({
  decors,
  role,
  title,
  current,
  onClose,
  onPick,
}: {
  decors: Decor[];
  role: RolaStylu;
  title: string;
  current?: string;
  onClose: () => void;
  onPick: (d: Decor) => void;
}) {
  const [query, setQuery] = useState("");
  const [maker, setMaker] = useState("");
  const [onlyWorktop, setOnlyWorktop] = useState(role === "blat");
  const [shown, setShown] = useState(PAGE);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const result = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pl");
    return decors.filter(
      (d) =>
        (!maker || d.manufacturer === maker) &&
        (!onlyWorktop || d.maBlat) &&
        (!q ||
          `${d.id} ${d.name} ${d.surface_label ?? ""} ${(d.textures ?? []).join(" ")}`
            .toLocaleLowerCase("pl")
            .includes(q)),
    );
  }, [decors, query, maker, onlyWorktop]);
  useEffect(() => setShown(PAGE), [query, maker, onlyWorktop]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div
      className="qp-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="qp-dialog">
        <div className="qp-bar">
          <h2 id={titleId}>Dekor: {title}</h2>
          <span className="qp-spacer" />
          <button
            ref={closeRef}
            type="button"
            className="qp-btn secondary"
            onClick={onClose}
          >
            Zamknij
          </button>
        </div>
        <div className="qp-bar">
          <input
            className="qp-input"
            style={{ flex: "1 1 220px", width: "auto" }}
            type="search"
            placeholder="Szukaj: kod, nazwa, struktura…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Szukaj dekoru"
          />
          <div className="qp-seg" role="group" aria-label="Producent">
            {[
              ["", "Wszyscy"],
              ["Egger", "Egger"],
              ["Kronospan", "Kronospan"],
            ].map(([v, t]) => (
              <button
                key={v}
                type="button"
                aria-pressed={maker === v}
                onClick={() => setMaker(v)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {role === "blat" && (
          <div className="qp-bar">
            <div className="qp-seg" role="group" aria-label="Zakres blatów">
              <button
                type="button"
                aria-pressed={onlyWorktop}
                onClick={() => setOnlyWorktop(true)}
              >
                Z blatem w danych
              </button>
              <button
                type="button"
                aria-pressed={!onlyWorktop}
                onClick={() => setOnlyWorktop(false)}
              >
                Wszystkie dekory
              </button>
            </div>
            <span className="qp-muted">
              {onlyWorktop
                ? "Tylko dekory z artykułem blatu Egger."
                : "Dla dekorów bez blatu w danych wymiary wpiszesz sam."}
            </span>
          </div>
        )}
        <p className="qp-muted" role="status">
          {result.length} dekorów
        </p>
        <div className="qp-gallery">
          {result.slice(0, shown).map((d) => (
            <button
              key={d.key}
              type="button"
              className="qp-decor"
              aria-pressed={current === d.key}
              onClick={() => onPick(d)}
            >
              <img src={d.obraz} alt="" loading="lazy" />
              <b>
                {d.manufacturer} {d.id}
              </b>
              <span>{d.name}</span>
            </button>
          ))}
        </div>
        {shown < result.length && (
          <button
            type="button"
            className="qp-btn secondary"
            onClick={() => setShown((x) => x + PAGE)}
          >
            Pokaż więcej ({result.length - shown})
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Rzut z góry (OCENA-kreatora §4, zmiana 2) ----------

export type FixedKind = "zlew" | "plyta" | "lodowka" | "okno";
export interface PlanMarker {
  id: string;
  kind: FixedKind;
  label: string;
  wall: number;
  xMM: number;
  widthMM: number;
}
const FIXED_COLOR: Record<FixedKind, string> = {
  zlew: "#9fc1d6",
  plyta: "#d6a09a",
  lodowka: "#c9d3d9",
  okno: "#7fb3d5",
};
const DEPTH = 600;

/**
 * Geometria rzutu zgodna z ikonami kształtu: L = ściana 1 po lewej (od dołu do narożnika), ściana 2 u góry;
 * U = dodatkowo ściana 3 po prawej (od narożnika w dół). Początek ściany (x = 0) oznaczony kropką ●.
 * Kolejna ściana zaczyna się w końcu poprzedniej — tak samo liczy silnik (service.ts, narożniki 90°).
 */
export function wallFrame(kind: Kind, lengths: number[], i: number) {
  const [a = 0, b = 0] = lengths;
  if (kind === "I" || i === 1) {
    // pozioma u góry, od lewej do prawej, wnętrze w dół
    return { at: (x: number) => [x, 0] as const, dir: [1, 0] as const, n: [0, 1] as const };
  }
  if (i === 0) return { at: (x: number) => [0, a - x] as const, dir: [0, -1] as const, n: [1, 0] as const };
  return { at: (x: number) => [b, x] as const, dir: [0, 1] as const, n: [-1, 0] as const };
}

export function PlanView({
  kind,
  lengths,
  markers,
  modules,
  walls,
  onPick,
}: {
  kind: Kind;
  lengths: number[];
  markers: PlanMarker[];
  /** Po podglądzie: moduły dolne silnika (rola, ściana jako indeks). */
  modules?: { wall: number; xMM: number; widthMM: number; rola: string }[];
  walls?: string[];
  onPick?: (id: string) => void;
}) {
  const n = kind === "I" ? 1 : kind === "L" ? 2 : 3;
  const L = lengths.slice(0, n);
  const width = kind === "I" ? L[0] : L[1] ?? 0;
  const height = kind === "I" ? DEPTH * 2 : Math.max(L[0] ?? 0, kind === "U" ? L[2] ?? 0 : 0);
  const M = 260;
  const rect = (wall: number, x: number, w: number, d: number, inset = 0) => {
    const f = wallFrame(kind, L, wall);
    const p = [f.at(x), f.at(x + w)];
    const q = p.map(([px, py]) => [px + f.n[0] * (inset + d), py + f.n[1] * (inset + d)]);
    const xs = [...p, ...q].map((v) => v[0]);
    const ys = [...p, ...q].map((v) => v[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  return (
    <figure className="qp-plan">
      <figcaption>
        <b>Rzut z góry</b> · ● = początek ściany, od niego liczysz „od ● [mm]”
      </figcaption>
      <svg viewBox={`${-M} ${-M} ${width + 2 * M} ${height + 2 * M}`} role="img" aria-label="Rzut kuchni z góry">
        {L.map((len, i) => {
          const f = wallFrame(kind, L, i);
          const [x1, y1] = f.at(0);
          const [x2, y2] = f.at(len);
          const [mx, my] = f.at(len / 2);
          return (
            <g key={`w${i}`}>
              <rect {...(() => { const r = rect(i, 0, len, DEPTH); return { x: r.x, y: r.y, width: r.w, height: r.h }; })()} fill="var(--panel)" stroke="var(--line)" strokeWidth={6} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text)" strokeWidth={40} strokeLinecap="square" />
              <circle cx={x1 + f.n[0] * 90 + f.dir[0] * 90} cy={y1 + f.n[1] * 90 + f.dir[1] * 90} r={45} fill="var(--text)" />
              <text
                x={mx - f.n[0] * 70}
                y={my - f.n[1] * 110}
                textAnchor={f.n[0] > 0 ? "end" : f.n[0] < 0 ? "start" : "middle"}
                dominantBaseline={f.n[1] > 0 ? "auto" : "middle"}
                fontSize={110}
                fill="var(--muted)"
              >
                {walls?.[i] ?? `Ściana ${i + 1} (${String.fromCharCode(65 + i)})`} · {mm(len)}
              </text>
            </g>
          );
        })}
        {modules?.map((m, i) => {
          const r = rect(m.wall, m.xMM, m.widthMM, DEPTH);
          return <rect key={`m${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={ROLE_COLOR[m.rola] ?? "#d9c4a3"} stroke="#3b3128" strokeWidth={6} />;
        })}
        {markers.map((k) => {
          const okno = k.kind === "okno";
          const r = okno ? rect(k.wall, k.xMM, k.widthMM, 60, -30) : rect(k.wall, k.xMM, k.widthMM, DEPTH);
          return (
            <g
              key={k.id}
              role={onPick ? "button" : undefined}
              aria-label={onPick ? `${k.label}: zmień położenie` : k.label}
              tabIndex={onPick ? 0 : undefined}
              onClick={() => onPick?.(k.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick?.(k.id)}
              style={{ cursor: onPick ? "pointer" : undefined }}
            >
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={FIXED_COLOR[k.kind]} fillOpacity={modules ? 0 : 0.9} stroke={okno ? "#2f6f99" : "#1d1812"} strokeWidth={okno ? 14 : modules ? 18 : 8} strokeDasharray={modules && !okno ? "50 30" : undefined} />
              <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={okno ? 90 : 100} fill="#1d1812" fontWeight={700}>
                {k.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

// ---------- Warianty: „co w środku” (OCENA-kreatora §4, zmiana 3) ----------

type VariantLike = {
  wariant: string;
  nazwa: string;
  pozycje: { nazwa: string; kategoria: string }[];
};
const HARDWARE = new Set(["okucia", "akcesoria"]);
/** „Blum Legrabox — Pure H86 L=500” → „Blum Legrabox”; bez sztucznego producenta „Generic”. */
export const shortItem = (n: string) =>
  n.split(" — ")[0].replace(/^Generic\s+/i, "").replace(/\s*\(ID:[^)]*\)/g, "").trim();

/**
 * 2–3 linie dla klienta wyliczone z różnic pozycji wyceny: pierwszy wariant — główne okucia,
 * kolejne — co dochodzi względem poprzedniego. Te same okucia = uczciwe „różnica: zakres robocizny”.
 * Dobór okuć w wariantach się nie zmienia (decyzja biznesowa); to tylko opis.
 */
export function variantInside(warianty: VariantLike[]): Record<string, string[]> {
  const hw = (v: VariantLike) => [...new Set(v.pozycje.filter((p) => HARDWARE.has(p.kategoria)).map((p) => shortItem(p.nazwa)))];
  const out: Record<string, string[]> = {};
  warianty.forEach((v, i) => {
    const mine = hw(v);
    if (i === 0) {
      out[v.wariant] = mine.slice(0, 2);
      return;
    }
    const prev = warianty[i - 1];
    const before = new Set(hw(prev));
    const added = mine.filter((x) => !before.has(x));
    const removed = [...before].filter((x) => !mine.includes(x));
    out[v.wariant] = !added.length && !removed.length
      ? [`Te same okucia co ${prev.nazwa}`, "Różnica: zakres robocizny"]
      : [`Względem ${prev.nazwa}:`, ...added.slice(0, 2).map((x) => `+ ${x}`)];
  });
  return out;
}
