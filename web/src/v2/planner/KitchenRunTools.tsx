import { useRef, useState } from "react";
import { Feedback } from "../ui";
import {
  detectKitchenRuns,
  fillKitchenGap,
  fillKitchenTier,
  kitchenFreeGaps,
  kitchenTierName,
  planKitchenSurround,
  type KitchenRun,
  type KitchenTier,
} from "../../../../src/core/kitchen-runs";
import type { KitchenItem } from "../../../../src/core/kitchen-configuration";
import { suggestKitchen } from "../../../../src/core/kitchen-suggestion";
import { randomId } from "../../uuid";
import type { Draft } from "./model";

const tierGenitive = { base: "dolnego", wall: "górnego", tall: "wysokiego" };
const cabinetCount = (n: number) =>
  n === 1
    ? "szafka"
    : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
      ? "szafki"
      : "szafek";

function SurroundTools({
  draft,
  run,
  disabled,
  onApply,
}: {
  draft: Draft;
  run: KitchenRun;
  disabled: boolean;
  onApply: (items: KitchenItem[], message: string) => void;
}) {
  const initial = run.modules[0].konfiguracja.obudowaZewnetrzna;
  const last = run.modules.at(-1)!.konfiguracja.obudowaZewnetrzna;
  const [form, setForm] = useState({
    left: !!initial?.lewy,
    right: !!last?.prawy,
    top: run.modules.every((m) => m.konfiguracja.obudowaZewnetrzna?.gora),
    bottom: run.modules.every((m) => m.konfiguracja.obudowaZewnetrzna?.dol),
    projection: String(initial?.wysuniecieMM ?? 20),
    keepWidth: true,
  });
  let plan: ReturnType<typeof planKitchenSurround> | undefined,
    error = "";
  try {
    plan = planKitchenSurround(draft, run.id, {
      ...form,
      projection: Number(form.projection.replace(",", ".")),
    });
  } catch (problem) {
    error =
      problem instanceof Error ? problem.message : "Sprawdź obudowę ciągu.";
  }
  const emptyProjection = !form.projection.trim();
  if (emptyProjection) {
    error = "Podaj wysunięcie przed lico frontów w mm.";
    plan = undefined;
  }
  const same =
    plan && JSON.stringify(plan.items) === JSON.stringify(draft.items);
  const adjustable = run.modules.some((m) => m.kategoria !== "appliance");
  return (
    <form
      className="kp-surround-tools"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!plan || disabled || same) return;
        onApply(
          plan.items,
          `Zastosowano wykończenie ciągu ${tierGenitive[run.tier]} na ścianie ${run.wall.toUpperCase()}. ${plan.changes.join("; ")}${plan.changes.length ? ". " : ""}Cofnij odtwarza poprzedni projekt.`,
        );
      }}
    >
      <fieldset disabled={disabled}>
        <legend>Boki i wieńce osłonowe</legend>
        <button
          type="button"
          className="ps-button secondary"
          onClick={() =>
            setForm({
              left: run.leftExposed && adjustable,
              right: run.rightExposed && adjustable,
              top: run.tier !== "base",
              bottom: run.tier === "wall",
              projection: "20",
              keepWidth: true,
            })
          }
        >
          Ustaw sugerowaną obudowę
        </button>
        <div className="kp-surround-checks">
          {(
            [
              ["left", "Lewy bok osłonowy"],
              ["right", "Prawy bok osłonowy"],
              ...(run.tier !== "base"
                ? [["top", "Górne wieńce osłonowe"]]
                : []),
              ...(run.tier === "wall"
                ? [["bottom", "Dolne wieńce osłonowe"]]
                : []),
            ] as ["left" | "right" | "top" | "bottom", string][]
          ).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) =>
                  setForm((old) => ({ ...old, [key]: e.target.checked }))
                }
              />
              {label}
            </label>
          ))}
        </div>
        <label>
          Wysunięcie przed lico frontów (mm)
          <input
            inputMode="numeric"
            value={form.projection}
            aria-invalid={!!error}
            aria-describedby="kp-surround-help"
            onChange={(e) =>
              setForm((old) => ({ ...old, projection: e.target.value }))
            }
          />
        </label>
        <label className="kp-surround-keep">
          <input
            type="checkbox"
            checked={form.keepWidth}
            onChange={(e) =>
              setForm((old) => ({ ...old, keepWidth: e.target.checked }))
            }
          />
          Zachowaj szerokość ciągu — dopasuj szafkę bez AGD
        </label>
        <p id="kp-surround-help">
          Domyślnie 20 mm przed zewnętrzną płaszczyzną frontów. Boki zajmują
          miejsce w ciągu; wieniec jest osobną płytą nad lub pod korpusem,
          modułowo na każdej szafce. Dla dolnych szafek górę zamyka blat. Okna,
          otwieranie i wentylację AGD sprawdzimy w projekcie.
        </p>
        {!adjustable && (
          <p>
            W tym ciągu są wyłącznie zabudowy AGD o stałej szerokości. Boki
            wymagają wcześniej pozostawionego miejsca; ich dodanie nie zmieni
            niszy urządzenia.
          </p>
        )}
        {plan?.changes.length ? (
          <p className="kp-run-change" role="status">
            Rezerwa na boki: {plan.changes.join("; ")}. Zmiana nastąpi po
            zastosowaniu.
          </p>
        ) : null}
        {error && <Feedback>{error}</Feedback>}
        <button
          className="ps-button"
          type="submit"
          disabled={disabled || !!error || !!same}
        >
          Zastosuj wykończenie ciągu
        </button>
      </fieldset>
    </form>
  );
}

