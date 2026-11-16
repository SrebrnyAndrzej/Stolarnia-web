import test from "node:test";
import assert from "node:assert/strict";
import {
  customerKitchenCatalog,
  kitchenInputSchema,
  kitchenModules,
  kitchenFitWidth,
  kitchenIssues,
  type KitchenInput,
} from "./kitchen-configuration.js";
import { fillKitchenRun, kitchenRunSpace } from "./kitchen-run.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { zbudujProjektWyceny } from "./pricing.js";
import { readDraft, toAnalysis } from "../../web/src/v2/planner/model.js";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const nextId = () => {
  let n = 100;
  return () => uuid(++n);
};
const draft = (): KitchenInput =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 3650,
    depth: 2400,
    height: 2600,
    items: [{ id: uuid(1), catalogId: "base-shelves-600", wall: "a" }],
    finish: "oak",
  });

test("gaps move following items in just the same row, survive import and do not create panels or worktops", () => {
  const d = draft();
  d.items = [
    { ...d.items[0], gapBefore: 100 },
    { id: uuid(2), catalogId: "wall-shelves-600", wall: "a", gapBefore: 20 },
    { id: uuid(3), catalogId: "base-shelves-600", wall: "a", gapBefore: 50 },
  ];
  assert.deepEqual(
    kitchenModules(d).map((m) => m.pozycjaXMM),
    [100, 20, 750],
  );
  const restored = readDraft(JSON.stringify({ version: 1, ...d }));
  assert.equal(restored.items[2].gapBefore, 50);
  const priced = calculateKitchenEstimate(d);
  const withoutGaps = calculateKitchenEstimate({
    ...d,
    items: d.items.map((i) => ({ ...i, gapBefore: 0 })),
  });
  assert.equal(priced.estimate.gross, withoutGaps.estimate.gross);
  assert.deepEqual(
    priced.built.map((b) => b.elementy),
    withoutGaps.built.map((b) => b.elementy),
  );
  assert.match(priced.estimate.notes.join(" "), /Przerwy pozostają puste/);
});

test("filler widths have a separate range and build a real front-material panel", () => {
  const d = draft();
  for (const width of [20, 50, 300]) {
    d.items = [{ id: uuid(1), catalogId: "base-filler-50", wall: "a", width }];
    const input = kitchenInputSchema.parse(d),
      result = calculateKitchenEstimate(input);
    assert.equal(
      result.built[0].elementy.filter((e) => e.rola === "filler").length,
      1,
    );
    assert.equal(
      result.built[0].elementy.find((e) => e.rola === "filler")!.szer,
      width,
    );
    assert.equal(
      result.built[0].elementy.find((e) => e.rola === "filler")!.materialRola,
      "front",
    );
    assert.equal(result.built[0].okucia.length, 0);
    assert.ok(!result.built[0].elementy.some((e) => e.kod === "BOK-L"));
  }
  for (const [catalogId, width] of [
    ["base-filler-50", 19],
    ["wall-filler-50", 301],
    ["base-shelves-600", 50],
  ] as const)
    assert.throws(() =>
      kitchenInputSchema.parse({
        ...d,
        items: [{ id: uuid(1), wall: "a", catalogId, width }],
      }),
    );
});

test("filler material and top count in estimate without a cabinet unit or hanging hardware", () => {
  const d = draft();
  d.items.push({ id: uuid(2), catalogId: "wall-filler-50", wall: "a" });
  const { built, estimate } = calculateKitchenEstimate(d);
  const parts = built.map((zm) => ({
    zm,
    materialy: { korpus: "white", front: "white", plecy: "hdf", blat: "top" },
  }));
  const all = zbudujProjektWyceny("Test", parts, []),
    base = zbudujProjektWyceny("Test", parts.slice(0, 1), []);
  assert.equal(all.liczbaModulow, 1);
  assert.equal(all.liczbaModulowWiszacych, 0);
  assert.equal(all.liczbaZawiasow, base.liczbaZawiasow);
  assert.equal(all.liczbaGodzinProdukcji, base.liczbaGodzinProdukcji);
  assert.ok(all.powierzchniaFrontowM2 > base.powierzchniaFrontowM2);
  assert.match(estimate.scope[0].description, /Szafki: 1; blendy: 1/);
  const floor = calculateKitchenEstimate({
    ...d,
    items: [d.items[0], { ...d.items[1], catalogId: "base-filler-50" }],
  }).built;
  assert.ok(
    floor[1].elementy.some((e) => e.rola === "worktop" && e.szer === 50),
  );
});

