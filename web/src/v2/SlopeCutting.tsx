import { useState } from "react";
import { slopeCut } from "../../../src/core/slope-cut";
import type { FurnitureModel } from "../../../src/core/furniture";
const number = (n: number, digits = 2) =>
  n.toLocaleString("pl-PL", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
export function SlopeCutting({ model }: { model: FurnitureModel }) {
  const [saw, setSaw] = useState("table");
  const [joint, setJoint] = useState("butt");
  const result = slopeCut(model);
  if (!result)
    return (
      <p role="alert">
        Sprawdź wysokości boków: długi bok nie może być niższy od krótkiego, a
        szerokość musi pomieścić obie płyty.
      </p>
    );
  const rows =
    joint === "butt"
      ? [
          { name: "Boki — górna krawędź", ...result.butt },
          { name: "Wieniec — zakończenia przy bokach", ...result.butt },
        ]
      : [
          {
            name: "Narożnik przy krótkim boku — obie płyty",
            ...result.mitreShort,
          },
          {
            name: "Narożnik przy długim boku — obie płyty",
            ...result.mitreLong,
          },
        ];
  const scale = Math.min(400 / model.width, 210 / model.height);
  const left = 95,
    right = left + model.width * scale,
    bottom = 250;
  const hl = model.reverse ? model.height : model.lowHeight;
  const hr = model.reverse ? model.lowHeight : model.height;
  return (
    <section className="fc-cut" aria-label="Kalkulator cięcia skosu">
      <h2>Skos i ustawienie piły do 45°</h2>
      <p>
        Wymiary boków mierzone od dołu do górnej linii obrysu na zewnętrznych
        krawędziach. Szerokość to poziomy wymiar zewnętrzny, nie długość skosu.
      </p>
      <svg
        role="img"
        aria-label="Schemat krótkiego i długiego boku oraz poziomej szerokości"
        viewBox="0 0 600 305"
        className="fc-cut-diagram"
      >
        <path
          d={`M ${left} ${bottom} V ${bottom - hl * scale} L ${right} ${bottom - hr * scale} V ${bottom} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d={`M ${left - 15} ${bottom} H ${left - 25} V ${bottom - hl * scale} H ${left - 15} M ${right + 15} ${bottom} H ${right + 25} V ${bottom - hr * scale} H ${right + 15} M ${left} ${bottom + 12} V ${bottom + 22} H ${right} V ${bottom + 12}`}
          fill="none"
          stroke="currentColor"
        />
        <text x={left - 33} y={bottom - (hl * scale) / 2} textAnchor="end">
          {number(hl, 0)}
        </text>
        <text x={right + 33} y={bottom - (hr * scale) / 2}>
          {number(hr, 0)}
        </text>
        <text x={(left + right) / 2} y={bottom + 44} textAnchor="middle">
          {number(model.width, 0)} mm
        </text>
        <text x={Math.min(470, right + 20)} y="30">
          α = {number(result.angle)}°
        </text>
      </svg>
      <dl className="fc-cut-summary">
        <div>
          <dt>Kąt skosu od poziomu</dt>
          <dd>{number(result.angle)}°</dd>
        </div>
        <div>
          <dt>Różnica wysokości</dt>
          <dd>{number(result.rise, 1)} mm</dd>
        </div>
        <div>
          <dt>Długość zewnętrznej linii skosu</dt>
          <dd>{number(result.outerSlopeLength, 1)} mm</dd>
        </div>
      </dl>
      <div className="fc-fields">
        <label>
          Piła
          <select
            aria-label="Piła"
            value={saw}
            onChange={(e) => setSaw(e.target.value)}
          >
            <option value="table">Mac Allister — pilarka stołowa</option>
            <option value="track">Mac Allister — zagłębiarka na szynie</option>
          </select>
        </label>
        <label>
          Oblicz kąty dla połączenia
          <select
            aria-label="Połączenie do obliczeń"
            value={joint}
            onChange={(e) => setJoint(e.target.value)}
          >
            <option value="butt">Wieniec między bokami</option>
            <option value="mitre">Ucios obu płyt — porównanie</option>
          </select>
        </label>
      </div>
      <p>
        <strong>Skala: 0° = cięcie prostopadłe do płyty.</strong> Wynik oznacza
        pochylenie tarczy od pionu, przy płycie leżącej szeroką powierzchnią
        płasko. To nie jest kąt obrotu przykładnicy w blacie.
      </p>
      <div className="fc-cut-table">
        <table>
          <thead>
            <tr>
              <th>Element / połączenie</th>
              <th>Nastawa tarczy</th>
              <th>Limit 45°</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>
                  <strong>{number(r.degrees)}°</strong>
                </td>
                <td>
                  {r.fits
                    ? "W zakresie kątowym"
                    : "Poza zakresem — nie wykonuj takiego cięcia"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {joint === "butt" ? (
        <>
          <h3>Wymiary przy wieńcu między bokami</h3>
          <ul>
            <li>
              Krótki bok: zewnętrzna krawędź {number(result.shortOuter, 1)} mm;
              wewnętrzna {number(result.shortInner, 1)} mm.
            </li>
            <li>
              Długi bok: zewnętrzna krawędź {number(result.longOuter, 1)} mm;
              wewnętrzna {number(result.longInner, 1)} mm.
            </li>
            <li>
              Górna krawędź wieńca między bokami:{" "}
              {number(result.roofTopEdge, 1)} mm.
            </li>
          </ul>
          <p>
            To wymiary geometryczne gotowych krawędzi, bez obrzeży, zapasu i
            rzazu. Wizualizacja przedstawia ten wariant połączenia.
          </p>
        </>
      ) : (
        <p>
          Kąty wewnętrzne narożników: {number(result.cornerShort)}° przy krótkim
          i {number(result.cornerLong)}° przy długim boku. Równy ucios każdej
          płyty: (180° − kąt wewnętrzny) / 2. To porównanie nastaw — nie zmienia
          konstrukcji na rysunku ani nie wyznacza długości płyt dla uciosu.
        </p>
      )}
      {rows.every((r) => r.fits) ? (
        <p>
          <strong>
            {saw === "table" ? "Pilarka stołowa:" : "Zagłębiarka:"}
          </strong>{" "}
          przy odłączonym zasilaniu ustaw i zablokuj wymagane pochylenie według
          skali swojej maszyny. Zweryfikuj 0° i ustawiony kąt kątownikiem lub
          kątomierzem.{" "}
          {saw === "track"
            ? "Płyta i szyna muszą być podparte i zamocowane; przy skosie sprawdź rzeczywisty przebieg cięcia względem szyny."
            : "Płyta musi mieć pełne podparcie i właściwe dla tego cięcia prowadzenie."}{" "}
          Zrób próbę na odpadzie tej samej grubości, zaznaczając stronę
          zewnętrzną, wewnętrzną i odpad.
        </p>
      ) : (
        <p role="alert">
          <strong>Wymagany kąt przekracza 45°.</strong> W tej konfiguracji nie
          ma bezpośredniej nastawy dla podanego zakresu maszyny. Zmień
          połączenie lub konstrukcję; kalkulator nie proponuje cięcia z płytą
          trzymaną pionowo ani prowizorycznych podkładek.
        </p>
      )}
      <p>
        Tarcza Freud nie zmienia wyliczonego kąta. Rzeczywisty rzaz i położenie
        cięcia po stronie odpadu sprawdź dla konkretnej tarczy. Samo
        zmieszczenie się w 45° nie potwierdza dopuszczalnej głębokości cięcia;
        model maszyny i jej instrukcja pozostają do sprawdzenia.
      </p>
    </section>
  );
}
