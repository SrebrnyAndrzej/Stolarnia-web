import test from "node:test";
import assert from "node:assert/strict";
import {
  detectKitchenRuns,
  fillKitchenGap,
  fillKitchenTier,
  kitchenFreeGaps,
  planKitchenSurround,
  type SurroundOptions,
} from "./kitchen-runs.js";
import {
  kitchenInputSchema,
  kitchenIssues,
  kitchenModules,
  kitchenOuterBounds,
  type KitchenInput,
} from "./kitchen-configuration.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { readDraft, toAnalysis } from "../../web/src/v2/planner/model.js";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const item = (id: number, catalogId = "base-shelves-600", gapBefore = 0) => ({
  id: uuid(id),
  catalogId,
  wall: "a" as const,
  gapBefore,
});
const draft = (items = [item(1), item(2)]): KitchenInput =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 3600,
    depth: 2400,
    height: 2600,
    finish: "oak",
    items,
  });
const ids = () => {
  let i = 100;
  return () => uuid(++i);
};
const options = (
  overrides: Partial<SurroundOptions> = {},
): SurroundOptions => ({
  left: true,
  right: true,
  top: false,
  bottom: false,
  projection: 20,
  keepWidth: true,
  ...overrides,
});

test("whole-tier fill handles interior and end gaps atomically, preserving existing positions", () => {
  const d = draft([item(1), item(2, "base-shelves-600", 50)]);
  d.width = 1800;
  const before = structuredClone(d);
  const result = fillKitchenTier(d, "a", "base", ids());
  assert.equal(result.items.length, 4);
  assert.ok(
    result.items.some(
      (i) => i.catalogId === "base-filler-50" && i.width === 50,
    ),
  );
  for (const old of kitchenModules(d))
    assert.equal(
      kitchenModules({ ...d, items: result.items }).find(
        (m) => m.id === old.id,
      )!.pozycjaXMM,
      old.pozycjaXMM,
    );
  assert.deepEqual(
    kitchenFreeGaps({ ...d, items: result.items }, "a", "base"),
    [],
  );
  assert.deepEqual(d, before);
  const full = draft(
    Array.from({ length: 23 }, (_, n) => ({
      ...item(n + 1),
      width: 200,
      gapBefore: n === 1 ? 50 : 0,
    })),
  );
  full.width = 5000;
  const original = structuredClone(full);
  assert.throws(() => fillKitchenTier(full, "a", "base", ids()), /24/);
  assert.deepEqual(full, original);
  assert.throws(
    () =>
      fillKitchenGap(
        d,
        "a",
        "base",
        kitchenFreeGaps(d, "a", "base")[0].id,
        () => uuid(1),
      ),
    /identyfikatory/,
  );
});

test("runs distinguish base, tall and upper, split at physical gaps and dimensional changes", () => {
  const d = draft([
    item(1, "tall-refrigerator-600"),
    item(2),
    item(3),
    item(4, "wall-shelves-600", 600),
    item(5, "wall-shelves-600"),
  ]);
  const runs = detectKitchenRuns(d);
  assert.deepEqual(
    runs.map((r) => [r.tier, r.modules.length, r.start, r.end]),
    [
      ["base", 2, 600, 1800],
      ["wall", 2, 600, 1800],
      ["tall", 1, 0, 600],
    ],
  );
  assert.equal(runs[0].leftExposed, false);
  d.items[2].gapBefore = 100;
  assert.equal(detectKitchenRuns(d).filter((r) => r.tier === "base").length, 2);
  d.items[2] = { ...d.items[2], gapBefore: 0, height: 800 };
  assert.equal(detectKitchenRuns(d).filter((r) => r.tier === "base").length, 2);
  d.items[2] = { ...d.items[2], height: 720, depth: 600 };
  assert.equal(detectKitchenRuns(d).filter((r) => r.tier === "base").length, 2);
});

