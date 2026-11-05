import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { staffApi } from "./staff-api-fixture";
import {
  freshFurniture,
  carcass,
  freshPlateSpecification,
} from "../../src/core/furniture";
import { randomUUID } from "node:crypto";
const key = "pan-stolarz:furniture-draft:v1:staff-test";
test("recovery restores only local account draft, explicit library save clears it", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.getByLabel("Nazwa mebla", { exact: true }).fill("Szkic po awarii");
  await expect(
    page.getByText("Szkic zabezpieczony na tym urządzeniu", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate((k) => Boolean(localStorage.getItem(k)), key))
    .toBeTruthy();
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await expect(
    page.getByText("Odnaleziono szkic:", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Przywróć szkic", exact: true })
    .click();
  await expect(page.getByLabel("Nazwa mebla", { exact: true })).toHaveValue(
    "Szkic po awarii",
  );
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate((k) => localStorage.getItem(k), key))
    .toBeNull();
});
test("multi selection duplicates shelves atomically and undo restores count", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByRole("button", { name: "+ Półka", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("400");
  await page.getByRole("tab", { name: "Części", exact: true }).click();
  await page.getByLabel("Zaznacz część: Półka", { exact: true }).check();
  await page.getByLabel("Odstęp / krok (mm)", { exact: true }).fill("250");
  const rows = page.locator(".fc-parts-browser li");
  const count = await rows.count();
  await page
    .getByRole("button", { name: "Duplikuj w górę", exact: true })
    .click();
  await expect(rows).toHaveCount(count + 1);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(rows).toHaveCount(count);
  await page.getByLabel("Odstęp / krok (mm)", { exact: true }).fill("1");
  await page
    .getByRole("button", { name: "Duplikuj w górę", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("przecięcie");
  await expect(rows).toHaveCount(count);
});
test("3D section and isolation change render without changing geometry, guides use stored specification", async ({
  page,
}) => {
  const model = freshFurniture();
  model.plates = carcass(model, randomUUID);
  const spec = freshPlateSpecification();
  spec.face = "yz";
  spec.grain = "u";
  spec.edges.v0 = { state: "band", material: "ABS", thickness: 1 };
  model.plates[0].specification = spec;
  model.plates.push(
    ...[500, 1400].map((y) => ({
      id: randomUUID(),
      name: `Półka ${y}`,
      kind: "board" as const,
      x: 18,
      y,
      z: 0,
      width: 964,
      height: 18,
      depth: 560,
    })),
  );
  const id = randomUUID();
  await staffApi(page);
  await page.route("**/api/v2/furniture", (r) =>
    r.fulfill({
      json: [
        {
          id,
          version: 1,
          model,
          createdBy: "staff-test",
          updatedBy: "staff-test",
          updatedAt: new Date().toISOString(),
        },
      ],
    }),
  );
  await page.goto(`/#/panel/meble?model=${id}&version=1`);
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  const canvas = page.locator(".fc-drawing canvas");
  await expect(canvas).toBeVisible();
  const full = await canvas.screenshot();
  await page.getByLabel("Przekrój 3D", { exact: true }).selectOption("y");
  await page.getByLabel("Położenie przekroju", { exact: true }).fill("35");
  expect((await canvas.screenshot()).equals(full)).toBeFalsy();
  await page.getByLabel("Przekrój 3D", { exact: true }).selectOption("none");
  await page.getByRole("tab", { name: "Płyta", exact: true }).click();
  await page
    .getByLabel("Wybierz płytę", { exact: true })
    .selectOption({ index: 1 });
  await page.getByRole("tab", { name: "Widok", exact: true }).click();
  await page.getByLabel("Tylko wybrana część", { exact: true }).check();
  const isolated = await canvas.screenshot();
  expect(isolated.equals(full)).toBeFalsy();
  await page.getByLabel("Obrzeża i usłojenie", { exact: true }).check();
  expect((await canvas.screenshot()).equals(isolated)).toBeFalsy();
  expect(
    (await new AxeBuilder({ page }).include(".fc-studio").analyze()).violations,
  ).toEqual([]);
  await page.getByLabel("Tylko wybrana część", { exact: true }).uncheck();
  await page.getByLabel("Przekrój 3D", { exact: true }).selectOption("y");
  await page.screenshot({
    path: "../../outputs/Kreator-przekroj-2026-11-05.png",
  });
  await expect(page.locator(".fc-measures")).toContainText("1000 × 2000 × 560");
});
test("collision action highlights both actual parts in 2D and draft from another account is not offered", async ({
  page,
}) => {
  const model = freshFurniture();
  model.plates = carcass(model, randomUUID);
  model.plates.push({
    id: randomUUID(),
    name: "Półka A",
    kind: "board",
    x: 18,
    y: 400,
    z: 0,
    width: 964,
    height: 18,
    depth: 500,
    specification: freshPlateSpecification(),
  });
  model.plates.push({
    ...model.plates.at(-1)!,
    id: randomUUID(),
    name: "Półka B",
    y: 405,
  });
  const draft = {
    id: randomUUID(),
    version: 0,
    model,
    savedAt: new Date().toISOString(),
  };
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.evaluate(
    ({ key, draft }) => {
      localStorage.setItem(key, JSON.stringify(draft));
      localStorage.setItem(
        key.replace("staff-test", "other-user"),
        JSON.stringify(draft),
      );
    },
    { key, draft },
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Przywróć szkic", exact: true })
    .click();
  await page.getByRole("button", { name: "Braki", exact: true }).click();
  await page.getByText(/Geometria i dopasowanie ·/).click();
  await page
    .getByRole("button", {
      name: /Sprawdź przecięcie obwiedni: Półka A \/ Półka B/,
    })
    .click();
  await expect(page.locator(".fc-plate.collision")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate((k) => localStorage.getItem(k), key))
    .toBeNull();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Przywróć szkic", exact: true }),
  ).toHaveCount(0);
});
