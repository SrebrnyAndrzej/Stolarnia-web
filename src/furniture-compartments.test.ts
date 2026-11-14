import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID as id } from "node:crypto";
import {
  freshFurniture,
  carcass,
  furnitureIssues,
  resizeFurniture,
  deskStartingModel,
} from "./core/furniture.js";
import {
  startCompartments,
  splitCompartment,
  changeCompartment,
  compartmentBoxes,
  compartmentGraphIssues,
  copyCompartment,
  mergeCompartment,
} from "./core/furniture-compartments.js";
import { furnitureSave } from "./server/furniture.js";
const base = () => {
  const m = freshFurniture();
  m.plates = carcass(m, id);
  return m;
};
test("compartments split, lock, resize and retain part IDs and annotations", () => {
  let m = startCompartments(base(), id),
    root = m.compartments!.roots[0].nodeId;
  m = splitCompartment(m, root, "x", 2, id);
  const [left, right] = m.compartments!.nodes.find((n) => n.id === root)!.split!
    .children;
  m = changeCompartment(
    m,
    left,
    { size: 300, interior: "shelves", count: 3 },
    id,
  );
  m = changeCompartment(m, right, { front: "drawers", count: 4 }, id);
  assert.deepEqual(furnitureIssues(m), []);
  assert.equal(
    compartmentBoxes(m).boxes.find((b) => b.node.id === left)!.width,
    300,
  );
  const p = m.plates.find(
    (p) => p.layoutSlot === `compartment/${left}/shelf/1`,
  )!;
  p.specification!.material = "Laminat";
  const resized = resizeFurniture(m, { width: 1400, height: 2200 }, id);
  assert.equal(
    compartmentBoxes(resized).boxes.find((b) => b.node.id === left)!.width,
    300,
  );
  assert.equal(
    compartmentBoxes(resized).boxes.find((b) => b.node.id === right)!.width,
    1046,
  );
  assert.equal(
    resized.plates.find((q) => q.layoutSlot === p.layoutSlot)!.id,
    p.id,
  );
  assert.equal(
    resized.plates.find((q) => q.id === p.id)!.specification!.material,
    "Laminat",
  );
  assert.deepEqual(furnitureIssues(resized), []);
  assert.ok(
    furnitureSave.safeParse({ id: id(), version: 0, model: resized }).success,
  );
  const copied = copyCompartment(resized, left, right, id);
  assert.equal(
    copied.compartments!.nodes.find((n) => n.id === right)!.interior,
    "shelves",
  );
  const merged = mergeCompartment(copied, root, id);
  assert.equal(merged.compartments!.nodes.length, 1);
  assert.ok(
    !merged.plates.some((p) => p.layoutSlot?.startsWith("compartment/")),
  );
});
test("invalid locks and cyclic or multiply referenced layouts fail explicitly", () => {
  let m = startCompartments(base(), id),
    root = m.compartments!.roots[0].nodeId;
  m = splitCompartment(m, root, "x", 2, id);
  const [left, right] = m.compartments!.nodes.find((n) => n.id === root)!.split!
    .children;
  m = changeCompartment(m, left, { size: 900 }, id);
  m = changeCompartment(m, right, { size: 900 }, id);
  assert.ok(furnitureIssues(m).some((i) => i.includes("zablokowane")));
  const layout = structuredClone(m.compartments!);
  layout.nodes.find((n) => n.id === root)!.split!.children = [root, left];
  assert.ok(compartmentGraphIssues(layout).length);
});
test("desk roots stay within their cabinet and hutch and survive height changes", () => {
  let m = deskStartingModel(base(), id, 1600, "desk-hutch");
  m = resizeFurniture(
    m,
    { desk: { ...m.desk!, side: "both", cabinetWidth: 375 } },
    id,
  );
  m = startCompartments(m, id);
  for (const r of m.compartments!.roots)
    m = changeCompartment(
      m,
      r.nodeId,
      r.region === "hutch"
        ? { interior: "shelves", count: 1 }
        : { front: "drawers", count: 3 },
      id,
    );
  assert.deepEqual(furnitureIssues(m), []);
  assert.equal(m.plates.filter((p) => p.kind === "drawer").length, 6);
  const resized = resizeFurniture(m, { height: 1500 }, id);
  assert.deepEqual(furnitureIssues(resized), []);
  assert.equal(resized.plates.filter((p) => p.kind === "drawer").length, 6);
  assert.equal(resized.plates.find((p) => p.anchor === "top")!.y, 712);
});
