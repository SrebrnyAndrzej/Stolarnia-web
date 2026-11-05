import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID as uid } from "node:crypto";
import { freshFurniture, carcass } from "./core/furniture.js";
import { furnitureSave } from "./server/furniture.js";
import {
  furniturePlateColor,
  defaultFurnitureAppearance,
} from "./core/furniture-appearance.js";
import { furnitureParts } from "./core/furniture-parts.js";
test("appearance colours are validated, survive save DTO and do not change cutting geometry", () => {
  const m = freshFurniture();
  m.plates = carcass(m, uid);
  assert.equal(
    furniturePlateColor(m, { kind: "board" }),
    defaultFurnitureAppearance.bodyColor,
  );
  assert.equal(
    furniturePlateColor(m, { kind: "drawer" }),
    defaultFurnitureAppearance.frontColor,
  );
  const parts = furnitureParts(m);
  m.appearance = { bodyColor: "#ffffff", frontColor: "#435058" };
  const saved = furnitureSave.parse({ id: uid(), version: 0, model: m });
  assert.deepEqual(saved.model.appearance, m.appearance);
  assert.equal(furniturePlateColor(m, { kind: "door" }), "#435058");
  assert.deepEqual(furnitureParts(m), parts);
  for (const invalid of [
    "red",
    "url(http://example.org)",
    "#xyz123",
    "#ffffff;display:none",
  ]) {
    m.appearance.frontColor = invalid;
    assert.equal(
      furnitureSave.safeParse({ id: uid(), version: 0, model: m }).success,
      false,
    );
  }
});
