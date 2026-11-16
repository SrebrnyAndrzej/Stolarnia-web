import { test } from "node:test";
import assert from "node:assert/strict";
import {
  architectFilesSchema,
  imageReferenceSchema,
  imageReferenceSize,
} from "./architect-files.js";
const reference = {
  pixelWidth: 1200,
  pixelHeight: 900,
  crop: { x: 100, y: 100, width: 600, height: 500 },
  mmPerPixel: 6,
  rotation: 0 as const,
  x: 0,
  y: 0,
};
const file = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "parter.jpg",
  format: "jpg",
  size: 1024,
  imageReference: reference,
};
test("raster calibration persists scale and crop, quarter turns swap the room axes", () => {
  const [parsed] = architectFilesSchema.parse([file]);
  assert.deepEqual(imageReferenceSize(parsed.imageReference!), {
    width: 3600,
    depth: 3000,
  });
  assert.deepEqual(imageReferenceSize({ ...reference, rotation: 90 }), {
    width: 3000,
    depth: 3600,
  });
  assert.equal(parsed.room, "Kuchnia");
});
test("rejects unbounded, outside-image or uncalibrated rasters", () => {
  for (const r of [
    { ...reference, mmPerPixel: 0 },
    { ...reference, mmPerPixel: Infinity },
    { ...reference, crop: { ...reference.crop, x: 1100 } },
    { ...reference, mmPerPixel: 50 },
    { ...reference, pixelWidth: 10000, pixelHeight: 10000 },
  ])
    assert.equal(imageReferenceSchema.safeParse(r).success, false);
  assert.equal(
    architectFilesSchema.safeParse([{ ...file, format: "pdf" }]).success,
    false,
  );
});
test("raster and DXF share the four active underlay limit", () => {
  const files = Array.from({ length: 5 }, (_, i) => ({
    ...file,
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
  }));
  assert.equal(architectFilesSchema.safeParse(files.slice(0, 4)).success, true);
  assert.equal(architectFilesSchema.safeParse(files).success, false);
});
