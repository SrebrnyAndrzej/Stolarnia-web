import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  carcass,
  deskStartingModel,
  resizeFurniture,
  applySuggestedLayout,
  furnitureIssues,
  applyConstructionStandard,
  freshConstructionStandard,
  deskWorktopHeight,
  deskLegWidth,
} from "./core/furniture.js";
import { furnitureDrawerCalculations } from "./core/furniture-drawers.js";
import { furnitureSave } from "./server/furniture.js";
test("storage desks preserve working height, generate both cabinets and valid drawer compartments", () => {
  const base = freshFurniture();
  base.plates = carcass(base, randomUUID);
  for (const variant of ["desk-storage", "desk-hutch"] as const) {
    for (const side of ["left", "right", "both"] as const) {
      let m = deskStartingModel(base, randomUUID, 1600, variant);
      m = resizeFurniture(
        m,
        {
          desk: {
            ...m.desk!,
            side,
            cabinetWidth: side === "both" ? 375 : 420,
            cabinetFront: "drawers",
          },
        },
        randomUUID,
      );
      assert.equal(deskWorktopHeight(m), 740);
      assert.ok(deskLegWidth(m) >= 850);
      assert.deepEqual(furnitureIssues(m), []);
      assert.equal(new Set(m.plates.map((p) => p.id)).size, m.plates.length);
      const slots = m.plates
        .filter((p) => p.layoutSlot)
        .map((p) => p.layoutSlot);
      assert.equal(new Set(slots).size, slots.length);
      const fronts = m.plates.filter((p) => p.kind === "drawer");
      assert.equal(fronts.length, side === "both" ? 6 : 3);
      m.drawerAssemblies = fronts.map((p) => ({
        frontId: p.id,
        profileId: "amix-elite-standard",
        variant: "84",
        nominalLength: 500,
      }));
      for (const c of furnitureDrawerCalculations(m)) {
        assert.deepEqual(c.blockers, []);
        assert.equal(c.openingWidth, m.desk!.cabinetWidth - 56);
        assert.ok(c.usableDepth <= 797);
      }
      assert.ok(
        furnitureSave.safeParse({ id: randomUUID(), version: 0, model: m })
          .success,
      );
      if (variant === "desk-hutch") {
        const resized = resizeFurniture(m, { height: 1500 }, randomUUID);
        assert.equal(resized.plates.find((p) => p.anchor === "top")!.y, 712);
        assert.equal(
          resized.plates.filter((p) => p.layoutSlot === "desk/hutch/top")
            .length,
          1,
        );
        assert.equal(
          resized.plates.find((p) => p.layoutSlot === "desk/hutch/top")!.y,
          1472,
        );
      }
    }
  }
});
test("desk preset creates a full-width horizontal top and unobstructed floor without cabinet bottom", () => {
  const base = freshFurniture();
  base.plates = carcass(base, randomUUID);
  const desk = deskStartingModel(base, randomUUID);
  assert.deepEqual(
    [desk.width, desk.depth, desk.height, desk.thickness],
    [1600, 800, 740, 28],
  );
  const top = desk.plates.find((p) => p.anchor === "top")!;
  assert.deepEqual(
    [top.x, top.y, top.width, top.height, top.depth],
    [0, 712, 1600, 28, 800],
  );
  assert.ok(
    !desk.plates.some((p) => p.anchor === "bottom" || p.anchor === "back"),
  );
  assert.equal(desk.plates.find((p) => p.anchor === "left")!.height, 712);
  assert.deepEqual(furnitureIssues(desk), []);
  const sized = resizeFurniture(desk, { height: 760, width: 1400 }, randomUUID);
  assert.equal(sized.plates.find((p) => p.anchor === "top")!.id, top.id);
  assert.equal(sized.plates.find((p) => p.anchor === "top")!.y, 732);
  assert.ok(
    furnitureSave.safeParse({ id: randomUUID(), version: 0, model: sized })
      .success,
  );
});
test("changing desk and cabinet variants normalizes the top face and preserves valid material data", () => {
  const base = freshFurniture();
  base.plates = carcass(base, randomUUID);
  const annotated = applyConstructionStandard(
    base,
    {
      ...freshConstructionStandard(),
      bodyMaterial: "Laminat",
      bodyDecor: "Biały",
    },
    randomUUID,
    true,
  );
  const desk = deskStartingModel(annotated, randomUUID);
  assert.equal(
    desk.plates.find((p) => p.anchor === "top")!.specification!.face,
    "xz",
  );
  assert.ok(
    furnitureSave.safeParse({ id: randomUUID(), version: 0, model: desk })
      .success,
  );
  const cabinet = applySuggestedLayout(desk, "wardrobe", randomUUID);
  assert.equal(
    cabinet.plates.find((p) => p.anchor === "top")!.specification!.face,
    "slope",
  );
  assert.ok(
    furnitureSave.safeParse({ id: randomUUID(), version: 0, model: cabinet })
      .success,
  );
});
