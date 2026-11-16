import test from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenIssues,
  kitchenModules,
  type KitchenInput,
} from "./kitchen-configuration.js";
import { kitchenFreeGaps, fillKitchenGap } from "./kitchen-runs.js";
import { addKitchenBlindCorner } from "./kitchen-corner.js";
import { openingOverlaps } from "./kitchen-room.js";
import { suggestKitchen } from "./kitchen-suggestion.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { readDraft, brief } from "../../web/src/v2/planner/model.js";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const item = (n: number, catalogId = "base-shelves-600", wall = "a") => ({
  id: uuid(n),
  catalogId,
  wall,
});
const draft = (extra: object = {}): KitchenInput =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 3600,
    depth: 3000,
    height: 2600,
    items: [],
    ...extra,
  });
const feature = (extra: object = {}) => ({
  id: uuid(90),
  kind: "window",
  wall: "a",
  x: 800,
  width: 1200,
  bottom: 1000,
  height: 1000,
  ...extra,
});
const ids = () => {
  let n = 200;
  return () => uuid(++n);
};

test("room features share strict validation and survive customer export and handoff", () => {
  const d = draft({ features: [feature()] });
  const restored = readDraft(JSON.stringify({ version: 1, ...d }));
  assert.deepEqual(restored.features, d.features);
  assert.match(brief(restored), /Okno: ściana A.*800 mm/);
  for (const f of [
    feature({ x: 3000 }),
    feature({ wall: "c" }),
    feature({ kind: "water" }),
    feature({ kind: "door", bottom: 30 }),
  ])
    assert.throws(() => draft({ features: [f] }));
});
test("window leaves the low run usable but reserves upper space and blocks colliding prices", () => {
  const d = draft({
    items: [item(1), item(2, "wall-shelves-600")],
    features: [feature({ x: 0 })],
  });
  assert.equal(openingOverlaps(kitchenModules(d)[0], d.features![0]), false);
  assert.equal(openingOverlaps(kitchenModules(d)[1], d.features![0]), true);
  assert.ok(kitchenIssues(d).some((s) => s.includes("koliduje")));
  assert.equal(calculateKitchenEstimate(d).estimate.gross, null);
  const empty = draft({ features: [feature({ x: 0 })] });
  assert.equal(kitchenFreeGaps(empty, "a", "base")[0].start, 0);
  assert.equal(kitchenFreeGaps(empty, "a", "wall")[0].start, 1200);
});
test("chosen item fills an interior gap, preserves both anchors and leaves an honest remainder", () => {
  const d = draft({ items: [item(1), { ...item(2), gapBefore: 900 }] });
  const gap = kitchenFreeGaps(d, "a", "base")[0];
  const items = fillKitchenGap(
    d,
    "a",
    "base",
    gap.id,
    ids(),
    "storage",
    "base-drawers-600",
  );
  const mods = kitchenModules({ ...d, items });
  assert.equal(mods.find((m) => m.id === uuid(2))!.pozycjaXMM, 1500);
  assert.equal(mods.find((m) => m.konstrukcja === "drawers")!.pozycjaXMM, 600);
  assert.ok(
    kitchenFreeGaps({ ...d, items }, "a", "base").some(
      (g) => g.start === 1200 && g.width === 300,
    ),
  );
  const narrow = draft({ items: [item(1), { ...item(2), gapBefore: 500 }] });
  assert.throws(
    () =>
      fillKitchenGap(
        narrow,
        "a",
        "base",
        kitchenFreeGaps(narrow, "a", "base")[0].id,
        ids(),
        "storage",
        "dishwasher-front-600",
      ),
    /AGD/,
  );
  const custom = fillKitchenGap(
    narrow,
    "a",
    "base",
    kitchenFreeGaps(narrow, "a", "base")[0].id,
    ids(),
    "storage",
    "base-shelves-600",
  );
  assert.equal(custom[1].width, 500);
  assert.deepEqual(narrow.items[1].gapBefore, 500);
});
test("functional proposal trims storage around windows and doors without consuming trial IDs", () => {
  const water = draft({
    width: 4800,
    planning: { waterWall: "a", sinkCenter: 1000, dishwasher: "600" },
    features: [
      feature({ kind: "water", x: 2100, width: 0, height: 0, bottom: 600 }),
    ],
  });
  const waterItems = suggestKitchen(water, ids());
  const sink = kitchenModules({ ...water, items: waterItems }).find(
    (m) => m.konstrukcja === "sink",
  )!;
  assert.equal(sink.pozycjaXMM + sink.szerokoscMM / 2, 2100);
  for (const f of [
    feature(),
    feature({ kind: "door", x: 3500, width: 900, bottom: 0, height: 2100 }),
  ]) {
    const d = draft({ width: 4800, features: [f] });
    const items = suggestKitchen(d, ids());
    assert.deepEqual(kitchenIssues({ ...d, items }), []);
    assert.ok(
      kitchenModules({ ...d, items }).every(
        (m) => !openingOverlaps(m, d.features![0]),
      ),
    );
    assert.ok(items.some((i) => i.catalogId === "base-sink-600"));
    assert.ok(items.some((i) => i.catalogId === "wall-hood-600"));
  }
  let consumed = 0;
  assert.throws(() =>
    suggestKitchen(
      draft({
        width: 1800,
        features: [
          feature({ kind: "door", x: 0, width: 900, bottom: 0, height: 2100 }),
        ],
      }),
      () => {
        consumed++;
        return uuid(consumed);
      },
    ),
  );
  assert.equal(consumed, 0);
});
test("real blind corner replaces only storage at a turn and is built and priced with correct front", () => {
  const d = draft({
    layout: "l",
    items: Array.from({ length: 6 }, (_, i) => item(i + 1)),
  });
  const before = structuredClone(d);
  const items = addKitchenBlindCorner(d, "a", ids());
  const corner = kitchenModules({ ...d, items }).find(
    (m) => m.konstrukcja === "blindCorner",
  )!;
  assert.equal(corner.pozycjaXMM, 2500);
  assert.equal(corner.konfiguracja.stronaDrzwiNaroznika, "lewa");
  const result = calculateKitchenEstimate({ ...d, items });
  assert.equal(result.estimate.status, "estimated");
  assert.ok(
    result.built
      .find((b) => b.modul.id === corner.id)!
      .elementy.some((e) => e.kod === "ZASLEPKA"),
  );
  assert.ok(result.estimate.notes.some((n) => n.includes("są w cenie")));
  assert.deepEqual(d, before);
  assert.throws(() => addKitchenBlindCorner(draft(), "a", ids()), /L lub U/);
  assert.throws(
    () =>
      addKitchenBlindCorner(
        draft({
          layout: "l",
          items: [
            ...Array.from({ length: 5 }, (_, i) => item(i + 1)),
            item(8, "base-oven-600"),
          ],
        }),
        "a",
        ids(),
      ),
    /AGD/,
  );
});
