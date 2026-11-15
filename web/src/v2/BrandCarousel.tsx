import { useRef } from "react";
import manifest from "../../public/brand/manufacturers/manufacturers.json";
export function BrandCarousel() {
  const ref = useRef<HTMLUListElement>(null);
  return (
    <section aria-label="Marki materiałów i okuć" className="ps-brand-carousel">
      <p>
        Marki w katalogach materiałów i akcesoriów. Dobór do Twojego projektu
        potwierdzimy podczas wyceny.
      </p>
      <div className="ps-task-actions">
        <button
          className="ps-button secondary"
          aria-label="Poprzednie logotypy"
          onClick={() =>
            ref.current?.scrollBy({
              left: -400,
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
            })
          }
        >
          ←
        </button>
        <button
          className="ps-button secondary"
          aria-label="Następne logotypy"
          onClick={() =>
            ref.current?.scrollBy({
              left: 400,
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
            })
          }
        >
          →
        </button>
      </div>
      <ul
        ref={ref}
        tabIndex={0}
        aria-label="Logotypy marek — przewijaj poziomo"
      >
        {manifest.items.map((m) => (
          <li key={m.src}>
            <img
              src={m.src}
              alt={m.name}
              width="160"
              height="80"
              loading="lazy"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
