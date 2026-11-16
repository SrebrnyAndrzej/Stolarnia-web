import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenModules,
  kitchenIssues,
  kitchenWalls,
  suggestKitchen,
} from "./kitchen-configuration.js";
import { kitchenRoomWalls } from "./kitchen-island.js";
import { scianyNaRzucie, punktNaRzucie } from "./geometry.js";
import { kitchenFreeGaps, fillKitchenGap } from "./kitchen-runs.js";
import { kitchenPlanningEnd } from "./kitchen-collisions.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { addKitchenBlindCorner } from "./kitchen-corner.js";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const room = () =>
  kitchenInputSchema.parse({
    layout: "parallel",
    width: 2895,
    depth: 2385,
    height: 2600,
    items: [],
  });
test("parallel rows face each other at the measured spacing without a phantom perpendicular wall or corner reserve", () => {
  const d = room(),
    walls = scianyNaRzucie({ sciany: kitchenRoomWalls(d) });
  assert.deepEqual(kitchenWalls(d), ["a", "c"]);
  assert.equal(walls.length, 2);
  assert.deepEqual(punktNaRzucie(walls[0], 1455, 600), [1455, 600]);
  assert.deepEqual(punktNaRzucie(walls[1], 1455, 600), [1440, 1785]);
  assert.equal(kitchenPlanningEnd(d, "c"), 2895);
  assert.equal(kitchenFreeGaps(d, "c", "base")[0].start, 0);
  assert.equal(kitchenFreeGaps(d, "c", "base")[0].end, 2895);
  let id = 100;
  const items = fillKitchenGap(
    d,
    "c",
    "base",
    kitchenFreeGaps(d, "c", "base")[0].id,
    () => uuid(++id),
  );
  const modules = kitchenModules({ ...d, items });
  assert.equal(modules[0].pozycjaXMM, 0);
  assert.equal(
    Math.max(...modules.map((m) => m.pozycjaXMM + m.szerokoscMM)),
    2895,
  );
  assert.throws(
    () => addKitchenBlindCorner(d, "a", () => uuid(200)),
    /układzie L lub U/,
  );
});
test("complete parallel proposals use both rows and measured water remains opposite the cooking row", () => {
  for (const width of [2400, 2895, 3600, 4800])
    for (const depth of [2385, 2800, 3600]) {
      const d = { ...room(), width, depth };
      let id = 100;
      const next = { ...d, items: suggestKitchen(d, () => uuid(++id)) };
      assert.deepEqual(kitchenIssues(next), []);
      assert.deepEqual(
        new Set(kitchenModules(next).map((m) => m.scianaId)),
        new Set(["a", "c"]),
      );
      assert.ok(calculateKitchenEstimate(next).estimate.gross! > 0);
    }
  const d = {
    ...room(),
    planning: {
      waterWall: "c" as const,
      sinkCenter: 1455,
      dishwasher: "600" as const,
    },
  };
  let id = 100;
  const next = { ...d, items: suggestKitchen(d, () => uuid(++id)) };
  const sink = kitchenModules(next).find((m) => m.konstrukcja === "sink")!;
  assert.equal(sink.scianaId, "c");
  assert.equal(sink.pozycjaXMM + sink.szerokoscMM / 2, 1455);
});
test("parallel quote reports both run lengths and spacing; deep opposing units cannot overlap", () => {
  const d = {
    ...room(),
    items: [
      { id: uuid(1), catalogId: "base-oven-600", wall: "a" as const },
      { id: uuid(2), catalogId: "base-sink-600", wall: "c" as const },
    ],
  };
  const q = calculateKitchenEstimate(d).estimate;
  assert.equal(q.status, "estimated");
  assert.match(
    q.scope.map((s) => s.description).join(" "),
    /równoległy A\/C.*2895 \/ 2895.*2385/,
  );
  assert.ok(q.notes.every((n) => !n.includes("650")));
  const invalid = {
    ...d,
    width: 1800,
    depth: 1800,
    items: d.items.map((i) => ({
      ...i,
      catalogId: "base-shelves-600",
      width: 1200,
    })),
  };
  assert.ok(kitchenIssues(invalid).some((s) => s.includes("otwieranie")));
  assert.equal(calculateKitchenEstimate(invalid).estimate.gross, null);
});
