import { useEffect, useState } from "react";
import {
  customerKitchenCatalog,
  kitchenItemSchema,
  kitchenIssues,
  kitchenFitWidth,
  type KitchenItem,
} from "../../../../src/core/kitchen-configuration";
import type { Modul, ZbudowanyModul } from "../../../../src/core/types";
import { dobierzNL } from "../../../../src/core/catalog/drawers";
import { USTAWIENIA_DOMYSLNE } from "../../../../src/core/settings";
import { domyslnaKonfiguracja } from "../../../../src/core/catalog/modules";
import {
  drawerStackHeights,
  type DrawerFrontLayout,
} from "../../../../src/core/drawer-front-layout";
import type { Draft } from "./model";
import { roomMillimetres, type RoomUnit } from "./room-dimensions";
import { kitchenMoney, useKitchenEstimate } from "./useKitchenEstimate";
import { kitchenApplianceFit } from "../../../../src/core/kitchen-appliance-fit";
import { kitchenModules } from "../../../../src/core/kitchen-configuration";

export function drawerCalculatorLink(
  draft: Draft,
  b: Pick<ZbudowanyModul, "modul" | "elementy">,
  frontCode?: string,
): string | null {
  const front = b.elementy.find(
    (e) =>
      e.rola === "front" &&
      e.kod.startsWith("FRONT-SZ") &&
      (!frontCode || e.kod === frontCode),
  );
  if (!front) return null;
  const k = USTAWIENIA_DOMYSLNE.konstrukcja,
    m = b.modul;
  const usable =
    m.glebokoscMM -
    (m.konfiguracja.plecy ? k.odsunieciePlecMM + k.gruboscPlecHDFMM : 0);
  const nl = dobierzNL(usable);
  if (!nl) return null;
  const q = new URLSearchParams({
    lw: String(m.szerokoscMM - 2 * k.gruboscPlytyKorpusuMM),
    nl: String(nl),
    width: String(front.szer),
    height: String(front.wys),
    system: draft.quote.drawers,
    cabinet: m.id,
    front: front.kod,
  });
  return `#/kalkulatory/szuflady?${q}`;
}

