import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceMovieTime } from "./home-motion";
test("large jumps respect the camera speed bound in both directions", () => {
  assert.ok(advanceMovieTime(0, 14, 1 / 60) <= 4 / 60);
  assert.ok(advanceMovieTime(14, 0, 1 / 60) >= 14 - 4 / 60);
  assert.ok(advanceMovieTime(0, 14, 5) <= 4 * 0.064);
});
test("normal scroll settles smoothly without overshooting or oscillating", () => {
  let time = 0;
  for (let i = 0; i < 120; i++) {
    const next = advanceMovieTime(time, 0.7, 1 / 60);
    assert.ok(next >= time && next <= 0.7);
    time = next;
  }
  assert.ok(Math.abs(time - 0.7) < 0.025);
  for (let i = 0; i < 120; i++) {
    const next = advanceMovieTime(time, 0.2, 1 / 60);
    assert.ok(next <= time && next >= 0.2);
    time = next;
  }
  assert.ok(Math.abs(time - 0.2) < 0.025);
});
