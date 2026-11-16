import test from "node:test";
import assert from "node:assert/strict";
import { drawerStackHeights } from "./drawer-front-layout.js";
import {
  kitchenInputSchema,
  kitchenFitWidth,
} from "./kitchen-configuration.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import {
  toAnalysis,
  readDraft,
  brief,
} from "../../web/src/v2/planner/model.js";
import { drawerCalculatorLink } from "../../web/src/v2/planner/KitchenCabinetEditor.js";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const draft = () =>
  readDraft(
    JSON.stringify({
      version: 1,
      layout: "straight",
      width: 3600,
      depth: 2400,
      height: 2600,
      finish: "oak",
      items: [
        { id: id(1), catalogId: "base-drawers-600", wall: "a", drawers: 3 },
      ],
    }),
  );
test("top locks leave automatic fronts equal and retain the exact height with gaps", () => {
  assert.deepEqual(
    drawerStackHeights(720, 3, 2, {
      mode: "custom",
      heightsFromTop: [140, null, null],
    }),
    [140, 286, 286],
  );
  const heights = drawerStackHeights(720, 3, 2, {
    mode: "custom",
    heightsFromTop: [140.5, null, null],
  });
  assert.equal(heights[0], 140.5);
  assert.ok(Math.abs(heights[1] - heights[2]) <= 0.100001);
  assert.ok(Math.abs(heights.reduce((a, b) => a + b) + 8 - 720) < 1e-7);
});
test("equal and graduated stacks conserve all height at the builder precision", () => {
  for (let count = 2; count <= 6; count++)
    for (const gap of [0, 2, 3])
      for (const mode of ["equal", "graduated"] as const) {
        const result = drawerStackHeights(720, count, gap, { mode });
        assert.ok(result.every((v) => v >= 60));
        assert.ok(
          Math.abs(result.reduce((a, b) => a + b) + gap * (count + 1) - 720) <
            1e-7,
        );
        if (mode === "graduated") assert.ok(result[0] < result[count - 1]);
      }
});
test("impossible heights and malformed plans are rejected rather than replaced", () => {
  for (const heightsFromTop of [
    [650, null, null],
    [59, null, null],
    [140.55, null, null],
    [140, null],
    [140, 200, 200],
    [NaN, null, null],
  ])
    assert.throws(() =>
      drawerStackHeights(720, 3, 2, { mode: "custom", heightsFromTop }),
    );
  assert.throws(() =>
    drawerStackHeights(720, 3, 2, {
      mode: "equal",
      heightsFromTop: [140, null, null],
    }),
  );
});
test("schema, restored draft, geometry, offer and handoff share the same actual fronts", () => {
  const d = draft();
  d.items[0].drawerFronts = {
    mode: "custom",
    heightsFromTop: [140, null, null],
  };
  const restored = readDraft(JSON.stringify(d));
  const built = toAnalysis(restored).zbudowane[0];
  const tops = built.elementy
    .filter((e) => e.kod.startsWith("FRONT-SZ"))
    .sort((a, b) => b.y - a.y);
  assert.deepEqual(
    tops.map((f) => f.wys),
    [140, 286, 286],
  );
  const server = calculateKitchenEstimate(restored);
  assert.equal(server.estimate.status, "estimated");
  assert.deepEqual(server.built[0].elementy, built.elementy);
  assert.match(brief(restored), /od góry: 140 \/ 286 \/ 286 mm/);
  const link = drawerCalculatorLink(restored, built, tops[0].kod)!;
  assert.equal(new URLSearchParams(link.split("?")[1]).get("height"), "140");
  assert.equal(drawerCalculatorLink(restored, built, "missing"), null);
  assert.deepEqual(draft().items[0].drawerFronts, undefined);
});
test("public schema refuses drawer plans on shelf cabinets and mismatched drawer counts", () => {
  const d = draft();
  for (const item of [
    {
      ...d.items[0],
      catalogId: "base-shelves-600",
      drawers: undefined,
      drawerFronts: { mode: "equal" },
    },
    {
      ...d.items[0],
      drawerFronts: { mode: "custom", heightsFromTop: [140, null] },
    },
    {
      ...d.items[0],
      drawerFronts: { mode: "custom", heightsFromTop: [700, null, null] },
    },
  ])
    assert.throws(() => kitchenInputSchema.parse({ ...d, items: [item] }));
});
test("width fitting considers only the same row and does not mutate appliance dimensions", () => {
  const d = draft();
  d.width = 3650;
  d.items = Array.from({ length: 6 }, (_, i) => ({
    id: id(i + 1),
    wall: "a",
    catalogId: i === 1 ? "dishwasher-front-600" : "base-shelves-600",
  }));
  d.items.push({ id: id(20), wall: "a", catalogId: "wall-shelves-600" });
  const before = structuredClone(d);
  assert.equal(kitchenFitWidth(d, id(1)), 650);
  assert.throws(() => kitchenFitWidth(d, id(2)), /AGD/);
  assert.throws(() => kitchenFitWidth(d, id(20)), /200–1200/);
  assert.deepEqual(d, before);
});
test("L and U width fitting reserve the existing 650 mm corner", () => {
  for (const layout of ["l", "u"] as const) {
    const d = draft();
    d.layout = layout;
    d.depth = 2500;
    d.returnLength = 2500;
    d.items = [1, 2, 3].map((n) => ({
      id: id(n),
      wall: layout === "u" ? "c" : "b",
      catalogId: "base-shelves-600",
    }));
    assert.equal(kitchenFitWidth(d, id(1)), 650);
  }
});
