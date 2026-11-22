import test from "node:test";
import assert from "node:assert/strict";
import { planKitchenMove } from "./catalog-movement";
import { newDraft, toAnalysis, type Draft } from "./model";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const draft = (): Draft => ({
  ...newDraft(),
  layout: "l",
  width: 3600,
  depth: 3600,
  items: [
    { id: id(1), catalogId: "base-drawers-600", wall: "a", width: 500 },
    { id: id(2), catalogId: "wall-shelves-600", wall: "a" },
    { id: id(3), catalogId: "base-shelves-600", wall: "a", width: 700 },
    { id: id(4), catalogId: "base-shelves-600", wall: "b" },
  ],
});
test("swap preserves equipment and widths, stays in its wall and tier, and does not mutate source", () => {
  const source = draft(),
    frozen = structuredClone(source),
    next = planKitchenMove(source, id(1), 1);
  assert.deepEqual(source, frozen);
  assert.deepEqual(
    next.items.map((i) => i.id),
    [id(3), id(2), id(1), id(4)],
  );
  for (const item of frozen.items)
    assert.deepEqual(
      next.items.find((i) => i.id === item.id),
      item,
    );
  const modules = toAnalysis(next).projekt.moduly;
  assert.equal(modules.find((m) => m.id === id(3))?.pozycjaXMM, 0);
  assert.equal(modules.find((m) => m.id === id(1))?.pozycjaXMM, 700);
  assert.deepEqual(planKitchenMove(next, id(1), -1), frozen);
  assert.equal(planKitchenMove(source, id(2), 1), source);
  assert.equal(planKitchenMove(source, id(1), -1), source);
});
test("moving a locked cabinet or displacing a locked neighbour fails atomically", () => {
  for (const locked of [id(1), id(3)]) {
    const source = draft();
    source.items = source.items.map((i) =>
      i.id === locked ? { ...i, locked: true } : i,
    );
    const before = structuredClone(source);
    assert.throws(() => planKitchenMove(source, id(1), 1), /odblokuj/);
    assert.deepEqual(source, before);
  }
  assert.throws(() => planKitchenMove(draft(), id(99), 1), /Wybierz szafkę/);
});
test("swap cannot place a tall unit under a window even though the row still fits", () => {
  const source: Draft = {
    ...newDraft(),
    items: [
      { id: id(1), catalogId: "tall-refrigerator-600", wall: "a" },
      { id: id(2), catalogId: "base-shelves-600", wall: "a" },
    ],
    features: [
      {
        id: id(9),
        kind: "window",
        wall: "a",
        x: 600,
        width: 600,
        bottom: 1000,
        height: 1000,
      },
    ],
  };
  const before = structuredClone(source);
  assert.throws(() => planKitchenMove(source, id(1), 1));
  assert.deepEqual(source, before);
});
