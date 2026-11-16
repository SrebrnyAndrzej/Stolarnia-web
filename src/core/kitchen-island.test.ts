import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenModules,
  kitchenIssues,
} from "./kitchen-configuration.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import {
  kitchenRoomWalls,
  islandSize,
  islandClearances,
} from "./kitchen-island.js";
import { scianyNaRzucie, punktNaRzucie } from "./geometry.js";
import { zbudujModul } from "./builder.js";
import { USTAWIENIA_DOMYSLNE } from "./settings.js";
import {
  draftSchema,
  brief,
  newDraft,
} from "../../web/src/v2/planner/model.js";
import { architectFilesSchema } from "./architect-files.js";
const ids = Array.from(
  { length: 5 },
  (_, n) => `00000000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`,
);
const draft = () =>
  draftSchema.parse({
    ...newDraft(),
    width: 4800,
    depth: 4500,
    items: [{ id: ids[0], catalogId: "base-shelves-600", wall: "a" }],
    island: {
      x: 1000,
      y: 1800,
      rotation: 0,
      depth: 900,
      items: [
        { id: ids[1], catalogId: "base-drawers-600", wall: "a" },
        { id: ids[2], catalogId: "base-shelves-600", wall: "a" },
      ],
    },
  });
test("island uses real cabinets, priced backs, exact worktop and independent virtual wall", () => {
  const d = draft(),
    mods = kitchenModules(d),
    island = mods.filter((m) => m.scianaId === "island");
  assert.equal(mods.length, 3);
  assert.equal(island.length, 2);
  assert.equal(islandSize(d)!.length, 1236);
  assert.deepEqual(kitchenIssues(d), []);
  assert.equal(islandClearances(d, mods)[0].distance, 1265);
  const b = zbudujModul(island[0], USTAWIENIA_DOMYSLNE.konstrukcja);
  assert.ok(
    b.elementy.some(
      (e) =>
        e.kod === "OSLONA-TYL" && e.materialRola === "front" && e.gl === 18,
    ),
  );
  const tops = island.flatMap((m) =>
    zbudujModul(m, USTAWIENIA_DOMYSLNE.konstrukcja).elementy.filter(
      (e) => e.rola === "worktop",
    ),
  );
  assert.equal(
    tops.reduce((s, e) => s + e.szer, 0),
    1236,
  );
  assert.ok(tops.every((e) => e.gl === 900));
  const wall = scianyNaRzucie({ sciany: kitchenRoomWalls(d) }).find(
    (w) => w.sciana.id === "island",
  )!;
  assert.deepEqual(punktNaRzucie(wall, -18, 581 - 900), [1000, 1800]);
  assert.equal(calculateKitchenEstimate(d).estimate.status, "estimated");
  assert.ok(
    calculateKitchenEstimate(d).estimate.gross! >
      calculateKitchenEstimate({ ...d, island: undefined }).estimate.gross!,
  );
  assert.match(brief(d), /Wyspa: położenie/);
  assert.deepEqual(
    draftSchema.parse(JSON.parse(JSON.stringify(d))).island,
    d.island,
  );
});
test("island rejects collisions, room overflow and forged appliances/IDs at both boundaries", () => {
  const d = draft();
  assert.ok(
    kitchenIssues({ ...d, island: { ...d.island!, x: 0, y: 0 } }).some((s) =>
      s.includes("koliduje"),
    ),
  );
  assert.equal(
    calculateKitchenEstimate({ ...d, island: { ...d.island!, x: 4600 } })
      .estimate.gross,
    null,
  );
  for (const schema of [kitchenInputSchema, draftSchema]) {
    assert.equal(
      schema.safeParse({
        ...d,
        island: {
          ...d.island!,
          items: [{ id: ids[0], catalogId: "base-shelves-600", wall: "a" }],
        },
      }).success,
      false,
    );
    assert.equal(
      schema.safeParse({
        ...d,
        island: {
          ...d.island!,
          items: [{ id: ids[1], catalogId: "tall-fridge-600", wall: "a" }],
        },
      }).success,
      false,
    );
  }
  const rotated = { ...d, island: { ...d.island!, rotation: 90 as const } };
  assert.deepEqual(kitchenIssues(rotated), []);
  const w = scianyNaRzucie({ sciany: kitchenRoomWalls(rotated) }).find(
    (w) => w.sciana.id === "island",
  )!;
  assert.deepEqual(punktNaRzucie(w, -18, 581), [1000, 1800]);
  const before = scianyNaRzucie({
    sciany: kitchenRoomWalls({ ...d, island: undefined }),
  });
  const after = scianyNaRzucie({ sciany: kitchenRoomWalls(d) });
  assert.deepEqual(after[0], before[0]);
});
test("architect manifests accept multiple rooms and enforce count, bytes, identity and DXF-only underlays", () => {
  const file = {
    id: ids[3],
    name: "plan.pdf",
    size: 100,
    format: "pdf",
    room: "Łazienka",
    role: "elevation",
  };
  assert.equal(architectFilesSchema.parse([file]).length, 1);
  assert.equal(architectFilesSchema.safeParse([file, file]).success, false);
  assert.equal(
    architectFilesSchema.safeParse([
      {
        ...file,
        reference: { unit: "mm", layer: "", rotation: 0, x: 0, y: 0 },
      },
    ]).success,
    false,
  );
  assert.equal(
    architectFilesSchema.safeParse([{ ...file, size: 11 * 1024 * 1024 }])
      .success,
    false,
  );
  assert.equal(
    draftSchema.parse({ ...draft(), architectFiles: [file] }).architectFiles![0]
      .room,
    "Łazienka",
  );
});
