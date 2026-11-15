import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  carcass,
  freshFurniture,
  freshPlateSpecification,
  freshConstructionStandard,
  type FurnitureEntry,
} from "./core/furniture.js";
import { USTAWIENIA_DOMYSLNE } from "./core/settings.js";
import { MATERIALY_STARTOWE } from "./core/catalog/materials.js";
import {
  prepareFurniture,
  preparationMaterials,
} from "./server/furniture-preparation.js";
import type { Magazyn, BazaDanych } from "./store/store.js";
import type { Principal } from "./server/access.js";

test("complete rectangular carcass includes flat cap and separate back-board material", () => {
  const model = freshFurniture();
  model.construction = {
    ...freshConstructionStandard(),
    dimensionMode: "finished",
  };
  model.plates = carcass(model, randomUUID);
  for (const p of model.plates) {
    Object.assign(p.specification!, {
      material: "płyta",
      decor: "biały",
      grain: "none",
    });
    for (const edge of Object.values(p.specification!.edges))
      edge.state = "none";
  }
  const base = MATERIALY_STARTOWE.find(
    (m) => m.jednostka === "metrKwadratowy",
  )!;
  const materials = [18, 3].map((t) => ({
    ...base,
    id: `material-${t}`,
    gruboscMM: t,
    szerokoscArkuszaMM: 2070,
    wysokoscArkuszaMM: 2800,
    kierunekDekoru: false,
    aktywny: true,
  }));
  const entry = { id: randomUUID(), version: 1, model } as FurnitureEntry;
  const db = {
    furnitureLibrary: [entry],
    materialy: materials,
    ustawienia: structuredClone(USTAWIENIA_DOMYSLNE),
  } as BazaDanych;
  const store = { odczytaj: () => structuredClone(db) } as Magazyn;
  const mapping = Object.fromEntries(
    model.plates.map((p) => [p.id, `material-${p.anchor === "back" ? 3 : 18}`]),
  );
  const result = prepareFurniture(
    store,
    { role: "owner", active: true } as Principal,
    entry.id,
    { version: 1, materials: mapping },
  );
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.planning!.formatki.length, model.plates.length);
  assert.ok(result.planning!.rozkroj.arkusze.length > 0);
});
test("saved furniture adapter uses one revision, compensates edging once, respects grain and fails closed", () => {
  const model = freshFurniture();
  model.construction = {
    ...freshConstructionStandard(),
    dimensionMode: "finished",
  };
  const specification = freshPlateSpecification();
  Object.assign(specification, {
    material: "płyta",
    decor: "biały",
    face: "xy",
    grain: "u",
  });
  for (const e of Object.values(specification.edges))
    Object.assign(e, { state: "band", material: "ABS", thickness: 2 });
  const part = {
    id: randomUUID(),
    name: "Panel",
    kind: "board" as const,
    x: 0,
    y: 0,
    z: 0,
    width: 100,
    height: 80,
    depth: 18,
    specification,
  };
  model.plates = [part];
  const entry = {
    id: randomUUID(),
    version: 2,
    updatedAt: "2026-11-03T00:00:00Z",
    model,
  } as FurnitureEntry;
  const mat = {
    ...MATERIALY_STARTOWE.find((m) => m.jednostka === "metrKwadratowy")!,
    id: "catalog",
    gruboscMM: 18,
    cenaNetto: 1234567,
    aktywny: true,
    szerokoscArkuszaMM: 2070,
    wysokoscArkuszaMM: 2800,
  };
  const db = {
    furnitureLibrary: [entry],
    materialy: [mat],
    ustawienia: structuredClone(USTAWIENIA_DOMYSLNE),
  } as BazaDanych;
  db.ustawienia.rozkroj.uwzgledniajKierunekDekoru = true;
  const store = { odczytaj: () => structuredClone(db) } as Magazyn;
  const person = { role: "employee", active: true } as Principal;
  const body = { version: 2, materials: { [part.id]: mat.id } };
  const result = prepareFurniture(store, person, entry.id, body);
  assert.equal(
    result.diagnostics.length,
    0,
    JSON.stringify(result.diagnostics),
  );
  assert.equal(result.planning!.formatki[0].dlugoscCieciaMM, 96);
  assert.equal(result.planning!.formatki[0].szerokoscCieciaMM, 76);
  assert.equal(result.readyForProduction, false);
  assert.equal(result.checksum.length, 64);
  assert.ok(!JSON.stringify(result).includes("1234567"));
  assert.ok(
    !JSON.stringify(preparationMaterials(store, person)).includes("cenaNetto"),
  );
  const original = result.checksum;
  part.specification.grain = "v";
  const rotated = prepareFurniture(store, person, entry.id, body);
  assert.equal(rotated.planning!.formatki[0].dlugoscCieciaMM, 76);
  assert.notEqual(rotated.checksum, original);
  model.construction.dimensionMode = "substrate";
  const substrate = prepareFurniture(store, person, entry.id, body).planning!
    .formatki[0];
  assert.equal(substrate.dlugoscCieciaMM, 80);
  assert.equal(substrate.dlugoscMM, 84);
  mat.gruboscMM = 16;
  assert.equal(prepareFurniture(store, person, entry.id, body).planning, null);
  assert.throws(
    () => prepareFurniture(store, person, entry.id, { ...body, version: 1 }),
    /zmienił/,
  );
  assert.throws(
    () => prepareFurniture(store, { ...person, active: false }, entry.id, body),
    /aktywnemu/,
  );
});
