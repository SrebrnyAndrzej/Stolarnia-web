import { useRef } from "react";
import { IconChevronDown, IconSearch, IconX } from "@tabler/icons-react";
import type { ModulKatalogowy } from "../../../../src/core/types";
import { studioGroup, studioGroups, studioMatches } from "./studio-catalog";
import { KitchenCatalogCard } from "./KitchenCatalogCard";
import type { RoomUnit } from "./room-dimensions";
import { uniqueKitchenAdditionPreviews } from "./catalog-placement";

export function KitchenStudioCatalog({
  catalog,
  available,
  group,
  query,
  onQuery,
  onGroup,
  onAdd,
  disabled,
  unit,
}: {
  catalog: ModulKatalogowy[];
  available: ModulKatalogowy[];
  group: string;
  query: string;
  onQuery: (query: string) => void;
  onGroup: (group: string) => void;
  onAdd: (id: string) => void;
  disabled: boolean;
  unit: RoomUnit;
}) {
  const searchInput = useRef<HTMLInputElement>(null);
  const searching = !!query.trim();
  const fits = new Map(available.map((m) => [m.id, m]));
  const matches = catalog.filter((m) =>
    studioMatches(fits.get(m.id) ?? m, query),
  );
  const clearSearch = () => {
    onQuery("");
    searchInput.current?.focus();
  };
  return (
    <div className="kp-studio-catalog">
      <div className="kp-studio-search">
        <label htmlFor="kp-studio-search">Szukaj szafki lub wyposażenia</label>
        <span>
          <IconSearch size={18} aria-hidden="true" />
          <input
            id="kp-studio-search"
            ref={searchInput}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Np. szuflady, lodówka, 60 cm"
          />
          {query && (
            <button
              type="button"
              className="ps-text-button"
              aria-label="Wyczyść wyszukiwanie szafek"
              onClick={clearSearch}
            >
              <IconX size={18} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>
      <p className="kp-muted">
        Wybierz grupę, a następnie wariant. Po dodaniu ustawisz jego wymiary.
      </p>
      {!matches.length && (
        <p role="status">
          Nie znaleziono wariantu. Zmień hasło lub{" "}
          <button className="ps-text-button" onClick={clearSearch}>
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
                const fitting = uniqueKitchenAdditionPreviews(
                  variants.flatMap((m) => {
                    const preview = fits.get(m.id);
                    return preview ? [preview] : [];
                  }),
                );
                const expanded = searching || group === g.id;
                const title = (
                  <span>
                    <strong>{g.name}</strong>
                    <small>Pasujące warianty: {fitting.length}</small>
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
                            <KitchenCatalogCard
                              key={m.id}
                              entry={m}
                              nominal={catalog.find(
                                (entry) => entry.id === m.id,
                              )!}
                              unit={unit}
                              disabled={disabled}
                              onAdd={onAdd}
                            />
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
