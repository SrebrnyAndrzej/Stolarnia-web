import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  freshConstructionStandard,
  freshPlateSpecification,
  type FurnitureEntry,
} from "../../src/core/furniture";
import { MATERIALY_STARTOWE } from "../../src/core/catalog/materials";
import { USTAWIENIA_DOMYSLNE } from "../../src/core/settings";
import type { BazaDanych, Magazyn } from "../../src/store/store";
import type { Principal } from "../../src/server/access";
export function furnitureBatchFixture() {
  const model = freshFurniture();
  model.construction = {
    ...freshConstructionStandard(),
    dimensionMode: "finished",
  };
  const spec = freshPlateSpecification();
  Object.assign(spec, {
    material: "płyta",
    decor: "biały",
    face: "xy",
    grain: "none",
  });
  for (const edge of Object.values(spec.edges)) edge.state = "none";
  model.plates = [
    {
      id: randomUUID(),
      name: "Panel",
      kind: "board",
      x: 0,
      y: 0,
      z: 0,
      width: 400,
      height: 300,
      depth: 18,
      specification: spec,
    },
  ];
  const entries = [1, 2].map(
    (i) =>
      ({
        id: randomUUID(),
        version: 1,
        model: { ...structuredClone(model), name: `Mebel ${i}` },
        createdBy: "test",
        updatedBy: "test",
        updatedAt: "2026-11-09T00:00:00Z",
      }) as FurnitureEntry,
  );
  const material = {
    ...MATERIALY_STARTOWE.find((m) => m.jednostka === "metrKwadratowy")!,
    id: "catalog",
    nazwa: "Płyta laminowana biała 18 mm",
    dekor: "Biały",
    jednostka: "sztuka" as const,
    typ: "plytaLaminowana" as const,
    gruboscMM: 18,
    kierunekDekoru: false,
    aktywny: true,
    szerokoscArkuszaMM: 1000,
    wysokoscArkuszaMM: 1000,
    cenaNetto: 7654321,
  };
  const db = {
    furnitureLibrary: entries,
    materialy: [material],
    ustawienia: structuredClone(USTAWIENIA_DOMYSLNE),
  } as BazaDanych;
  const store = { odczytaj: () => db } as Magazyn,
    person = {
      user_id: "staff-test",
      role: "employee",
      active: true,
      display_name: "Test",
      project_ids: [],
    } as Principal;
  return { entries, db, store, person, material };
}