export function KitchenRunTools({
  draft,
  wall,
  disabled,
  onApply,
  onSelect,
}: {
  draft: Draft;
  wall: KitchenItem["wall"];
  disabled: boolean;
  onApply: (items: KitchenItem[], message: string) => void;
  onSelect?: (id: string) => void;
}) {
  const [row, setRow] = useState<KitchenTier>("base"),
    [purpose, setPurpose] = useState<"kitchen" | "storage" | "preparation">(
      "kitchen",
    ),
    [gapId, setGapId] = useState(""),
    [runId, setRunId] = useState(""),
    [error, setError] = useState("");
  const field = useRef<HTMLSelectElement>(null),
    rowField = useRef<HTMLSelectElement>(null),
    runField = useRef<HTMLSelectElement>(null);
  const runs = detectKitchenRuns(draft).filter((r) => r.wall === wall);
  const gaps = kitchenFreeGaps(draft, wall, row);
  const chosenGap = gaps.find((g) => g.id === gapId) ?? gaps.at(-1);
  const run = runs.find((r) => r.id === runId) ?? runs[0];
  return (
    <section className="kp-runs" aria-label="Ciągi kuchenne i wykończenie">
      <div className="kp-run-counts" aria-label="Automatycznie wykryte ciągi">
        {(["base", "wall", "tall"] as const).map((tier) => (
          <span key={tier}>
            {kitchenTierName[tier]}:{" "}
            <strong>{runs.filter((r) => r.tier === tier).length}</strong>
          </span>
        ))}
      </div>
      <details className="kp-run-tools">
        <summary>Uzupełnij kuchnię lub rząd</summary>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            try {
              if (purpose !== "kitchen" && !chosenGap)
                throw new Error(
                  "Ten rząd jest już wypełniony lub zajęty przez zabudowę wysoką. Wybierz inny rząd lub zmień szerokości szafek.",
                );
              const items =
                purpose === "kitchen"
                  ? suggestKitchen(draft, randomId, true)
                  : fillKitchenGap(
                      draft,
                      wall,
                      row,
                      chosenGap!.id,
                      randomId,
                      purpose,
                    );
              onApply(
                items,
                purpose === "kitchen"
                  ? `Uzupełniono brakujące strefy kuchni: dodano ${items.length - draft.items.length} elementów, zachowując istniejące. Cofnij odtwarza poprzedni układ.`
                  : `Dopełniono ciąg ${kitchenTierName[row].toLowerCase()} na ścianie ${wall.toUpperCase()}: dodano ${items.length - draft.items.length} elementów. Pozostałe szafki zachowały pozycje. Cofnij odtwarza poprzedni układ.`,
              );
              setError("");
              setGapId("");
            } catch (problem) {
              setError(
                problem instanceof Error
                  ? problem.message
                  : "Nie można dopełnić rzędu.",
              );
              (purpose === "kitchen" ? field : rowField).current?.focus();
            }
          }}
        >
          <label>
            Cel uzupełniania
            <select
              ref={field}
              aria-label="Cel uzupełniania"
              value={purpose}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={
                error ? "kp-run-error kp-run-help" : "kp-run-help"
              }
              onChange={(e) => {
                setPurpose(e.target.value as typeof purpose);
                if (e.target.value === "preparation") setRow("base");
                setError("");
                setGapId("");
              }}
            >
              <option value="kitchen">Auto · brakujące AGD i hydraulika</option>
              <option value="storage">Przechowywanie · półki</option>
              <option value="preparation">
                Przygotowanie · szuflady i blat
              </option>
            </select>
          </label>
          {purpose !== "kitchen" && (
            <>
              <label>
                Rząd do dopełnienia
                <select
                  ref={rowField}
                  aria-label="Rząd do dopełnienia"
                  value={row}
                  disabled={disabled}
                  aria-invalid={!!error}
                  aria-describedby={
                    error ? "kp-run-error kp-run-help" : "kp-run-help"
                  }
                  onChange={(e) => {
                    setRow(e.target.value as KitchenTier);
                    if (e.target.value !== "base") setPurpose("storage");
                    setError("");
                    setGapId("");
                  }}
                >
                  <option value="base">Dolne</option>
                  <option value="wall">Górne / wiszące</option>
                  <option value="tall">Wysokie / słupki</option>
                </select>
              </label>
              <label>
                Luka do uzupełnienia
                <select
                  aria-label="Luka do uzupełnienia"
                  value={chosenGap?.id ?? ""}
                  disabled={disabled || !gaps.length}
                  onChange={(e) => {
                    setGapId(e.target.value);
                    setError("");
                  }}
                >
                  {!gaps.length && (
                    <option value="">Brak wolnego miejsca</option>
                  )}
                  {gaps.map((g) => (
                    <option value={g.id} key={g.id}>
                      {g.start}–{g.end} mm · {g.width} mm
                      {g.width >= 20 && g.width < 200
                        ? " · sugerowana blenda"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <p>
                {chosenGap ? (
                  <>
                    Wolna luka: <strong>{chosenGap.width} mm</strong>.{" "}
                    {chosenGap.width >= 20 && chosenGap.width < 200
                      ? "Zaproponujemy dopasowaną blendę."
                      : "Szafki do 600 mm; wymiary dobierane do tej luki."}
                  </>
                ) : (
                  "Ten rząd jest wypełniony lub zajęty przez zabudowę wysoką."
                )}
              </p>
            </>
          )}
          <p id="kp-run-help">
            {purpose === "kitchen"
              ? "Zachowa obecne elementy i poszuka miejsca na brakujące strefy na dostępnych ścianach. Zmywarkę doda obok zlewu, okap nad płytą. Gdy układ to uniemożliwia, popraw położenia albo użyj Zastąp proponowanym układem."
              : "Uzupełnia wskazaną lukę, także między szafkami. Górne omijają słupki; wysokie dzielą miejsce z dolnymi. AGD i pozostałe szafki zachowują wymiary i pozycje."}
          </p>
          <button
            className="ps-button secondary"
            disabled={disabled}
            type="submit"
          >
            {purpose === "kitchen"
              ? "Uzupełnij brakujące strefy"
              : "Dopełnij ten rząd"}
          </button>
          {purpose !== "kitchen" && (
            <button
              className="ps-button secondary"
              type="button"
              disabled={disabled}
              onClick={() => {
                try {
                  const result = fillKitchenTier(
                    draft,
                    wall,
                    row,
                    randomId,
                    purpose,
                  );
                  onApply(
                    result.items,
                    `Uzupełniono wszystkie luki ciągu ${tierGenitive[row]}: dodano ${result.items.length - draft.items.length} elementów. ${result.skipped ? `Pozostawiono drobne luzy poniżej 20 mm (${result.skipped}). ` : ""}Cofnij odtwarza cały poprzedni układ.`,
                  );
                  setError("");
                  setGapId("");
                  rowField.current?.focus();
                } catch (problem) {
                  setError(
                    problem instanceof Error
                      ? problem.message
                      : "Nie można uzupełnić rzędu.",
                  );
                  rowField.current?.focus();
                }
              }}
            >
              Uzupełnij cały rząd
            </button>
          )}
          {error && (
            <Feedback>
              <p id="kp-run-error">{error}</p>
            </Feedback>
          )}
        </form>
      </details>
      {run && (
        <details className="kp-run-tools kp-run-finishing">
          <summary>Wykryte ciągi · blendy, boki i wieńce</summary>
          <label>
            Wykryty ciąg
            <select
              ref={runField}
              aria-label="Wykryty ciąg"
              value={run.id}
              disabled={disabled}
              onChange={(e) => setRunId(e.target.value)}
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {kitchenTierName[r.tier]} · {r.modules.length}{" "}
                  {cabinetCount(r.modules.length)} · {r.start}–{r.end} mm · wys.{" "}
                  {r.height} mm
                </option>
              ))}
            </select>
          </label>
          <p>
            Ciąg rozpoznany po sąsiadowaniu, typie, wysokości i głębokości.
            Przerwa lub zmiana poziomu tworzy oddzielny ciąg.
          </p>
          {onSelect && (
            <button
              type="button"
              className="ps-text-button"
              disabled={disabled}
              onClick={() => onSelect(run.modules[0].id)}
            >
              Pokaż pierwszą szafkę ciągu
            </button>
          )}
          <SurroundTools
            key={JSON.stringify([
              run.id,
              draft.items.filter((i) => run.modules.some((m) => m.id === i.id)),
            ])}
            draft={draft}
            run={run}
            disabled={disabled}
            onApply={(items, message) => {
              onApply(items, message);
              requestAnimationFrame(() => runField.current?.focus());
            }}
          />
        </details>
      )}
    </section>
  );
}
