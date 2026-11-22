import type { Modul } from "../../../../src/core/types";
import { isKitchenUpper } from "../../../../src/core/kitchen-configuration";
import { useEffect, useState } from "react";

const cm = (value: number) => (value / 10).toLocaleString("pl-PL");
function shortName(m: Modul) {
  if (m.konstrukcja === "filler") return "Blenda";
  if (m.konstrukcja === "drawers") return "Szuflady";
  if (m.konstrukcja === "sink") return "Zlew";
  if (m.konstrukcja === "dishwasherFront") return "Zmywarka";
  if (m.konstrukcja === "refrigerator") return "Lodówka";
  if (m.konstrukcja === "oven") return "Piekarnik";
  if (m.konstrukcja === "hood") return "Okap";
  if (m.kategoria === "corner") return "Narożna";
  return m.kategoria === "tall" ? "Słupek" : "Szafka";
}

/** Selection schematic, not a second editable or scaled geometry model. */
export function KitchenRunStrip({
  modules,
  selected,
  disabled,
  onSelect,
}: {
  modules: Modul[];
  selected: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [tier, setTier] = useState(false);
  const selectedModule = modules.find((m) => m.id === selected);
  const selectedUpper = selectedModule
    ? isKitchenUpper({
        category: selectedModule.kategoria,
        construction: selectedModule.konstrukcja,
      })
    : undefined;
  useEffect(() => {
    if (selectedUpper !== undefined) setTier(selectedUpper);
  }, [selected, selectedUpper]);
  const rows = ([false, true] as const).map((upper) => ({
    upper,
    modules: modules
      .filter(
        (m) =>
          isKitchenUpper({
            category: m.kategoria,
            construction: m.konstrukcja,
          }) === upper,
      )
      .sort((a, b) => a.pozycjaXMM - b.pozycjaXMM),
  }));
  const active =
    rows.find((r) => r.upper === tier && r.modules.length) ??
    rows.find((r) => r.modules.length);
  return (
    <div
      className="kp-run-strip"
      role="group"
      aria-label="Graficzny wybór szafki w rzędzie"
    >
      {active && (
        <>
          <div
            className="kp-run-tier"
            role="group"
            aria-label="Rząd do wyboru szafki"
          >
            {rows.map((r) => (
              <button
                key={String(r.upper)}
                type="button"
                aria-pressed={active.upper === r.upper}
                disabled={disabled || !r.modules.length}
                onClick={() => setTier(r.upper)}
              >
                {r.upper ? "Górne" : "Dolne i wysokie"}{" "}
                <small>({r.modules.length})</small>
              </button>
            ))}
          </div>
          <div className="kp-run-strip-row">
            <div
              className="kp-run-strip-track"
              role="group"
              aria-label={active.upper ? "Rząd górny" : "Rząd dolny i wysoki"}
            >
              {active.modules.map((m, index) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={selected === m.id}
                  aria-label={`${index + 1}. ${m.nazwa}, ${cm(m.szerokoscMM)} cm. Edytuj szafkę`}
                  title={`${m.nazwa} · ${cm(m.szerokoscMM)} cm`}
                  disabled={disabled}
                  onClick={() => onSelect(m.id)}
                >
                  <span>{shortName(m)}</span>
                  <strong>
                    {cm(m.szerokoscMM)} <small>cm</small>
                  </strong>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {!modules.length && (
        <p>
          Ta ściana jest pusta. Wybierz grupę w katalogu i dodaj pierwszą
          szafkę.
        </p>
      )}
    </div>
  );
}
