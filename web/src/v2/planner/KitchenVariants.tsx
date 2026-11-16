import { useEffect, useRef, useState } from "react";
import { readDraft, finishes, type Draft } from "./model";
import { useKitchenEstimate, kitchenMoney } from "./useKitchenEstimate";
import {
  kitchenOptions,
  kitchenModules,
  kitchenOuterBounds,
} from "../../../../src/core/kitchen-configuration";
import { Feedback } from "../ui";

const KEY = "pan-stolarz.kuchnia.warianty.v1";
function Variant({
  draft,
  label,
  open,
  disabled,
  onUse,
}: {
  draft: Draft | null;
  label: string;
  open: boolean;
  disabled: boolean;
  onUse: () => void;
}) {
  const estimate = useKitchenEstimate(draft, !open || !draft);
  const modules = draft ? kitchenModules(draft) : [];
  return (
    <article>
      <h2>Wariant {label}</h2>
      {draft ? (
        <>
          <p>
            Elementy: {modules.length} · {draft.width / 10} cm ·{" "}
            {draft.layout === "parallel"
              ? "dwa ciągi naprzeciwko"
              : draft.layout === "straight"
                ? "jedna ściana"
                : draft.layout.toUpperCase()}
          </p>
          {draft.island && (
            <p>
              Wyspa: {draft.island.items.length} szafki · blat{" "}
              {draft.island.depth / 10} cm głębokości
            </p>
          )}
          <p>
            {kitchenOptions.front[draft.quote.front]} ·{" "}
            {draft.decor?.name ??
              finishes.find((f) => f.id === draft.finish)?.name}
          </p>
          <p>
            Szuflady:{" "}
            {modules.reduce((n, m) => n + m.konfiguracja.liczbaSzuflad, 0)} ·
            dolna zabudowa:{" "}
            {modules
              .filter((m) => m.pozycjaYMM < 1000)
              .reduce(
                (n, m) =>
                  n + kitchenOuterBounds(m).end - kitchenOuterBounds(m).start,
                0,
              ) / 10}{" "}
            cm
          </p>
          <p>
            {kitchenOptions.worktop[draft.quote.worktop]} ·{" "}
            {draft.quote.installation ? "z montażem" : "bez montażu"}
          </p>
          <strong>
            {estimate.data?.gross != null
              ? kitchenMoney(estimate.data.gross)
              : estimate.error
                ? "Cena niedostępna"
                : estimate.data?.status === "blocked"
                  ? "Popraw układ"
                  : "Obliczamy…"}
          </strong>
          {estimate.error && (
            <button className="ps-text-button" onClick={estimate.retry}>
              Ponów wycenę wariantu {label}
            </button>
          )}
          <button
            className="ps-button secondary"
            disabled={disabled}
            onClick={onUse}
          >
            Użyj wariantu {label}
          </button>
        </>
      ) : (
        <p>Zapisz tutaj bieżący projekt, aby go porównać.</p>
      )}
    </article>
  );
}
export function useKitchenVariants() {
  const [error, setError] = useState(""),
    [volatile, setVolatile] = useState(false);
  const [variants, setVariants] = useState<(Draft | null)[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [null, null];
      if (raw.length > 150000) return [null, null];
      const saved = JSON.parse(raw);
      if (
        saved.version !== 1 ||
        !Array.isArray(saved.items) ||
        saved.items.length !== 2
      )
        return [null, null];
      return saved.items.map((x: unknown) =>
        x ? readDraft(JSON.stringify(x)) : null,
      );
    } catch {
      return [null, null];
    }
  });
  const save = (draft: Draft, n: number) => {
    const next = variants.map((v, i) => (i === n ? structuredClone(draft) : v));
    setVariants(next);
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, items: next }));
      setError("");
      setVolatile(false);
    } catch {
      setVolatile(true);
      setError(
        "Warianty są dostępne w tej karcie. Pamięć urządzenia jest niedostępna; pobierz szkic przed zamknięciem.",
      );
    }
  };
  useEffect(() => {
    if (!volatile) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [volatile]);
  return { variants, error, save };
}
export function KitchenVariants({
  draft,
  disabled,
  onApply,
  model,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (d: Draft) => void;
  model: ReturnType<typeof useKitchenVariants>;
}) {
  const [open, setOpen] = useState(false);
  const [overwrite, setOverwrite] = useState<number | null>(null);
  const confirmation = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement | null>(null);
  const { variants, error, save } = model;
  return (
    <details
      className="kp-variants"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Porównaj dwa warianty kuchni</summary>
      <p>
        Zapisane na tym urządzeniu. Wybór wariantu zastąpi bieżący projekt;
        Cofnij go odtworzy. Każdy wariant ma własną orientacyjną wycenę na tych
        samych stawkach.
      </p>
      <div className="kp-variant-grid">
        {[0, 1].map((n) => (
          <div key={n}>
            <Variant
              label={n ? "B" : "A"}
              draft={variants[n]}
              open={open}
              disabled={disabled}
              onUse={() =>
                variants[n] && onApply(structuredClone(variants[n]!))
              }
            />
            <button
              className="ps-text-button"
              disabled={
                disabled || (!draft.items.length && !draft.island?.items.length)
              }
              onClick={(e) => {
                if (variants[n]) {
                  trigger.current = e.currentTarget;
                  setOverwrite(n);
                  confirmation.current?.showModal();
                } else save(draft, n);
              }}
            >
              {variants[n] ? "Zastąp" : "Zapisz"} wariant {n ? "B" : "A"}{" "}
              bieżącym projektem
            </button>
          </div>
        ))}
      </div>
      {error && <Feedback>{error}</Feedback>}
      <dialog
        className="kp-dialog"
        ref={confirmation}
        aria-labelledby="kp-variant-confirm-title"
        onClose={() => {
          setOverwrite(null);
          trigger.current?.focus();
        }}
      >
        <h2 id="kp-variant-confirm-title">
          Zastąpić wariant {overwrite === 1 ? "B" : "A"}?
        </h2>
        <p>Zapisany wariant zostanie zastąpiony bieżącym projektem.</p>
        <div className="kp-actions">
          <button
            type="button"
            className="ps-button secondary"
            autoFocus
            onClick={() => confirmation.current?.close()}
          >
            Zachowaj zapisany wariant
          </button>
          <button
            type="button"
            className="ps-button"
            disabled={disabled}
            onClick={() => {
              if (overwrite !== null) save(draft, overwrite);
              confirmation.current?.close();
            }}
          >
            Zastąp zapisany wariant
          </button>
        </div>
      </dialog>
    </details>
  );
}
