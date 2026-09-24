// Kontrola katalogu okuć po scrapowaniu (docs/okucia/produkty/katalog.json):
// • GTV: długość z symbolu (KPL450 → 450) porównana z tabelą parametrów karty; rozbieżność oznaczana jako „Konflikt danych”
//   — nie poprawiamy wartości producenta, tylko blokujemy ich bezkrytyczne użycie;
// • indeks rodziny bez publicznego SKU dostaje jawny opis braku.
// Uruchom po każdym ponownym pobraniu katalogu: node scripts/oznacz-konflikty-okuc.mjs
import { readFileSync, writeFileSync } from "node:fs";

const plik = "docs/okucia/produkty/katalog.json";
const katalog = JSON.parse(readFileSync(plik, "utf8"));
let konflikty = 0;
let bezSku = 0;
for (const p of katalog) {
  if (p.producent === "GTV") {
    const zSymbolu = p.sku.match(/KPL(\d{3})/)?.[1];
    const zKarty = p.parametry["Długość [mm]"];
    if (zSymbolu && zKarty !== zSymbolu) {
      p.parametry["Konflikt danych"] = `Symbol ${p.sku} wskazuje długość ${zSymbolu} mm, tabela karty producenta podaje „${zKarty ?? "brak"}”. Potwierdź u dostawcy przed zamówieniem.`;
      konflikty++;
    } else delete p.parametry["Konflikt danych"];
  }
  if (!p.sku && p.rodzajSKU === "rodzina") {
    p.parametry["Zakres indeksu"] = "Producent nie publikuje indeksu na karcie produktu — wariant (kolor, długość) i indeks ustal u dostawcy.";
    bezSku++;
  }
}
writeFileSync(plik, JSON.stringify(katalog, null, 2) + "\n");
console.log(`Produkty: ${katalog.length}, konflikty GTV: ${konflikty}, bez indeksu: ${bezSku}`);
