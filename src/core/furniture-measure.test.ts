import test from "node:test";
import assert from "node:assert/strict";
import { freshFurniture, type FurniturePlate } from "./furniture.js";
import { measureFurnitureParts } from "./furniture-measure.js";
const plate = (
  id: string,
  patch: Partial<FurniturePlate> = {},
): FurniturePlate => ({
  id,
  name: id,
  kind: "board",
  x: 18,
  y: 18,
  z: 0,
  width: 964,
  height: 18,
  depth: 560,
  ...patch,
});
test("surface gap excludes board thickness and responds to vertical and depth changes", () => {
  const m = freshFurniture();
  m.plates = [plate("a"), plate("b", { y: 500 })];
  let r = measureFurnitureParts(m, ["a", "b"])!;
  assert.equal(r.distance, 464);
  assert.equal(r.axes.y.gap, 464);
  assert.equal(r.axes.x.gap, 0);
  m.plates[1].z = 600;
  r = measureFurnitureParts(m, ["a", "b"])!;
  assert.ok(Math.abs(r.distance - Math.hypot(464, 40)) < 1e-8);
  assert.equal(r.axes.z.gap, 40);
});
test("touching and containment are zero, diagonal distance is Euclidean", () => {
  const m = freshFurniture();
  m.plates = [
    plate("a", { x: 0, y: 0, width: 100, height: 100, depth: 20 }),
    plate("b", { x: 103, y: 104, width: 100, height: 100, depth: 20 }),
  ];
  assert.equal(measureFurnitureParts(m, ["a", "b"])!.distance, 5);
  m.plates[1] = { ...m.plates[1], x: 100, y: 0 };
  assert.equal(measureFurnitureParts(m, ["a", "b"])!.distance, 0);
  m.plates[1] = { ...m.plates[1], x: 20, y: 20, width: 30, height: 30 };
  assert.equal(measureFurnitureParts(m, ["a", "b"])!.distance, 0);
});
test("sloped geometry uses clipped polygons, not bounding box overlap", () => {
  const m = freshFurniture();
  m.shape = "slope";
  m.lowHeight = 1000;
  m.height = 2000;
  m.width = 1000;
  m.plates = [
    plate("roof", {
      kind: "cap",
      anchor: "top",
      x: 0,
      y: 0,
      width: 1000,
      height: 18,
    }),
    plate("shelf", { x: 50, y: 500, width: 100, height: 18 }),
  ];
  const r = measureFurnitureParts(m, ["roof", "shelf"]);
  assert.ok(r);
  assert.ok(r.distance > 100);
  assert.equal(r.shaped, true);
  // Closest points belong to the clipped top: a point above the lower side cannot be invented.
  assert.ok(r.from[1] > 900);
  assert.equal(measureFurnitureParts(m, ["roof"]), null);
  assert.equal(measureFurnitureParts(m, ["roof", "missing"]), null);
});

test("crossing polygons with no contained vertices have zero distance; empty clipped parts are not measured", () => {
  const m = freshFurniture();
  m.plates = [
    plate("a", { x: 0, y: 40, width: 100, height: 10 }),
    plate("b", { x: 40, y: 0, width: 10, height: 100 }),
  ];
  assert.equal(measureFurnitureParts(m, ["a", "b"])!.distance, 0);
  m.plates[1].x = 5000;
  assert.equal(measureFurnitureParts(m, ["a", "b"]), null);
  assert.equal(measureFurnitureParts(m, ["a", "a"]), null);
});
