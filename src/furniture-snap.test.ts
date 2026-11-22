import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  carcass,
  furnitureGeometrySnapshot,
} from "./core/furniture.js";
import {
  snapFurniturePlate,
  furniturePlateSnap,
} from "./core/furniture-snap.js";
test("snap aligns with actual panel edges and room instances remain detached from library changes", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  const p = {
    id: randomUUID(),
    name: "Półka",
    kind: "board" as const,
    x: 18,
    y: 200,
    z: 0,
    width: 500,
    height: 18,
    depth: 560,
  };
  assert.equal(snapFurniturePlate(m, p, 22, 217).x, 18);
  assert.equal(snapFurniturePlate(m, p, 233, 277).x, 230);
  assert.equal(snapFurniturePlate(m, p, 233, 277).y, 280);
  const copy = furnitureGeometrySnapshot(m);
  m.width = 2000;
  m.plates[0].height = 100;
  assert.equal(copy.width, 1000);
  assert.notEqual(copy.plates[0].height, m.plates[0].height);
});

const movingPlate = () => ({
  id: "moving",
  name: "Półka ruchoma",
  kind: "board" as const,
  x: 100,
  y: 300,
  z: 0,
  width: 100,
  height: 18,
  depth: 500,
});

test("guides describe the actual shared edge, including the far edge of the moving plate", () => {
  const m = freshFurniture();
  const p = movingPlate();
  m.plates = [
    { ...p, id: "target", name: "Przegroda", x: 500, y: 700, width: 18 },
  ];
  const r = furniturePlateSnap(m, p, 405, 685);
  assert.equal(r.x, 400);
  assert.equal(r.y, 682);
  assert.deepEqual(r.guides, [
    {
      axis: "x",
      position: 500,
      targetId: "target",
      targetName: "Przegroda · lewa krawędź",
    },
    {
      axis: "y",
      position: 700,
      targetId: "target",
      targetName: "Przegroda · dolna krawędź",
    },
  ]);
  assert.deepEqual(snapFurniturePlate(m, p, 405, 685), { x: 400, y: 682 });
});

test("grid, depth-separated neighbors and unreachable clamped edges do not produce false guides", () => {
  const m = freshFurniture();
  const p = movingPlate();
  m.plates = [{ ...p, id: "behind", x: 233, y: 277, z: 500 }];
  assert.deepEqual(furniturePlateSnap(m, p, 233, 277), {
    x: 230,
    y: 280,
    guides: [],
  });
  m.plates = [{ ...p, id: "out", x: -10, y: -10 }];
  const r = furniturePlateSnap(m, p, -10, -10);
  assert.equal(r.x, 0);
  assert.equal(r.y, 0);
  assert.deepEqual(r.guides, []);
});

test("sloped caps and clipped panels never advertise a horizontal edge that does not exist", () => {
  const m = freshFurniture();
  m.shape = "slope";
  m.lowHeight = 900;
  m.plates = carcass(m, randomUUID);
  const p = movingPlate();
  const cap = m.plates.find((q) => q.kind === "cap")!;
  for (const y of [
    m.height - m.thickness - p.height,
    cap.y,
    cap.y + cap.height,
    cap.y - p.height,
  ]) {
    const result = furniturePlateSnap(m, p, 200, y);
    assert.equal(
      result.guides.some((g) => g.axis === "y"),
      false,
    );
  }
});

test("edge threshold is inclusive and metadata is deterministic without mutating the model", () => {
  const m = freshFurniture();
  const p = movingPlate();
  m.plates = [{ ...p, id: "target", x: 500, y: 700 }];
  const before = structuredClone(m);
  assert.equal(furniturePlateSnap(m, p, 412, 300).guides[0]?.position, 500);
  assert.equal(furniturePlateSnap(m, p, 413, 300).guides.length, 0);
  assert.deepEqual(
    furniturePlateSnap(m, p, 412, 300),
    furniturePlateSnap(m, p, 412, 300),
  );
  assert.deepEqual(m, before);
});

test("guide enhancement preserves legacy placement across grid, edge, tie and boundary cases", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  m.plates.push({ ...movingPlate(), id: "target", x: 400, y: 600 });
  const p = movingPlate();
  const near = m.plates.filter(
    (q) => q.id !== p.id && q.z < p.z + p.depth && q.z + q.depth > p.z,
  );
  const legacy = (key: "x" | "y", n: number) => {
    const size = key === "x" ? p.width : p.height;
    const extent = key === "x" ? m.width : m.height;
    const candidates = [
      0,
      m.thickness,
      extent - m.thickness - size,
      ...near.flatMap((q) => {
        const end = q[key] + (key === "x" ? q.width : q.height);
        return [q[key], end, q[key] - size, end - size];
      }),
    ];
    const nearest = candidates.reduce(
      (best, v) => (Math.abs(v - n) < Math.abs(best - n) ? v : best),
      Infinity,
    );
    return Math.max(
      0,
      Math.min(
        extent - size,
        Math.abs(nearest - n) <= 12 ? nearest : Math.round(n / 10) * 10,
      ),
    );
  };
  for (let x = -35; x <= m.width + 35; x += 7)
    for (const y of [
      -30,
      0,
      6,
      12,
      18,
      27,
      277,
      582,
      591,
      600,
      612,
      613,
      1000,
      m.height,
      m.height + 30,
    ])
      assert.deepEqual(snapFurniturePlate(m, p, x, y), {
        x: legacy("x", x),
        y: legacy("y", y),
      });
});
