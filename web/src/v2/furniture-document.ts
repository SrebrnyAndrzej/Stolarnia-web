import {
  type FurnitureModel,
  furnitureIssues,
} from "../../../src/core/furniture";
import { drawingParts } from "../../../src/core/furniture-drawings";
import { furnitureDrawerCalculations } from "../../../src/core/furniture-drawers";
import { frontHardware } from "../../../src/core/front-hardware";
import { slopeRoofPanels } from "../../../src/core/slope-cut";
import {
  technicalDrawingSvgs,
  assemblyDrawingSvg,
  drawingEscape as esc,
  drawingMM as mm,
} from "./furniture-drawings";

/** Two concise sheets; the same document is used for the in-app preview and offline print. */
export function furnitureDocument(
  model: FurnitureModel,
  id: string,
  version: number,
) {
  const drawings = technicalDrawingSvgs(model),
    parts = drawingParts(model);
  const structural = parts.filter(
    (p) => p.plate.kind !== "door" && p.plate.kind !== "drawer",
  );
  const shelves = structural.filter(
    ({ plate: p }) =>
      !p.anchor &&
      p.kind === "board" &&
      (p.specification?.face === "xz" ||
        (p.height <= model.thickness &&
          p.depth > p.height &&
          p.width > p.height)),
  );
  const issues = furnitureIssues(model),
    roof = slopeRoofPanels(model);
  const hardware = parts
    .filter(
      (p) =>
        p.plate.frontHardware &&
        (p.plate.frontHardware.hinges || p.plate.frontHardware.handle),
    )
    .map((p) => ({ ...p, result: frontHardware(model, p.plate) }));
  const drawers = furnitureDrawerCalculations(model);
  const header = (sheet: string, n: number) =>
    `<header><div><p class="eyebrow">PAN STOLARZ / ${sheet}</p><h1>${esc(model.name)}</h1></div><div class="sheet-number">${n} / 2</div></header><p class="meta">Model ${esc(id)} · wersja bazowa ${version} · bieżący szkic, także niezapisane zmiany · mm · nie w skali 1:1</p>`;
  const overflow = (shown: number, total: number, where: string) =>
    total > shown
      ? `<p class="meta">Pokazano ${shown} z ${total}. Pozostałe ${esc(where)} sprawdź w kreatorze; karta jest skrótem.</p>`
      : "";
  const partRows = structural
    .slice(0, 16)
    .map(
      ({ plate: p, label }) =>
        `<tr><th scope="row">${label}</th><td>${esc(p.name)}</td><td>${mm(p.width)} × ${mm(p.height)} × ${mm(p.depth)}</td></tr>`,
    )
    .join("");
  const shelfRows = shelves
    .slice(0, 8)
    .map(
      ({ plate: p, label }) =>
        `<tr><th scope="row">${label}</th><td>${mm(p.y)}</td><td>${mm(p.y + p.height)}</td></tr>`,
    )
    .join("");
  const openingRows = drawings.openings
    .slice(0, 16)
    .map(
      (o) =>
        `<tr><th scope="row">${o.label}</th><td>${mm(o.probeX)}</td><td>${mm(o.y)}</td><td><strong>${mm(o.height)}</strong></td><td>${o.clearWidth === null ? "—" : mm(o.clearWidth)}</td></tr>`,
    )
    .join("");
  const mounting = hardware.length
    ? `<p>Plany okuć frontów: ${hardware.length}. ${hardware.map((h) => `${h.label}: ${h.result.issues.length ? "wstrzymany" : `${h.result.holes.length} otw.`}`).join("; ")}. Współrzędne X/Y, średnice, głębokości i baza pomiaru są w osobnych kartach frontów (Płyta → Okucia).</p>`
    : "";
  const drawerMounts = drawers.filter(
    (c) => c.result?.mocowanieFrontu?.status === "pozycje",
  );
  const drawerPositions = drawerMounts.length
    ? `<table aria-label="Pozycje zaczepów szuflad"><thead><tr><th>Front</th><th>Oś od lewej</th><th>Oś od prawej</th><th>Wysokości od dołu</th></tr></thead><tbody>${drawerMounts
        .slice(0, 4)
        .map((c) => {
          const f = c.result!.mocowanieFrontu!;
          return `<tr><th scope="row">${esc(parts.find((p) => p.plate.id === c.frontId)?.label)} · ${esc(c.frontName)}</th><td>${esc(f.odLewejKrawedziMM)}</td><td>${esc(f.odPrawejKrawedziMM)}</td><td>${esc(f.odDolnejKrawedziMM?.join(" / "))}</td></tr>`;
        })
        .join(
          "",
        )}</tbody></table><p class="meta">Widok od tyłu frontu, osie od wskazanych krawędzi. Średnice i głębokości: do ustalenia. Pozycje katalogowe, niezatwierdzone produkcyjnie.</p>${overflow(4, drawerMounts.length, "plany zaczepów")}`
    : "";
  const dense = structural.length > 8 || drawings.openingCount > 6;
  const foot = `<footer>SZKIC KONSTRUKCJI · sprawdź połączenia i dokumentację wybranych okuć przed produkcją.</footer>`;
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(model.name)} — rysunki techniczne i montażowe</title><style>
@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font:11px Arial,sans-serif;color:#1c2b30;background:#e7ebe8;margin:0;line-height:1.35}.sheet{background:white;width:277mm;min-height:190mm;padding:8mm;margin:16px auto;break-after:page}.sheet:last-child{break-after:auto}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1c2b30;padding-bottom:5px}h1{font-size:20px;margin:0;overflow-wrap:anywhere}h2{font-size:12px;margin:0 0 5px}h3{font-size:11px;margin:8px 0 4px}p{margin:4px 0}.eyebrow{font-size:9px;letter-spacing:1.2px;margin:0 0 3px}.sheet-number{font-size:18px;white-space:nowrap;padding-left:16px}.meta,figcaption{color:#4b5b57;font-size:9px;overflow-wrap:anywhere}.note{border-left:3px solid #a5b859;background:#f1f4f1;padding:6px 8px;margin:7px 0}.note.error{border-color:#8b3d29}.views{display:grid;grid-template-columns:1fr 1fr;gap:12px}.view{border:1px solid #bac5be;padding:8px;margin:0;break-inside:avoid}svg{width:100%;height:300px;display:block}.board{fill:#edf0ec;stroke:#1c2b30;stroke-width:1}.section-board{fill:url(#section-hatch);stroke:#1c2b30;stroke-width:1.2}.assembly-face{fill:#e8eee6;stroke:#26382e;stroke-width:1}.assembly-edge{fill:#c4d0bd;stroke:#26382e;stroke-width:1}svg text{font:16px Arial,sans-serif;fill:#1c2b30;paint-order:stroke;stroke:white;stroke-width:3;stroke-linejoin:round}.dimension path{fill:none;stroke:#43534b;stroke-width:.8}.dimension .extension{stroke:#78857d;stroke-width:.5}.part-label{font-weight:bold}.leader{fill:none;stroke:#647365;stroke-width:.7}.data{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-top:9px}table{width:100%;border-collapse:collapse;font-size:10px}th,td{text-align:left;padding:3px 4px;border-bottom:1px solid #dce2dc;vertical-align:top}thead th{font-size:9px;color:#415148}tr{break-inside:avoid}footer{font-size:9px;border-top:1px solid #bac5be;margin-top:9px;padding-top:5px;color:#4b5b57}.assembly .views{grid-template-columns:1.15fr 1fr}.assembly svg{height:304px}ol{padding-left:18px;margin:6px 0}li{padding:2px 0}.setup{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px}.setup p{font-size:10px}caption{text-align:left;font-size:11px;font-weight:bold;padding:3px 0 5px}body.dense svg{height:225px}body.dense svg text{font-size:17px}body.dense .assembly svg{height:260px}body.dense th,body.dense td{padding-top:2px;padding-bottom:2px}body.dense .setup{margin-top:6px}body.dense .data{margin-top:6px}body.dense footer{margin-top:3px;padding-top:2px}@media screen and (max-width:1080px){.sheet{width:100%;min-height:0;margin:0 0 14px;padding:16px}}@media screen and (max-width:640px){.views,.data,.assembly .views,.setup{grid-template-columns:1fr}svg{height:auto}.assembly svg{height:auto}body.dense svg,body.dense .assembly svg{height:auto}header h1{font-size:18px}.sheet{padding:12px}table{font-size:10px}th,td{padding:4px 2px}}@media print{body{background:white}.sheet{width:auto;min-height:0;margin:0;padding:0}.view,header,.note{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body class="${dense ? "dense" : ""}">
<main>
<section class="sheet technical" aria-label="Arkusz techniczny">${header("RYSUNEK TECHNICZNY", 1)}
<p class="note"><strong>${mm(model.width)} × ${mm(model.height)} × ${mm(model.depth)} mm</strong> · grubość korpusu ${mm(model.thickness)} mm · wymiary geometrii, bez automatycznej kompensacji obrzeży.</p>
${issues.length ? `<p class="note error"><strong>Konflikty geometrii: ${issues.length}.</strong> ${issues.slice(0, 3).map(esc).join("; ")}${issues.length > 3 ? ". Pozostałe w kontroli geometrii kreatora." : ""}</p>` : ""}
<div class="views"><figure class="view"><h2>Przód bez frontów i pleców</h2>${drawings.front}<figcaption>O = światło między powierzchniami płyt; grubości półek odjęte. P = numer części zgodny z CSV/DXF. Drobne prześwity odczytaj w tabeli.</figcaption></figure><figure class="view"><h2>Przekrój boczny w osi X</h2>${drawings.side}<figcaption>Cięcie w pokazanej osi X. Szrafowane elementy przecina płaszczyzna; uwzględnione są plecy. Fronty ukryte.</figcaption></figure></div>
<div class="data"><div><h2>Światło między półkami i przegrodami</h2><table aria-label="Prześwity"><thead><tr><th>Nr</th><th>Oś X</th><th>Dół od podstawy</th><th>Wysokość</th><th>Szerokość*</th></tr></thead><tbody>${openingRows}</tbody></table>${overflow(16, drawings.openingCount, "prześwity")}<p class="meta">Wysokość w osi X od lewej. * Szerokość w połowie wysokości danej przestrzeni. Pod skosem i przy krótkich przegrodach wymiary obowiązują tylko w tych osiach.</p></div><div><h2>Bazy pomiaru i skosy</h2><p>X od lewego boku, Y od dolnej krawędzi mebla. Poziomy półek odnoszą się do modelu złożonego.</p>${roof.map((p) => `<p><strong>Wieniec pod skosem:</strong> górna krawędź ${mm(p.topLength)}; formatka przed cięciem ${mm(p.blankLength)} × ${mm(p.depth)} × ${mm(p.thickness)} mm.</p>`).join("")}<p>${model.shape === "rectangle" ? "Gabaryty dotyczą całego mebla. Przekrój może nie obejmować wyposażenia poza środkową osią." : "Krótszy i dłuższy bok są zwymiarowane osobno. Przekrój nie zastępuje rzutu od przodu."}</p><p class="meta">Pełne nazwy i dane materiałowe: części CSV/JSON. Otwory okuć: osobne karty frontów.</p></div></div>${foot}</section>
<section class="sheet assembly" aria-label="Arkusz montażowy">${header("RYSUNEK MONTAŻOWY", 2)}
<div class="views"><figure class="view"><h2>Rozstrzelenie korpusu</h2>${assemblyDrawingSvg(model)}<figcaption>Fronty ukryte. Rozsunięcie boków, dna, wieńca i pleców jest umowne; nie odczytuj z niego odległości montażowych. Geometria części pochodzi z tego samego szkicu.</figcaption></figure><div><h2>Oznaczenia na rysunku</h2><table aria-label="Oznaczenia części montażowych"><thead><tr><th>Część</th><th>Nazwa</th><th>Obwiednia X × Y × Z</th></tr></thead><tbody>${partRows}</tbody></table>${overflow(16, structural.length, "części")}<p class="meta">Obwiednia nie jest formatką cięcia. Przy skosie użyj długości wieńca z arkusza 1 i danych części.</p></div></div>
<div class="setup"><div>${shelves.length ? `<table aria-label="Poziomy półek"><caption>Poziomy półek od podstawy mebla</caption><thead><tr><th>Część</th><th>Dolna powierzchnia</th><th>Górna powierzchnia</th></tr></thead><tbody>${shelfRows}</tbody></table>${overflow(8, shelves.length, "poziomy półek")}<p class="meta">To poziomy powierzchni płyty, nie osie otworów podpórek.</p>` : `<h2>Ustawienie części</h2><p>Położenia i prześwity odczytaj z arkusza 1. Półki generowane poza tą osią sprawdź w kreatorze.</p>`}</div><div><h2>Kontrola przy składaniu</h2><ol><li>Oznacz części P zgodnie z tabelą; sprawdź obrzeża i kierunek dekoru.</li><li>Zestaw korpus według rzutów. Typ łącznika i jego wiercenia dobierz z dokumentacji użytego systemu.</li><li>Sprawdź geometrię korpusu, poziomy półek i światła O przed zamocowaniem wyposażenia.</li><li>Załóż plecy i fronty, jeśli są w projekcie; sprawdź szczeliny oraz kolizje przy otwieraniu.</li></ol></div></div>
<div class="note"><h2>Najważniejsze wiercenia okuć</h2><p>Biblioteka mebli nie zawiera zatwierdzonych operacji produkcyjnych. Nie wyznaczono automatycznie otworów pod podpórki i łączniki korpusu.</p>${mounting}${drawers.length ? `<p>Systemy szuflad: ${drawers.length}; wyznaczone pozycje zaczepów: ${drawerMounts.length}. Dane konkretnego frontu sprawdź w zakładce System; pozycje katalogowe pozostają niezatwierdzone produkcyjnie.</p>` : ""}${drawerPositions}<p>Każda karta wierceń musi określać stronę płyty, bazę X/Y, średnicę i głębokość. Nie przenoś wymiarów z widoku rozstrzelonego.</p></div>${foot}</section>
</main></body></html>`;
}
