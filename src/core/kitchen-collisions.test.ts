import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenModules,
  kitchenIssues,
  suggestKitchen,
  type KitchenInput,
} from "./kitchen-configuration.js";
import { kitchenCollisions, kitchenPlanningEnd } from "./kitchen-collisions.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { addKitchenBlindCorner } from "./kitchen-corner.js";
import { kitchenFreeGaps, fillKitchenGap } from "./kitchen-runs.js";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const base = (extra: Partial<KitchenInput> = {}) =>
  kitchenInputSchema.parse({
    layout: "u",
    width: 3600,
    depth: 3000,
    returnLength: 3600,
    height: 2600,
    items: [],
    ...extra,
  });
test("regression: perpendicular tall unit blocks outgoing fronts even when all separate wall limits pass", () => {
  const d = base({
    items: [
      {
        id: uuid(1),
        catalogId: "base-shelves-600",
        wall: "a",
        gapBefore: 3000,
      },
      { id: uuid(2), catalogId: "tall-refrigerator-600", wall: "b" },
    ],
  });
  const before = structuredClone(d),
    hits = kitchenCollisions(d, kitchenModules(d));
  assert.ok(hits.some((c) => c.kind === "opening" && c.ids.includes(uuid(2))));
  assert.match(kitchenIssues(d).join(" "), /Zablokowane otwieranie/);
  assert.equal(calculateKitchenEstimate(d).estimate.gross, null);
  assert.deepEqual(d, before);
});
test("second U corner, depth changes and decorative plates participate in physical 3D collision checks", () => {
  const d = base({
    items: [
      {
        id: uuid(1),
        catalogId: "tall-refrigerator-600",
        wall: "b",
        gapBefore: 1750,
      },
      { id: uuid(2), catalogId: "base-shelves-600", wall: "c" },
    ],
  });
  assert.ok(kitchenCollisions(d, kitchenModules(d)).length > 0);
  const l = base({
    layout: "l",
    items: [
      {
        id: uuid(1),
        catalogId: "base-shelves-600",
        wall: "a",
        gapBefore: 2400,
        depth: 600,
        surround: {
          left: false,
          right: true,
          top: false,
          bottom: false,
          projection: 100,
        },
      },
      { id: uuid(2), catalogId: "base-shelves-600", wall: "b" },
    ],
  });
  assert.ok(kitchenCollisions(l, kitchenModules(l)).length > 0);
});
test("real blind front is on the accessible side; safe corner stays usable and upper/lower are not mixed", () => {
  const d = base({
    layout: "l",
    items: [
      {
        id: uuid(1),
        catalogId: "base-shelves-600",
        wall: "a",
        gapBefore: 1800,
        width: 500,
      },
      { id: uuid(2), catalogId: "base-shelves-600", wall: "b" },
      { id: uuid(3), catalogId: "wall-shelves-600", wall: "b" },
    ],
  });
  assert.deepEqual(kitchenCollisions(d, kitchenModules(d)), []);
  let next = 20;
  d.items = addKitchenBlindCorner(d, "a", () => uuid(++next));
  assert.deepEqual(kitchenCollisions(d, kitchenModules(d)), []);
  assert.equal(calculateKitchenEstimate(d).estimate.status, "estimated");
  const short = base({
    layout: "l",
    items: [
      {
        id: uuid(1),
        catalogId: "wall-shelves-600",
        wall: "a",
        gapBefore: 3000,
      },
      { id: uuid(2), catalogId: "base-shelves-600", wall: "b" },
    ],
  });
  assert.deepEqual(kitchenCollisions(short, kitchenModules(short)), []); // Only their plans overlap; heights do not.
});
test("I/L/U generator matrix uses all arms, has no body/opening conflict and places fridge at an open end", () => {
  for (const layout of ["straight", "l", "u"] as const)
    for (const width of [2400, 3000, 3600, 4800, 8000])
      for (const depth of [2400, 3000, 4200]) {
        const d = base({ layout, width, depth, returnLength: width });
        let n = 0;
        try {
          d.items = suggestKitchen(d, () => uuid(++n));
        } catch {
          assert.equal(n, 0);
          continue;
        }
        const modules = kitchenModules(d);
        assert.deepEqual(
          kitchenCollisions(d, modules),
          [],
          JSON.stringify({ layout, width, depth }),
        );
        assert.deepEqual(kitchenIssues(d), []);
        const fridge = modules.find((m) => m.konstrukcja === "refrigerator")!;
        assert.ok(
          (fridge.scianaId === "a" && fridge.pozycjaXMM === 0) ||
            (fridge.scianaId ===
              (layout === "u" ? "c" : layout === "l" ? "b" : "a") &&
              fridge.pozycjaXMM + fridge.szerokoscMM ===
                kitchenPlanningEnd(d, fridge.scianaId as "a" | "b" | "c")),
        );
        if (layout === "u") assert.ok(modules.some((m) => m.scianaId === "b"));
        assert.equal(calculateKitchenEstimate(d).estimate.status, "estimated");
      }
});
test("row gap fill cannot reoccupy reserved corner, bad preserved drafts remain unchanged", () => {
  const d = base({
    items: [{ id: uuid(1), catalogId: "base-shelves-600", wall: "a" }],
  });
  const gap = kitchenFreeGaps(d, "a", "base").at(-1)!;
  assert.equal(gap.end, 2950);
  let n = 20;
  const filled = fillKitchenGap(d, "a", "base", gap.id, () => uuid(++n));
  assert.equal(
    Math.max(
      ...kitchenModules({ ...d, items: filled })
        .filter((m) => m.scianaId === "a")
        .map((m) => m.pozycjaXMM + m.szerokoscMM),
    ),
    2950,
  );
  const bad = base({
    items: [
      {
        id: uuid(1),
        catalogId: "base-shelves-600",
        wall: "a",
        gapBefore: 3000,
      },
      { id: uuid(2), catalogId: "tall-refrigerator-600", wall: "b" },
    ],
  });
  const before = structuredClone(bad);
  let calls = 0;
  assert.throws(
    () =>
      suggestKitchen(
        bad,
        () => {
          calls++;
          return uuid(50);
        },
        true,
      ),
    /otwieranie|Kolizja/,
  );
  assert.equal(calls, 0);
  assert.deepEqual(bad, before);
});
