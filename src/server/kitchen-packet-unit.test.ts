import { test } from "node:test";
import assert from "node:assert/strict";
import { kitchenInputSchema } from "../core/kitchen-configuration.js";
import { kitchenWorkshopPacket } from "./kitchen-projects.js";

test("workshop packet preserves inner boxes, hardware, linked dimensions and the actual appliance card", () => {
  const draft = kitchenInputSchema.parse({
    layout: "straight",
    width: 3600,
    depth: 2600,
    height: 2600,
    standards: { plinth: 150, baseHeight: 800, upperBottom: 1500 },
    items: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        wall: "a",
        catalogId: "base-drawers-600",
        drawers: 1,
        innerDrawers: 2,
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        wall: "a",
        catalogId: "tall-refrigerator-600",
        appliance: {
          model: "Fixture refrigerator",
          width: 560,
          height: 1700,
          depth: 550,
          source: "https://example.com/manual.pdf",
          ventilationChecked: false,
        },
      },
    ],
  });
  const packet = kitchenWorkshopPacket({ ...draft, version: 1 }, 7);
  assert.equal(packet.revision, 7);
  assert.equal(packet.standards?.plinth, 150);
  assert.equal(packet.appliances[0].card?.model, "Fixture refrigerator");
  assert.equal(packet.appliances[0].fit?.status, "ventilation-needed");
  assert.match(packet.csv, /SU02/);
  assert.ok(packet.hardware[0].items.some((i) => i.opis.includes("SU02")));
  assert.equal(
    packet.hardware[0].items
      .filter((i) => i.typ === "systemSzuflad")
      .reduce((n, i) => n + i.ilosc, 0),
    3,
  );
  assert.ok(!JSON.stringify(packet).includes('"cenaNetto"'));
});
