import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  carcass,
  furnitureGeometrySnapshot,
} from "./core/furniture.js";
import { snapFurniturePlate } from "./core/furniture-snap.js";
test("snap aligns with actual panel edges and room instances remain detached from library changes", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const p = {
    id: randomUUID(),
    name: "Półka",
    kind: "board" as const,
    x: 18,
    y: 200,
    z: 0,
    width: 500,
    height: 18,
    depth: 560,
  };
  assert.equal(snapFurniturePlate(m, p, 22, 217).x, 18);
  assert.equal(snapFurniturePlate(m, p, 233, 277).x, 230);
  assert.equal(snapFurniturePlate(m, p, 233, 277).y, 280);
  const copy = furnitureGeometrySnapshot(m);
  m.width = 2000;
  m.plates[0].height = 100;
  assert.equal(copy.width, 1000);
  assert.notEqual(copy.plates[0].height, m.plates[0].height);
});
