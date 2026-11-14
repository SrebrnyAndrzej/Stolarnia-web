import test from "node:test";
import assert from "node:assert/strict";
import { dimensionExpression as calc } from "./dimension-expression.js";
test("dimension arithmetic respects precedence, signs, decimal comma and workshop symbols", () => {
  assert.equal(calc("(600-2*18)/3"), 188);
  assert.equal(calc("350,5 + 2 × 18"), 386.5);
  assert.equal(calc("−18 + 600 ÷ 2"), 282);
  assert.equal(calc("-(-18)"), 18);
  assert.equal(calc("100/3"), 33.333333);
});
test("invalid and unbounded formulas cannot execute code or produce misleading results", () => {
  for (const s of [
    "",
    " ",
    "600-",
    "(600",
    "2(18)",
    "1/0",
    "0/0",
    "1e3",
    "Infinity",
    "NaN",
    "1;alert(1)",
    "globalThis.x=1",
    "2**3",
    "18 mm",
    "1.2.3",
    "1,,2",
    "9".repeat(161),
    "(".repeat(26) + "1" + ")".repeat(26),
    "1000000000*2",
  ])
    assert.throws(() => calc(s), undefined, s);
});
