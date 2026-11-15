import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID as uid } from "node:crypto";
import { freshFurniture, carcass } from "./core/furniture.js";
import {
  startCompartments,
  splitCompartment,
  compartmentBoxes,
} from "./core/furniture-compartments.js";
import {
  applyCompartmentPreset,
  copyToAdjacent,
  adjacentCompartment,
} from "./core/furniture-compartment-presets.js";
const setup = () => {
  let m = freshFurniture();
  m.plates = carcass(m, uid);
  m = startCompartments(m, uid);
  const root = m.compartments!.roots[0].nodeId;
  m = splitCompartment(m, root, "x", 2, uid);
  const children = m.compartments!.nodes.find((n) => n.id === root)!.split!
    .children;
  return { m, children };
};
test("equipment presets and adjacent copy preserve target geometry and clear removed drawer assignments", () => {
  const { m, children } = setup();
  const drawers = applyCompartmentPreset(m, children[0], "drawers", uid);
  assert.equal(drawers.plates.filter((p) => p.kind === "drawer").length, 3);
  const copy = copyToAdjacent(drawers, children[0], uid);
  assert.equal(copy.plates.filter((p) => p.kind === "drawer").length, 6);
  assert.deepEqual(
    compartmentBoxes(m).boxes.map((b) => [b.x, b.y, b.width, b.height]),
    compartmentBoxes(copy).boxes.map((b) => [b.x, b.y, b.width, b.height]),
  );
  assert.equal(adjacentCompartment(m, children[0])!.id, children[1]);
  assert.equal(adjacentCompartment(m, children[1])!.id, children[0]);
  const front = drawers.plates.find((p) => p.kind === "drawer")!;
  drawers.drawerAssemblies = [
    { frontId: front.id, profileId: "test", variant: "x", nominalLength: 400 },
  ];
  const open = applyCompartmentPreset(drawers, children[0], "open", uid);
  assert.equal(open.drawerAssemblies!.length, 0);
  assert.equal(m.plates.filter((p) => p.kind === "drawer").length, 0);
});
test("equipment presets fail without mutating a small compartment", () => {
  const { m, children } = setup();
  m.height = 110;
  const before = JSON.stringify(m);
  assert.throws(() => applyCompartmentPreset(m, children[0], "pair", uid));
  assert.equal(JSON.stringify(m), before);
});
