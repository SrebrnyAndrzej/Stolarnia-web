import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  freshPlateSpecification,
  carcass,
  applyConstructionStandard,
  freshConstructionStandard,
} from "./core/furniture.js";
import { furnitureDrawerCalculations } from "./core/furniture-drawers.js";
import { saveFurniture, furnitureConstruction } from "./server/furniture.js";
import type { Magazyn, BazaDanych } from "./store/store.js";
import type { Principal } from "./server/access.js";
const member = {
  user_id: randomUUID(),
  role: "employee",
  active: true,
  email: "",
  display_name: "Test",
  project_ids: [],
} as Principal;
function model() {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const front = {
    id: randomUUID(),
    name: "Front niski",
    kind: "drawer" as const,
    x: 20,
    y: 20,
    z: 560,
    width: 960,
    height: 140,
    depth: 18,
  };
  m.plates.push(front);
  m.drawerAssemblies = [
    {
      frontId: front.id,
      profileId: "amix-elite-standard",
      variant: "84",
      nominalLength: 500,
    },
  ];
  return m;
}
test("drawer system uses existing profile, actual sides and back rather than nominal thickness", () => {
  const m = applyConstructionStandard(
    model(),
    { ...freshConstructionStandard(), back: "applied" },
    randomUUID,
    false,
  );
  const c = furnitureDrawerCalculations(m)[0];
  assert.equal(c.openingWidth, 964);
  assert.equal(c.usableDepth, 557);
  assert.deepEqual(c.blockers, []);
  assert.equal(c.result!.dno.szer, 889);
  assert.equal(c.result!.dno.gl, 474);
  assert.equal(c.result!.plecy.szer, 877);
  assert.equal(c.result!.grubosc, 18);
  assert.equal(c.readyForProduction, false);
  assert.match(c.source!.sha256, /^[a-f0-9]{64}$/);
  m.drawerAssemblies![0].profileId = "blum-merivobox-m-wood";
  m.drawerAssemblies![0].variant = "M";
  const other = furnitureDrawerCalculations(m)[0];
  assert.equal(other.result!.grubosc, 16);
  assert.notEqual(other.result!.dno.szer, c.result!.dno.szer);
});
test("missing selection, unsupported variant, shallow depth and partitions never produce plausible cut sizes", () => {
  const m = model();
  m.drawerAssemblies![0].nominalLength = null;
  assert.equal(furnitureDrawerCalculations(m)[0].result, null);
  m.drawerAssemblies![0].nominalLength = 600;
  assert.match(
    furnitureDrawerCalculations(m)[0].blockers.join(" "),
    /głębokości/,
  );
  m.drawerAssemblies![0].nominalLength = 500;
  m.drawerAssemblies![0].variant = "fiction";
  assert.equal(furnitureDrawerCalculations(m)[0].result, null);
  m.drawerAssemblies![0].variant = "84";
  m.plates.at(-1)!.width = 600;
  assert.match(
    furnitureDrawerCalculations(m)[0].blockers.join(" "),
    /całe światło/,
  );
  m.plates.at(-1)!.width = 960;
  m.plates.push({
    id: randomUUID(),
    name: "Przegroda",
    kind: "board",
    x: 400,
    y: 18,
    z: 0,
    width: 18,
    height: 1982,
    depth: 560,
  });
  assert.match(
    furnitureDrawerCalculations(m)[0].blockers.join(" "),
    /Przegroda/,
  );
  assert.equal(furnitureDrawerCalculations(m)[0].result, null);
});
test("selected partition defines the actual compartment and a missing boundary never falls back silently", () => {
  const m = model();
  const partition = {
    id: randomUUID(),
    name: "Przegroda",
    kind: "board" as const,
    x: 500,
    y: 0,
    z: 0,
    width: 18,
    height: 2000,
    depth: 560,
    specification: { ...freshPlateSpecification(), face: "yz" as const },
  };
  m.plates.push(partition);
  m.plates[4].width = 478;
  m.drawerAssemblies![0].rightBoundaryId = partition.id;
  const c = furnitureDrawerCalculations(m)[0];
  assert.equal(c.openingWidth, 482);
  assert.equal(c.result!.dno.szer, 407);
  assert.deepEqual(c.blockers, []);
  m.plates = m.plates.filter((p) => p.id !== partition.id);
  assert.equal(furnitureDrawerCalculations(m)[0].result, null);
  assert.equal(furnitureDrawerCalculations(m)[0].openingWidth, null);
});
test("saved assembly calculations are frozen and exports cannot mutate or spoof them", () => {
  const db = { furnitureLibrary: [] } as unknown as BazaDanych;
  const store = {
    zmien: (fn: (db: BazaDanych) => unknown) => fn(db),
    odczytaj: () => db,
  } as Magazyn;
  const m = model();
  const input = { id: randomUUID(), version: 0, model: m };
  const saved = saveFurniture(store, member, input);
  const frozen = saved.drawerCalculations![0].result!.dno.szer;
  m.width = 1200;
  const card = furnitureConstruction(store, member, saved.id, 1);
  assert.equal(card.drawerAssemblies[0].result!.dno.szer, frozen);
  card.drawerAssemblies[0].result!.dno.szer = 0;
  assert.equal(
    db.furnitureLibrary![0].drawerCalculations![0].result!.dno.szer,
    frozen,
  );
  assert.throws(
    () =>
      saveFurniture(store, member, {
        ...input,
        version: 1,
        model: { ...saved.model, drawerCalculations: [] },
      }),
    /Sprawdź/,
  );
  assert.throws(
    () =>
      saveFurniture(store, member, {
        ...input,
        version: 1,
        model: {
          ...saved.model,
          drawerAssemblies: [
            { ...saved.model.drawerAssemblies![0], frontId: randomUUID() },
          ],
        },
      }),
    /istniejący/,
  );
});
