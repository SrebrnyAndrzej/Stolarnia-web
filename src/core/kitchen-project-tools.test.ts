import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  kitchenInputSchema,
  kitchenModules,
  suggestKitchen,
  kitchenIssues,
} from "./kitchen-configuration.js";
import { kitchenLockProblem } from "./kitchen-locks.js";
import { kitchenMeasurementKey } from "./kitchen-project-details.js";
import {
  kitchenShelfSpaces,
  reviewKitchenObjects,
} from "./kitchen-storage-check.js";
import { kitchenRepairOptions } from "./kitchen-repairs.js";
const input = (extra: object = {}) =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 4200,
    depth: 3000,
    height: 2600,
    items: [],
    ...extra,
  });
test("accepted cabinet position and equipment survive replanning; impossible locks fail without mutation", () => {
  const d = input();
  d.items = suggestKitchen(d, randomUUID);
  const i = d.items.find((i) => i.catalogId === "base-sink-600")!;
  i.locked = true;
  const before = structuredClone(d),
    next = { ...d, items: suggestKitchen(d, randomUUID) };
  assert.equal(kitchenLockProblem(d, next), "");
  assert.ok(next.items.some((n) => n.id === i.id && n.locked));
  assert.deepEqual(d, before);
  const moved = {
    ...d,
    items: d.items.map((n) => (n.id === i.id ? { ...n, gapBefore: 150 } : n)),
  };
  assert.match(kitchenLockProblem(d, moved), /odblokuj/);
  const resized = {
    ...d,
    items: d.items.map((n) => (n.id === i.id ? { ...n, width: 650 } : n)),
  };
  assert.match(kitchenLockProblem(d, resized), /odblokuj/);
  assert.equal(
    kitchenLockProblem(d, {
      ...resized,
      items: resized.items.map((n) =>
        n.id === i.id ? { ...n, locked: false } : n,
      ),
    }),
    "",
  );
  const custom = {
    ...d,
    items: d.items.map((n) => (n.id === i.id ? { ...n, width: 650 } : n)),
  };
  assert.throws(() => suggestKitchen(custom, randomUUID), /blokad|odblokuj/);
});
test("measurement declarations expire after a dimensional or service change, not a finish change", () => {
  const d = input();
  const key = kitchenMeasurementKey(d);
  assert.equal(kitchenMeasurementKey({ ...d, finish: "cashmere" }), key);
  assert.notEqual(kitchenMeasurementKey({ ...d, width: 4300 }), key);
  assert.notEqual(
    kitchenMeasurementKey({
      ...d,
      features: [
        {
          id: randomUUID(),
          kind: "water",
          wall: "a",
          x: 1200,
          y: 500,
          width: 100,
          height: 100,
        },
      ],
    }),
    key,
  );
});
test("storage checks use real shelf clear dimensions and never equate drawer fronts with cavities", () => {
  const id = randomUUID(),
    d = input({
      items: [{ id, catalogId: "base-shelves-600", wall: "a", shelves: 1 }],
    });
  const spaces = kitchenShelfSpaces(d);
  assert.equal(spaces.length, 2);
  assert.equal(spaces[0].width, 564);
  assert.ok(spaces[0].height < 360);
  assert.ok(spaces[0].depth <= 560);
  d.projectDetails = {
    measured: [],
    objects: [
      {
        id: randomUUID(),
        name: "Garnek",
        width: 300,
        height: 200,
        depth: 300,
        cabinetId: id,
      },
      { id: randomUUID(), name: "Robot", width: 700, height: 200, depth: 300 },
    ],
  };
  const rows = reviewKitchenObjects(d);
  assert.ok(rows[0].fit);
  assert.equal(rows[1].fit, undefined);
  assert.deepEqual(
    kitchenShelfSpaces(
      input({ items: [{ id, catalogId: "base-drawers-600", wall: "a" }] }),
    ),
    [],
  );
});
test("collision repairs are previews, never move locks, and strictly reduce existing issues", () => {
  const source = input({
    layout: "u",
    width: 3000,
    depth: 3000,
    returnLength: 3000,
    items: [
      {
        id: randomUUID(),
        catalogId: "base-shelves-600",
        wall: "a",
        gapBefore: 1800,
      },
      { id: randomUUID(), catalogId: "tall-pantry-600", wall: "b" },
    ],
  });
  const before = structuredClone(source),
    problems = kitchenIssues(source),
    options = kitchenRepairOptions(source);
  assert.ok(problems.length);
  assert.ok(options.length);
  for (const o of options) {
    assert.ok(kitchenIssues(o.draft).length < problems.length);
    assert.equal(kitchenLockProblem(source, o.draft), "");
  }
  assert.deepEqual(source, before);
  source.items.forEach((i) => (i.locked = true));
  assert.equal(kitchenRepairOptions(source).length, 0);
});
