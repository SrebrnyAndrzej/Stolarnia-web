import { test } from "node:test";
import assert from "node:assert/strict";
import { slopeCut } from "./core/slope-cut.js";
import { carcass, freshFurniture, platePolygon } from "./core/furniture.js";
import { randomUUID } from "node:crypto";
const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("two wall heights and horizontal width determine slope, not half-angle", () => {
  const r = slopeCut({
    width: 1000,
    height: 2000,
    lowHeight: 1500,
    thickness: 18,
  })!;
  close(r.angle, 26.56505117707799);
  close(r.roofTopEdge, 964 / Math.cos(Math.atan(0.5)));
  close(r.shortInner, 1509);
  close(r.longInner, 1991);
  assert.equal(r.butt.fits, true);
  assert.equal(r.mitreShort.fits, true);
  assert.equal(r.mitreLong.fits, false);
  close(r.mitreShort.degrees + r.mitreLong.degrees, 90);
  close(2 * r.mitreShort.degrees + r.cornerShort, 180);
  close(2 * r.mitreLong.degrees + r.cornerLong, 180);
});
test("45 degree boundary, horizontal roof and invalid heights", () => {
  const m = { width: 1000, height: 2000, lowHeight: 1000, thickness: 18 };
  assert.equal(slopeCut(m)!.butt.fits, true);
  assert.equal(slopeCut({ ...m, lowHeight: 999 })!.butt.fits, false);
  const flat = slopeCut({ ...m, lowHeight: 2000 })!;
  close(flat.angle, 0);
  close(flat.mitreShort.degrees, 45);
  close(flat.mitreLong.degrees, 45);
  assert.equal(slopeCut({ ...m, lowHeight: 2001 }), null);
  assert.equal(slopeCut({ ...m, width: 36 }), null);
  assert.equal(slopeCut({ ...m, width: NaN }), null);
});
test("roof lies between the side panels and its thickness is perpendicular to the slope", () => {
  const m = { ...freshFurniture(), shape: "slope" as const, lowHeight: 1500 };
  m.plates = carcass(m, randomUUID);
  const cap = m.plates.find((p) => p.kind === "cap")!;
  for (const reverse of [false, true]) {
    const model = { ...m, reverse };
    const poly = platePolygon(model, cap);
    close(Math.min(...poly.map((p) => p[0])), 18);
    close(Math.max(...poly.map((p) => p[0])), 982);
    const [lowLeft, , , topLeft] = poly;
    close((topLeft[1] - lowLeft[1]) * Math.cos(Math.atan(0.5)), 18);
  }
});
