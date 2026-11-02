import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { freshFurniture, carcass } from "./core/furniture.js";
import { furnitureReview, frontMotion } from "./core/furniture-review.js";
test("review distinguishes touching parts, intersections and room clearances", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  assert.equal(furnitureReview(m).collisions.length, 0);
  m.plates.push({
    ...m.plates[0],
    id: randomUUID(),
    name: "Przecinający bok",
    x: 2,
    anchor: undefined,
  });
  assert.equal(furnitureReview(m).collisions.length, 3);
  m.installation = {
    width: 1000,
    height: 2000,
    depth: 550,
    left: 10,
    right: 10,
    top: 10,
    obstacles: [
      {
        id: randomUUID(),
        name: "Belka",
        x: 0,
        y: 0,
        z: 0,
        width: 100,
        height: 100,
        depth: 100,
      },
    ],
  };
  assert.equal(furnitureReview(m).installation.length, 4);
  const front = { ...m.plates[0], kind: "drawer" as const, z: 560 };
  assert.ok(frontMotion(m, front).travel > 0);
});
test("opening review detects an obstacle in the drawer travel even without a closed collision", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const front = {
    id: randomUUID(),
    name: "Front",
    kind: "drawer" as const,
    x: 20,
    y: 20,
    z: 560,
    width: 960,
    height: 140,
    depth: 18,
  };
  m.plates.push(front);
  m.installation = {
    width: 1200,
    height: 2300,
    depth: 1000,
    left: 10,
    right: 10,
    top: 10,
    obstacles: [
      {
        id: randomUUID(),
        name: "Przeszkoda z przodu",
        x: 50,
        y: 50,
        z: 700,
        width: 100,
        height: 100,
        depth: 50,
      },
    ],
  };
  assert.equal(furnitureReview(m).collisions.length, 0);
  assert.ok(
    furnitureReview(m).motion.some(
      (c) => c.partId === front.id && c.message.includes("Przeszkoda z przodu"),
    ),
  );
});
