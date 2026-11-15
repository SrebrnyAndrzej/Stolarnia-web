import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Stolarnia } from "../src/service.js";
import { Magazyn } from "../src/store/store.js";
import {
  freshFurniture,
  carcass,
  applySuggestedLayout,
} from "../src/core/furniture.js";
import { furnitureDocument } from "../web/src/v2/furniture-document.ts";
import { randomUUID } from "node:crypto";
const s = new Stolarnia(
  new Magazyn(mkdtempSync(join(tmpdir(), "compact-qa-"))),
);
const p = s.utworzProjekt({
  nazwa: "Szafka z półkami — przykład",
  sciany: [{ dlugoscMM: 3000 }],
});
s.wypelnijSciane(p.id, p.pomieszczenia[0].sciany[0].id, [
  "base-shelves-800",
  "base-drawers-600",
]);
writeFileSync(
  "../../outputs/Dokumentacja-skrocona-przyklad.pdf",
  await s.dokumentacjaPdf(p.id, { zwiezly: true, ukryjDaneKlienta: true }),
);
const m = freshFurniture();
m.plates = carcass(m, randomUUID);
const shelves = applySuggestedLayout(m, "shelves", randomUUID);
writeFileSync(
  "../../outputs/Karta-mebla-przyklad.html",
  furnitureDocument(shelves, "przyklad", 1),
);
