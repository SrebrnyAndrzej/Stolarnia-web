import { useState } from "react";
import { IconArrowRight, IconArrowUpRight } from "@tabler/icons-react";

export function CabinetAssembly() {
  const [failed, setFailed] = useState(false);
  return (
    <section
      className="ps-public-section ps-assembly"
      aria-labelledby="assembly-heading"
    >
      <div className="ps-assembly-copy">
        <span className="ps-eyebrow">Od projektu do mebla</span>
        <h2 id="assembly-heading">Zobacz, jak składa się szafka.</h2>
        <p>
          Przyjrzyj się elementom korpusu i zobacz, jak trafiają na swoje
          miejsce.
        </p>
        <p className="ps-media-note">
          Model szafki z jednego z naszych projektów. To poglądowa prezentacja
          konstrukcji, nie instrukcja montażowa.
        </p>
      </div>
      <figure className="ps-assembly-film">
        {failed ? (
          <>
            <img
              src="/animations/skladanie-szafki-poster.png"
              width="1280"
              height="720"
              alt="Elementy korpusu szafki pokazane osobno w widoku 3D"
            />
            <p className="ps-media-error" role="status">
              Film jest niedostępny. Możesz obejrzeć statyczny podgląd.
            </p>
          </>
        ) : (
          <video
            controls
            muted
            playsInline
            preload="none"
            width="1280"
            height="720"
            poster="/animations/skladanie-szafki-poster.png"
            aria-label="Poglądowa animacja składania korpusu szafki"
            onError={() => setFailed(true)}
          >
            <source src="/animations/skladanie-szafki.mp4" type="video/mp4" />
            Twoja przeglądarka nie obsługuje filmu.
          </video>
        )}
        <figcaption>
          {failed
            ? "Statyczny podgląd konstrukcji"
            : "Uruchom film, aby zobaczyć składanie · bez dźwięku"}
        </figcaption>
      </figure>
    </section>
  );
}
const projects = [
  {
    file: "projekt-1.jpg",
    title: "Zabudowa wysoka",
    modules: 16,
    alt: "Studyjny widok 3D wysokiej zabudowy kuchennej z szafkami wiszącymi",
  },
  {
    file: "projekt-2.jpg",
    title: "Zabudowa narożna",
    modules: 11,
    alt: "Studyjny widok 3D projektu kuchni z niską zabudową narożną i słupkami",
  },
  {
    file: "projekt-3.jpg",
    title: "Kuchnia z wyspą",
    modules: 12,
    alt: "Studyjny widok 3D projektu z ciągiem kuchennym i oddzielną wyspą",
  },
];
export function ProjectRenders() {
  return (
    <section
      className="ps-public-section ps-render-section"
      aria-labelledby="renders-heading"
    >
      <div className="ps-render-heading">
        <div>
          <span className="ps-eyebrow">Z naszych projektów</span>
          <h2 id="renders-heading">Zobacz projekty w 3D.</h2>
        </div>
        <p>
          Rendery powstały z geometrii zapisanych projektów. Materiały i kolory
          są poglądowe.
        </p>
      </div>
      <ul className="ps-render-grid">
        {projects.map((p) => (
          <li key={p.file}>
            <figure>
              <a
                href={`/renders/${p.file}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Powiększ render: ${p.title}`}
              >
                <img
                  src={`/renders/${p.file}`}
                  alt={p.alt}
                  width="1920"
                  height="1200"
                  loading="lazy"
                  decoding="async"
                />
                <span className="ps-render-expand">
                  <IconArrowUpRight size={20} />
                </span>
              </a>
              <figcaption>
                <h3>{p.title}</h3>
                <p>{p.modules} modułów · widok studyjny</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <a className="ps-button" href="#/kreator-kuchni">
        Zaprojektuj kuchnię <IconArrowRight size={18} />
      </a>
    </section>
  );
}
