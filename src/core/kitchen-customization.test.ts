import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenModules,
  kitchenIssues,
  suggestKitchen,
} from "./kitchen-configuration.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
const id = "00000000-0000-4000-8000-000000000001";
const base = () =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 3600,
    depth: 2400,
    height: 2600,
    items: [{ id, catalogId: "base-drawers-600", wall: "a" }],
  });
test("custom width and number of drawers reach geometry and sale estimate", () => {
  const a = base(),
    b = kitchenInputSchema.parse({
      ...a,
      items: [{ ...a.items[0], width: 900, drawers: 5 }],
    });
  const m = kitchenModules(b)[0];
  assert.equal(m.szerokoscMM, 900);
  assert.equal(m.konfiguracja.liczbaSzuflad, 5);
  assert.ok(
    calculateKitchenEstimate(b).estimate.gross! >
      calculateKitchenEstimate(a).estimate.gross!,
  );
});
test("preset fits I/L/U across supported dimensions, IDs and module limit", () => {
  let n = 0;
  const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  for (const layout of ["straight", "l", "u"] as const)
    for (const width of [1800, 2400, 3600, 8000]) {
      const d = kitchenInputSchema.parse({
        ...base(),
        layout,
        width,
        depth: width,
        returnLength: width,
      });
      d.items = suggestKitchen(d, uuid);
      assert.ok(d.items.length > 0 && d.items.length <= 24);
      assert.deepEqual(kitchenIssues(d), []);
      assert.doesNotThrow(() => kitchenInputSchema.parse(d));
    }
});
test("appliance widths, unavailable sizes and unrelated interior fields are rejected", () => {
  for (const item of [
    { id, catalogId: "dishwasher-front-600", wall: "a", width: 800 },
    { ...base().items[0], height: 1000 },
    { ...base().items[0], shelves: 2 },
    { ...base().items[0], drawers: 7 },
  ])
    assert.throws(() => kitchenInputSchema.parse({ ...base(), items: [item] }));
});
test("widening a cabinet beyond a wall blocks both amount and PDF readiness", () => {
  const d = kitchenInputSchema.parse({
    ...base(),
    width: 1800,
    items: [
      { ...base().items[0], width: 1200 },
      {
        id: "00000000-0000-4000-8000-000000000002",
        catalogId: "base-shelves-900",
        wall: "a",
      },
    ],
  });
  assert.equal(calculateKitchenEstimate(d).estimate.gross, null);
});
