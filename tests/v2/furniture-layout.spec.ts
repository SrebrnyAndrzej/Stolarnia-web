import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
test("new models suggest an editable interior and manual positions survive resize and save", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await expect(page.getByLabel("Układ startowy", { exact: true })).toHaveValue(
    "auto",
  );
  const selector = page.getByLabel("Wybierz płytę", { exact: true });
  const shelfId = await selector
    .locator("option")
    .filter({ hasText: "Półka sugerowana 1.1" })
    .getAttribute("value");
  expect(shelfId).toBeTruthy();
  await selector.selectOption(shelfId!);
  await page.getByLabel("Pozycja Y", { exact: true }).fill("300");
  await page.getByLabel("Wysokość", { exact: true }).fill("2400");
  await expect(selector).toHaveValue(shelfId!);
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "300",
  );
  await page.getByRole("button", { name: "Usuń płytę", exact: true }).click();
  await page.getByLabel("Szerokość", { exact: true }).fill("1200");
  await expect(
    selector.locator("option").filter({ hasText: "Półka sugerowana 1.1" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
  await page.getByRole("button", { name: /Nowy mebel.*Wersja 1/ }).click();
  await expect(
    selector.locator("option").filter({ hasText: "Półka sugerowana 1.1" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Przywróć sugerowany układ", exact: true })
    .click();
  await expect(
    selector.locator("option").filter({ hasText: "Półka sugerowana 1.1" }),
  ).toHaveCount(1);
});
test("every shape gets automatic contents and variant switches can be undone on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.getByLabel("Obrys", { exact: true }).selectOption("slope");
  const select = page.getByLabel("Wybierz płytę", { exact: true });
  await expect(
    select.locator("option").filter({ hasText: "Półka sugerowana" }),
  ).toHaveCount(6);
  await page.getByLabel("Obrys", { exact: true }).selectOption("stairs");
  await expect(
    select.locator("option").filter({ hasText: "Przegroda sugerowana" }),
  ).toHaveCount(3);
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("mixed");
  await expect(
    select.locator("option").filter({ hasText: "Front sugerowany" }),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(page.getByLabel("Układ startowy", { exact: true })).toHaveValue(
    "auto",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("wardrobe proposal has a visible default preview", async ({ page }) => {
  await staffApi(page, "owner");
  await page.goto("/#/panel/meble");
  await expect(
    page
      .getByLabel("Wybierz płytę", { exact: true })
      .locator("option")
      .filter({ hasText: "Przegroda sugerowana" }),
  ).toHaveCount(1);
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_LAYOUT) {
    await page
      .getByLabel("Układ startowy", { exact: true })
      .selectOption("mixed");
    await page.locator(".fc-drawing").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_LAYOUT,
    });
  }
});