export function KitchenCabinetEditor({
  draft,
  item,
  module,
  onApply,
  disabled,
  onDirtyChange,
  onClose,
  defaultUnit = "cm",
  onUnitChange,
}: {
  draft: Draft;
  item: KitchenItem;
  module: Modul;
  onApply: (d: Draft) => void;
  disabled: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onClose: () => void;
  defaultUnit?: RoomUnit;
  onUnitChange?: (unit: RoomUnit) => void;
}) {
  const [unit, setUnit] = useState<RoomUnit>(defaultUnit);
  const display = (mm: number, u = unit) => String(mm / (u === "cm" ? 10 : 1));
  const [form, setForm] = useState({
    catalogId: item.catalogId,
    width: display(module.szerokoscMM),
    height: String(module.wysokoscMM),
    depth: String(module.glebokoscMM),
    shelves: String(
      module.konstrukcja === "shelves"
        ? module.konfiguracja.liczbaPolek
        : domyslnaKonfiguracja(
            customerKitchenCatalog.find((m) => m.id === "base-shelves-600")!,
          ).liczbaPolek,
    ),
    drawers: String(
      module.konstrukcja === "drawers"
        ? module.konfiguracja.liczbaSzuflad
        : domyslnaKonfiguracja(
            customerKitchenCatalog.find((m) => m.id === "base-drawers-600")!,
          ).liczbaSzuflad,
    ),
    gapBefore: display(item.gapBefore ?? 0),
    innerDrawers: String(item.innerDrawers ?? 0),
    applianceModel: item.appliance?.model ?? "",
    applianceWidth: item.appliance ? String(item.appliance.width) : "",
    applianceHeight: item.appliance ? String(item.appliance.height) : "",
    applianceDepth: item.appliance ? String(item.appliance.depth) : "",
    applianceSource: item.appliance?.source ?? "",
    ventilation: item.appliance?.ventilationChecked ?? false,
  });
  const entry = customerKitchenCatalog.find((m) => m.id === form.catalogId)!;
  const canChangeStorage =
    module.kategoria === "base" &&
    ["shelves", "drawers"].includes(module.konstrukcja);
  const [error, setError] = useState("");
  const [layout, setLayout] = useState<DrawerFrontLayout["mode"] | "standard">(
    item.drawerFronts?.mode ?? "standard",
  );
  const [heights, setHeights] = useState<string[]>(
    Array.from({ length: Number(form.drawers) }, (_, i) => {
      const value = item.drawerFronts?.heightsFromTop?.[i];
      return value == null ? "" : String(value);
    }),
  );
  const signature = () =>
    JSON.stringify({
      form: {
        ...form,
        width: roomMillimetres(form.width, unit),
        gapBefore: roomMillimetres(form.gapBefore, unit),
      },
      layout,
      heights,
    });
  const [baseline, setBaseline] = useState(signature);
  const dirty = signature() !== baseline;
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  const frontPlan = (): DrawerFrontLayout | undefined =>
    layout === "standard"
      ? undefined
      : {
          mode: layout,
          ...(layout === "custom"
            ? {
                heightsFromTop: heights.map((v) =>
                  v.trim() === "" ? null : Number(v.replace(",", ".")),
                ),
              }
            : {}),
        };
  const candidateItem = () => ({
    ...item,
    catalogId: form.catalogId,
    width: roomMillimetres(form.width, unit),
    height: Number(form.height),
    depth: Number(form.depth),
    gapBefore: roomMillimetres(form.gapBefore, unit),
    shelves:
      entry.construction === "shelves" ? Number(form.shelves) : undefined,
    drawers:
      entry.construction === "drawers" ? Number(form.drawers) : undefined,
    innerDrawers:
      entry.construction === "drawers" ? Number(form.innerDrawers) : undefined,
    drawerFronts: entry.construction === "drawers" ? frontPlan() : undefined,
    appliance:
      entry.category === "appliance" &&
      [
        form.applianceModel,
        form.applianceWidth,
        form.applianceHeight,
        form.applianceDepth,
        form.applianceSource,
      ].some((v) => v.trim())
        ? {
            model: form.applianceModel,
            width: Number(form.applianceWidth),
            height: Number(form.applianceHeight),
            depth: Number(form.applianceDepth),
            source: form.applianceSource.trim() || undefined,
            ventilationChecked: form.ventilation,
          }
        : undefined,
  });
  let priceDraft: Draft | null = null;
  try {
    const parsed = kitchenItemSchema.safeParse(candidateItem());
    if (parsed.success) {
      const next = {
        ...draft,
        items: draft.items.map((i) => (i.id === item.id ? parsed.data : i)),
      };
      if (!kitchenIssues(next).length) priceDraft = next;
    }
  } catch {
    /* An unfinished input never produces a stale quote. */
  }
  const beforePrice = useKitchenEstimate(draft, disabled || !dirty);
  const afterPrice = useKitchenEstimate(priceDraft, disabled || !dirty);
  const priceDelta =
    beforePrice.data?.gross != null && afterPrice.data?.gross != null
      ? afterPrice.data.gross - beforePrice.data.gross
      : null;
  let plannedHeights: number[] | undefined;
  try {
    const plan = frontPlan();
    if (entry.construction === "drawers" && plan)
      plannedHeights = drawerStackHeights(
        Number(form.height),
        Number(form.drawers),
        USTAWIENIA_DOMYSLNE.konstrukcja.szczelinaFrontowMM,
        plan,
      );
  } catch {
    /* Invalid uncommitted inputs are reported on Apply. */
  }
  const field = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  };
  const clearHeight =
    module.konfiguracja.liczbaPolek && module.konstrukcja === "shelves"
      ? (module.wysokoscMM - 36 - module.konfiguracja.liczbaPolek * 18) /
        (module.konfiguracja.liczbaPolek + 1)
      : null;
  return (
    <section className="kp-cabinet-editor" aria-labelledby="kp-editor-title">
      <header className="kp-editor-header">
        <h2 id="kp-editor-title" tabIndex={-1}>
          {entry.construction === "filler"
            ? "Wybrana blenda"
            : "Wybrana szafka"}
        </h2>
        <button
          className="ps-text-button"
          type="button"
          onClick={onClose}
          disabled={disabled}
        >
          Wróć do podglądu
        </button>
      </header>
      <p>
        {module.nazwa} · ściana {item.wall.toUpperCase()} · wymiary korpusu w
        {unit}
      </p>
      {(item.surround?.left || item.surround?.right) && (
        <p>
          Boki osłonowe: +
          {(Number(!!item.surround.left) + Number(!!item.surround.right)) *
            (draft.quote.front === "lacquer" ? 19 : 18)}{" "}
          mm do szerokości korpusu. Zmienisz je w wykończeniu ciągu.
        </p>
      )}
      <label className="kp-check kp-lock-control">
        <input
          type="checkbox"
          checked={!!item.locked}
          disabled={disabled || dirty}
          onChange={(e) =>
            onApply({
              ...draft,
              items: draft.items.map((i) =>
                i.id === item.id ? { ...i, locked: e.target.checked } : i,
              ),
            })
          }
        />
        Zachowaj tę szafkę i jej położenie przy automatycznym układaniu
      </label>
      {item.locked && (
        <p className="kp-muted">
          Szafka jest zablokowana. Odznacz blokadę, aby zmienić jej wymiary,
          wnętrze albo położenie.
        </p>
      )}
      <form
        id="kp-cabinet-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const widthMM = roomMillimetres(form.width, unit),
            gapMM = roomMillimetres(form.gapBefore, unit);
          const minWidth = entry.construction === "filler" ? 20 : 200,
            maxWidth = entry.construction === "filler" ? 300 : 1200;
          if (
            !Number.isFinite(widthMM) ||
            widthMM < minWidth ||
            widthMM > maxWidth
          ) {
            setError(
              `Szerokość: wpisz ${display(minWidth)}–${display(maxWidth)} ${unit}${unit === "cm" ? ", z dokładnością do 0,1 cm" : ", w całych milimetrach"}.`,
            );
            e.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
            return;
          }
          if (!Number.isFinite(gapMM) || gapMM < 0 || gapMM > 4000) {
            setError(`Przerwa: wpisz 0–${display(4000)} ${unit}.`);
            const placement =
              e.currentTarget.querySelector<HTMLDetailsElement>(
                ".kp-placement",
              );
            if (placement) placement.open = true;
            e.currentTarget
              .querySelector<HTMLInputElement>("[data-cabinet-gap]")
              ?.focus();
            return;
          }
          const plan = frontPlan();
          if (entry.construction === "drawers" && plan) {
            try {
              drawerStackHeights(
                Number(form.height),
                Number(form.drawers),
                USTAWIENIA_DOMYSLNE.konstrukcja.szczelinaFrontowMM,
                plan,
              );
            } catch (problem) {
              setError(
                problem instanceof Error
                  ? problem.message
                  : "Sprawdź podział frontów.",
              );
              e.currentTarget
                .querySelector<HTMLInputElement>("[data-front-height]")
                ?.focus();
              return;
            }
          }
          const candidate = candidateItem();
          const parsed = kitchenItemSchema.safeParse(candidate);
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            const selector =
              parsed.error.issues[0].path[0] === "drawerFronts"
                ? "[data-front-height]"
                : parsed.error.issues[0].path[0] === "appliance"
                  ? "[data-appliance-model]"
                  : "input";
            if (parsed.error.issues[0].path[0] === "appliance") {
              const card =
                e.currentTarget.querySelector<HTMLDetailsElement>(
                  ".kp-appliance-card",
                );
              if (card) card.open = true;
            }
            (
              e.currentTarget.querySelector<HTMLInputElement>(selector) ??
              e.currentTarget.querySelector<HTMLInputElement>("input")
            )?.focus();
            return;
          }
          const next = {
            ...draft,
            items: draft.items.map((i) => (i.id === item.id ? parsed.data : i)),
          };
          const issues = kitchenIssues(next);
          if (issues.length) {
            setError(issues[0]);
            const card =
              e.currentTarget.querySelector<HTMLDetailsElement>(
                ".kp-appliance-card",
              );
            if (candidate.appliance && card) card.open = true;
            e.currentTarget
              .querySelector<HTMLInputElement>(
                candidate.appliance
                  ? "[data-appliance-model]"
                  : "input:not(:disabled)",
              )
              ?.focus();
            return;
          }
          onApply(next);
          setBaseline(signature());
          setError("");
        }}
      >
        <fieldset disabled={disabled || item.locked}>
          <legend>Wymiary i wnętrze</legend>
          {canChangeStorage && (
            <div
              className="kp-storage-presets"
              role="group"
              aria-label="Gotowe wyposażenie szafki"
            >
              {(
                [
                  {
                    id: "shelves",
                    name: "Drzwi i półki",
                    count: 2,
                    mode: "standard",
                  },
                  {
                    id: "drawers",
                    name: "Trzy równe szuflady",
                    count: 3,
                    mode: "equal",
                  },
                  {
                    id: "drawers",
                    name: "Sztućce i garnki",
                    count: 3,
                    mode: "graduated",
                  },
                  {
                    id: "drawers",
                    name: "Dwie wysokie szuflady",
                    count: 2,
                    mode: "equal",
                  },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={
                    entry.construction === preset.id &&
                    (preset.id === "shelves"
                      ? Number(form.shelves) === preset.count
                      : Number(form.drawers) === preset.count &&
                        layout === preset.mode)
                  }
                  onClick={() => {
                    setForm((old) => ({
                      ...old,
                      catalogId: `base-${preset.id}-600`,
                      ...(preset.id === "shelves"
                        ? { shelves: String(preset.count) }
                        : { drawers: String(preset.count) }),
                      innerDrawers: "0",
                    }));
                    setLayout(preset.mode);
                    setHeights(Array(preset.count).fill(""));
                    setError("");
                  }}
                >
                  <svg viewBox="0 0 56 54" aria-hidden="true">
                    <rect x="9" y="3" width="38" height="48" rx="1" />
                    {preset.id === "shelves" ? (
                      <>
                        <path d="M28 3v48" />
                        <path d="M31 25h3" />
                      </>
                    ) : preset.count === 2 ? (
                      <>
                        <path d="M9 27h38" />
                        <path d="M25 15h6M25 39h6" />
                      </>
                    ) : preset.mode === "graduated" ? (
                      <>
                        <path d="M9 15h38M9 33h38" />
                        <path d="M25 9h6M25 24h6M25 42h6" />
                      </>
                    ) : (
                      <>
                        <path d="M9 19h38M9 35h38" />
                        <path d="M25 11h6M25 27h6M25 43h6" />
                      </>
                    )}
                  </svg>
                  <span>{preset.name}</span>
                </button>
              ))}
              <p>
                Wybierz układ i zastosuj go do szafki. Szczegóły możesz zmienić
                poniżej.
              </p>
            </div>
          )}
          <label className="kp-editor-unit">
            Jednostka edycji
            <select
              aria-label="Jednostka edycji"
              value={unit}
              onChange={(e) => {
                const next = e.target.value as RoomUnit;
                const w = roomMillimetres(form.width, unit),
                  g = roomMillimetres(form.gapBefore, unit);
                if (!Number.isFinite(w) || !Number.isFinite(g)) {
                  setError(
                    "Popraw szerokość i przerwę przed zmianą jednostki.",
                  );
                  return;
                }
                setForm((f) => ({
                  ...f,
                  width: display(w, next),
                  gapBefore: display(g, next),
                }));
                setUnit(next);
                onUnitChange?.(next);
                setError("");
              }}
            >
              <option value="cm">Centymetry (cm)</option>
              <option value="mm">Milimetry (mm)</option>
            </select>
          </label>
          <div className="kp-editor-fields">
            {canChangeStorage && (
              <label>
                Wyposażenie szafki
                <select
                  aria-label="Wyposażenie szafki"
                  value={entry.construction}
                  aria-describedby="kp-storage-help"
                  onChange={(e) =>
                    field(
                      "catalogId",
                      e.target.value === module.konstrukcja
                        ? item.catalogId
                        : `base-${e.target.value}-600`,
                    )
                  }
                >
                  <option value="shelves">Drzwi i półki</option>
                  <option value="drawers">Szuflady</option>
                </select>
              </label>
            )}
            <label>
              {entry.construction === "filler"
                ? "Szerokość blendy"
                : "Szerokość szafki"}
              <input
                data-cabinet-width
                inputMode="decimal"
                aria-invalid={!!error}
                aria-describedby={error ? "kp-editor-error" : undefined}
                value={form.width}
                disabled={
                  entry.category === "appliance" || entry.category === "corner"
                }
                onChange={(e) => field("width", e.target.value)}
              />
            </label>
            <label>
              {entry.construction === "filler"
                ? "Wysokość blendy"
                : "Wysokość szafki"}
              <select
                aria-label={
                  entry.construction === "filler"
                    ? "Wysokość blendy"
                    : "Wysokość szafki"
                }
                value={form.height}
                onChange={(e) => field("height", e.target.value)}
              >
                {[
                  ...new Set([entry.heightMM, ...entry.availableHeightsMM]),
                ].map((v) => (
                  <option key={v} value={v}>
                    {display(v)} {unit}
                  </option>
                ))}
              </select>
            </label>
            {entry.construction !== "filler" && (
              <label>
                Głębokość szafki
                <select
                  aria-label="Głębokość szafki"
                  value={form.depth}
                  onChange={(e) => field("depth", e.target.value)}
                >
                  {[
                    ...new Set([entry.depthMM, ...entry.availableDepthsMM]),
                  ].map((v) => (
                    <option key={v} value={v}>
                      {display(v)} {unit}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {entry.construction === "shelves" && (
              <label>
                Liczba półek
                <select
                  aria-label="Liczba półek"
                  value={form.shelves}
                  onChange={(e) => field("shelves", e.target.value)}
                >
                  {Array.from({ length: 9 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {entry.construction === "drawers" && (
              <label>
                Liczba szuflad
                <select
                  aria-label="Liczba szuflad"
                  value={form.drawers}
                  onChange={(e) => {
                    field("drawers", e.target.value);
                    if (Number(e.target.value) > 1) field("innerDrawers", "0");
                    setHeights((old) =>
                      Array.from(
                        { length: Number(e.target.value) },
                        (_, i) => old[i] ?? "",
                      ),
                    );
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? "1 wspólny front" : n}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {entry.construction === "drawers" && (
              <label>
                Szuflady ukryte za wspólnym frontem
                <select
                  value={form.innerDrawers}
                  onChange={(e) => {
                    field("innerDrawers", e.target.value);
                    if (Number(e.target.value)) {
                      field("drawers", "1");
                      setLayout("equal");
                      setHeights([""]);
                    }
                  }}
                >
                  {[0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n
                        ? `${n} niezależne ${n === 1 ? "wysunięcie" : "wysunięcia"}`
                        : "Bez szuflad ukrytych"}
                    </option>
                  ))}
                </select>
                <small>
                  Wysunięcia wewnętrzne nad skrzynką główną, otwierane po
                  wysunięciu wspólnego frontu.
                </small>
              </label>
            )}
            {entry.construction === "drawers" && (
              <label>
                Podział frontów
                <select
                  aria-label="Podział frontów"
                  value={layout}
                  onChange={(e) => {
                    setLayout(e.target.value as typeof layout);
                    setError("");
                  }}
                >
                  <option value="standard">Dotychczasowy układ</option>
                  <option value="equal">Równe fronty</option>
                  <option value="graduated">Niski front u góry</option>
                  <option value="custom">Własne wysokości</option>
                </select>
              </label>
            )}
          </div>
          {entry.category === "appliance" && (
            <details
              className="kp-appliance-card"
              open={item.appliance ? true : undefined}
            >
              <summary>Model AGD i sprawdzenie niszy</summary>
              <p>
                Przepisz minimalne wymiary niszy z instrukcji urządzenia (mm).
                To wymiary otworu, nie obudowy AGD.
              </p>
              <label>
                Model urządzenia
                <input
                  data-appliance-model
                  value={form.applianceModel}
                  onChange={(e) => field("applianceModel", e.target.value)}
                  maxLength={160}
                />
              </label>
              <div className="kp-module-fields">
                {(
                  [
                    ["applianceWidth", "Min. szerokość niszy"],
                    ["applianceHeight", "Min. wysokość niszy"],
                    ["applianceDepth", "Min. głębokość niszy"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label} (mm)
                    <input
                      inputMode="numeric"
                      value={form[key]}
                      onChange={(e) => field(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
              <label>
                Link do instrukcji (opcjonalnie)
                <input
                  type="url"
                  value={form.applianceSource}
                  onChange={(e) => field("applianceSource", e.target.value)}
                  placeholder="https://"
                  maxLength={500}
                />
              </label>
              <label className="kp-check">
                <input
                  type="checkbox"
                  checked={form.ventilation}
                  onChange={(e) => field("ventilation", e.target.checked)}
                />
                Sprawdzono wymagania wentylacji w instrukcji
              </label>
              {(() => {
                const parsed = kitchenItemSchema.safeParse(candidateItem());
                if (!parsed.success || !parsed.data.appliance)
                  return (
                    <p>
                      Bez pełnej karty modelu dopasowanie AGD pozostaje
                      niepotwierdzone.
                    </p>
                  );
                const m = kitchenModules({
                  ...draft,
                  items: [parsed.data],
                  island: undefined,
                })[0];
                const fit = kitchenApplianceFit(m, parsed.data.appliance);
                return (
                  <div role="status">
                    <p>
                      Światło zabudowy: {fit.available.width} ×{" "}
                      {fit.available.height} × {fit.available.depth} mm (szer. ×
                      wys. × gł.).
                    </p>
                    {fit.issues.length ? (
                      <p className="kp-error">{fit.issues.join(" ")}</p>
                    ) : (
                      <p>
                        Minimalne wymiary mieszczą się.
                        {fit.status === "ventilation-needed"
                          ? " Sprawdź jeszcze wentylację."
                          : " Zakresy maksymalne, mocowanie i otwieranie potwierdzimy z instrukcją przed produkcją."}
                      </p>
                    )}
                  </div>
                );
              })()}
              <button
                className="ps-text-button"
                type="button"
                onClick={() =>
                  setForm((old) => ({
                    ...old,
                    applianceModel: "",
                    applianceWidth: "",
                    applianceHeight: "",
                    applianceDepth: "",
                    applianceSource: "",
                    ventilation: false,
                  }))
                }
              >
                Usuń kartę urządzenia
              </button>
            </details>
          )}
          {canChangeStorage && (
            <p id="kp-storage-help">
              Sama zamiana wyposażenia zachowuje miejsce i wymiary szafki.
              Zmiana nastąpi po zastosowaniu.
            </p>
          )}
          {dirty && (
            <div className="kp-editor-pending" role="status">
              <p>
                Masz niezastosowane zmiany. Zastosuj je, aby zaktualizować
                projekt i wycenę.
              </p>
            </div>
          )}
          <details className="kp-placement">
            <summary>
              Położenie i przerwa · początek {module.pozycjaXMM} mm
            </summary>
            <label>
              Przerwa przed elementem ({unit})
              <input
                inputMode="decimal"
                value={form.gapBefore}
                data-cabinet-gap
                aria-invalid={!!error}
                aria-describedby={
                  error
                    ? "kp-editor-error kp-placement-help"
                    : "kp-placement-help"
                }
                onChange={(e) => field("gapBefore", e.target.value)}
              />
            </label>
            <p id="kp-placement-help">
              Pusta przestrzeń w tym rzędzie. Przesuwa ten element i kolejne;
              nie dodaje płyty ani blatu. Zastosuj, aby zobaczyć zmianę.
            </p>
          </details>
          {entry.construction === "filler" && (
            <p>
              Blenda to pionowy pas płyty frontowej, bez korpusu i okuć. Zakres
              szerokości: 20–300 mm. Dopasowanie przy ścianie wymaga pomiaru.
            </p>
          )}
          {entry.category !== "appliance" && (
            <div className="kp-fit-action">
              <button
                type="button"
                className="ps-text-button"
                onClick={() => {
                  try {
                    const gapBefore = roomMillimetres(form.gapBefore, unit);
                    if (
                      !Number.isInteger(gapBefore) ||
                      gapBefore < 0 ||
                      gapBefore > 4000
                    )
                      throw new Error(
                        "Przerwa przed elementem: 0–4000 mm, w całych milimetrach.",
                      );
                    const candidate = {
                      ...draft,
                      items: draft.items.map((i) =>
                        i.id === item.id ? { ...i, gapBefore } : i,
                      ),
                    };
                    field(
                      "width",
                      display(kitchenFitWidth(candidate, item.id)),
                    );
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Nie można dopasować szerokości.",
                    );
                  }
                }}
              >
                Dopasuj szerokość do wolnego miejsca
              </button>
              <small>
                Uzupełnia ten sam rząd do końca ściany. Następnie zastosuj
                zmianę.
              </small>
            </div>
          )}
          {entry.construction === "drawers" && (
            <div className="kp-front-layout">
              {layout === "custom" && (
                <div
                  className="kp-front-heights"
                  role="group"
                  aria-label="Wysokości frontów od góry"
                >
                  {heights.map((value, i) => (
                    <label key={i}>
                      Front {i + 1} od góry (mm)
                      <input
                        data-front-height
                        inputMode="decimal"
                        value={value}
                        placeholder="Auto"
                        aria-invalid={!!error}
                        aria-describedby={
                          error
                            ? "kp-editor-error kp-front-help"
                            : "kp-front-help"
                        }
                        onChange={(e) => {
                          setHeights((old) =>
                            old.map((v, j) => (j === i ? e.target.value : v)),
                          );
                          setError("");
                        }}
                      />
                    </label>
                  ))}
                </div>
              )}
              <p id="kp-front-help">
                Szczeliny: {USTAWIENIA_DOMYSLNE.konstrukcja.szczelinaFrontowMM}{" "}
                mm na krańcach i między frontami.
                {layout === "custom" &&
                  " Puste pole = Auto; pozostała wysokość rozdzieli się równo. Minimum frontu w szkicu: 60 mm."}
              </p>
              {plannedHeights && (
                <p className="kp-front-preview" role="status">
                  {dirty ? "Po zastosowaniu, od góry:" : "Fronty od góry:"}{" "}
                  <strong>
                    {plannedHeights
                      .map((v) =>
                        v.toLocaleString("pl-PL", { maximumFractionDigits: 1 }),
                      )
                      .join(" / ")}{" "}
                    mm
                  </strong>
                </p>
              )}
            </div>
          )}
        </fieldset>
        {error && (
          <p className="kp-error" id="kp-editor-error" role="alert">
            {error}
          </p>
        )}
        <div className="kp-editor-commit">
          {dirty && (
            <div className="kp-price-preview" role="status">
              {!priceDraft ? (
                "Uzupełnij poprawne wymiary, aby porównać cenę."
              ) : afterPrice.error || beforePrice.error ? (
                <>
                  <span>Porównanie ceny jest chwilowo niedostępne.</span>
                  <button
                    type="button"
                    className="ps-text-button"
                    onClick={() => {
                      beforePrice.retry();
                      afterPrice.retry();
                    }}
                  >
                    Ponów porównanie
                  </button>
                </>
              ) : priceDelta !== null ? (
                <>
                  <strong>
                    Po zmianie: {kitchenMoney(afterPrice.data!.gross!)}
                  </strong>
                  <span>
                    {priceDelta === 0
                      ? "Cena bez zmian"
                      : `Różnica: ${priceDelta > 0 ? "+" : "−"}${kitchenMoney(Math.abs(priceDelta))}`}{" "}
                    · brutto, orientacyjnie
                  </span>
                </>
              ) : afterPrice.data?.status === "blocked" ||
                beforePrice.data?.status === "blocked" ? (
                "Ten wariant wymaga sprawdzenia przed wyceną."
              ) : (
                "Porównujemy cenę przed zastosowaniem…"
              )}
            </div>
          )}
          <button
            className="ps-button"
            type="submit"
            data-apply-cabinet
            disabled={disabled || item.locked}
          >
            {entry.construction === "filler"
              ? "Zastosuj do blendy"
              : "Zastosuj do szafki"}
          </button>
          {dirty && (
            <button
              type="button"
              className="ps-text-button"
              disabled={disabled || item.locked}
              onClick={() => {
                const old = JSON.parse(baseline);
                setForm({
                  ...old.form,
                  width: display(old.form.width),
                  gapBefore: display(old.form.gapBefore),
                });
                setLayout(old.layout);
                setHeights(old.heights);
                setError("");
              }}
            >
              Anuluj zmiany
            </button>
          )}
        </div>
      </form>
      {clearHeight !== null && (
        <p>
          Światło między półkami w zapisanym układzie:{" "}
          <strong>
            {clearHeight.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}{" "}
            mm
          </strong>
          .
        </p>
      )}
      {entry.category === "appliance" && (
        <p>
          Szerokość zabudowy AGD wynika z wybranego wariantu. Niszę i wentylację
          potwierdzimy z kartą urządzenia.
        </p>
      )}
    </section>
  );
}
