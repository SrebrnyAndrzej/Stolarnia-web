import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProduktOkucia } from "../hardware-products.js";
export const PRODUKTY_OKUC: ProduktOkucia[] = JSON.parse(readFileSync(join(process.cwd(), "docs/okucia/produkty/katalog.json"), "utf8"));