test("internal gap fill consumes only that gap and preserves all other module positions", () => {
  const d = draft([
    item(1),
    item(2, "base-shelves-600", 300),
    item(3, "wall-shelves-600", 900),
  ]);
  const snapshot = structuredClone(d),
    gap = kitchenFreeGaps(d, "a", "base")[0];
  assert.equal(gap.width, 300);
  const items = fillKitchenGap(d, "a", "base", gap.id, ids()),
    modules = kitchenModules({ ...d, items });
  assert.deepEqual(d, snapshot);
  assert.equal(items[1].width, 300);
  assert.equal(modules.find((m) => m.id === uuid(2))!.pozycjaXMM, 900);
  assert.equal(modules.find((m) => m.id === uuid(3))!.pozycjaXMM, 900);
  assert.equal(items.find((i) => i.id === uuid(2))!.gapBefore, 0);
  assert.deepEqual(kitchenIssues({ ...d, items }), []);
});

test("upper gap fill avoids tall appliances even without an explicit gap in the upper row", () => {
  const d = draft([item(1), item(2, "tall-refrigerator-600")]);
  const gaps = kitchenFreeGaps(d, "a", "wall");
  const nextId = ids();
  assert.deepEqual(
    gaps.map((g) => [g.start, g.end]),
    [
      [0, 600],
      [1200, 3600],
    ],
  );
  d.items = fillKitchenGap(d, "a", "wall", gaps[1].id, nextId);
  const upper = kitchenModules(d).filter((m) => m.kategoria === "wall");
  assert.equal(upper[0].pozycjaXMM, 1200);
  assert.deepEqual(kitchenIssues(d), []);
  const first = kitchenFreeGaps(d, "a", "wall")[0];
  d.items = fillKitchenGap(d, "a", "wall", first.id, nextId);
  assert.deepEqual(kitchenIssues(d), []);
  assert.equal(
    kitchenModules(d).find((m) => m.id === upper[0].id)!.pozycjaXMM,
    1200,
  );
});

test("tall fill uses pantry cabinets and tall narrow gaps suggest actual matching filler plates", () => {
  const d = draft([item(1, "tall-pantry-600")]);
  d.width = 1850;
  d.items = fillKitchenGap(
    d,
    "a",
    "tall",
    kitchenFreeGaps(d, "a", "tall")[0].id,
    ids(),
  );
  assert.equal(d.items.length, 4);
  assert.ok(d.items.every((i) => i.catalogId === "tall-pantry-600"));
  const narrow = draft([
    item(1, "tall-pantry-600"),
    item(2, "tall-pantry-600"),
    item(3, "tall-pantry-600"),
  ]);
  narrow.width = 1850;
  narrow.items = fillKitchenGap(
    narrow,
    "a",
    "tall",
    kitchenFreeGaps(narrow, "a", "tall")[0].id,
    ids(),
  );
  const last = calculateKitchenEstimate(narrow).built.at(-1)!;
  assert.equal(last.modul.katalogId, "tall-filler-50");
  assert.equal(last.elementy[0].wys, 2070);
  assert.equal(last.elementy[0].szer, 50);
  assert.equal(last.okucia.length, 0);
});

test("surround reserves side thickness inside the run and never resizes an appliance", () => {
  const d = draft([item(1), item(2), item(3, "tall-refrigerator-600")]);
  const before = structuredClone(d),
    run = detectKitchenRuns(d)[0];
  const plan = planKitchenSurround(d, run.id, options());
  assert.deepEqual(d, before);
  assert.equal(plan.items[1].width, 564);
  const modules = kitchenModules({ ...d, items: plan.items });
  assert.equal(modules[0].pozycjaXMM, 18);
  assert.equal(kitchenOuterBounds(modules[1]).end, 1200);
  assert.equal(modules[2].pozycjaXMM, 1200);
  assert.equal(modules[2].szerokoscMM, 600);
  assert.equal(plan.changes.length, 1);
  const removed = planKitchenSurround(
    { ...d, items: plan.items },
    run.id,
    options({ left: false, right: false }),
  );
  assert.equal(
    kitchenModules({ ...d, items: removed.items })[1].szerokoscMM,
    600,
  );
});

