import { test } from "node:test";
import assert from "node:assert/strict";
import { drawerBridge } from "./model";
import { drawerCalculatorLink } from "../planner/KitchenCabinetEditor";
import { newDraft, toAnalysis } from "../planner/model";
test("kitchen bridge transfers the actual first front and usable drawer depth", () => {
  const draft = {
    ...newDraft(),
    items: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        catalogId: "base-drawers-600",
        wall: "a" as const,
        width: 800,
        drawers: 4,
      },
    ],
  };
  const b = toAnalysis(draft).zbudowane[0];
  const href = drawerCalculatorLink(draft, b)!;
  const form = drawerBridge(href.split("?")[1])!;
  assert.equal(form.lw, "764");
  assert.equal(form.nl, "500");
  const front = b.elementy.find(
    (e) => e.rola === "front" && e.kod.startsWith("FRONT-SZ"),
  )!;
  assert.equal(form.frontZewSzer, String(front.szer));
  assert.equal(form.frontZewWys, String(front.wys));
  assert.equal(form.otworZew, "");
  assert.equal(form.otworWew, "");
  assert.equal(form.rozstaw, false);
});
test("malformed URL measurements do not become calculator data", () => {
  assert.equal(drawerBridge(""), undefined);
  for (const q of [
    "lw=-1&nl=500&width=596&height=200&system=amix",
    "lw=564&nl=Infinity&width=596&height=200&system=amix",
    "lw=564&nl=500&width=596&height=200&system=unknown",
  ])
    assert.throws(() => drawerBridge(q));
});
