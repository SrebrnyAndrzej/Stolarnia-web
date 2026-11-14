import { useState } from "react";
import {
  customerKitchenCatalog,
  kitchenItemSchema,
  kitchenIssues,
  type KitchenItem,
} from "../../../../src/core/kitchen-configuration";
import type { Modul, ZbudowanyModul } from "../../../../src/core/types";
import { dobierzNL } from "../../../../src/core/catalog/drawers";
import { USTAWIENIA_DOMYSLNE } from "../../../../src/core/settings";
import type { Draft } from "./model";

export function drawerCalculatorLink(
  draft: Draft,
  b: Pick<ZbudowanyModul, "modul" | "elementy">,
): string | null {
  const front = b.elementy.find(
    (e) => e.rola === "front" && e.kod.startsWith("FRONT-SZ"),
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
  });
  return `#/kalkulatory/szuflady?${q}`;
}

export function KitchenCabinetEditor({
  draft,
  item,
  module,
  onApply,
  disabled,
}: {
  draft: Draft;
  item: KitchenItem;
  module: Modul;
  onApply: (d: Draft) => void;
  disabled: boolean;
}) {
  const entry = customerKitchenCatalog.find((m) => m.id === item.catalogId)!;
  const [form, setForm] = useState({
    width: String(module.szerokoscMM),
    height: String(module.wysokoscMM),
    depth: String(module.glebokoscMM),
    shelves: String(module.konfiguracja.liczbaPolek),
    drawers: String(module.konfiguracja.liczbaSzuflad),
  });
  const [error, setError] = useState("");
  const field = (key: keyof typeof form, value: string) => {
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
      <h2 id="kp-editor-title">Wybrana szafka</h2>
      <p>
        {module.nazwa} · ściana {item.wall.toUpperCase()} · wszystkie wymiary w
        mm
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const candidate = {
            ...item,
            width: Number(form.width),
            height: Number(form.height),
            depth: Number(form.depth),
            ...(entry.construction === "shelves"
              ? { shelves: Number(form.shelves) }
              : {}),
            ...(entry.construction === "drawers"
              ? { drawers: Number(form.drawers) }
              : {}),
          };
          const parsed = kitchenItemSchema.safeParse(candidate);
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            e.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
            return;
          }
          const next = {
            ...draft,
            items: draft.items.map((i) => (i.id === item.id ? parsed.data : i)),
          };
          const issues = kitchenIssues(next);
          if (issues.length) {
            setError(issues[0]);
            e.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
            return;
          }
          onApply(next);
          setError("");
        }}
      >
        <fieldset disabled={disabled}>
          <legend>Wymiary i wnętrze</legend>
          <div className="kp-editor-fields">
            <label>
              Szerokość szafki
              <input
                inputMode="numeric"
                aria-invalid={!!error}
                aria-describedby={error ? "kp-editor-error" : undefined}
                value={form.width}
                disabled={entry.category === "appliance"}
                onChange={(e) => field("width", e.target.value)}
              />
            </label>
            <label>
              Wysokość szafki
              <select
                aria-label="Wysokość szafki"
                value={form.height}
                onChange={(e) => field("height", e.target.value)}
              >
                {[
                  ...new Set([entry.heightMM, ...entry.availableHeightsMM]),
                ].map((v) => (
                  <option key={v} value={v}>
                    {v} mm
                  </option>
                ))}
              </select>
            </label>
            <label>
              Głębokość szafki
              <select
                aria-label="Głębokość szafki"
                value={form.depth}
                onChange={(e) => field("depth", e.target.value)}
              >
                {[...new Set([entry.depthMM, ...entry.availableDepthsMM])].map(
                  (v) => (
                    <option key={v} value={v}>
                      {v} mm
                    </option>
                  ),
                )}
              </select>
            </label>
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
                  onChange={(e) => field("drawers", e.target.value)}
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="ps-button" type="submit">
              Zastosuj do szafki
            </button>
          </div>
        </fieldset>
        {error && (
          <p className="kp-error" id="kp-editor-error" role="alert">
            {error}
          </p>
        )}
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
