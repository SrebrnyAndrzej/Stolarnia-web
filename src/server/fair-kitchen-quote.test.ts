import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fairKitchenSource } from "./fair-kitchen-quote.js";
import type { Principal } from "./access.js";
import { calculateKitchenEstimate } from "../core/kitchen-estimate.js";
import { fairQuote } from "../core/fair-quote.js";
const owner = { role: "owner", active: true } as Principal;
const draft = {
  layout: "straight",
  width: 3600,
  depth: 3000,
  height: 2600,
  items: [{ id: randomUUID(), catalogId: "base-shelves-600", wall: "a" }],
};
test("only active owner may obtain internal costs; public sale DTO remains unchanged", () => {
  for (const p of [
    { role: "employee", active: true },
    { role: "client", active: true },
    { role: "owner", active: false },
  ])
    assert.throws(() => fairKitchenSource(p as Principal, draft), /wyłącznie/);
  const r = fairKitchenSource(owner, draft);
  assert.ok(r.inputs.materialsNet > 0);
  assert.ok(r.lines.length);
  assert.equal(r.legacyGross, calculateKitchenEstimate(draft).estimate.gross);
  assert.ok(fairQuote(r.inputs).gross > 0);
  assert.doesNotMatch(
    JSON.stringify(calculateKitchenEstimate(draft).estimate),
    /costing|kosztBazowy|productionHourCostNet|marzaKwota/,
  );
});
test("kitchen bridge passes counted costs once and distinguishes outsourced worktop", () => {
  const r = fairKitchenSource(owner, draft),
    c = calculateKitchenEstimate(draft).costing.legacy;
  const sum =
    r.inputs.materialsNet +
    r.inputs.preparationNet +
    r.inputs.productionHours * r.inputs.productionHourCostNet +
    r.inputs.installationNet +
    r.inputs.transportNet +
    r.inputs.boughtWorktopNet;
  assert.ok(Math.abs(sum - c.kosztBazowyNetto) < 0.03);
  assert.ok(r.inputs.boughtWorktopNet > 0);
  assert.match(r.source, /modelowe/);
});
test("invalid or geometrically blocked kitchens return actionable errors", () => {
  assert.throws(
    () => fairKitchenSource(owner, { ...draft, items: [] }),
    /Dodaj/,
  );
  assert.throws(
    () => fairKitchenSource(owner, { ...draft, width: 0 }),
    /Niepoprawny/,
  );
});
