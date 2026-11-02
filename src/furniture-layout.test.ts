import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  carcass,
  applySuggestedLayout,
  resizeFurniture,
  furnitureIssues,
  layoutVariants,
  platePolygon,
  polygonArea,
} from "./core/furniture.js";
import { furnitureSave } from "./server/furniture.js";
test("every suggested variant fits both directions of rectangular, slope and stair envelopes", () => {
  for (const shape of ["rectangle", "slope", "stairs"] as const)
    for (const reverse of [false, true])
      for (const { value } of layoutVariants) {
        const base = { ...freshFurniture(), shape, reverse };
        base.plates = carcass(base, randomUUID);
        const m = applySuggestedLayout(base, value, randomUUID);
        assert.deepEqual(
          furnitureIssues(m),
          [],
          `${shape}/${reverse}/${value}`,
        );
        assert.ok(m.plates.length < 150);
        assert.equal(new Set(m.plates.map((p) => p.id)).size, m.plates.length);
        assert.ok(
          furnitureSave.safeParse({ id: randomUUID(), version: 0, model: m })
            .success,
        );
        if (value !== "empty") assert.ok(m.plates.some((p) => p.layoutSlot));
        m.plates
          .filter((p) => p.layoutSlot)
          .forEach((p) => assert.ok(polygonArea(platePolygon(m, p)) > 0));
      }
});
test("resize preserves manual changes and stable IDs, removed suggestions do not return", () => {
  const base = freshFurniture();
  base.plates = carcass(base, randomUUID);
  const m = applySuggestedLayout(base, "shelves", randomUUID);
  const shelves = m.plates.filter((p) => p.layoutSlot);
  assert.equal(shelves.length, 3);
  shelves[0].y = 250;
  shelves[0].layoutCustomized = true;
  const removed = shelves[2];
  m.plates = m.plates.filter((p) => p.id !== removed.id);
  m.suggestion!.excludedSlots.push(removed.layoutSlot!);
  const resized = resizeFurniture(m, { height: 2400 }, randomUUID);
  assert.equal(resized.plates.find((p) => p.id === shelves[0].id)!.y, 250);
  assert.notEqual(
    resized.plates.find((p) => p.id === shelves[1].id)!.y,
    shelves[1].y,
  );
  assert.ok(!resized.plates.some((p) => p.layoutSlot === removed.layoutSlot));
  const restored = applySuggestedLayout(resized, "shelves", randomUUID);
  assert.equal(restored.plates.filter((p) => p.layoutSlot).length, 3);
});
