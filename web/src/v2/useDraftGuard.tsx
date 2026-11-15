import { useEffect, useRef, useState } from "react";
export function useDraftGuard(
  dirty: boolean,
  onDiscard: () => void,
  stayLabel = "Zostań w edytorze",
) {
  const [pending, setPending] = useState<null | (() => void)>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const discard = useRef(onDiscard);
  discard.current = onDiscard;
  useEffect(() => {
    if (pending) dialog.current?.showModal();
    else dialog.current?.close();
  }, [pending]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const navigate = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (!a || a.target === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey)
        return;
      const href = a.getAttribute("href");
      if (!href?.startsWith("#/") || href === location.hash) return;
      e.preventDefault();
      setPending(() => () => {
        location.hash = href;
      });
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
  return {
    guarded: (action: () => void) =>
      dirty ? setPending(() => action) : action(),
    dialog: (
      <dialog
        className="ps-draft-dialog"
        ref={dialog}
        onCancel={() => setPending(null)}
      >
        <h2>Odrzucić niezapisane zmiany?</h2>
        <p>Zmiany w tym szkicu nie zostały zapisane.</p>
        <button
          className="ps-button secondary"
          autoFocus
          onClick={() => setPending(null)}
        >
          {stayLabel}
        </button>
        <button
          className="ps-button"
          onClick={() => {
            const action = pending;
            setPending(null);
            discard.current();
            action?.();
          }}
        >
          Odrzuć szkic
        </button>
      </dialog>
    ),
  };
}
