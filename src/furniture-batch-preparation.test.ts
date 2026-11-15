import { preparationMaterials } from "./server/furniture-preparation.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  freshConstructionStandard,
  freshPlateSpecification,
  type FurnitureEntry,
} from "./core/furniture.js";
import { USTAWIENIA_DOMYSLNE } from "./core/settings.js";
import { MATERIALY_STARTOWE } from "./core/catalog/materials.js";
import { prepareFurnitureBatch } from "./server/furniture-batch-preparation.js";
import type { Magazyn, BazaDanych } from "./store/store.js";
import type { Principal } from "./server/access.js";
function setup() {
  const model = freshFurniture();
  model.construction = {
    ...freshConstructionStandard(),
    dimensionMode: "finished",
  };
  const spec = freshPlateSpecification();
  Object.assign(spec, {
    material: "płyta",
    decor: "biały",
    face: "xy",
    grain: "none",
  });
  for (const e of Object.values(spec.edges)) e.state = "none";
  const part = {
    id: randomUUID(),
    name: "Panel",
    kind: "board" as const,
    x: 0,
    y: 0,
    z: 0,
    width: 400,
    height: 300,
    depth: 18,
    specification: spec,
  };
  model.plates = [part];
  const entries = [0, 1].map(
    (i) =>
      ({
        id: randomUUID(),
        version: i + 1,
        model: { ...structuredClone(model), name: `Mebel ${i + 1}` },
        updatedAt: "2026-11-09T00:00:00Z",
        createdBy: "test",
        updatedBy: "test",
      }) as FurnitureEntry,
  );
  const material = {
    ...MATERIALY_STARTOWE.find((m) => m.jednostka === "metrKwadratowy")!,
    id: "catalog",
    cenaNetto: 7654321,
    gruboscMM: 18,
    aktywny: true,
    kierunekDekoru: false,
    szerokoscArkuszaMM: 1000,
    wysokoscArkuszaMM: 1000,
  };
  const db = {
    furnitureLibrary: entries,
    materialy: [material],
    ustawienia: structuredClone(USTAWIENIA_DOMYSLNE),
  } as BazaDanych;
  const store = { odczytaj: () => db } as Magazyn,
    person = {
      role: "employee",
      active: true,
      user_id: "test",
      project_ids: [],
    } as Principal;
  const items = entries.map((e, i) => ({
    id: e.id,
    version: e.version,
    quantity: i === 0 ? 2 : 1,
    materials: { [part.id]: material.id },
  }));
  return { db, store, person, items, part, entries, material };
}
test("batch combines instances with collision-free identities and fewer sheets; input order does not change packet", () => {
  const { db, store, person, items, part } = setup(),
    before = structuredClone(db),
    result = prepareFurnitureBatch(store, person, { items });
  assert.equal(result.readyForProduction, false);
  assert.equal(result.planning!.formatki.length, 3);
  assert.equal(new Set(result.planning!.formatki.map((f) => f.id)).size, 3);
  assert.ok(result.partSources.every((s) => s.partId === part.id));
  assert.equal(result.comparison!.separateSheets, 3);
  assert.equal(result.comparison!.combinedSheets, 1);
  assert.equal(
    result.checksum,
    prepareFurnitureBatch(store, person, { items: [...items].reverse() })
      .checksum,
  );
  assert.deepEqual(db, before);
  assert.ok(!JSON.stringify(result).includes("7654321"));
  assert.ok(!JSON.stringify(result).includes("cenaNetto"));
});
test("missing material blocks the whole batch, a changed version rejects the request and duplicates are invalid", () => {
  const { store, person, items } = setup();
  const broken = structuredClone(items);
  broken[0].materials = {};
  const result = prepareFurnitureBatch(store, person, { items: broken });
  assert.equal(result.planning, null);
  assert.equal(result.comparison, null);
  assert.ok(result.diagnostics.length);
  assert.throws(
    () =>
      prepareFurnitureBatch(store, person, {
        items: [{ ...items[0], version: 99 }, items[1]],
      }),
    /zmienił/,
  );
  assert.throws(
    () => prepareFurnitureBatch(store, person, { items: [items[0], items[0]] }),
    /różnych modeli/,
  );
  assert.throws(
    () => prepareFurnitureBatch(store, { ...person, active: false }, { items }),
    /aktywnemu/,
  );
});
test("quantity, material snapshot and planning settings change checksum; unsupported mappings remain blocked", () => {
  const { store, person, items, material, db } = setup();
  const first = prepareFurnitureBatch(store, person, { items }).checksum;
  const changed = structuredClone(items);
  changed[0].quantity = 1;
  assert.notEqual(
    prepareFurnitureBatch(store, person, { items: changed }).checksum,
    first,
  );
  material.szerokoscArkuszaMM = 1200;
  const second = prepareFurnitureBatch(store, person, { items }).checksum;
  assert.notEqual(second, first);
  db.ustawienia.rozkroj.rzazPilyMM += 1;
  assert.notEqual(
    prepareFurnitureBatch(store, person, { items }).checksum,
    second,
  );
  material.gruboscMM = 16;
  assert.equal(prepareFurnitureBatch(store, person, { items }).planning, null);
  assert.throws(
    () =>
      prepareFurnitureBatch(store, person, {
        items: [{ ...items[0], materials: { [randomUUID()]: "catalog" } }],
      }),
    /spoza tej wersji/,
  );
});
test("bounded batch rejects too many physical parts before planning", () => {
  const { store, person, items, entries, part } = setup();
  entries[0].model.plates = Array.from({ length: 150 }, () => ({
    ...part,
    id: randomUUID(),
  }));
  assert.throws(
    () =>
      prepareFurnitureBatch(store, person, {
        items: [{ ...items[0], quantity: 20, materials: {} }],
      }),
    /1500/,
  );
});

test("board catalogue sold per sheet is accepted; finished fronts sold per piece are not sheet stock", () => {
  const { store, person, items, material } = setup();
  material.jednostka = "sztuka";
  material.typ = "plytaLaminowana";
  assert.ok(
    preparationMaterials(store, person).some((m) => m.id === material.id),
  );
  assert.ok(prepareFurnitureBatch(store, person, { items }).planning);
  material.typ = "front";
  assert.ok(
    !preparationMaterials(store, person).some((m) => m.id === material.id),
  );
  assert.equal(prepareFurnitureBatch(store, person, { items }).planning, null);
});
