import { useEffect, useState } from "react";
import {
  featureName,
  kitchenFeatureSchema,
  featureRoomIssues,
  type KitchenFeature,
} from "../../../../src/core/kitchen-room";
import { randomId } from "../../uuid";
import { Feedback } from "../ui";
import { wallIds, type Draft } from "./model";
import { roomMillimetres } from "./room-dimensions";

export function KitchenRoomTools({
  draft,
  disabled,
  onApply,
  onDirtyChange,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (d: Draft) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const fresh = () => ({
    id: "",
    kind: "window",
    wall: "a",
    x: "60",
    width: "120",
    bottom: "100",
    height: "120",
  });
  const [form, setForm] = useState(fresh);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(fresh());
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  const opening = form.kind === "window" || form.kind === "door";
  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  };
  const apply = (
    features: KitchenFeature[],
    water?: KitchenFeature,
    removed?: KitchenFeature,
  ) => {
    const planning = water
      ? {
          ...draft.planning,
          waterWall: water.wall,
          sinkCenter: water.x,
          dishwasher: draft.planning?.dishwasher ?? ("600" as const),
        }
      : removed?.kind === "water" &&
          draft.planning?.waterWall === removed.wall &&
          draft.planning.sinkCenter === removed.x
        ? {
            ...draft.planning,
            waterWall: "auto" as const,
            sinkCenter: undefined,
          }
        : draft.planning;
    onApply({ ...draft, features, planning });
    setForm(fresh());
    setError("");
  };
  return (
    <details className="kp-room-tools">
      <summary>Okna, drzwi i przyłącza</summary>
      <p>
        Położenia od początku ściany i od podłogi. Woda wyznacza środek zlewu;
        okna i drzwi ograniczają miejsce na szafki.
      </p>
      <ul className="kp-feature-list">
        {(draft.features ?? []).map((f) => (
          <li key={f.id}>
            <span>
              {featureName[f.kind]} · {f.wall.toUpperCase()} · {f.x / 10} cm
              {f.width ? ` · ${f.width / 10} × ${f.height / 10} cm` : ""}
            </span>
            <button
              type="button"
              className="ps-text-button"
              disabled={disabled || dirty}
              onClick={() => {
                setForm({
                  ...f,
                  x: String(f.x / 10),
                  width: String(f.width / 10),
                  bottom: String(f.bottom / 10),
                  height: String(f.height / 10),
                });
                setError("");
              }}
            >
              Edytuj {featureName[f.kind].toLowerCase()}
            </button>
            <button
              type="button"
              className="ps-text-button"
              disabled={disabled || dirty}
              onClick={() =>
                apply(
                  (draft.features ?? []).filter((x) => x.id !== f.id),
                  undefined,
                  f,
                )
              }
            >
              Usuń {featureName[f.kind].toLowerCase()}
            </button>
          </li>
        ))}
      </ul>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (disabled) return;
          const parsed = kitchenFeatureSchema.safeParse({
            id: form.id || randomId(),
            kind: form.kind,
            wall: form.wall,
            x: roomMillimetres(form.x, "cm"),
            width: opening ? roomMillimetres(form.width, "cm") : 0,
            bottom:
              form.kind === "door" ? 0 : roomMillimetres(form.bottom, "cm"),
            height: opening ? roomMillimetres(form.height, "cm") : 0,
          });
          if (!parsed.success) {
            setError(
              "Sprawdź wymiary w cm. Okno lub drzwi: minimum 20 × 20 cm; dokładność do 0,1 cm.",
            );
            e.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
            return;
          }
          const features = [
            ...(draft.features ?? []).filter((f) => f.id !== parsed.data.id),
            parsed.data,
          ];
          const issues = featureRoomIssues(
            { ...draft, features },
            wallIds(draft),
          );
          if (
            features.length > 20 ||
            issues.length ||
            (parsed.data.kind === "water" &&
              features.filter((f) => f.kind === "water").length > 1)
          ) {
            setError(
              issues[0] ??
                "Dodaj maksymalnie 20 oznaczeń i jeden punkt wody dla proponowanej kuchni.",
            );
            return;
          }
          apply(
            features,
            parsed.data.kind === "water" ? parsed.data : undefined,
          );
        }}
      >
        <fieldset disabled={disabled}>
          <legend>{form.id ? "Edytuj oznaczenie" : "Dodaj oznaczenie"}</legend>
          <div className="kp-editor-fields">
            <label>
              Element pomieszczenia
              <select
                aria-label="Element pomieszczenia"
                value={form.kind}
                onChange={(e) => {
                  const kind = e.target.value;
                  setForm((f) => ({
                    ...f,
                    kind,
                    bottom:
                      kind === "door" ? "0" : kind === "window" ? "100" : "60",
                    width: kind === "door" ? "90" : "120",
                    height: kind === "door" ? "210" : "120",
                  }));
                  setError("");
                }}
              >
                {Object.entries(featureName).map(([v, n]) => (
                  <option value={v} key={v}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ściana oznaczenia
              <select
                aria-label="Ściana oznaczenia"
                value={form.wall}
                onChange={(e) => set("wall", e.target.value)}
              >
                {wallIds(draft).map((w) => (
                  <option value={w} key={w}>
                    {w.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Od początku ściany (cm)
              <input
                inputMode="decimal"
                value={form.x}
                onChange={(e) => set("x", e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "kp-room-feature-error" : undefined}
              />
            </label>
            {opening && (
              <label>
                Szerokość otworu (cm)
                <input
                  inputMode="decimal"
                  value={form.width}
                  onChange={(e) => set("width", e.target.value)}
                />
              </label>
            )}
            {form.kind !== "door" && (
              <label>
                {opening
                  ? "Parapet od podłogi (cm)"
                  : "Wysokość przyłącza (cm)"}
                <input
                  inputMode="decimal"
                  value={form.bottom}
                  onChange={(e) => set("bottom", e.target.value)}
                />
              </label>
            )}
            {opening && (
              <label>
                Wysokość otworu (cm)
                <input
                  inputMode="decimal"
                  value={form.height}
                  onChange={(e) => set("height", e.target.value)}
                />
              </label>
            )}
            <button className="ps-button" type="submit" data-save-room-feature>
              {form.id ? "Zapisz oznaczenie" : "Dodaj do pomieszczenia"}
            </button>
            {dirty && (
              <button
                className="ps-text-button"
                type="button"
                onClick={() => {
                  setForm(fresh());
                  setError("");
                }}
              >
                Anuluj edycję oznaczenia
              </button>
            )}
          </div>
        </fieldset>
        {error && (
          <div id="kp-room-feature-error">
            <Feedback>{error}</Feedback>
          </div>
        )}
      </form>
      <p>
        Przyłącza są orientacyjne. Nie dobieramy instalacji ani przestrzeni
        otwierania skrzydeł; potwierdzimy je przy pomiarze.
      </p>
    </details>
  );
}
