import test from "node:test";
import assert from "node:assert/strict";
import { fairQuote, fairQuoteSchema } from "./fair-quote.js";
const base = (extra: object = {}) => ({
  materialsNet: 5000,
  preparationNet: 800,
  productionHours: 24,
  productionHourCostNet: 70,
  installationNet: 1400,
  transportNet: 250,
  boughtWorktopNet: 1200,
  ...extra,
});
test("material multiplier funds production once and expensive bought worktop is not doubled", () => {
  const r = fairQuote(base({ roundGrossTo: 0 }));
  assert.equal(r.multiplier.net, 14570); // (5000+800)*2 + 1200*1.10 + 1400 + 250
  assert.equal(r.costs.productionNet, 1680);
  assert.equal(r.costs.baseNet, 10330);
  assert.equal(r.costs.reserveNet, 309.9);
  assert.equal(r.adjustment, "cap");
  assert.ok(r.gross < r.multiplier.gross);
  assert.ok(r.marginPercent >= 25);
});
test("cheap material with substantial work cannot sell below cost, wages, reserve or minimum profit", () => {
  const r = fairQuote(
    base({
      materialsNet: 500,
      preparationNet: 100,
      productionHours: 40,
      productionHourCostNet: 100,
      boughtWorktopNet: 0,
    }),
  );
  assert.equal(r.adjustment, "floor");
  assert.ok(r.multiplier.profitNet < 0);
  assert.ok(r.profitNet >= 500);
  assert.ok(r.marginPercent >= 15);
  assert.ok(r.net >= r.costs.protectedCostNet);
  assert.ok(r.gross >= r.net);
});
test("margin is a share of sale, not a markup, and gross rounding never breaches the floor", () => {
  const r = fairQuote(
    base({
      materialsNet: 1000,
      preparationNet: 0,
      productionHours: 0,
      productionHourCostNet: 0,
      installationNet: 0,
      transportNet: 0,
      boughtWorktopNet: 0,
      reservePercent: 0,
      minimumMarginPercent: 20,
      targetMarginPercent: 25,
      minimumProfitNet: 0,
      minimumOrderNet: 0,
      vatPercent: 0,
      roundGrossTo: 0,
    }),
  );
  assert.equal(r.minimumNet, 1250);
  assert.equal(r.targetNet, 1333.34);
  assert.equal(r.net, 1333.34);
  assert.ok(r.marginPercent >= 25);
});
test("high material values are capped without hiding long hours or fixed-cost minimums", () => {
  const r = fairQuote(
    base({
      materialsNet: 30000,
      preparationNet: 0,
      productionHours: 8,
      productionHourCostNet: 70,
      boughtWorktopNet: 0,
    }),
  );
  assert.equal(r.adjustment, "cap");
  assert.ok(r.gross < r.multiplier.gross);
  assert.ok(r.profitNet > 0);
  const minimum = fairQuote(
    base({ minimumProfitNet: 20000, minimumOrderNet: 50000 }),
  );
  assert.ok(minimum.net >= 50000);
  assert.ok(minimum.profitNet >= 20000);
});
test("overhead, installation, delivery and a one-time reserve are accounted for, VAT applies last", () => {
  const r = fairQuote(
    base({ overheadNet: 400, vatPercent: 8, roundGrossTo: 0 }),
  );
  assert.equal(r.costs.baseNet, 10730);
  assert.equal(r.costs.reserveNet, 321.9);
  assert.equal(Math.round((r.net + r.vat) * 100), Math.round(r.gross * 100));
});
test("invalid or misleading inputs are rejected rather than converted into a plausible quote", () => {
  for (const x of [
    base({ materialsNet: NaN }),
    base({ productionHours: 2, productionHourCostNet: 0 }),
    base({ materialsNet: -1 }),
    base({ minimumMarginPercent: 30, targetMarginPercent: 20 }),
    base({ materialMultiplier: 0 }),
    base({ vatPercent: Infinity }),
  ])
    assert.throws(() => fairQuote(x));
  assert.equal(
    fairQuoteSchema.safeParse({
      materialsNet: 0,
      productionHours: 0,
      productionHourCostNet: 0,
    }).success,
    false,
  );
});
test("cost and margin invariants hold across realistic and extreme jobs", () => {
  for (const materialsNet of [100, 1000, 5000, 50000])
    for (const productionHours of [1, 12, 60])
      for (const vatPercent of [0, 8, 23])
        for (const roundGrossTo of [0, 1, 50]) {
          const r = fairQuote(
            base({ materialsNet, productionHours, vatPercent, roundGrossTo }),
          );
          assert.ok(r.profitNet >= r.input.minimumProfitNet);
          assert.ok(r.marginPercent + 1e-9 >= r.input.minimumMarginPercent);
          assert.ok(r.net >= r.minimumNet);
          assert.ok(r.gross >= r.net);
          assert.ok(Number.isFinite(r.gross));
        }
});
