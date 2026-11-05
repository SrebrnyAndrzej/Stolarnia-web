import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  carcass,
  freshFurniture,
  furnitureIssues,
  platePolygon,
  polygonArea,
  freshPlateSpecification,
  resizeFurniture,
  plateThickness,
  plateSpecificationIssues,
} from "./core/furniture.js";
import { saveFurniture, furnitureConstruction } from "./server/furniture.js";
import type { Magazyn, BazaDanych } from "./store/store.js";
import type { Principal } from "./server/access.js";
const employee = {
  user_id: randomUUID(),
  role: "employee",
  active: true,
  email: "",
  display_name: "Test",
  project_ids: [],
} as Principal;
test("material annotations and stable IDs survive resizing and legacy models remain editable", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const side = m.plates[0];
  side.specification = {
    ...freshPlateSpecification(),
    material: "Płyta laminowana",
    decor: "W1100 ST9",
    face: "yz",
    grain: "v",
  };
  side.specification.edges.u0 = {
    state: "band",
    material: "ABS biały",
    thickness: 2,
  };
  const before = structuredClone(m);
  const resized = resizeFurniture(
    m,
    { width: 1200, thickness: 22, shape: "slope" },
    randomUUID,
  );
  assert.deepEqual(
    resized.plates.map((p) => p.id),
    m.plates.map((p) => p.id),
  );
  assert.deepEqual(resized.plates[0].specification, side.specification);
  assert.equal(plateThickness(resized, resized.plates[0]), 22);
  assert.equal(plateThickness(resized, resized.plates[2]), null);
  assert.deepEqual(m, before);
  assert.match(
    plateSpecificationIssues(resized, resized.plates[2]).join(" "),
    /brak materiału/,
  );
  const db = { furnitureLibrary: [] } as unknown as BazaDanych;
  const store = {
    zmien: (fn: (db: BazaDanych) => unknown) => fn(db),
  } as Magazyn;
  const input = { id: randomUUID(), version: 0, model: resized };
  const saved = saveFurniture(store, employee, input);
  assert.equal(saved.model.plates[0].specification?.edges.u0.thickness, 2);
  assert.throws(
    () =>
      saveFurniture(store, employee, {
        ...input,
        id: randomUUID(),
        model: {
          ...resized,
          plates: resized.plates.map((p, i) =>
            i
              ? p
              : {
                  ...p,
                  specification: { ...p.specification, unexpected: true },
                },
          ),
        },
      }),
    /Sprawdź/,
  );
});
test("material readiness requires explicit edge decisions and a valid broad face", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const p = m.plates[0];
  p.specification = freshPlateSpecification();
  assert.equal(plateSpecificationIssues(m, p).length, 8);
  p.specification.material = "MDF";
  p.specification.decor = "Surowy";
  p.specification.face = "yz";
  p.specification.grain = "none";
  Object.values(p.specification.edges).forEach((e) => {
    e.state = "none";
  });
  assert.deepEqual(plateSpecificationIssues(m, p), []);
  p.specification.edges.u0.state = "band";
  assert.match(
    plateSpecificationIssues(m, p).join(" "),
    /brak oznaczenia obrzeża/,
  );
  const cap = m.plates[3];
  cap.specification = { ...freshPlateSpecification(), face: "slope" };
  assert.equal(plateThickness(m, cap), 18);
});
test("construction cards use saved geometry, retain polygons, enforce version and never release production", () => {
  const model = { ...freshFurniture(), shape: "slope" as const };
  model.plates = carcass(model, randomUUID);
  const db = { furnitureLibrary: [] } as unknown as BazaDanych;
  const store = {
    zmien: (fn: (db: BazaDanych) => unknown) => fn(db),
    odczytaj: () => db,
  } as Magazyn;
  const entry = saveFurniture(store, employee, {
    id: randomUUID(),
    version: 0,
    model,
  });
  const card = furnitureConstruction(store, employee, entry.id, 1);
  assert.equal(card.readyForProduction, false);
  assert.equal(card.libraryVersion, 1);
  assert.deepEqual(
    card.parts[3].frontPolygon,
    platePolygon(model, model.plates[3]),
  );
  assert.notEqual(
    card.parts[3].frontPolygon[0][1],
    card.parts[3].frontPolygon[1][1],
  );
  assert.ok(card.parts[0].missingMaterialData.length);
  card.model.name = "Nie zmieniaj bazy";
  assert.equal(db.furnitureLibrary![0].model.name, "Nowy mebel");
  assert.throws(
    () => furnitureConstruction(store, employee, entry.id, 0),
    /Wersja/,
  );
  assert.throws(
    () =>
      furnitureConstruction(
        store,
        { ...employee, role: "client" },
        entry.id,
        1,
      ),
    /aktywnego/,
  );
});
test("slope and mirrored stairs clip plate geometry inside the envelope", () => {
  const m = { ...freshFurniture(), shape: "slope" as const };
  const p = {
    id: randomUUID(),
    name: "Plecy",
    kind: "board" as const,
    x: 0,
    y: 0,
    z: 0,
    width: m.width,
    height: m.height,
    depth: 3,
  };
  assert.equal(
    polygonArea(platePolygon(m, p)),
    ((m.lowHeight + m.height) * m.width) / 2,
  );
  const stairs = { ...m, shape: "stairs" as const };
  const area = polygonArea(platePolygon(stairs, p));
  assert.ok(
    Math.abs(
      polygonArea(platePolygon({ ...stairs, reverse: true }, p)) - area,
    ) < 0.001,
  );
  assert.ok(area > m.width * m.lowHeight);
});
test("drawer fronts exceeding the lowest step or slope are rejected", () => {
  const m = { ...freshFurniture(), shape: "stairs" as const };
  m.plates = [
    {
      id: randomUUID(),
      name: "Szuflada",
      kind: "drawer",
      x: 20,
      y: 850,
      z: m.depth,
      width: 960,
      height: 200,
      depth: 18,
    },
  ];
  assert.match(furnitureIssues(m).join(" "), /nie mieści/);
});
test("all active employees edit shared models; conflicts preserve the newer model", () => {
  const db = { furnitureLibrary: [] } as unknown as BazaDanych;
  const store = {
    zmien: (fn: (db: BazaDanych) => unknown) => fn(db),
  } as Magazyn;
  const model = freshFurniture();
  model.plates = carcass(model, randomUUID);
  const input = { id: randomUUID(), version: 0, model };
  const first = saveFurniture(store, employee, input);
  const second = saveFurniture(
    store,
    { ...employee, user_id: randomUUID() },
    { ...input, version: 1, model: { ...model, name: "Zmieniony" } },
  );
  assert.equal(second.version, 2);
  assert.equal(second.createdBy, first.createdBy);
  assert.notEqual(second.updatedBy, first.updatedBy);
  assert.throws(
    () => saveFurniture(store, employee, { ...input, version: 1 }),
    /inną osobę/,
  );
  assert.equal(db.furnitureLibrary![0].model.name, "Zmieniony");
  assert.throws(
    () => saveFurniture(store, { ...employee, active: false }, input),
    /aktywn/,
  );
  assert.throws(
    () => saveFurniture(store, { ...employee, role: "client" }, input),
    /aktywn/,
  );
  assert.throws(
    () =>
      saveFurniture(store, employee, {
        ...input,
        model: { ...model, width: -1 },
      }),
    /Sprawdź/,
  );
});
