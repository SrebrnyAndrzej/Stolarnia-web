import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenModules,
  kitchenIssues,
} from "./kitchen-configuration.js";
import { buildKitchenModule } from "./kitchen-build.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { USTAWIENIA_DOMYSLNE } from "./settings.js";
import { kitchenApplianceFit } from "./kitchen-appliance-fit.js";
import { kitchenLockProblem } from "./kitchen-locks.js";
import { kitchenShelfAlternative } from "./kitchen-storage-variants.js";

const id = "00000000-0000-4000-8000-000000000001";
const draft = (count = 0) =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 3600,
    depth: 2600,
    height: 2600,
    items: [
      {
        id,
        wall: "a",
        catalogId: "base-drawers-600",
        drawers: 1,
        innerDrawers: count,
      },
    ],
  });

test("budget shelf alternative removes hidden drawers without changing the source or crashing project rendering", () => {
  const d = draft(2);
  const before = structuredClone(d);
  const item = kitchenShelfAlternative(d.items[0]);
  assert.equal("innerDrawers" in item, false);
  assert.equal("drawerFronts" in item, false);
  assert.equal("drawers" in item, false);
  const candidate = kitchenInputSchema.parse({ ...d, items: [item] });
  assert.deepEqual(kitchenIssues(candidate), []);
  assert.doesNotThrow(() => kitchenModules(candidate));
  assert.deepEqual(d, before);
});

test("one common front with three inner drawers has separate boxes, runner levels and hardware in the priced build", () => {
  const d = draft(3);
  const m = kitchenModules(d)[0];
  const b = buildKitchenModule(m, USTAWIENIA_DOMYSLNE.konstrukcja);
  assert.equal(b.elementy.filter((e) => e.rola === "front").length, 1);
  assert.equal(
    b.elementy.filter((e) => e.kod.startsWith("SU") && e.kod.endsWith("-DNO"))
      .length,
    3,
  );
  const inner = b.szufladyWewnetrzne!;
  assert.equal(new Set(inner.map((i) => i.podlogaY)).size, 3);
  for (let n = 1; n < inner.length; n++)
    assert.equal(inner[n].sufitY, inner[n - 1].podlogaY);
  for (const i of inner) {
    assert.equal((i.podlogaY - 18) % 32, 0);
    assert.ok(i.sufitY - i.podlogaY >= 112);
  }
  assert.equal(
    b.okucia
      .filter((o) => o.typ === "systemSzuflad")
      .reduce((s, o) => s + o.ilosc, 0),
    4,
  );
  assert.ok(!b.ostrzezenia.some((s) => s.includes("nie zbudowano")));
  assert.ok(
    calculateKitchenEstimate(d).estimate.gross! >
      calculateKitchenEstimate(draft()).estimate.gross!,
  );
  assert.deepEqual(kitchenIssues(d), []);
});

test("hidden drawer combinations that cannot share a common front are rejected at the API boundary", () => {
  for (const change of [
    { drawers: 2 },
    { height: 300 },
    { depth: 300 },
    { innerDrawers: 4 },
    { catalogId: "base-shelves-600" },
  ]) {
    const d = draft(2);
    assert.equal(
      kitchenInputSchema.safeParse({
        ...d,
        items: [{ ...d.items[0], ...change }],
      }).success,
      false,
    );
  }
});

test("linked kitchen dimensions position the countertop and upper run, preserve old drafts, respect locks and detect the ceiling", () => {
  const old = draft();
  assert.equal(kitchenModules(old)[0].pozycjaYMM, 100);
  const linked = kitchenInputSchema.parse({
    ...old,
    standards: { plinth: 150, baseHeight: 800, upperBottom: 1850 },
    items: [
      ...old.items,
      {
        id: "00000000-0000-4000-8000-000000000002",
        wall: "a",
        catalogId: "wall-shelves-600",
      },
    ],
  });
  const [base, upper] = kitchenModules(linked);
  assert.equal(base.wysokoscMM, 800);
  assert.equal(base.pozycjaYMM + base.wysokoscMM + 38, 988);
  assert.equal(upper.pozycjaYMM, 1850);
  assert.ok(
    kitchenIssues({
      ...linked,
      standards: { ...linked.standards!, upperBottom: 2000 },
    }).some((i) => i.includes("wysokość pomieszczenia")),
  );
  assert.ok(
    kitchenLockProblem(
      { ...old, items: [{ ...old.items[0], locked: true }] },
      {
        ...linked,
        items: linked.items.map((i) =>
          i.id === id ? { ...i, locked: true } : i,
        ),
      },
    ),
  );
});

test("appliance card compares required niche with clear panel faces and does not certify ventilation by dimensions alone", () => {
  const d = kitchenInputSchema.parse({
    ...draft(),
    items: [
      {
        id,
        wall: "a",
        catalogId: "base-oven-600",
        appliance: { model: "Test Oven", width: 560, height: 590, depth: 550 },
      },
    ],
  });
  const m = kitchenModules(d)[0];
  const fit = kitchenApplianceFit(m, d.items[0].appliance!);
  assert.equal(fit.available.width, 564);
  assert.equal(fit.available.height, 577);
  assert.equal(fit.status, "blocked");
  assert.ok(kitchenIssues(d).some((i) => i.includes("590 mm")));
  assert.equal(calculateKitchenEstimate(d).estimate.gross, null);
  const fridge = kitchenModules(
    kitchenInputSchema.parse({
      ...d,
      items: [{ id, wall: "a", catalogId: "tall-refrigerator-600" }],
    }),
  )[0];
  if (fridge)
    assert.equal(
      kitchenApplianceFit(fridge, {
        model: "Test",
        width: 560,
        height: 1700,
        depth: 550,
        ventilationChecked: false,
      }).status,
      "ventilation-needed",
    );
});
