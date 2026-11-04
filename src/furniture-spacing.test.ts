import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshFurniture,
  carcass,
  type FurnitureModel,
} from "./core/furniture.js";
import { shelfSpacing, applyShelfSpacing } from "./core/furniture-spacing.js";
let sequence = 0;
const uid = () => `p-${++sequence}`;
function model(): FurnitureModel {
  const m = freshFurniture();
  m.plates = carcass(m, uid);
  for (const y of [250, 800, 1200])
    m.plates.push({
      id: uid(),
      name: "Półka",
      kind: "board",
      x: m.thickness,
      y,
      z: 0,
      width: m.width - 2 * m.thickness,
      height: m.thickness,
      depth: m.depth,
    });
  return m;
}
test("equal clear openings preserve identities, material and source; second application is stable", () => {
  const m = model(),
    id = m.plates.at(-1)!.id,
    before = JSON.stringify(m),
    r = shelfSpacing(m, id);
  assert.equal(r.issue, null);
  const result = applyShelfSpacing(m, id);
  assert.equal(JSON.stringify(m), before);
  const shelves = result.plates
    .filter((p) => r.ids.includes(p.id))
    .sort((a, b) => a.y - b.y);
  let previous = m.thickness;
  for (const p of shelves) {
    assert.ok(Math.abs(p.y - previous - r.clearance) < 1e-8);
    previous = p.y + p.height;
    assert.equal(p.layoutCustomized, true);
  }
  assert.ok(Math.abs(m.height - m.thickness - previous - r.clearance) < 1e-8);
  assert.deepEqual(applyShelfSpacing(result, id), result);
});
test("drawer, partition, slope, compartment and insufficient space block automatic redistribution", () => {
  const base = model(),
    id = base.plates.at(-1)!.id;
  for (const change of [
    (m: FurnitureModel) => {
      m.shape = "slope";
    },
    (m: FurnitureModel) => {
      m.plates.push({ ...m.plates.at(-1)!, id: uid(), kind: "drawer", y: 400 });
    },
    (m: FurnitureModel) => {
      m.plates.push({
        ...m.plates.at(-1)!,
        id: uid(),
        width: 18,
        height: 1000,
        x: 300,
      });
    },
    (m: FurnitureModel) => {
      m.plates.at(-1)!.height = m.height;
    },
  ]) {
    const m = structuredClone(base);
    change(m);
    assert.ok(shelfSpacing(m, id).issue);
    assert.equal(applyShelfSpacing(m, id), m);
  }
});
