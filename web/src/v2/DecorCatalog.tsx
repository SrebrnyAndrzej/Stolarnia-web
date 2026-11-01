import { useState } from "react";
import { useResource } from "./useResource";
import { Feedback, Logo } from "./ui";
export interface DecorChoice {
  key: string;
  id: string;
  name: string;
  manufacturer: string;
  obraz: string;
}
export function DecorPicker({
  onSelect,
  selected,
}: {
  onSelect?: (d: DecorChoice) => void;
  selected?: string;
}) {
  const list = useResource<DecorChoice[]>("/api/demo/dekory");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [limit, setLimit] = useState(24);
  const rows = (list.data ?? []).filter(
    (d) =>
      (!brand || d.manufacturer === brand) &&
      `${d.id} ${d.name} ${d.manufacturer}`
        .toLocaleLowerCase("pl")
        .includes(query.toLocaleLowerCase("pl")),
  );
  return (
    <section aria-label="Katalog dekorów" className="ps-decor-catalog">
      <div className="ps-decor-filters">
        <label>
          Szukaj dekoru
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(24);
            }}
            placeholder="Kod lub nazwa dekoru"
          />
        </label>
        {query && (
          <button
            className="ps-button secondary"
            onClick={() => {
              setQuery("");
              setLimit(24);
            }}
          >
            Wyczyść wyszukiwanie
          </button>
        )}
        <label>
          Producent
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setLimit(24);
            }}
          >
            <option value="">Wszyscy producenci</option>
            <option>Egger</option>
            <option>Kronospan</option>
          </select>
        </label>
      </div>
      {list.busy ? (
        <p role="status">Wczytywanie dekorów…</p>
      ) : list.error ? (
        <Feedback retry={list.retry}>{list.error}</Feedback>
      ) : (
        <>
          <p role="status">
            Pokazano {Math.min(limit, rows.length)} z {rows.length} dekorów.
          </p>
          {!rows.length && (
            <p>Nie znaleziono dekorów. Zmień nazwę lub producenta.</p>
          )}
          <div className="ps-decor-grid">
            {rows.slice(0, limit).map((d) => (
              <article key={d.key} className="ps-decor-card">
                <img
                  src={d.obraz}
                  alt={`Próbka: ${d.name}`}
                  width="320"
                  height="180"
                  loading="lazy"
                />
                <p>
                  {d.manufacturer} · {d.id}
                </p>
                <h3>{d.name}</h3>
                {onSelect ? (
                  <button
                    className="ps-button secondary"
                    aria-pressed={selected === d.key}
                    onClick={() => onSelect(d)}
                  >
                    {selected === d.key ? "Wybrany dekor" : "Wybierz dekor"}
                  </button>
                ) : (
                  <a
                    className="ps-button secondary"
                    href={`#/kreator-kuchni?dekor=${encodeURIComponent(d.key)}`}
                  >
                    Wybierz do kuchni
                  </a>
                )}
              </article>
            ))}
          </div>
          {limit < rows.length && (
            <button
              className="ps-button"
              onClick={() => setLimit((n) => n + 24)}
            >
              Pokaż kolejne 24
            </button>
          )}
        </>
      )}
    </section>
  );
}
export function DecorCatalog() {
  return (
    <div className="ps-public">
      <header className="ps-public-header">
        <a href="#/" aria-label="Pan Stolarz — strona główna">
          <Logo />
        </a>
        <nav>
          <a href="#/">Strona główna</a>
          <a href="#/kreator-kuchni">Kreator kuchni</a>
        </nav>
      </header>
      <main className="ps-public-section">
        <h1>Katalog dekorów</h1>
        <p>
          Znajdź wykończenie swojej kuchni. Zdjęcia są poglądowe — kolor i
          strukturę potwierdzimy na fizycznej próbce. Obecność w katalogu nie
          oznacza dostępności magazynowej.
        </p>
        <DecorPicker />
      </main>
    </div>
  );
}
