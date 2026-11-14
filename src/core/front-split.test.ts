import { test } from "node:test";
import assert from "node:assert/strict";
import { splitFronts } from "./front-split.js";
test("two 970 mm doors distinguish the centre gap from both edge gaps", () => {
  assert.deepEqual(
    splitFronts(970, 2, 3, 0).map((p) => p.size),
    [483.5, 483.5],
  );
  assert.deepEqual(
    splitFronts(970, 2, 3, 3).map((p) => p.size),
    [480.5, 480.5],
  );
});
test("thirds close the dimension without losing gaps or rounding budget", () => {
  const ps = splitFronts(1000, 3, 3, 2);
  assert.ok(Math.abs(ps.reduce((s, p) => s + p.size, 0) + 6 + 4 - 1000) < 1e-7);
  assert.ok(Math.abs(ps.at(-1)!.start + ps.at(-1)!.size + 2 - 1000) < 1e-7);
});
test("nonfinite, impossible and excessively narrow panels have no result", () => {
  for (const input of [
    [970, 0, 3, 3],
    [20, 2, 3, 3],
    [NaN, 2, 3, 3],
    [970, 2, -1, 0],
    [970, 13, 0, 0],
  ])
    assert.throws(() =>
      splitFronts(...(input as [number, number, number, number])),
    );
});
