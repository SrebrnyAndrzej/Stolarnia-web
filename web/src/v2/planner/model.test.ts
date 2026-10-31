import { test } from "node:test";
import assert from "node:assert/strict";
import {
  brief,
  layoutIssues,
  newDraft,
  readDraft,
  toAnalysis,
  type Draft,
} from "./model";
const id = "00000000-0000-4000-8000-000000000001";
test("draft parsing rejects corrupt, oversized and unknown catalog input", () => {
  for (const d of [
    { ...newDraft(), width: -1 },
    { ...newDraft(), items: [{ id, catalogId: "unknown", wall: "a" }] },
    {
      ...newDraft(),
      items: Array(25).fill({ id, catalogId: "base-shelves-600", wall: "a" }),
    },
  ])
    assert.throws(() => readDraft(JSON.stringify(d)));
});
test("L adapter reserves corner and uses catalog construction", () => {
  const d: Draft = {
    ...newDraft(),
    layout: "l",
    items: [{ id, catalogId: "base-shelves-600", wall: "b" }],
  };
  const a = toAnalysis(d);
  assert.equal(a.projekt.moduly[0].pozycjaXMM, 650);
  assert.ok(a.zbudowane[0].elementy.length > 0);
  assert.equal(layoutIssues(d).length, 0);
  assert.match(brief(d), /650 mm/);
});
test("overflow and tall/upper overlap are visible; brief fits form limit", () => {
  const d: Draft = {
    ...newDraft(),
    width: 1800,
    items: [
      { id, catalogId: "tall-pantry-600", wall: "a" },
      {
        id: "00000000-0000-4000-8000-000000000002",
        catalogId: "wall-shelves-600",
        wall: "a",
      },
    ],
  };
  assert.ok(layoutIssues(d).some((i) => i.includes("nakłada")));
  const many = {
    ...d,
    items: Array.from({ length: 24 }, (_, i) => ({
      id: crypto.randomUUID(),
      catalogId: "base-shelves-900",
      wall: "a" as const,
    })),
  };
  assert.ok(layoutIssues(many).some((i) => i.includes("poza")));
  assert.ok(brief(many).length < 6000);
});

test("U layout has three walls, two reserved corners and C overflow checks", () => {
  const d: Draft = {
    ...newDraft(),
    layout: "u",
    returnLength: 1800,
    items: [{ id, catalogId: "base-shelves-600", wall: "c" }],
  };
  const a = toAnalysis(d);
  assert.equal(a.projekt.pomieszczenia[0].sciany.length, 3);
  assert.equal(a.projekt.moduly[0].pozycjaXMM, 650);
  assert.equal(layoutIssues(d).length, 0);
  assert.match(brief(d), /C: 1800 mm/);
  d.items.push({
    id: crypto.randomUUID(),
    catalogId: "base-shelves-600",
    wall: "c",
  });
  assert.ok(layoutIssues(d).some((i) => i.includes("ścianę C")));
  assert.throws(() => readDraft(JSON.stringify({ ...d, layout: "l" })));
});

test("older straight and L drafts retain compatibility", () => {
  const { returnLength: _old, ...legacy } = newDraft();
  assert.equal(readDraft(JSON.stringify(legacy)).returnLength, 3600);
  assert.equal(
    readDraft(JSON.stringify({ ...legacy, layout: "l" })).layout,
    "l",
  );
});
