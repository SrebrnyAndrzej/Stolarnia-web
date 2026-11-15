import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  carcass,
  applySuggestedLayout,
  fitDrawerFronts,
  resizeFurniture,
  furnitureIssues,
  deskStartingModel,
  type FurnitureModel,
  type FurniturePlate,
} from "./core/furniture.js";
import { furnitureSave } from "./server/furniture.js";
function model(): FurnitureModel {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  return {
    ...m,
    drawerFit: "fill",
    customDrawerSet: true,
    suggestion: { variant: "empty", excludedSlots: [] },
    plates: [
      ...m.plates,
      ...[140, 220, 320].map((height, i) => ({
        id: randomUUID(),
        name: `Front ${i}`,
        kind: "drawer" as const,
        x: m.thickness + 2,
        y: 20 + i * 400,
        z: m.depth,
        width: m.width - 2 * m.thickness - 4,
        height,
        depth: m.thickness,
      })),
    ],
  };
}
function shelf(m: FurnitureModel, y: number): FurniturePlate {
  return {
    id: randomUUID(),
    name: "Półka",
    kind: "board",
    x: m.thickness,
    y,
    z: 0,
    width: m.width - 2 * m.thickness,
    height: m.thickness,
    depth: m.depth,
  };
}
test("default fills the entire height with only 2mm gaps, preserves IDs and is idempotent", () => {
  const m = model(),
    fitted = fitDrawerFronts(m),
    fronts = fitted.plates.filter((p) => p.kind === "drawer");
  assert.equal(fronts[0].y, m.thickness + 2);
  assert.equal(
    fronts.at(-1)!.y + fronts.at(-1)!.height,
    m.height - m.thickness - 2,
  );
  fronts
    .slice(1)
    .forEach((p, i) => assert.equal(p.y - fronts[i].y - fronts[i].height, 2));
  assert.ok(
    fronts[0].height < fronts[1].height && fronts[1].height < fronts[2].height,
  );
  assert.deepEqual(fitDrawerFronts(fitted), fitted);
  assert.deepEqual(
    fronts.map((p) => p.id),
    m.plates.filter((p) => p.kind === "drawer").map((p) => p.id),
  );
  const sized = resizeFurniture(fitted, { height: 2400 }, randomUUID);
  const last = sized.plates.filter((p) => p.kind === "drawer").at(-1)!;
  assert.equal(last.y + last.height, 2400 - m.thickness - 2);
  assert.equal(sized.plates.filter((p) => p.kind === "drawer").length, 3);
  assert.ok(
    furnitureSave.safeParse({ id: randomUUID(), version: 0, model: sized })
      .success,
  );
});
test("a spanning shelf caps the stack, moving and removing it refills the correct available height", () => {
  const m = model(),
    divider = shelf(m, 800);
  for (const y of [800, 1100]) {
    const fitted = fitDrawerFronts({
      ...m,
      plates: [...m.plates, { ...divider, y }],
    });
    const last = fitted.plates.filter((p) => p.kind === "drawer").at(-1)!;
    assert.equal(last.y + last.height, y - 2);
    assert.deepEqual(furnitureIssues(fitted), []);
  }
  const partial = { ...divider, width: 100 };
  const fitted = fitDrawerFronts({ ...m, plates: [...m.plates, partial] });
  const last = fitted.plates.filter((p) => p.kind === "drawer").at(-1)!;
  assert.equal(last.y + last.height, m.height - m.thickness - 2);
  assert.ok(
    furnitureIssues({
      ...m,
      plates: [...m.plates, { ...divider, y: 150 }],
    }).some((s) => s.includes("Za dużo szuflad")),
  );
});
test("fixed and legacy layouts never get silently resized, generated fixed fronts survive envelope changes", () => {
  const m = model();
  assert.deepEqual(
    fitDrawerFronts({ ...m, drawerFit: "fixed" }).plates,
    m.plates,
  );
  assert.deepEqual(
    fitDrawerFronts({ ...m, drawerFit: undefined }).plates,
    m.plates,
  );
  const generated = applySuggestedLayout(m, "drawers", randomUUID);
  const fixed = { ...generated, drawerFit: "fixed" as const };
  const sized = resizeFurniture(fixed, { height: 2400 }, randomUUID);
  assert.deepEqual(
    sized.plates.filter((p) => p.kind === "drawer"),
    fixed.plates.filter((p) => p.kind === "drawer"),
  );
});
test("both desk columns fill only their own cabinets below the worktop", () => {
  let m = deskStartingModel(model(), randomUUID, 1600, "desk-hutch");
  m = resizeFurniture(
    m,
    {
      desk: {
        ...m.desk!,
        side: "both",
        cabinetWidth: 375,
        cabinetFront: "drawers",
      },
    },
    randomUUID,
  );
  const fronts = m.plates.filter((p) => p.kind === "drawer");
  assert.equal(fronts.length, 6);
  for (const x of new Set(fronts.map((p) => p.x))) {
    const group = fronts.filter((p) => p.x === x);
    assert.equal(group[0].y, 30);
    assert.equal(group.at(-1)!.y + group.at(-1)!.height, 710);
  }
  assert.deepEqual(furnitureIssues(m), []);
});
