import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  freshPlateSpecification,
  freshConstructionStandard,
  type FurnitureEntry,
} from "../../src/core/furniture";
import { MATERIALY_STARTOWE } from "../../src/core/catalog/materials";
import { USTAWIENIA_DOMYSLNE } from "../../src/core/settings";
import {
  prepareFurniture,
  preparationMaterials,
} from "../../src/server/furniture-preparation";
import type { Magazyn, BazaDanych } from "../../src/store/store";
import type { Principal } from "../../src/server/access";
test("saved library version produces board preparation packet and no plan for unmapped materials", async ({
  page,
}) => {
  const model = freshFurniture();
  model.name = "Panel do rozkroju";
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
  for (const e of Object.values(spec.edges)) e.state = "none";
  const part = {
    id: randomUUID(),
    name: "Panel",
    kind: "board" as const,
    x: 0,
    y: 0,
    z: 0,
    width: 500,
    height: 400,
    depth: 18,
    specification: spec,
  };
  model.plates = [part];
  const owner = {
    role: "owner",
    active: true,
    user_id: "test",
    display_name: "Test",
    project_ids: [],
  } as Principal;
  const entry = {
    id: randomUUID(),
    version: 2,
    model,
    updatedAt: "2026-11-03T00:00:00Z",
    createdBy: "test",
    updatedBy: "test",
  } as FurnitureEntry;
  const db = {
    furnitureLibrary: [entry],
    materialy: [
      {
        ...MATERIALY_STARTOWE.find((m) => m.jednostka === "metrKwadratowy")!,
        id: "catalog",
        gruboscMM: 18,
        kierunekDekoru: false,
        szerokoscArkuszaMM: 2070,
        wysokoscArkuszaMM: 2800,
        aktywny: true,
      },
    ],
    ustawienia: structuredClone(USTAWIENIA_DOMYSLNE),
  } as BazaDanych;
  const store = { odczytaj: () => structuredClone(db) } as Magazyn;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session")) return route.fulfill({ json: owner });
    if (path.endsWith("/furniture/materials"))
      return route.fulfill({ json: preparationMaterials(store, owner) });
    if (path.endsWith("/preparation"))
      return route.fulfill({
        json: prepareFurniture(
          store,
          owner,
          entry.id,
          route.request().postDataJSON(),
        ),
      });
    if (path.endsWith("/furniture")) return route.fulfill({ json: [entry] });
    return route.fulfill({ json: [] });
  });
  await page.goto(`/#/panel/meble?model=${entry.id}&version=2&part=${part.id}`);
  await page.getByRole("button", { name: "Dokumentacja", exact: true }).click();
  await page
    .getByText("Przygotowanie płyt do rozkroju", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Oblicz roboczy rozkrój", exact: true })
    .click();
  await expect(
    page.getByText(/Rozkrój całego modelu wstrzymany/),
  ).toBeVisible();
  await page
    .getByLabel("Materiał zbiorczy", { exact: true })
    .selectOption("catalog");
  await page
    .getByRole("button", {
      name: "Przypisz do części o zgodnej grubości",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Oblicz roboczy rozkrój", exact: true })
    .click();
  await expect(page.getByText(/Formatki: 1 · arkusze: 1/)).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz pakiet roboczy JSON", exact: true })
    .click();
  const packet = JSON.parse(
    await readFile((await (await downloading).path())!, "utf8"),
  );
  expect(packet.source.libraryVersion).toBe(2);
  expect(packet.readyForProduction).toBe(false);
  expect(packet.planning.formatki[0].id).toBe(part.id);
  expect(packet.checksum).toMatch(/^[a-f0-9]{64}$/);
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_PREPARATION)
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_PREPARATION,
    });
});
