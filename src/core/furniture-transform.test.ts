import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { freshFurniture, carcass, type FurniturePlate } from "./furniture.js";
import { transformFurnitureParts } from "./furniture-transform.js";
import { furnitureSave } from "./furniture-schema.js";
const setup = () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const p: FurniturePlate = {
    id: randomUUID(),
    name: "Półka",
    kind: "board",
    x: 18,
    y: 400,
    z: 0,
    width: 964,
    height: 18,
    depth: 500,
  };
  m.plates.push(p);
  return { m, p };
};
test("duplicate uses new IDs, detaches layout and preserves original without mutation", () => {
  const { m, p } = setup();
  const before = structuredClone(m);
  const next = transformFurnitureParts(m, [p.id], "duplicate", 250, randomUUID);
  assert.deepEqual(m, before);
  assert.equal(next.plates.length, m.plates.length + 1);
  const copy = next.plates.at(-1)!;
  assert.notEqual(copy.id, p.id);
  assert.equal(copy.y, 650);
  assert.equal(copy.layoutSlot, undefined);
  assert.ok(
    furnitureSave.safeParse({ id: randomUUID(), version: 0, model: next })
      .success,
  );
});
test("group movement rejects new overlaps and structural plates", () => {
  const { m, p } = setup();
  assert.throws(
    () => transformFurnitureParts(m, [p.id], "duplicate", 1, randomUUID),
    /przecięcie/,
  );
  assert.throws(
    () =>
      transformFurnitureParts(
        m,
        [m.plates[0].id],
        "duplicate",
        100,
        randomUUID,
      ),
    /korpusu/,
  );
  assert.throws(
    () => transformFurnitureParts(m, [p.id], "duplicate", NaN, randomUUID),
    /odstęp/,
  );
});
test("align drawer fronts across columns and preserve fixed stack, not all drawers to one height", () => {
  const { m, p } = setup();
  m.plates = m.plates.filter((q) => q.id !== p.id);
  const first = {
    ...p,
    kind: "drawer" as const,
    width: 450,
    height: 160,
    depth: 18,
    z: 520,
    y: 300,
  };
  const second = { ...first, id: randomUUID(), x: 510, y: 330 };
  m.plates.push(first, second);
  const next = transformFurnitureParts(
    m,
    [first.id, second.id],
    "align-y",
    100,
    randomUUID,
  );
  assert.equal(next.plates.at(-1)!.y, 300);
  assert.equal(next.drawerFit, "fixed");
  const sameColumn = { ...second, x: first.x, y: 600 };
  m.plates[m.plates.length - 1] = sameColumn;
  assert.throws(
    () =>
      transformFurnitureParts(
        m,
        [first.id, second.id],
        "align-y",
        100,
        randomUUID,
      ),
    /przecięcie/,
  );
});
