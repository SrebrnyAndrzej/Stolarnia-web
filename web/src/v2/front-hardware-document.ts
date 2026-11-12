import type { FurnitureModel } from "../../../src/core/furniture";
import { frontHardware } from "../../../src/core/front-hardware";
const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const mm = (n: number) =>
  n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
export function frontHardwareDocument(model: FurnitureModel, onlyId?: string) {
  return model.plates
    .filter(
      (p) =>
        (!onlyId || p.id === onlyId) &&
        p.frontHardware &&
        (p.frontHardware.hinges || p.frontHardware.handle),
    )
    .map((p) => {
      const r = frontHardware(model, p);
      if (!onlyId)
        return `<section><h2>${esc(p.name)} · plan okuć</h2><p>${r.issues.length ? `WSTRZYMANE: ${r.issues.map(esc).join("; ")}` : `${r.holes.length} otworów w ręcznym planie roboczym. Szczegóły: osobna karta frontu w zakładce Okucia.`} ${r.warnings.map(esc).join("; ")}</p></section>`;
      const diagram =
        onlyId && r.holes.length
          ? `<svg viewBox="-45 -45 ${p.width + 90} ${p.height + 90}" role="img" aria-label="Rzut frontu od przodu"><rect x="0" y="0" width="${p.width}" height="${p.height}" fill="#f1f4f0" stroke="#1c2b30"/>${r.holes.map((h, i) => `<circle cx="${h.x}" cy="${p.height - h.y}" r="${h.diameter / 2}" fill="none" stroke="#1c2b30" stroke-width="2"/><text x="${h.x + 25}" y="${p.height - h.y + 5}" font-size="${Math.max(14, p.height / 20)}">${i + 1}</text>`).join("")}</svg>`
          : "";
      return `<section><h2>${esc(p.name)} · ręczny plan okuć</h2><p>Rzut od przodu, obróbka od tyłu płyty, bez wiercenia tafli lustra. X od lewej krawędzi rzutu, Y od dolnej. Zachowaj oznaczenie krawędzi przy odwracaniu części. Wszystkie wymiary w mm. Plan roboczy, bez dopuszczenia produkcyjnego.</p><p>${esc(p.width)} × ${esc(p.height)} × ${esc(p.depth)} mm. ${p.frontHardware?.hinges ? `Zawias: ${esc(p.frontHardware.hinges.source || "źródło do ustalenia")}. ` : ""}${p.frontHardware?.handle ? `Uchwyt: ${esc(p.frontHardware.handle.source || "źródło do ustalenia")}.` : ""}</p>${diagram}${r.issues.length ? `<p>WSTRZYMANE: ${r.issues.map(esc).join("; ")}</p>` : `<table><thead><tr><th>Otwór</th><th>X</th><th>Y</th><th>Średnica</th><th>Głębokość</th></tr></thead><tbody>${r.holes.map((h, i) => `<tr><td>${i + 1}. ${h.kind === "hinge" ? "Puszka" : "Uchwyt"}</td><td>${mm(h.x)}</td><td>${mm(h.y)}</td><td>${mm(h.diameter)}</td><td>${h.kind === "handle" ? "Przelot w płycie" : mm(h.depth)}</td></tr>`).join("")}</tbody></table>`}${r.warnings.length ? `<p>Do sprawdzenia: ${r.warnings.map(esc).join("; ")}</p>` : ""}</section>`;
    })
    .join("");
}
export function frontHardwarePrint(model: FurnitureModel, id: string) {
  return `<!doctype html><html lang="pl"><meta charset="utf-8"><title>Karta frontu · ${esc(model.name)}</title><style>@page{size:A4;margin:12mm}body{font:12px Arial,sans-serif;color:#1c2b30;line-height:1.45}h2{font-size:20px}svg{width:32%;height:350px;float:left;margin-right:3%}table{border-collapse:collapse;width:65%;font-size:11px}td,th{padding:6px;border-bottom:1px solid #d5dcda;text-align:left}p:last-child{clear:both;padding-top:12px}</style>${frontHardwareDocument(model, id)}</html>`;
}
