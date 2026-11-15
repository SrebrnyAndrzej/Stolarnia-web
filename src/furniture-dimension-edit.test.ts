import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID as uid } from "node:crypto";
import {
  freshFurniture,
  carcass,
  resizeFurniture,
  type FurnitureModel,
} from "./core/furniture.js";
import {
  startCompartments,
  splitCompartment,
  compartmentBoxes,
} from "./core/furniture-compartments.js";
import { furnitureOpenings } from "./core/furniture-openings.js";
import { editFurnitureDimension } from "./core/furniture-dimension-edit.js";
const model = () => {
  const m = freshFurniture();
  m.plates = carcass(m, uid);
  return m;
};
test("direct compartment dimension uses existing locks and rejects an impossible size without changing source", () => {
  let m = startCompartments(model(), uid);
  m = splitCompartment(m, m.compartments!.roots[0].nodeId, "y", 2, uid);
  const child = m.compartments!.nodes.find(
    (n) => n.id !== m.compartments!.roots[0].nodeId,
  )!;
  const target = { kind: "compartment" as const, id: child.id };
  const locked = editFurnitureDimension(m, target, 350, uid);
  assert.equal(
    compartmentBoxes(locked).boxes.find((b) => b.node.id === child.id)!.height,
    350,
  );
  const resized = resizeFurniture(locked, { height: 2400 }, uid);
  assert.equal(
    compartmentBoxes(resized).boxes.find((b) => b.node.id === child.id)!.height,
    350,
  );
  const before = JSON.stringify(locked);
  assert.throws(
    () => editFurnitureDimension(locked, target, 4000, uid),
    /zablokowane/,
  );
  assert.equal(JSON.stringify(locked), before);
  assert.equal(
    editFurnitureDimension(
      locked,
      target,
      0,
      uid,
      true,
    ).compartments!.nodes.find((n) => n.id === child.id)!.size,
    undefined,
  );
});
test("direct clear opening moves only a loose boundary shelf and subtracts real thickness", () => {
  const m = model();
  const shelf = {
    id: uid(),
    name: "Półka",
    kind: "board" as const,
    x: 18,
    y: 500,
    z: 0,
    width: 964,
    height: 18,
    depth: 560,
  };
  m.plates.push(shelf);
  const [bottom, top] = furnitureOpenings(m).openings;
  const a = editFurnitureDimension(
    m,
    { kind: "opening", opening: bottom },
    350,
    uid,
  );
  assert.equal(a.plates.at(-1)!.y, 368);
  assert.equal(shelf.y, 500);
  const b = editFurnitureDimension(
    m,
    { kind: "opening", opening: top },
    1200,
    uid,
  );
  assert.equal(b.plates.at(-1)!.y, 764);
  assert.equal(furnitureOpenings(b).openings.at(-1)!.height, 1200);
  m.plates.push({ ...shelf, id: uid(), y: 700 });
  assert.throws(() =>
    editFurnitureDimension(
      m,
      { kind: "opening", opening: furnitureOpenings(m).openings[0] },
      900,
      uid,
    ),
  );
});
test("direct external dimensions reject bad input and delegate carcass resize", () => {
  const m = model(),
    next = editFurnitureDimension(
      m,
      { kind: "overall", axis: "width" },
      1200,
      uid,
    );
  assert.equal(next.width, 1200);
  assert.equal(m.width, 1000);
  for (const v of [NaN, -1, 0, 10001])
    assert.throws(() =>
      editFurnitureDimension(m, { kind: "overall", axis: "width" }, v, uid),
    );
});
