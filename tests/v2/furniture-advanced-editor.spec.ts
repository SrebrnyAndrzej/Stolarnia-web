import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { staffApi } from "./staff-api-fixture";
import { freshFurniture, carcass } from "../../src/core/furniture";

test("equal shelf gaps preserve extremes and different thicknesses through save and undo", async ({
  page,
}) => {
  await staffApi(page);
  const model = freshFurniture();
  model.plates = carcass(model, randomUUID);
  const shelves = [200, 500, 1600].map((y, i) => ({
    id: randomUUID(),
    name: `Półka ${i + 1}`,
    kind: "board" as const,
    x: 18,
    y,
    z: 0,
    width: 964,
    height: i === 1 ? 36 : 18,
    depth: 500,
  }));
  model.plates.push(...shelves);
  const id = randomUUID();
  await page.route("**/api/v2/furniture", (r) =>
    r.request().method() === "GET"
      ? r.fulfill({
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
        })
      : r.fallback(),
  );
  await page.goto(`/#/panel/meble?model=${id}&version=1`);
  await page.getByRole("tab", { name: "Części", exact: true }).click();
  for (const s of shelves)
    await page.getByLabel(`Zaznacz część: ${s.name}`, { exact: true }).check();
  const operation = page.getByLabel("Operacja na częściach", { exact: true });
  await operation.focus();
  await operation.press("ArrowDown");
  await operation.press("ArrowUp");
  await operation.selectOption("equal-y");
  await page
    .getByRole("button", { name: "Zastosuj operację", exact: true })
    .click();
  const saved = page.waitForRequest(
    (r) => r.url().endsWith("/api/v2/furniture") && r.method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  const body = (await saved).postDataJSON();
  expect(
    shelves.map(
      (s) => body.model.plates.find((p: { id: string }) => p.id === s.id).y,
    ),
  ).toEqual([200, 891, 1600]);
  await page.getByLabel("Pokaż wymiary", { exact: true }).check();
  await page.screenshot({
    path: "../../outputs/Kreator-rowne-swiatla-2026-11-11.png",
  });
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await page.getByRole("tab", { name: "Płyta", exact: true }).click();
  await page
    .getByLabel("Wybierz płytę", { exact: true })
    .selectOption(shelves[1].id);
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "500",
  );
  await page.getByRole("tab", { name: "Części", exact: true }).click();
  expect(
    (await new AxeBuilder({ page }).include(".fc-studio").analyze()).violations,
  ).toEqual([]);
});

for (const mobile of [false, true])
  test(`dimension formula preview, validation, cancel and undo (${mobile ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await staffApi(page);
    await page.goto("/#/panel/meble");
    await page.getByLabel("Pokaż wymiary", { exact: true }).check();
    await page
      .getByRole("button", {
        name: "Zmień szerokość mebla: 1000 mm",
        exact: true,
      })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Zmień wymiar na rysunku",
    });
    await dialog.getByRole("textbox").fill("1000 + 2*100");
    await expect(dialog.locator("output")).toHaveText("Wynik: 1200 mm");
    await expect(
      page.getByLabel("Szybka szerokość", { exact: true }),
    ).toHaveValue("1000");
    await dialog
      .getByRole("button", { name: "Zastosuj wymiar", exact: true })
      .click();
    await expect(
      page.getByLabel("Szybka szerokość", { exact: true }),
    ).toHaveValue("1200");
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    await expect(
      page.getByLabel("Szybka szerokość", { exact: true }),
    ).toHaveValue("1000");
    await page
      .getByRole("button", {
        name: "Zmień szerokość mebla: 1000 mm",
        exact: true,
      })
      .click();
    await dialog.getByRole("textbox").fill("600/0");
    await dialog
      .getByRole("button", { name: "Zastosuj wymiar", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText("zero");
    await expect(
      page.getByLabel("Szybka szerokość", { exact: true }),
    ).toHaveValue("1000");
    expect(
      (await new AxeBuilder({ page }).include(".fc-dimension-dialog").analyze())
        .violations,
    ).toEqual([]);
    await dialog.getByRole("textbox").fill("(600-2*18)/3");
    await expect(dialog.locator("output")).toHaveText("Wynik: 188 mm");
    await page.screenshot({
      path: `../../outputs/Kreator-dzialania-${mobile ? "telefon" : "desktop"}-2026-11-11.png`,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByLabel("Szybka szerokość", { exact: true }),
    ).toHaveValue("1000");
  });
