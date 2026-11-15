import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { staffApi } from "./staff-api-fixture";
import { freshFurniture, carcass } from "../../src/core/furniture";
for (const mobile of [false, true])
  test(`front hardware saves, validates, prints and survives reopen (${mobile ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await staffApi(page, mobile ? "owner" : "employee");
    const model = freshFurniture();
    model.name = "Próba okuć";
    model.plates = carcass(model, randomUUID);
    const front = {
      id: randomUUID(),
      name: "Front testowy",
      kind: "door" as const,
      x: 18,
      y: 18,
      z: 560,
      width: 450,
      height: 1800,
      depth: 18,
    };
    model.plates.push(front);
    const id = randomUUID();
    let entry = {
      id,
      version: 1,
      model,
      createdBy: "staff-test",
      updatedBy: "staff-test",
      updatedAt: new Date().toISOString(),
    };
    await page.route("**/api/v2/furniture", (r) => {
      if (r.request().method() === "PUT") {
        const b = r.request().postDataJSON();
        entry = { ...entry, ...b, version: b.version + 1 };
      }
      return r.fulfill({
        json: r.request().method() === "GET" ? [entry] : entry,
      });
    });
    await page.goto(`/#/panel/meble?model=${id}&version=1`);
    if (mobile)
      await page
        .getByRole("button", { name: "Inspektor", exact: true })
        .click();
    await page
      .getByLabel("Wybierz płytę", { exact: true })
      .selectOption(front.id);
    await page.getByRole("tab", { name: "Okucia", exact: true }).click();
    await page.getByLabel("Planuj zawiasy", { exact: true }).check();
    await page.getByLabel("Planuj uchwyt / gałkę", { exact: true }).check();
    await page.getByText("Zawiasy · 4 szt.", { exact: true }).click();
    await page
      .getByLabel("Model zawiasu / źródło", { exact: true })
      .fill("Zawias próbny - karta do sprawdzenia");
    await page.getByLabel("Głębokość puszki (mm)", { exact: true }).fill("18");
    await expect(page.getByRole("alert")).toContainText("grubości");
    await expect(
      page.getByRole("button", { name: "Pobierz kartę do druku", exact: true }),
    ).toHaveCount(0);
    await page.getByLabel("Głębokość puszki (mm)", { exact: true }).fill("13");
    await page.getByText("Zawiasy · 4 szt.", { exact: true }).click();
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Pobierz kartę do druku", exact: true })
      .click();
    const file = await download;
    await file.saveAs(
      "../../work/hardware-front-card-" +
        (mobile ? "phone" : "desktop") +
        ".html",
    );
    if (!mobile) {
      const printPage = await page.context().newPage();
      await printPage.setViewportSize({ width: 794, height: 1123 });
      await printPage.emulateMedia({ media: "print" });
      await printPage.setContent(
        readFileSync("../../work/hardware-front-card-desktop.html", "utf8"),
      );
      await expect(printPage.locator("svg")).toHaveCount(1);
      await expect(printPage.locator("tbody tr")).toHaveCount(6);
      await printPage.screenshot({
        path: "../../outputs/Karta-frontu-proba-2026-11-12.png",
      });
      await printPage.close();
    }
    await page
      .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
      .click();
    await expect(
      page.getByText("Zapisano we wspólnej bibliotece.", { exact: true }),
    ).toBeVisible();
    expect(entry.model.plates.at(-1)?.frontHardware?.hinges?.count).toBe(4);
    await page.goto(`/#/panel/meble?model=${id}&version=${entry.version}`);
    if (mobile)
      await page
        .getByRole("button", { name: "Inspektor", exact: true })
        .click();
    await page
      .getByLabel("Wybierz płytę", { exact: true })
      .selectOption(front.id);
    await page.getByRole("tab", { name: "Okucia", exact: true }).click();
    await expect(
      page.getByLabel("Planuj zawiasy", { exact: true }),
    ).toBeChecked();
    await expect(
      page.getByLabel("Planuj uchwyt / gałkę", { exact: true }),
    ).toBeChecked();
    expect(
      (await new AxeBuilder({ page }).include(".fc-studio").analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({
      path: `../../outputs/Kreator-okucia-${mobile ? "telefon" : "desktop"}-2026-11-12.png`,
    });
    await page.getByRole("tab", { name: "Wymiary", exact: true }).click();
    await page.getByLabel("Wysokość płyty", { exact: true }).fill("150");
    await page.getByRole("tab", { name: "Okucia", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Rysunek otworów wstrzymany",
    );
  });
