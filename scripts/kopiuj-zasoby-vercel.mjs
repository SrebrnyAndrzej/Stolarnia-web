// Build na Vercelu: zdjęcia dekorów jako pliki statyczne CDN pod tym samym adresem co w aplikacji
// (/api/dekory/obrazy/...). Pliki statyczne mają pierwszeństwo przed przekierowaniem do funkcji API.
import { cpSync, existsSync } from "node:fs";

const zrodlo = "docs/materialy/obrazy";
const cel = "dist/web/api/dekory/obrazy";
if (existsSync(zrodlo)) {
  cpSync(zrodlo, cel, { recursive: true });
  console.log(`Skopiowano zdjęcia dekorów → ${cel}`);
}

// Zdjęcia katalogu okuć (/api/okucia-katalog/obrazy/...)
if (existsSync("docs/okucia/produkty/obrazy")) {
  cpSync("docs/okucia/produkty/obrazy", "dist/web/api/okucia-katalog/obrazy", { recursive: true });
  console.log("Skopiowano zdjęcia okuć → dist/web/api/okucia-katalog/obrazy");
}
