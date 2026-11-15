import { test } from "node:test";
import assert from "node:assert/strict";
import {
  technicalOpenings,
  verticalSection,
} from "./core/technical-openings.js";
const rect = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  vertical = false,
) => ({
  id,
  vertical,
  polygon: [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ] as [number, number][],
});
test("clear heights subtract actual board thicknesses and split by vertical partitions", () => {
  const outline: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ] = [
    [0, 0],
    [1000, 0],
    [1000, 2000],
    [0, 2000],
  ];
  const parts = [
    rect("l", 0, 0, 18, 2000, true),
    rect("r", 982, 0, 18, 2000, true),
    rect("b", 18, 0, 964, 18),
    rect("t", 18, 1982, 964, 18),
    rect("s", 18, 500, 964, 18),
    rect("d", 491, 18, 18, 1964, true),
  ];
  const o = technicalOpenings(outline, parts);
  assert.equal(o.length, 4);
  assert.deepEqual(
    o.map((p) => p.height),
    [482, 1464, 482, 1464],
  );
  assert.equal(o[0].probeX, 254.5);
});
test("slope is intersected at the measuring axis, not measured using bounding boxes", () => {
  const poly: [number, number][] = [
    [0, 0],
    [1000, 0],
    [1000, 2000],
    [0, 1000],
  ];
  assert.deepEqual(verticalSection(poly, 500), [0, 1500]);
  const o = technicalOpenings(poly, [rect("b", 0, 0, 1000, 18)]);
  assert.equal(o[0].height, 1482);
  assert.equal(o[0].probeX, 500);
});