test("run fill preserves earlier objects and gaps; divides the tail in whole millimetres", () => {
  const d = draft();
  d.width = 3651;
  d.items[0].gapBefore = 50;
  const before = structuredClone(d),
    items = fillKitchenRun(d, "a", "base", nextId());
  assert.deepEqual(d, before);
  assert.deepEqual(items[0], d.items[0]);
  const candidate = { ...d, items },
    space = kitchenRunSpace(candidate, "a", "base");
  assert.equal(space.remaining, 0);
  assert.equal(space.end, 3651);
  assert.ok(
    items
      .slice(1)
      .every(
        (i) => i.width! >= 200 && i.width! <= 600 && Number.isInteger(i.width),
      ),
  );
  assert.deepEqual(kitchenIssues(candidate), []);
  assert.doesNotThrow(() => kitchenInputSchema.parse(candidate));
});

test("a small tail becomes a matching upper filler and is shared by UI and server geometry", () => {
  const d = draft();
  d.width = 1850;
  d.items = [1, 2, 3].map((n) => ({
    id: uuid(n),
    catalogId: "wall-shelves-600",
    wall: "a",
    height: 900,
  }));
  d.items = fillKitchenRun(d, "a", "wall", nextId());
  assert.equal(d.items[3].catalogId, "wall-filler-50");
  assert.equal(d.items[3].width, 50);
  assert.equal(d.items[3].height, 900);
  assert.equal(kitchenRunSpace(d, "a", "wall").remaining, 0);
  const client = toAnalysis(readDraft(JSON.stringify({ version: 1, ...d }))),
    server = calculateKitchenEstimate(d);
  assert.deepEqual(
    client.zbudowane.map((b) => b.elementy),
    server.built.map((b) => b.elementy),
  );
});

test("invalid or completed runs and capacity limits never partly replace a draft", () => {
  for (const width of [1800, 1810]) {
    const d = draft();
    d.width = width;
    d.items = [1, 2, 3].map((n) => ({
      id: uuid(n),
      catalogId: "base-shelves-600",
      wall: "a",
    }));
    const before = structuredClone(d);
    assert.throws(() => fillKitchenRun(d, "a", "base", nextId()));
    assert.deepEqual(d, before);
  }
  const d = draft();
  d.items = Array.from({ length: 23 }, (_, i) => ({
    id: uuid(i + 1),
    catalogId: "wall-filler-50",
    width: 20,
    wall: "a",
  }));
  assert.throws(
    () => fillKitchenRun(d, "a", "base", nextId()),
    /maksymalnie 24/,
  );
});

test("L/U corners and existing tall cabinets remain constraints", () => {
  for (const layout of ["l", "u"] as const) {
    const d = draft();
    d.layout = layout;
    d.items = [];
    d.items = fillKitchenRun(d, layout === "u" ? "c" : "b", "base", nextId());
    assert.equal(kitchenModules(d)[0].pozycjaXMM, 650);
    assert.equal(
      kitchenRunSpace(d, layout === "u" ? "c" : "b", "base").remaining,
      0,
    );
  }
  const d = draft();
  d.items = [
    {
      id: uuid(1),
      catalogId: customerKitchenCatalog.find((m) => m.category === "tall")!.id,
      wall: "a",
    },
  ];
  const withUpper = { ...d, items: fillKitchenRun(d, "a", "wall", nextId()) };
  assert.deepEqual(kitchenIssues(withUpper), []);
  assert.equal(kitchenModules(withUpper)[0].pozycjaXMM, 0);
  assert.ok(
    kitchenModules(withUpper)
      .filter((m) => m.kategoria === "wall")
      .every((m) => m.pozycjaXMM >= kitchenModules(d)[0].szerokoscMM),
  );
});

test("fit width subtracts explicit gaps and applies filler width limits", () => {
  const d = draft();
  d.width = 3650;
  d.items = [1, 2, 3, 4, 5, 6].map((n) => ({
    id: uuid(n),
    catalogId: "base-shelves-600",
    wall: "a",
    gapBefore: n === 1 ? 50 : 0,
  }));
  assert.equal(kitchenFitWidth(d, uuid(1)), 600);
  d.items = [
    ...d.items.slice(0, 5),
    { id: uuid(6), catalogId: "base-filler-50", wall: "a" },
  ];
  assert.throws(() => kitchenFitWidth(d, uuid(6)), /20–300/);
});
