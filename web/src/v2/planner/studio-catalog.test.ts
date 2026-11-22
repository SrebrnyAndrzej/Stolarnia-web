import { test } from "node:test";
import assert from "node:assert/strict";
import { catalog, newDraft } from "./model";
import { studioGroup, studioGroups, studioMatches } from "./studio-catalog";
import { kitchenAdditionFits } from "./catalog-placement";

test("every public variant has one Studio group, with separate appliances and fillers", () => {
  for (const m of catalog) {
    assert.equal(
      studioGroups.filter((g) => g.id === studioGroup(m)).length,
      1,
      m.id,
    );
    if (m.construction === "refrigerator")
      assert.equal(studioGroup(m), "cooling");
    if (m.construction === "filler") assert.equal(studioGroup(m), "fillers");
    if (m.construction === "hood" || m.construction === "oven")
      assert.equal(studioGroup(m), "cooking");
  }
  assert.ok(catalog.some((m) => studioGroup(m) === "corner"));
});

test("search accepts Polish letters, multiple terms, group purpose and centimetres", () => {
  const base = catalog.find((m) => m.id === "base-shelves-600")!;
  const tall = catalog.find((m) => m.id === "tall-pantry-600")!;
  assert.equal(studioMatches(base, "  naczynia 60 cm  "), true);
  assert.equal(studioMatches(tall, "SLUPKI przechowywania"), true);
  assert.equal(studioMatches(base, "lodówka"), false);
  assert.equal(studioMatches(base, "nieistniejąca-szafka"), false);
  assert.equal(studioMatches(base, ""), true);
});

test("Studio search cannot admit a variant rejected by placement and does not change a full draft", () => {
  const draft = {
    ...newDraft(),
    width: 1800,
    items: [1, 2, 3].map((n) => ({
      id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
      wall: "a" as const,
      catalogId: "base-shelves-600",
    })),
  };
  const before = JSON.stringify(draft);
  const available = catalog.filter((m) =>
    kitchenAdditionFits(draft, "a", m.id, ""),
  );
  assert.equal(
    available.filter(
      (m) => studioGroup(m) === "base" && studioMatches(m, "60 cm"),
    ).length,
    0,
  );
  assert.ok(available.some((m) => studioGroup(m) === "wall"));
  assert.equal(JSON.stringify(draft), before);
});
