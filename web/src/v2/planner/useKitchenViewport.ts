import { useEffect, useRef } from "react";

/** Fit only the preview, leaving the page and auxiliary forms naturally scrollable. */
export function useKitchenViewport(step: number, revision: string) {
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element || step === 0) return;
    const desktop = window.matchMedia("(min-width: 721px)");
    const inspector = element
      .closest(".kp-workbench")
      ?.querySelector<HTMLElement>(".kp-catalog");
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!desktop.matches) {
          element.style.removeProperty("--kp-available-height");
          inspector?.style.removeProperty("--kp-inspector-height");
          return;
        }
        const footer =
          document.querySelector<HTMLElement>(".kp-bottom-actions");
        const caption = element.parentElement?.querySelector<HTMLElement>(
          ".kp-preview-caption",
        );
        const bottom = footer?.getBoundingClientRect().top ?? innerHeight - 80;
        const available = Math.floor(
          bottom -
            element.getBoundingClientRect().top -
            (caption?.offsetHeight ?? 20) -
            24,
        );
        element.style.setProperty(
          "--kp-available-height",
          `${Math.max(120, Math.min(560, available))}px`,
        );
        if (inspector)
          inspector.style.setProperty(
            "--kp-inspector-height",
            `${Math.max(160, Math.floor(bottom - inspector.getBoundingClientRect().top - 12))}px`,
          );
      });
    };
    const observer = new ResizeObserver(measure);
    if (element.parentElement) observer.observe(element.parentElement);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [step, revision]);
  return canvas;
}
