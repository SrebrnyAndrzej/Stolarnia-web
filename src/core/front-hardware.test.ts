import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  carcass,
  resizeFurniture,
  type FurniturePlate,
} from "./furniture.js";
import { frontHardware } from "./front-hardware.js";
import { furnitureSave } from "./furniture-schema.js";
const setup = () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const p: FurniturePlate = {
    id: randomUUID(),
    name: "Drzwi",
    kind: "door",
    x: 18,
    y: 18,
    z: 560,
    width: 450,
    height: 1800,
    depth: 18,
    frontHardware: {
      kgPerM2: 8,
      mirrorKgPerM2: 10,
      hinges: {
        count: 4,
        side: "left",
        axis: 22.5,
        bottom: 100,
        top: 100,
        diameter: 35,
        depth: 13,
        clearance: 30,
        source: "Próba",
      },
      handle: {
        x: 350,
        y: 900,
        pitch: 128,
        vertical: true,
        diameter: 5,
        source: "Uchwyt test",
      },
    },
  };
  m.plates.push(p);
  return { m, p };
};
test("front holes share one coordinate system, mass includes mirror, plan survives schema and resize", () => {
  const { m, p } = setup(),
    before = structuredClone(m),
    r = frontHardware(m, p);
  assert.equal(r.holes.length, 6);
  assert.equal(r.holes[0].y, 100);
  assert.equal(r.holes[3].y, 1700);
  assert.equal(r.holes[4].y, 836);
  assert.equal(r.holes[5].y, 964);
  assert.ok(Math.abs(r.mass! - 14.58) < 1e-9);
  assert.deepEqual(m, before);
  const saved = furnitureSave.parse({ id: randomUUID(), version: 0, model: m });
  assert.deepEqual(saved.model.plates.at(-1)!.frontHardware, p.frontHardware);
  assert.deepEqual(
    resizeFurniture(m, { height: 2200 }, randomUUID).plates.at(-1)!
      .frontHardware,
    p.frontHardware,
  );
  p.frontHardware!.hinges!.side = "right";
  assert.equal(frontHardware(m, p).holes[0].x, 427.5);
});
test("invalid edge, depth, overlapping holes and clipped fronts withhold the entire drilling drawing", () => {
  for (const change of [
    (p: FurniturePlate) => (p.frontHardware!.hinges!.depth = 18),
    (p: FurniturePlate) => (p.frontHardware!.handle!.x = 0),
    (p: FurniturePlate) => (p.frontHardware!.hinges!.count = 8),
    (p: FurniturePlate) => (p.height = 150),
  ]) {
    const { m, p } = setup();
    change(p);
    if (p.frontHardware!.hinges!.count === 8)
      p.frontHardware!.hinges!.top = 1690;
    const r = frontHardware(m, p);
    assert.ok(r.issues.length);
    assert.equal(r.holes.length, 0);
  }
  const { m, p } = setup();
  p.width = 2000;
  assert.equal(frontHardware(m, p).holes.length, 0);
});
test("shelf control zone warns without claiming to simulate hardware; drawer hinges are rejected", () => {
  const { m, p } = setup();
  m.plates.push({
    id: randomUUID(),
    name: "Półka testowa",
    kind: "board",
    x: 18,
    y: 110,
    z: 0,
    width: 964,
    height: 18,
    depth: 500,
  });
  assert.ok(
    frontHardware(m, p).warnings.some((s) => s.includes("Półka testowa")),
  );
  p.kind = "drawer";
  assert.equal(frontHardware(m, p).holes.length, 0);
});
