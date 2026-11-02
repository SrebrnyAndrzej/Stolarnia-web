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
} from "./core/furniture.js";
import { furnitureSave } from "./server/furniture.js";
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
