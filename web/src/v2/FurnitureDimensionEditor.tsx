import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  dimensionDescription,
  editFurnitureDimension,
  type DimensionTarget,
} from "../../../src/core/furniture-dimension-edit";
import type { FurnitureModel } from "../../../src/core/furniture";
import { Feedback } from "./ui";
import { dimensionExpression } from "../../../src/core/dimension-expression";
export function FurnitureDimensionEditor({
  model,
  target,
  onApply,
  onClose,
}: {
  model: FurnitureModel;
  target: DimensionTarget;
  onApply: (next: FurnitureModel) => void;
  onClose: () => void;
}) {
  const d = dimensionDescription(model, target),
    [value, setValue] = useState(String(Math.round(d.value * 10) / 10)),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null);
  let preview: number | undefined;
  try {
    preview = dimensionExpression(value);
  } catch {
    /* Show actionable errors on apply. */
  }
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const el = dialog.current;
    el?.showModal();
    input.current?.select();
    return () => {
      el?.close();
      if (opener?.isConnected) opener.focus?.();
    };
  }, []);
  const apply = (automatic = false) => {
    try {
      const next = editFurnitureDimension(
        model,
        target,
        automatic ? d.value : dimensionExpression(value),
        () => crypto.randomUUID(),
        automatic,
      );
      onApply(next);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      input.current?.focus();
    }
  };
  return createPortal(
    <dialog
      ref={dialog}
      className="fc fc-dimension-dialog"
      aria-labelledby="dimension-editor-title"
      onCancel={onClose}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <h2 id="dimension-editor-title">Zmień wymiar na rysunku</h2>
        <label>
          {d.label} (mm)
          <input
            ref={input}
            autoFocus
            inputMode="text"
            maxLength={160}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby="dimension-editor-help"
          />
        </label>
        {preview !== undefined && (
          <output aria-live="polite" className="num">
            Wynik:{" "}
            {preview.toLocaleString("pl-PL", { maximumFractionDigits: 6 })} mm
          </output>
        )}
        <p id="dimension-editor-help">
          Wpisz mm lub działanie, np. (600-2*18)/3. Wynik jest wymiarem, nie
          zapisaną formułą.{" "}
          {target.kind === "compartment"
            ? "Podany wymiar zostanie zablokowany. Sąsiednie komory automatyczne podzielą pozostałe miejsce; grubość przegród jest uwzględniona."
            : target.kind === "opening"
              ? "Przesuniemy sąsiednią luźną półkę. Stałe blokady prześwitów ustawiaj w układzie komór."
              : "Przeliczymy korpus tym samym mechanizmem co w głównym formularzu. Blokady komór pozostają zachowane."}
        </p>
        {error && <Feedback>{error}</Feedback>}
        <div className="fc-actions">
          <button type="submit" className="ps-button">
            {target.kind === "compartment"
              ? "Ustaw i zablokuj"
              : "Zastosuj wymiar"}
          </button>
          {target.kind === "compartment" && d.locked && (
            <button type="button" onClick={() => apply(true)}>
              Przywróć wymiar automatyczny
            </button>
          )}
          <button type="button" onClick={onClose}>
            Anuluj
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
