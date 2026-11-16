import { test } from "node:test";
import assert from "node:assert/strict";
import {
  drawerBridge,
  drawerSource,
  drawerReturnLink,
  drawerQuery,
} from "./model";
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
  const source = drawerSource(href.split("?")[1]);
  assert.deepEqual(source, { cabinet: b.modul.id, front: front.kod });
  assert.equal(
    new URLSearchParams(drawerReturnLink(source).split("?")[1]).get("szafka"),
    b.modul.id,
  );
});

test("drawer context accepts only paired, typed source identifiers and canonical calculator fields", () => {
  const query = "lw=564&nl=500&width=596&height=240&system=amix";
  assert.equal(drawerSource(query), undefined);
  assert.equal(drawerReturnLink(), "#/kreator-kuchni");
  assert.equal(drawerQuery(`${query}&unrelated=secret`), query);
  for (const suffix of [
    "&cabinet=bad&front=FRONT-SZ01",
    "&cabinet=00000000-0000-4000-8000-000000000001",
    "&front=../external",
    "&front=FRONT-SZ01",
  ])
    assert.throws(() => drawerSource(query + suffix));
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
