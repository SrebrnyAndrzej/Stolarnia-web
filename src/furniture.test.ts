import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  carcass,
  freshFurniture,
  furnitureIssues,
  platePolygon,
  polygonArea,
} from "./core/furniture.js";
import { saveFurniture } from "./server/furniture.js";
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
