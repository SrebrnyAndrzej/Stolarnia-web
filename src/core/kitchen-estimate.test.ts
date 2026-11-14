import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { kitchenInputSchema, kitchenModules } from "./kitchen-configuration.js";
const item = (catalogId: string, n = 1, wall = "a") => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  catalogId,
  wall,
});
const draft = () => ({
  layout: "straight",
  width: 3600,
  depth: 2400,
  height: 2600,
  finish: "cashmere",
  items: [
    item("base-drawers-600"),
    item("base-shelves-600", 2),
    item("wall-shelves-600", 3),
  ],
});
test("server calculates sale-only groups and quantities from actual cabinet geometry", () => {
  const { estimate: e, modules } = calculateKitchenEstimate(draft());
  assert.equal(e.status, "estimated");
  assert.ok(e.gross! > 0);
  assert.equal(
    e.groups.reduce((s, g) => s + g.gross, 0),
    e.gross,
  );
  assert.equal(modules.length, 3);
  for (const secret of [
    "cenaNetto",
    "kosztBazowyNetto",
    "marzaKwota",
    "pozycje",
    "cenaJednostkowaNetto",
  ])
    assert.ok(!JSON.stringify(e).includes(secret));
});
test("front finish, drawer brand and installation change the same full estimate", () => {
  const calc = (quote: object) =>
    calculateKitchenEstimate({ ...draft(), quote }).estimate.gross!;
  const base = calc({});
  assert.ok(calc({ front: "fluted" }) > base);
  assert.ok(calc({ drawers: "blum" }) > base);
  assert.ok(calc({ installation: false }) < base);
  assert.ok(calc({ worktop: "compact" }) > base);
});
test("empty, overflowing and colliding layouts have no amount or PDF-ready groups", () => {
  for (const d of [
    { ...draft(), items: [] },
    {
      ...draft(),
      width: 1800,
      items: Array.from({ length: 4 }, (_, i) =>
        item("base-shelves-600", i + 1),
      ),
    },
    {
      ...draft(),
      items: [item("tall-pantry-600"), item("wall-shelves-600", 2)],
    },
  ]) {
    const { estimate: e } = calculateKitchenEstimate(d);
    assert.equal(e.status, "blocked");
    assert.equal(e.gross, null);
    assert.deepEqual(e.groups, []);
  }
});
test("client supplied price is ignored and invalid or oversized input rejected", () => {
  assert.equal(
    calculateKitchenEstimate({ ...draft(), gross: 1 }).estimate.gross,
    calculateKitchenEstimate(draft()).estimate.gross,
  );
  for (const d of [
    { ...draft(), items: [item("unknown")] },
    {
      ...draft(),
      items: Array.from({ length: 25 }, (_, i) =>
        item("base-shelves-600", i + 1),
      ),
    },
    { ...draft(), items: [item("base-shelves-600", 1, "b")] },
    { ...draft(), quote: { drawers: "unknown" } },
  ])
    assert.throws(() => calculateKitchenEstimate(d));
});
test("legacy drafts get quote defaults; U uses all three independent walls", () => {
  const d = kitchenInputSchema.parse({
    ...draft(),
    layout: "u",
    returnLength: 2400,
    items: [
      item("base-shelves-600"),
      item("base-shelves-600", 2, "b"),
      item("base-shelves-600", 3, "c"),
    ],
  });
  assert.equal(d.quote.drawers, "amix");
  assert.deepEqual(
    kitchenModules(d).map((m) => m.pozycjaXMM),
    [0, 650, 650],
  );
});
