import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  applyConstructionStandard,
  freshConstructionStandard,
  freshFurniture,
  carcass,
  resizeFurniture,
  furnitureIssues,
} from "./core/furniture.js";
import { furnitureParts } from "./core/furniture-parts.js";
import { furnitureSave } from "./server/furniture.js";
const standard = () => ({
  ...freshConstructionStandard(),
  back: "applied" as const,
  dimensionMode: "finished" as const,
  bodyMaterial: "Laminat",
  bodyDecor: "Biały",
  frontMaterial: "MDF",
  frontDecor: "Lakier",
  backMaterial: "HDF",
  backDecor: "Biały",
  edgeMaterial: "ABS",
  edgeThickness: 2,
});
test("applied back uses the overall depth and preserves existing IDs on resize", () => {
  const base = freshFurniture();
  base.plates = carcass(base, randomUUID);
  const model = applyConstructionStandard(base, standard(), randomUUID, false);
  assert.equal(model.plates.length, 5);
  assert.deepEqual(
    model.plates.slice(0, 4).map((p) => p.id),
    base.plates.map((p) => p.id),
  );
  assert.equal(model.plates[0].z, 3);
  assert.equal(model.plates[0].depth, 557);
  assert.equal(model.plates[4].z, 0);
  assert.equal(model.plates[4].depth, 3);
  assert.deepEqual(furnitureIssues(model), []);
  const resized = resizeFurniture(
    model,
    { width: 1200, depth: 600 },
    randomUUID,
  );
  assert.equal(resized.plates[4].width, 1200);
  assert.equal(resized.plates[0].depth, 597);
  assert.equal(resized.plates[4].id, model.plates[4].id);
  assert.ok(
    furnitureSave.safeParse({ id: randomUUID(), version: 0, model: resized })
      .success,
  );
  const removed = resizeFurniture(
    resized,
    { construction: { ...standard(), back: "none" } },
    randomUUID,
  );
  assert.equal(removed.plates.length, 4);
  assert.equal(removed.plates[0].z, 0);
  assert.equal(removed.plates[0].depth, 600);
});
test("standards fill missing data without overwriting exceptions; replacement and source are independent", () => {
  const base = freshFurniture();
  base.plates = carcass(base, randomUUID);
  const a = applyConstructionStandard(base, standard(), randomUUID, false);
  a.plates[0].specification!.decor = "Wyjątek";
  a.plates[0].specification!.edges.u1 = {
    state: "none",
    material: "",
    thickness: 1,
  };
  const b = applyConstructionStandard(
    a,
    { ...standard(), bodyDecor: "Dąb" },
    randomUUID,
    false,
  );
  assert.equal(b.plates[0].specification!.decor, "Wyjątek");
  assert.equal(b.plates[0].specification!.edges.u1.state, "none");
  const c = applyConstructionStandard(
    a,
    { ...standard(), bodyDecor: "Dąb" },
    randomUUID,
    true,
  );
  assert.equal(c.plates[0].specification!.decor, "Dąb");
  assert.equal(c.plates[0].specification!.edges.u1.state, "band");
  assert.equal(a.plates[0].specification!.decor, "Wyjątek");
});
test("part list deducts only chosen edges for finished dimensions and blocks uncertain cuts", () => {
  const base = freshFurniture();
  base.plates = carcass(base, randomUUID);
  const m = applyConstructionStandard(base, standard(), randomUUID, true);
  m.plates.forEach((p) => {
    p.specification!.grain = "none";
  });
  const rows = furnitureParts(m);
  assert.deepEqual(rows[0].dimensions, [557, 2000]);
  assert.deepEqual(rows[0].substrate, [555, 2000]);
  assert.deepEqual(rows[2].substrate, [964, 555]);
  assert.deepEqual(rows[4].substrate, [1000, 2000]);
  assert.deepEqual(
    furnitureParts({
      ...m,
      construction: { ...standard(), dimensionMode: "substrate" },
    })[0].substrate,
    [557, 2000],
  );
  assert.equal(
    furnitureParts({
      ...m,
      construction: { ...standard(), dimensionMode: "unset" },
    })[0].substrate,
    null,
  );
  assert.equal(
    furnitureParts(resizeFurniture(m, { shape: "slope" }, randomUUID))[3]
      .substrate,
    null,
  );
  const shelf = { ...m.plates[2], id: randomUUID(), anchor: undefined, z: 0 };
  assert.match(
    furnitureIssues({ ...m, plates: [...m.plates, shelf] }).join(" "),
    /nachodzi na plecy/,
  );
});
