import { useState } from "react";
import type { ZbudowanyModul } from "../../../../src/core/types";
import type { Draft } from "./model";
import { drawerCalculatorLink } from "./KitchenCabinetEditor";

export function KitchenDrawerFronts({
  draft,
  built,
  initialCode,
}: {
  draft: Draft;
  built: Pick<ZbudowanyModul, "modul" | "elementy">;
  initialCode?: string;
}) {
  const fronts = built.elementy
    .filter((e) => e.rola === "front" && e.kod.startsWith("FRONT-SZ"))
    .sort((a, b) => b.y - a.y);
  const [code, setCode] = useState(initialCode ?? fronts[0]?.kod ?? "");
  const front = fronts.find((f) => f.kod === code) ?? fronts[0];
  if (!front) return null;
  const link = drawerCalculatorLink(draft, built, front.kod);
  return (
    <section
      className="kp-drawer-choice"
      aria-label="Szuflady zastosowane w szafce"
    >
      <label>
        Front do przeliczenia
        <select
          aria-label="Front do przeliczenia"
          value={front.kod}
          onChange={(e) => setCode(e.target.value)}
        >
          {fronts.map((f, i) => (
            <option key={f.kod} value={f.kod}>
              {i + 1} od góry · {f.szer.toLocaleString("pl-PL")} ×{" "}
              {f.wys.toLocaleString("pl-PL")} mm
            </option>
          ))}
        </select>
      </label>
      {link ? (
        <a className="ps-button secondary" href={link}>
          Przelicz szufladę tej szafki
        </a>
      ) : (
        <p>
          Głębokość szafki nie pozwala dobrać długości prowadnicy. Zwiększ
          głębokość.
        </p>
      )}
      <p>
        Wymiary dotyczą zastosowanego układu. Przeniesiemy światło korpusu,
        długość prowadnicy i wybrany front. Wysokość frontu nie jest wysokością
        boku szuflady.
      </p>
    </section>
  );
}
