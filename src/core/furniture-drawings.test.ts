import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  carcass,
  applySuggestedLayout,
  resizeFurniture,
  type FurnitureModel,
} from "./furniture.js";
import {
  drawingOpenings,
  assemblyDrawing,
  drawingParts,
} from "./furniture-drawings.js";
import { furnitureDocument } from "../../web/src/v2/furniture-document.js";
const base = () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  return m;
};
test("drawing clearances subtract the real boards and horizontal width follows a short partition", () => {
  const m = base();
  m.plates.push({
    id: randomUUID(),
    name: "Półka",
    kind: "board",
    x: 18,
    y: 500,
    z: 0,
    width: 964,
    height: 18,
    depth: 500,
  });
  m.plates.push({
    id: randomUUID(),
    name: "Krótka przegroda",
    kind: "board",
    x: 491,
    y: 18,
    z: 0,
    width: 18,
    height: 482,
    depth: 500,
  });
  const o = drawingOpenings(m);
  const lower = o.filter((v) => v.y === 18),
    upper = o.filter((v) => v.y === 518);
  assert.equal(lower.length, 2);
  assert.deepEqual(
    lower.map((v) => v.clearWidth),
    [473, 473],
  );
  assert.ok(upper.length >= 2);
  assert.ok(upper.every((v) => v.clearWidth === 964));
  assert.equal(lower[0].height, 482);
  assert.equal(upper[0].height, 1464);
});
test("assembly uses real sloped prisms, finite bounds, stable CSV references and does not mutate a model", () => {
  const m = resizeFurniture(
    base(),
    { shape: "slope", height: 2000, lowHeight: 1100 },
    randomUUID,
  );
  const original = structuredClone(m),
    scene = assemblyDrawing(m);
  assert.deepEqual(m, original);
  assert.ok(scene.faces.length > 0);
  assert.ok(
    scene.faces.every((f) => f.points.every((p) => p.every(Number.isFinite))),
  );
  assert.ok(
    scene.faces.every((f, i, a) => i === 0 || f.depth >= a[i - 1].depth),
  );
  assert.equal(drawingParts(m)[0].label, "P1");
  assert.ok(scene.bounds.right > scene.bounds.left);
  assert.ok(scene.bounds.bottom > scene.bounds.top);
  const cap = scene.parts.find((p) => p.plate.kind === "cap")!;
  assert.ok(cap.polygon.some((p, i, a) => i > 0 && p[1] !== a[0][1]));
});
test("compact document includes datum, shelf surfaces, back section, short assembly, safe names and explicit omissions", () => {
  const m = applySuggestedLayout(base(), "shelves", randomUUID);
  m.name = '<script>alert("x")</script>';
  const html = furnitureDocument(m, "<id>", 7);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes('aria-label="Arkusz techniczny"'));
  assert.ok(html.includes('aria-label="Arkusz montażowy"'));
  assert.ok(html.includes("Dolna powierzchnia"));
  assert.ok(html.includes("Górna powierzchnia"));
  assert.ok(html.includes("uwzględnione są plecy"));
  assert.ok(html.includes("nie osie otworów podpórek"));
  const big: FurnitureModel = {
    ...m,
    plates: [
      ...m.plates,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: randomUUID(),
        kind: "board" as const,
        name: `Półka ${i}`,
        x: 18,
        y: 100 + i * 50,
        z: 0,
        width: 964,
        height: 18,
        depth: 500,
      })),
    ],
  };
  assert.ok(furnitureDocument(big, "big", 1).includes("karta jest skrótem"));
});
