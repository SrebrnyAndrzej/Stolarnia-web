import {
  furnitureDrawerCalculations,
  furnitureDrawerProfiles,
  drawerBoundaryCandidates,
  type FurnitureDrawerCalculation,
} from "../../../src/core/furniture-drawers";
import type {
  FurnitureModel,
  DrawerAssembly,
} from "../../../src/core/furniture";
import { RysunekFrontu } from "../views/szuflady/RysunekFrontu";
const mm = (v: number | null | undefined) =>
  v == null
    ? "Do ustalenia"
    : v.toLocaleString("pl-PL", { maximumFractionDigits: 3 });
export function FurnitureDrawers({
  model,
  disabled,
  saved,
  onChange,
  frontId,
}: {
  model: FurnitureModel;
  frontId?: string;
  disabled: boolean;
  saved: FurnitureDrawerCalculation[] | null;
  onChange: (frontId: string, selection: DrawerAssembly | null) => void;
}) {
  const calculations = (saved ?? furnitureDrawerCalculations(model)).filter(
    (c) => !frontId || c.frontId === frontId,
  );
  if (!calculations.length) return null;
  return (
    <section className="fc-drawer-systems" aria-label="Systemy szuflad w meblu">
      <h2>Systemy szuflad · {calculations.length}</h2>
      <p>
        Każdy front ma własny system, wysokość boku i długość NL. Dno i
        drewniane plecy przeliczamy dla wybranego systemu i światła komory. Nie
        zmienia to frontu ani nie zatwierdza okuć do zakupu.
      </p>
      <p>
        {saved
          ? "Wynik zapisanej wersji modelu. Zmiana danych przeliczy szkic na bieżącej bibliotece profili."
          : "Wynik roboczy bieżącego szkicu — zapisz, aby zamrozić go z modelem."}
      </p>
      {calculations.map((c) => {
        const selection = model.drawerAssemblies?.find(
          (p) => p.frontId === c.frontId,
        );
        const profile = furnitureDrawerProfiles.find(
          (p) => p.id === selection?.profileId,
        );
        const set = (patch: Partial<DrawerAssembly>) =>
          onChange(c.frontId, {
            frontId: c.frontId,
            profileId: selection?.profileId ?? "",
            variant: selection?.variant ?? "",
            nominalLength: selection?.nominalLength ?? null,
            ...selection,
            ...patch,
          });
        return (
          <fieldset
            id={`fc-drawer-${c.frontId}`}
            disabled={disabled}
            key={c.frontId}
          >
            <legend>
              {c.frontName} · front {mm(c.frontHeight)} mm
            </legend>
            <div className="fc-fields">
              {(["leftBoundaryId", "rightBoundaryId"] as const).map((key) => (
                <label key={key}>
                  {key === "leftBoundaryId" ? "Lewa" : "Prawa"} granica dla{" "}
                  {c.frontName}
                  <select
                    aria-label={`${key === "leftBoundaryId" ? "Lewa" : "Prawa"} granica dla ${c.frontName}`}
                    disabled={!profile}
                    value={selection?.[key] ?? ""}
                    onChange={(e) =>
                      set({ [key]: e.target.value || undefined })
                    }
                  >
                    <option value="">Granica automatyczna</option>
                    {drawerBoundaryCandidates(model).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label>
                System dla {c.frontName}
                <select
                  aria-label={`System dla ${c.frontName}`}
                  value={selection?.profileId ?? ""}
                  onChange={(e) =>
                    e.target.value
                      ? set({ profileId: e.target.value, variant: "" })
                      : onChange(c.frontId, null)
                  }
                >
                  <option value="">Wybierz system…</option>
                  {furnitureDrawerProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.manufacturer} {p.family}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Wariant boku dla {c.frontName}
                <select
                  aria-label={`Wariant boku dla ${c.frontName}`}
                  disabled={!profile}
                  value={selection?.variant ?? ""}
                  onChange={(e) => set({ variant: e.target.value })}
                >
                  <option value="">Wybierz wysokość…</option>
                  {profile?.variants.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                NL dla {c.frontName} (mm)
                <input
                  type="number"
                  min={1}
                  max={3000}
                  step={1}
                  disabled={!profile}
                  value={selection?.nominalLength ?? ""}
                  onChange={(e) => {
                    const n = e.target.valueAsNumber;
                    set({
                      nominalLength: Number.isFinite(n) && n > 0 ? n : null,
                    });
                  }}
                />
              </label>
            </div>
            <p>
              Światło między bokami: {mm(c.openingWidth)} mm · głębokość
              użytkowa między bokami i plecami: {mm(c.usableDepth)} mm. NL
              wybierz z karty konkretnej prowadnicy.
            </p>
            {profile && <p>{profile.scope}</p>}
            {profile && (
              <details className="fc-drawer-mounting">
                <summary>Mocowanie frontu · osie X/Y</summary>
                <label>
                  Pierwszy otwór od dołu dla {c.frontName} (mm)
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    step="any"
                    aria-describedby={`mount-hint-${c.frontId}${c.mountingError ? ` mount-error-${c.frontId}` : ""}`}
                    aria-invalid={!!c.mountingError}
                    value={selection?.firstHoleFromBottom ?? ""}
                    onChange={(e) =>
                      set({
                        firstHoleFromBottom:
                          e.target.value === ""
                            ? undefined
                            : e.target.valueAsNumber,
                      })
                    }
                  />
                </label>
                <p id={`mount-hint-${c.frontId}`}>
                  {profile.firstHoleMinimum !== undefined
                    ? `Minimum ${mm(profile.firstHoleMinimum)} mm nie wyznacza pozycji otworu. Wpisz położenie wynikające z montażu konkretnej skrzynki.`
                    : "Brak zweryfikowanego schematu zaczepów dla tego systemu. Pozycja nie tworzy brakujących danych katalogowych."}
                </p>
                {c.mountingError ? (
                  <p id={`mount-error-${c.frontId}`} role="alert">
                    Wiercenia wstrzymane: {c.mountingError}
                  </p>
                ) : (
                  c.result?.mocowanieFrontu && (
                    <>
                      <RysunekFrontu
                        mocowanie={c.result.mocowanieFrontu}
                        szerokosc={
                          model.plates.find((p) => p.id === c.frontId)?.width
                        }
                        wysokosc={c.frontHeight}
                      />
                      <p>
                        Oś od lewej:{" "}
                        <strong>
                          {mm(c.result.mocowanieFrontu.odLewejKrawedziMM)} mm
                        </strong>{" "}
                        · od prawej:{" "}
                        <strong>
                          {mm(c.result.mocowanieFrontu.odPrawejKrawedziMM)} mm
                        </strong>
                        .
                      </p>
                      <p>
                        Wysokości od dołu:{" "}
                        <strong>
                          {c.result.mocowanieFrontu.odDolnejKrawedziMM
                            ?.map(mm)
                            .join(" / ") ?? "Podaj pierwszy otwór"}
                        </strong>
                        .
                      </p>
                      <details>
                        <summary>Bazy pomiaru i założenia</summary>
                        <p>{c.result.mocowanieFrontu.opis}</p>
                        <p>
                          Zachowaj oznaczenia krawędzi L/P przy odwracaniu
                          płyty. Pozycje uwzględniają rzeczywiste przesunięcie
                          frontu względem boków komory.
                        </p>
                      </details>
                      <p>
                        Średnica i głębokość:{" "}
                        {mm(c.result.mocowanieFrontu.srednicaMM)} /{" "}
                        {mm(c.result.mocowanieFrontu.glebokoscMM)}. Obliczenie
                        robocze.
                      </p>
                    </>
                  )
                )}
              </details>
            )}
            {!!c.blockers.length && (
              <div className="ps-feedback" role="status">
                <strong>Uzupełnij lub popraw:</strong>
                <ul>
                  {c.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {c.result && (
              <>
                <div className="fc-cut-table">
                  <table>
                    <caption>
                      Formatki skrzynki · obliczenia robocze, mm
                    </caption>
                    <thead>
                      <tr>
                        <th>Element</th>
                        <th>Ilość</th>
                        <th>Wymiary</th>
                        <th>Grubość</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Dno</td>
                        <td>1</td>
                        <td>
                          {mm(c.result.dno.szer)} × {mm(c.result.dno.gl)}
                        </td>
                        <td>{mm(c.result.grubosc)}</td>
                      </tr>
                      <tr>
                        <td>Plecy drewniane</td>
                        <td>1</td>
                        <td>
                          {mm(c.result.plecy.szer)} × {mm(c.result.plecy.wys)}
                        </td>
                        <td>{mm(c.result.grubosc)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  Źródło: {c.result.zrodlo.dokument}, strona{" "}
                  {c.result.zrodlo.strona}. Obliczenie robocze, bez dopuszczenia
                  produkcyjnego.
                </p>
                <ul>
                  {c.result.uwagi.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </>
            )}
            <details>
              <summary>
                Komplet okuć — wymagane funkcje do potwierdzenia
              </summary>
              <ul>
                {c.hardwareFunctions.map((h) => (
                  <li key={h}>{h} · SKU i opakowanie nieustalone</li>
                ))}
              </ul>
            </details>
            <details>
              <summary>Braki do zatwierdzenia montażu i produkcji</summary>
              <ul>
                {c.unresolved.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              <p>
                Nie wygenerowano pozycji wkrętów prowadnic ani umiejscowienia
                skrzynki w bryle. Wymiary dna i pleców nie wyznaczają
                samodzielnie baz montażowych.
              </p>
            </details>
          </fieldset>
        );
      })}
    </section>
  );
}
