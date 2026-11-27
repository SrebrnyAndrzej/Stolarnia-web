import { useEffect, useMemo, useState } from "react";
import { randomId } from "../../uuid";
import { Feedback } from "../ui";
import {
  kitchenMeasurementKey,
  kitchenMeasurementLabels,
  kitchenProjectDetailsSchema,
} from "../../../../src/core/kitchen-project-details";
import {
  kitchenModules,
  kitchenIssues,
} from "../../../../src/core/kitchen-configuration";
import { reviewKitchenObjects } from "../../../../src/core/kitchen-storage-check";
import { kitchenRepairOptions } from "../../../../src/core/kitchen-repairs";
import { kitchenLockProblem } from "../../../../src/core/kitchen-locks";
import { kitchenShelfAlternative } from "../../../../src/core/kitchen-storage-variants";
import { Rzut } from "../../views/Rzut";
import { type Draft, toAnalysis } from "./model";
import {
  kitchenMoney,
  useKitchenEstimate,
  type KitchenEstimateState,
} from "./useKitchenEstimate";

const defaults = () => kitchenProjectDetailsSchema.parse({})!;
export function KitchenProjectExtras({
  draft,
  disabled,
  onApply,
  onDirty,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (d: Draft) => void;
  onDirty: (b: boolean) => void;
}) {
  const details = draft.projectDetails ?? defaults(),
    measurementKey = kitchenMeasurementKey(draft);
  const measured =
    details.measurementKey === measurementKey ? details.measured : [];
  const [budget, setBudget] = useState(
    details.budget ? String(details.budget) : "",
  );
  const [object, setObject] = useState({
    name: "",
    width: "",
    height: "",
    depth: "",
    cabinetId: "",
  });
  const [error, setError] = useState("");
  useEffect(
    () => setBudget(details.budget ? String(details.budget) : ""),
    [details.budget],
  );
  const dirty =
    budget !== (details.budget ? String(details.budget) : "") ||
    Object.values(object).some(Boolean);
  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);
  const update = (patch: Partial<NonNullable<Draft["projectDetails"]>>) =>
    onApply({ ...draft, projectDetails: { ...details, ...patch } });
  const objects = reviewKitchenObjects(draft),
    modules = kitchenModules(draft);
  return (
    <details className="kp-project-extras">
      <summary>
        Pomiary, budżet i rzeczy do schowania · {measured.length}/4 pomiary
      </summary>
      <fieldset disabled={disabled || dirty}>
        <legend>Co zostało już sprawdzone na miejscu?</legend>
        <p className="kp-muted">
          Zmiana wymiarów lub przyłączy wymaga ponownego sprawdzenia. To
          deklaracja pomiaru, a nie zatwierdzenie produkcji.
        </p>
        {Object.entries(kitchenMeasurementLabels).map(([key, label]) => (
          <label key={key} className="kp-check">
            <input
              type="checkbox"
              checked={measured.includes(key as (typeof measured)[number])}
              onChange={(e) =>
                update({
                  measurementKey,
                  measured: e.target.checked
                    ? [...measured, key as (typeof measured)[number]]
                    : measured.filter((k) => k !== key),
                })
              }
            />
            {label}
          </label>
        ))}
        {measured.length < 4 && (
          <p>
            Wymiary orientacyjne · zostało {4 - measured.length} obszarów do
            sprawdzenia.
          </p>
        )}
      </fieldset>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const n = budget ? Number(budget) : undefined;
          if (
            n !== undefined &&
            (!Number.isInteger(n) || n < 1000 || n > 500000)
          ) {
            setError("Podaj budżet 1000–500 000 zł albo pozostaw pole puste.");
            return;
          }
          update({ budget: n });
          setError("");
        }}
      >
        <fieldset disabled={disabled || Object.values(object).some(Boolean)}>
          <legend>Budżet na meble</legend>
          <label>
            Kwota brutto (zł), bez zakupu AGD
            <input
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </label>
          <button className="ps-button secondary" type="submit">
            Zapisz budżet
          </button>
          {budget !== (details.budget ? String(details.budget) : "") && (
            <button
              type="button"
              className="ps-text-button"
              onClick={() => {
                setBudget(details.budget ? String(details.budget) : "");
                setError("");
              }}
            >
              Anuluj budżet
            </button>
          )}
        </fieldset>
      </form>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const candidate = {
            id: randomId(),
            name: object.name,
            width: Math.round(Number(object.width.replace(",", ".")) * 10),
            height: Math.round(Number(object.height.replace(",", ".")) * 10),
            depth: Math.round(Number(object.depth.replace(",", ".")) * 10),
            cabinetId: object.cabinetId || undefined,
          };
          const parsed = kitchenProjectDetailsSchema.safeParse({
            ...details,
            objects: [...details.objects, candidate],
          });
          if (!parsed.success) {
            setError(
              "Podaj nazwę i trzy wymiary 1–200 cm. Możesz zapisać do 20 przedmiotów.",
            );
            return;
          }
          onApply({ ...draft, projectDetails: parsed.data });
          setObject({
            name: "",
            width: "",
            height: "",
            depth: "",
            cabinetId: "",
          });
          setError("");
        }}
      >
        <fieldset
          disabled={
            disabled ||
            budget !== (details.budget ? String(details.budget) : "")
          }
        >
          <legend>Czy zmieści się mój przedmiot?</legend>
          <label>
            Nazwa, np. robot kuchenny
            <input
              value={object.name}
              maxLength={100}
              onChange={(e) => setObject({ ...object, name: e.target.value })}
            />
          </label>
          <div className="kp-object-dimensions">
            {(["width", "height", "depth"] as const).map((key, n) => (
              <label key={key}>
                {["Szerokość", "Wysokość", "Głębokość"][n]} (cm)
                <input
                  inputMode="decimal"
                  value={object[key]}
                  onChange={(e) =>
                    setObject({ ...object, [key]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Gdzie chcesz go schować?
            <select
              value={object.cabinetId}
              onChange={(e) =>
                setObject({ ...object, cabinetId: e.target.value })
              }
            >
              <option value="">Poszukaj szafki z półkami</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nazwa} · {m.scianaId.toUpperCase()} · od{" "}
                  {m.pozycjaXMM / 10} cm
                </option>
              ))}
            </select>
          </label>
          <button className="ps-button secondary" type="submit">
            Dodaj i sprawdź wymiary
          </button>
          {Object.values(object).some(Boolean) && (
            <button
              className="ps-text-button"
              type="button"
              onClick={() => {
                setObject({
                  name: "",
                  width: "",
                  height: "",
                  depth: "",
                  cabinetId: "",
                });
                setError("");
              }}
            >
              Anuluj przedmiot
            </button>
          )}
        </fieldset>
      </form>
      {error && <Feedback>{error}</Feedback>}
      {!!objects.length && (
        <ul className="kp-object-results">
          {objects.map((o) => (
            <li key={o.id}>
              <strong>
                {o.name} · {o.width / 10} × {o.height / 10} × {o.depth / 10} cm
              </strong>
              <p>
                {o.fit ? `${o.fit.name} · ${o.fit.wall.toUpperCase()}: ` : ""}
                {o.message}
              </p>
              <button
                className="ps-text-button"
                disabled={disabled || dirty}
                onClick={() =>
                  update({
                    objects: details.objects.filter((i) => i.id !== o.id),
                  })
                }
              >
                Usuń przedmiot: {o.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

function SavingsOption({
  draft,
  current,
  onApply,
  disabled,
  title,
}: {
  draft: Draft;
  current: KitchenEstimateState;
  onApply: (d: Draft) => void;
  disabled: boolean;
  title: string;
}) {
  const alternative = useKitchenEstimate(draft, disabled);
  const saving =
    current.data?.gross != null && alternative.data?.gross != null
      ? current.data.gross - alternative.data.gross
      : null;
  return (
    <div className="kp-saving-option">
      <strong>{title}</strong>
      {saving === null ? (
        <p>{alternative.error ?? "Obliczanie ceny alternatywy…"}</p>
      ) : saving > 0 ? (
        <p>
          {kitchenMoney(alternative.data!.gross!)} · oszczędność{" "}
          {kitchenMoney(saving)} brutto
        </p>
      ) : (
        <p>Ten wariant nie obniża ceny obecnej kuchni.</p>
      )}
      {alternative.error && (
        <button className="ps-text-button" onClick={alternative.retry}>
          Ponów wycenę wariantu
        </button>
      )}
      <button
        className="ps-button secondary"
        disabled={
          disabled ||
          saving === null ||
          saving <= 0 ||
          alternative.data?.status !== "estimated"
        }
        onClick={() => onApply(draft)}
      >
        Zastosuj tę oszczędność
      </button>
    </div>
  );
}
export function KitchenBudgetAdvice({
  draft,
  estimate,
  disabled,
  onApply,
}: {
  draft: Draft;
  estimate: KitchenEstimateState;
  disabled: boolean;
  onApply: (d: Draft) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: { title: string; draft: Draft }[] = [];
  if (draft.quote.front !== "laminate" || draft.quote.worktop !== "laminate") {
    const candidate = {
      ...draft,
      quote: {
        ...draft.quote,
        front: "laminate" as const,
        worktop: "laminate" as const,
      },
    };
    if (
      !kitchenIssues(candidate).length &&
      !kitchenLockProblem(draft, candidate)
    )
      options.push({
        title: "Front laminowany i blat laminowany — ten sam układ",
        draft: candidate,
      });
  }
  const item = draft.items.find(
    (i) => i.catalogId === "base-drawers-600" && !i.locked,
  );
  if (item) {
    const candidate = {
      ...draft,
      items: draft.items.map((i) =>
        i.id === item.id ? kitchenShelfAlternative(i) : i,
      ),
    };
    if (
      !kitchenIssues(candidate).length &&
      !kitchenLockProblem(draft, candidate)
    )
      options.push({
        title: "Jedna szafka z półką zamiast zestawu szuflad",
        draft: candidate,
      });
  }
  const budget = draft.projectDetails?.budget;
  return (
    <details
      className="kp-budget-advice"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Budżet i konkretne oszczędności</summary>
      {budget ? (
        <p>
          Twój budżet: <strong>{kitchenMoney(budget)}</strong>.{" "}
          {disabled || estimate.data?.gross == null
            ? "Czekamy na aktualną wycenę."
            : estimate.data.gross > budget
              ? `Przekroczenie: ${kitchenMoney(estimate.data.gross - budget)}.`
              : `Pozostaje ${kitchenMoney(budget - estimate.data.gross)} w budżecie.`}
        </p>
      ) : (
        <p>
          Budżet możesz podać w sekcji Pomiary, budżet i rzeczy do schowania.
        </p>
      )}
      <p className="kp-muted">
        Porównujemy ceny tego samego silnika. AGD, zlew, bateria i podłączenia
        nie są wliczone. Zastosowana zmiana ma wspólne Cofnij.
      </p>
      {!open ? null : options.length ? (
        options.map((o) => (
          <SavingsOption
            key={o.title + JSON.stringify(o.draft)}
            title={o.title}
            draft={o.draft}
            current={estimate}
            disabled={disabled}
            onApply={onApply}
          />
        ))
      ) : (
        <p>
          Wybrano podstawowe materiały, a wyposażenie nie daje teraz prostej
          oszczędności. Nie usuwamy urządzeń ani zablokowanych szafek.
        </p>
      )}
    </details>
  );
}

export function KitchenRepairPreview({
  draft,
  disabled,
  onApply,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (d: Draft) => void;
}) {
  const options = useMemo(() => kitchenRepairOptions(draft), [draft]);
  const [selected, setSelected] = useState<string | null>(null);
  const option = options.find((o) => o.id === selected),
    analysis = option ? toAnalysis(option.draft) : null;
  if (!options.length) return null;
  return (
    <details className="kp-repair-preview">
      <summary>Proponowane poprawki kolizji · {options.length}</summary>
      {options.map((o) => (
        <button
          key={o.id}
          className="ps-text-button"
          disabled={disabled}
          aria-pressed={selected === o.id}
          onClick={() => setSelected(o.id)}
        >
          {o.title}
        </button>
      ))}
      {option && analysis && (
        <>
          <p>
            {option.description} Usunięte problemy: {option.fixed}.
          </p>
          <p className="kp-muted">
            Podgląd po poprawce. Dopiero przycisk poniżej zmieni projekt.
          </p>
          <div className="kp-shared-plan">
            <Rzut
              analiza={analysis}
              pomieszczenieId={analysis.projekt.pomieszczenia[0].id}
              scianaId="a"
              wybrany={option.id}
              matMap={new Map(analysis.materialy.map((m) => [m.id, m]))}
              onSciana={() => {}}
              onWybierz={() => {}}
              roomFeatures={option.draft.features}
              showFunctions
            />
          </div>
          <button
            className="ps-button secondary"
            disabled={disabled}
            onClick={() => {
              onApply(option.draft);
              setSelected(null);
            }}
          >
            Zastosuj poprawkę — możesz cofnąć
          </button>
          <button className="ps-text-button" onClick={() => setSelected(null)}>
            Zamknij podgląd bez zmian
          </button>
        </>
      )}
    </details>
  );
}
