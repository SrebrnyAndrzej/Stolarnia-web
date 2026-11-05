import { furnitureOpenings } from "../../../src/core/furniture-openings";
import {
  platePolygon,
  furnitureOutline,
  type FurnitureModel,
} from "../../../src/core/furniture";
import { verticalSection } from "../../../src/core/technical-openings";
import { furnitureDrawerCalculations } from "../../../src/core/furniture-drawers";
import { slopeRoofPanels } from "../../../src/core/slope-cut";
const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const mm = (v: number) =>
  v.toLocaleString("pl-PL", { maximumFractionDigits: 1 });
export function furnitureDocument(
  model: FurnitureModel,
  id: string,
  version: number,
) {
  const { structural, geometry, openings } = furnitureOpenings(model);
  const W = 440,
    H = 330,
    pad = 42,
    scale = Math.min((W - 2 * pad) / model.width, (H - 2 * pad) / model.height);
  const X = (x: number) => pad + x * scale,
    Y = (y: number) => H - pad - y * scale;
  const line = (x1: number, y1: number, x2: number, y2: number, text: string) =>
    `<path d="M${x1} ${y1}L${x2} ${y2}" class="dim"/><text x="${(x1 + x2) / 2 + 4}" y="${(y1 + y2) / 2 - 4}">${esc(text)}</text>`;
  const front = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Wnętrze i światło między półkami">${geometry.map((p) => `<polygon points="${p.polygon.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}"/>`).join("")}${line(X(0), H - 16, X(model.width), H - 16, mm(model.width))}${line(16, Y(0), 16, Y(model.height), mm(model.height))}${openings.map((o, i) => line(X(o.probeX), Y(o.y), X(o.probeX), Y(o.y + o.height), `${i + 1}: ${mm(o.height)}`)).join("")}</svg>`;
  const sx = Math.min(
      (W - 2 * pad) / model.depth,
      (H - 2 * pad) / model.height,
    ),
    probe = model.width / 2;
  const side = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Przekrój boczny w osi mebla">${structural
    .map((p) => {
      const range = verticalSection(platePolygon(model, p), probe);
      return range
        ? `<rect x="${pad + p.z * sx}" y="${H - pad - range[1] * sx}" width="${p.depth * sx}" height="${(range[1] - range[0]) * sx}"/>`
        : "";
    })
    .join(
      "",
    )}${line(pad, H - 16, pad + model.depth * sx, H - 16, mm(model.depth))}<text x="${pad}" y="18">Przekrój X = ${mm(probe)} mm · tył z lewej</text></svg>`;
  const drawers = furnitureDrawerCalculations(model);
  return `<!doctype html><html lang="pl"><meta charset="utf-8"><title>${esc(model.name)} — karta skrócona</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font:11px Arial,sans-serif;color:#1c2b30;margin:20px}h1{font-size:22px;margin:0 0 5px}h2{font-size:14px;margin:14px 0 6px}p{margin:5px 0;line-height:1.45}.meta{color:#58676a}.views{display:grid;grid-template-columns:1fr 1fr;gap:18px}.view{border:1px solid #b6c3bb;padding:10px;break-inside:avoid}svg{width:100%;height:270px}polygon,rect{fill:#edf0ec;stroke:#1c2b30;stroke-width:1}text{font:11px Arial;fill:#1c2b30;paint-order:stroke;stroke:#fff;stroke-width:3;stroke-linejoin:round}.dim{fill:none;stroke:#435058;stroke-width:.7;stroke-dasharray:3 2}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #dce1df;padding:5px}tr,section{break-inside:avoid}.note{padding:8px;border-left:3px solid #a5b859;background:#f1f4f1}@media print{body{margin:0}button{display:none}}</style><h1>${esc(model.name)} · karta skrócona</h1><p>${mm(model.width)} × ${mm(model.height)} × ${mm(model.depth)} mm · grubość korpusu ${mm(model.thickness)} mm</p><p class="meta">Model ${esc(id)} · wersja bazowa ${version} · bieżący szkic, także niezapisane zmiany. Wszystkie wymiary w mm. Rysunek poglądowy, nie w skali 1:1.</p><p class="note">SZKIC — wymaga sprawdzenia konstrukcji i okuć przed produkcją.</p><div class="views"><div class="view"><h2>Przód bez frontów · światło między płytami</h2>${front}</div><div class="view"><h2>Przekrój boczny · głębokość</h2>${side}</div></div><h2>Prześwity w osi każdej kolumny</h2><p>Od górnej powierzchni dolnej płyty do dolnej powierzchni płyty powyżej; grubości półek odjęte. Przy skosie wymiar obowiązuje na pokazanej osi X. Fronty i plecy są ukryte.</p><table><thead><tr><th>Nr</th><th>Oś X od lewej</th><th>Dół od podstawy</th><th>Światło pionowe</th></tr></thead><tbody>${openings.map((o, i) => `<tr><td>${i + 1}</td><td>${mm(o.probeX)}</td><td>${mm(o.y)}</td><td><strong>${mm(o.height)}</strong></td></tr>`).join("")}</tbody></table>${slopeRoofPanels(
    model,
  )
    .map(
      (p) =>
        `<section><h2>Wieniec pod skosem</h2><p>Górna krawędź ${mm(p.topLength)} mm · formatka przed cięciem ${mm(p.blankLength)} × ${mm(p.depth)} × ${mm(p.thickness)} mm.</p></section>`,
    )
    .join(
      "",
    )}<section><h2>Najważniejsze wiercenia okuć</h2><p>Biblioteka mebli nie zawiera zatwierdzonych operacji produkcyjnych. Nie wyznaczono automatycznie otworów pod podpórki i zawiasy.</p>${drawers
    .map((c) => {
      const f = c.result?.mocowanieFrontu;
      return `<p><strong>${esc(c.frontName)}</strong>: ${esc(c.result?.system ?? "system do wyboru")}. ${f?.status === "pozycje" ? `Tylna strona frontu: oś lewa ${esc(f.odLewejKrawedziMM)} mm od lewej, prawa ${esc(f.odPrawejKrawedziMM)} mm od prawej; wysokości ${esc(f.odDolnejKrawedziMM?.join(" / "))} mm od dołu. Średnica i głębokość: do ustalenia. Pozycje katalogowe, niezatwierdzone produkcyjnie.` : `Pozycje, średnice i głębokości do ustalenia w karcie wybranego systemu.`}</p>`;
    })
    .join(
      "",
    )}</section><p class="meta">Pełny indeks części: osobny eksport CSV/JSON. Drukuj w poziomie lub zapisz jako PDF.</p></html>`;
}
