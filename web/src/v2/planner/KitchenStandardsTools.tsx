import { useEffect, useState } from "react";
import {
  kitchenModules,
  kitchenIssues,
  customerKitchenCatalog,
} from "../../../../src/core/kitchen-configuration";
import {
  defaultKitchenStandards,
  isStandardBase,
  kitchenStandardsSchema,
} from "../../../../src/core/kitchen-standards";
import { kitchenLockProblem } from "../../../../src/core/kitchen-locks";
import type { Draft } from "./model";
import { Feedback } from "../ui";

export function KitchenStandardsTools({
  draft,
  disabled,
  onApply,
  onDirtyChange,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (d: Draft) => void;
  onDirtyChange: (v: boolean) => void;
}) {
  const saved = draft.standards ?? defaultKitchenStandards;
  const initial = {
    plinth: String(saved.plinth),
    baseHeight: String(saved.baseHeight),
    upperBottom: String(saved.upperBottom),
  };
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  return (
    <details className="kp-room-tools kp-standards-tools">
      <summary>Wspólne wymiary kuchni · cokół, blat i górne szafki</summary>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = kitchenStandardsSchema.safeParse(
            Object.fromEntries(
              Object.entries(form).map(([key, value]) => [
                key,
                value.trim() ? Number(value.replace(",", ".")) : NaN,
              ]),
            ),
          );
          if (!parsed.success) {
            setError(
              "Cokół: 80–200 mm; korpus: 720 lub 800 mm; spód szafek wiszących: 1300–2000 mm od podłogi.",
            );
            return;
          }
          const next: Draft = {
            ...draft,
            standards: parsed.data,
            items: draft.items.map((i) =>
              isStandardBase(
                customerKitchenCatalog.find((m) => m.id === i.catalogId)!,
              )
                ? { ...i, height: undefined }
                : i,
            ),
          };
          const problem =
            kitchenLockProblem(draft, next) || kitchenIssues(next)[0];
          if (problem) {
            setError(problem);
            return;
          }
          onApply(next);
          setError("");
        }}
      >
        <fieldset disabled={disabled}>
          <legend>Wszystkie ciągi przy ścianach</legend>
          <div className="kp-editor-fields">
            <label>
              Wysokość cokołu (mm)
              <input
                inputMode="numeric"
                value={form.plinth}
                onChange={(e) => {
                  setForm({ ...form, plinth: e.target.value });
                  setError("");
                }}
              />
            </label>
            <label>
              Wysokość dolnych korpusów
              <select
                aria-label="Wysokość dolnych korpusów"
                value={form.baseHeight}
                onChange={(e) => {
                  setForm({ ...form, baseHeight: e.target.value });
                  setError("");
                }}
              >
                <option value="720">720 mm</option>
                <option value="800">800 mm</option>
              </select>
            </label>
            <label>
              Spód wiszących od podłogi (mm)
              <input
                inputMode="numeric"
                value={form.upperBottom}
                onChange={(e) => {
                  setForm({ ...form, upperBottom: e.target.value });
                  setError("");
                }}
              />
            </label>
          </div>
          <p>
            Wierzch blatu po zmianie:{" "}
            <strong>
              {form.plinth.trim() && Number.isFinite(Number(form.plinth))
                ? `${Number(form.plinth) + Number(form.baseHeight) + (draft.quote.worktop === "compact" ? 12 : 38)} mm`
                : "uzupełnij cokół"}
            </strong>
            . Grubość blatu wynika z wybranego materiału.
          </p>
          <p>
            Zastosowanie wyrówna dolne korpusy i położenie górnych szafek.
            Słupki zachowają swoją wysokość. Korpusy wyspy pozostaną 720 mm,
            cokół będzie wspólny. Zablokowane szafki wymagają odblokowania.
          </p>
          {error && <Feedback>{error}</Feedback>}
          <div className="kp-actions">
            <button type="submit" data-apply-standards className="ps-button">
              Zastosuj wspólne wymiary
            </button>
            {dirty && (
              <button
                type="button"
                className="ps-text-button"
                onClick={() => {
                  setForm(initial);
                  setError("");
                }}
              >
                Anuluj wymiary
              </button>
            )}
          </div>
          <p className="kp-muted">
            W zapisanym projekcie najwyższa zabudowa kończy się{" "}
            {Math.max(
              0,
              ...kitchenModules(draft).map((m) => m.pozycjaYMM + m.wysokoscMM),
            )}{" "}
            mm od podłogi; sufit: {draft.height} mm.
          </p>
        </fieldset>
      </form>
    </details>
  );
}
