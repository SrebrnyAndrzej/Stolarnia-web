import test from "node:test";
import assert from "node:assert/strict";
import { freshFurniture, freshPlateSpecification } from "./furniture.js";
import { furnitureFaceGuides } from "./furniture-face-guides.js";
test("YZ grain U follows depth, band v0 stays at bottom, matching cut-list axes", () => {
  const m = freshFurniture(),
    s = freshPlateSpecification();
  s.face = "yz";
  s.grain = "u";
  s.edges.v0.state = "band";
  const p = {
    id: "side",
    kind: "board" as const,
    name: "Bok",
    x: 0,
    y: 18,
    z: 0,
    width: 18,
    height: 1900,
    depth: 560,
    specification: s,
  };
  const [band, grain] = furnitureFaceGuides(m, p);
  assert.equal(band.kind, "band");
  assert.deepEqual(band.points, [
    [18.7, 18, 0],
    [18.7, 18, 560],
  ]);
  assert.equal(grain.points[0][1], grain.points[1][1]);
  assert.ok(grain.points[1][2] > grain.points[0][2]);
  s.face = "slope";
  assert.deepEqual(furnitureFaceGuides(m, p), []);
});
