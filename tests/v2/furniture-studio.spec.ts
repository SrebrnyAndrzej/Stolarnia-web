import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
import AxeBuilder from "@axe-core/playwright";
test("visual layouts, equal shelf spacing and undo/redo preserve the model", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByRole("group", { name: "Gotowe układy mebli" })
    .getByRole("button", { name: "Regał z półkami", exact: true })
    .click();
  await expect(page.getByLabel("Układ startowy", { exact: true })).toHaveValue(
    "shelves",
  );
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByRole("button", { name: "+ Półka", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("250");
  await page.getByRole("button", { name: "+ Półka", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("800");
  await page
    .getByRole("button", { name: "Rozmieść półki równo", exact: true })
    .click();
  const position = await page
    .getByLabel("Pozycja Y", { exact: true })
    .inputValue();
  expect(position).not.toBe("800");
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "800",
  );
  await page.getByRole("button", { name: "Ponów", exact: true }).click();
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    position,
  );
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("700");
  await expect(
    page.getByRole("button", { name: "Ponów", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect(page.locator(".fc-library-preview")).toHaveCount(1);
  expect(
    (await new AxeBuilder({ page }).include(".fc").analyze()).violations,
  ).toEqual([]);
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_STUDIO) {
    await page.setViewportSize({ width: 1488, height: 1400 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_STUDIO,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("3D exports an actual PNG without saving or sending model data", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz widok PNG", exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/-podglad\.png$/);
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream!) chunks.push(Buffer.from(c));
  expect(Buffer.concat(chunks).subarray(0, 8).toString("hex")).toBe(
    "89504e470d0a1a0a",
  );
});

test("quick dimensions and expanded drawing retain the draft and expose clear shelf heights", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByRole("button", { name: "+ Półka", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("500");
  await page.getByLabel("Pokaż wymiary", { exact: true }).check();
  await expect(
    page.locator('g[aria-label="Światło między półkami"]'),
  ).toContainText("482 mm");
  await page
    .getByRole("button", { name: "Powiększ podgląd", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Powiększony obszar projektowania",
  });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((e) => e.matches(":modal"))).toBe(true);
  await dialog.getByLabel("Szybka szerokość", { exact: true }).fill("1200");
  await expect(dialog.locator(".fc-measures")).toContainText("1200");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Powiększ podgląd", exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel("Szerokość", { exact: true })).toHaveValue(
    "1200",
  );
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(
    page.getByLabel("Szybka szerokość", { exact: true }),
  ).toHaveValue("1000");
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_FOCUS) {
    await page
      .getByRole("button", { name: "Powiększ podgląd", exact: true })
      .click();
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_FOCUS,
    });
  }
});
