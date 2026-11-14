import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { distributeDrawerFronts as distribute } from "./drawer-front-layout.js";
import {
  freshFurniture,
  carcass,
  applySuggestedLayout,
  setDrawerHeightLock,
  fitDrawerFronts,
  resizeFurniture,
  furnitureIssues,
} from "./furniture.js";
import { furnitureSave } from "./furniture-schema.js";
test("locked fronts stay exact, free fronts share the rest and all millimetres are accounted for", () => {
  const fronts = [
    { id: "a", height: 140, drawerHeightLock: 140.5 },
    { id: "b", height: 220 },
    { id: "c", height: 320 },
  ];
  const h = distribute(704, fronts);
  assert.equal(h.get("a"), 140.5);
  assert.equal(h.get("b"), 281.75);
  assert.equal(h.get("c"), 281.75);
  assert.equal(
    [...h.values()].reduce((a, b) => a + b, 0),
    704,
  );
  const uneven = distribute(705, fronts);
  assert.equal(
    [...uneven.values()].reduce((a, b) => a + b, 0),
    705,
  );
  const minimum = distribute(180.1, [
    { id: "1", height: 1 },
    { id: "2", height: 300 },
    { id: "3", height: 1 },
  ]);
  assert.ok([...minimum.values()].every((v) => v >= 60));
});
test("impossible locks never silently resize a locked front", () => {
  for (const fronts of [
    [
      { id: "a", height: 100, drawerHeightLock: 290 },
      { id: "b", height: 100 },
    ],
    [{ id: "a", height: 100, drawerHeightLock: 90 }],
    [{ id: "a", height: 100, drawerHeightLock: 59 }],
    [{ id: "a", height: 100, drawerHeightLock: NaN }],
  ])
    assert.throws(() => distribute(300, fronts));
  assert.equal(
    distribute(300, [{ id: "a", height: 300, drawerHeightLock: 300 }]).get("a"),
    300,
  );
});
test("creator lock survives schema, resizing and shelf changes; impossible resize is diagnosed", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const initial = applySuggestedLayout(m, "drawers", randomUUID),
    front = initial.plates.find((p) => p.kind === "drawer")!;
  const before = structuredClone(initial),
    locked = setDrawerHeightLock(initial, front.id, 140);
  assert.deepEqual(initial, before);
  assert.equal(locked.plates.find((p) => p.id === front.id)!.height, 140);
  const larger = resizeFurniture(locked, { height: 2400 }, randomUUID);
  assert.equal(larger.plates.find((p) => p.id === front.id)!.height, 140);
  assert.equal(
    larger.plates.find((p) => p.id === front.id)!.drawerHeightLock,
    140,
  );
  assert.ok(
    furnitureSave.safeParse({ id: randomUUID(), version: 0, model: larger })
      .success,
  );
  assert.throws(() => setDrawerHeightLock(locked, front.id, 10000), /Stałe/);
  const withShelf = fitDrawerFronts({
    ...locked,
    plates: [
      ...locked.plates,
      {
        id: randomUUID(),
        name: "Półka nad szufladami",
        kind: "board",
        x: front.x,
        y: 900,
        z: 0,
        width: front.width,
        height: locked.thickness,
        depth: locked.depth - 20,
      },
    ],
  });
  assert.equal(withShelf.plates.find((p) => p.id === front.id)!.height, 140);
  assert.ok(
    withShelf.plates
      .filter((p) => p.kind === "drawer")
      .every((p) => p.y + p.height <= 898.001),
  );
  assert.deepEqual(furnitureIssues(withShelf), []);
  const invalid = resizeFurniture(
    setDrawerHeightLock(initial, front.id, 500),
    { height: 300 },
    randomUUID,
  );
  assert.ok(
    furnitureIssues(invalid).some(
      (s) => s.includes("Stałe") || s.includes("mało miejsca"),
    ),
  );
  assert.equal(invalid.plates.find((p) => p.id === front.id)!.height, 500);
});
