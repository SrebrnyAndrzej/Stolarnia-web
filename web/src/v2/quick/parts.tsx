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
          return (
            <g key={i}>
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
              <text
                x={(r.odMM + r.doMM) / 2}
                y={hang ? Y(1760) : Y(450)}
                textAnchor="middle"
                fontSize={70}
                fill="var(--muted)"
              >
                {r.opis}
              </text>
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
}: {
  name: string;
  list: OpcjaOkucia[];
  value?: string;
  onChange: (v: string | undefined) => void;
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
