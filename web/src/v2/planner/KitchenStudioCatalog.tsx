import { IconChevronDown, IconPlus, IconSearch } from "@tabler/icons-react";
import type { ModulKatalogowy } from "../../../../src/core/types";
import { studioGroup, studioGroups, studioMatches } from "./studio-catalog";

export function KitchenStudioCatalog({
  catalog,
  available,
  group,
  query,
  onQuery,
  onGroup,
  onAdd,
  disabled,
}: {
  catalog: ModulKatalogowy[];
  available: ModulKatalogowy[];
  group: string;
  query: string;
  onQuery: (query: string) => void;
  onGroup: (group: string) => void;
  onAdd: (id: string) => void;
  disabled: boolean;
}) {
  const searching = !!query.trim();
  const matches = catalog.filter((m) => studioMatches(m, query));
  const fits = new Set(available.map((m) => m.id));
  return (
    <div className="kp-studio-catalog">
      <label className="kp-studio-search">
        <span>Szukaj szafki lub wyposażenia</span>
        <span>
          <IconSearch size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Np. szuflady, lodówka, 60 cm"
          />
        </span>
      </label>
      <p className="kp-muted">
        Wybierz grupę, a następnie wariant. Po dodaniu ustawisz jego wymiary.
      </p>
      {!matches.length && (
        <p role="status">
          Nie znaleziono wariantu. Zmień hasło lub{" "}
          <button className="ps-text-button" onClick={() => onQuery("")}>
            wyczyść wyszukiwanie
          </button>
          .
        </p>
      )}
      {["Meble", "AGD i hydraulika", "Wykończenia"].map((section) => {
        const groups = studioGroups.filter(
          (g) =>
            g.section === section &&
            matches.some((m) => studioGroup(m) === g.id),
        );
        return (
          groups.length > 0 && (
            <section key={section} aria-label={section}>
              <h3>{section}</h3>
              {groups.map((g) => {
                const variants = matches.filter((m) => studioGroup(m) === g.id);
                const fitting = variants.filter((m) => fits.has(m.id));
                const expanded = searching || group === g.id;
                const title = (
                  <span>
                    <strong>{g.name}</strong>
                    <small>
                      Pasujące warianty: {fitting.length} z {variants.length}
                    </small>
                  </span>
                );
                return (
                  <div className="kp-studio-category" key={g.id}>
                    {searching ? (
                      <h4
                        id={`kp-studio-group-${g.id}`}
                        className="kp-studio-category-toggle"
                      >
                        {title}
                      </h4>
                    ) : (
                      <button
                        type="button"
                        id={`kp-studio-group-${g.id}`}
                        className="kp-studio-category-toggle"
                        aria-expanded={expanded}
                        aria-controls={`kp-studio-variants-${g.id}`}
                        onClick={() => {
                          onGroup(group === g.id ? "" : g.id);
                        }}
                      >
                        {title}
                        <IconChevronDown size={18} aria-hidden="true" />
                      </button>
                    )}
                    <div
                      id={`kp-studio-variants-${g.id}`}
                      role="region"
                      aria-labelledby={`kp-studio-group-${g.id}`}
                      hidden={!expanded}
                    >
                      <p className="kp-muted">{g.hint}</p>
                      {fitting.length ? (
                        <div className="kp-catalog-items">
                          {fitting.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => onAdd(m.id)}
                            >
                              <span
                                className={`kp-cabinet-icon ${m.construction}`}
                                aria-hidden="true"
                              />
                              <span>
                                <strong>Dodaj: {m.name}</strong>
                                <small>
                                  {m.widthMM / 10} × {m.heightMM / 10}
                                  {m.construction === "filler"
                                    ? " cm · blenda"
                                    : ` × ${m.depthMM / 10} cm`}
                                </small>
                              </span>
                              <IconPlus size={18} aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="kp-studio-no-fit">
                          W tym miejscu nie można dodać wariantu z tej grupy.
                          Sprawdź wolną lukę, okna i narożniki lub wybierz inną
                          ścianę.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )
        );
      })}
      <p className="kp-muted">
        Katalog pokazuje zabudowy pod AGD. Cenę urządzeń potwierdzimy osobno.
      </p>
    </div>
  );
}