test("decorative sides and caps are physical plates 20 mm in front of the chosen front, shared by UI, price and import", () => {
  for (const front of ["laminate", "lacquer"] as const) {
    const d = draft([item(1, "wall-shelves-600"), item(2, "wall-shelves-600")]);
    d.quote.front = front;
    const plan = planKitchenSurround(
      d,
      detectKitchenRuns(d)[0].id,
      options({ top: true, bottom: true }),
    );
    const configured = { ...d, items: plan.items },
      result = calculateKitchenEstimate(configured),
      thickness = front === "lacquer" ? 19 : 18;
    const panels = result.built
      .flatMap((b) => b.elementy)
      .filter((e) => e.kod.startsWith("OSLONA-"));
    assert.equal(panels.length, 6);
    for (const e of panels) {
      assert.equal(e.z, -(thickness + 2 + 20));
      assert.equal(e.gl, 320 + thickness + 2 + 20);
      assert.equal(e.materialRola, "front");
    }
    assert.equal(panels.find((e) => e.kod === "OSLONA-BOK-L")!.szer, thickness);
    assert.match(
      result.estimate.scope[0].description,
      /Boki i wieńce osłonowe: 6/,
    );
    assert.ok(
      result.estimate.gross! > calculateKitchenEstimate(d).estimate.gross!,
    );
    const restored = readDraft(JSON.stringify({ version: 1, ...configured }));
    assert.deepEqual(
      toAnalysis(restored).zbudowane.map((b) => b.elementy),
      result.built.map((b) => b.elementy),
    );
    const again = planKitchenSurround(
      configured,
      detectKitchenRuns(configured)[0].id,
      options({ top: true, bottom: true }),
    );
    assert.deepEqual(again.items, configured.items);
  }
});

test("base sides reach the floor and the worktop includes the side thickness", () => {
  const d = draft();
  const items = planKitchenSurround(
    d,
    detectKitchenRuns(d)[0].id,
    options(),
  ).items;
  const result = calculateKitchenEstimate({ ...d, items });
  const left = result.built[0].elementy.find((e) => e.kod === "OSLONA-BOK-L")!;
  assert.equal(left.y, -100);
  assert.equal(left.wys, 820);
  assert.equal(
    result.built[0].elementy.find((e) => e.kod === "BLAT")!.szer,
    618,
  );
});

test("stale gaps, impossible sizes, ceiling and illegal covers are rejected without partial changes", () => {
  const d = draft(),
    before = structuredClone(d),
    run = detectKitchenRuns(d)[0];
  assert.throws(
    () => fillKitchenGap(d, "a", "base", "old-gap", ids()),
    /zmieniła/,
  );
  assert.throws(
    () => planKitchenSurround(d, run.id, options({ projection: 101 })),
    /0–100/,
  );
  assert.throws(
    () => planKitchenSurround(d, run.id, options({ top: true })),
    /blat/,
  );
  assert.throws(
    () => planKitchenSurround(d, run.id, options({ bottom: true })),
    /wiszących/,
  );
  const agd = draft([item(1, "tall-refrigerator-600")]);
  assert.throws(
    () => planKitchenSurround(agd, detectKitchenRuns(agd)[0].id, options()),
    /AGD/,
  );
  const a = planKitchenSurround(
    agd,
    detectKitchenRuns(agd)[0].id,
    options({ keepWidth: false }),
  );
  assert.equal(kitchenModules({ ...agd, items: a.items })[0].szerokoscMM, 600);
  const ceiling = draft([{ ...item(1, "wall-shelves-600"), height: 900 }]);
  ceiling.height = 2300;
  assert.throws(
    () =>
      planKitchenSurround(
        ceiling,
        detectKitchenRuns(ceiling)[0].id,
        options({ top: true }),
      ),
    /wysokość/,
  );
  assert.deepEqual(d, before);
});

test("L and U free areas retain the corner reserve and fill only the selected wall", () => {
  for (const layout of ["l", "u"] as const) {
    const d = draft([]);
    d.layout = layout;
    const wall = layout === "u" ? "c" : "b";
    const gap = kitchenFreeGaps(d, wall, "tall")[0];
    assert.equal(gap.start, 650);
    const items = fillKitchenGap(d, wall, "tall", gap.id, ids());
    assert.ok(items.every((i) => i.wall === wall));
    assert.equal(
      kitchenOuterBounds(kitchenModules({ ...d, items })[0]).start,
      650,
    );
    assert.deepEqual(kitchenIssues({ ...d, items }), []);
  }
});
