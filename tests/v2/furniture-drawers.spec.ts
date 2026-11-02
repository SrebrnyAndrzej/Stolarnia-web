import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
test("employee assigns a drawer system to a front and reopens the frozen calculation", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByLabel("Liczba: średnie", { exact: true }).fill("0");
  await page.getByLabel("Liczba: wysokie", { exact: true }).fill("0");
  await page
    .getByRole("button", { name: "Ustaw zestaw szuflad", exact: true })
    .click();
  const region = page.getByRole("region", { name: "Systemy szuflad w meblu" });
  await expect(region).toContainText("Wybierz system szuflady.");
  await page
    .getByLabel("System dla Szuflada niska 1", { exact: true })
    .selectOption("amix-elite-standard");
  await page
    .getByLabel("Wariant boku dla Szuflada niska 1", { exact: true })
    .selectOption("84");
  await page
    .getByLabel("NL dla Szuflada niska 1 (mm)", { exact: true })
    .fill("500");
  await expect(region).toContainText("889 × 474");
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect(region).toContainText("Wynik zapisanej wersji modelu.");
  await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
  await page.getByRole("button", { name: /Nowy mebel.*Wersja 1/ }).click();
  await expect(
    page.getByLabel("NL dla Szuflada niska 1 (mm)", { exact: true }),
  ).toHaveValue("500");
  await expect(region).toContainText("889 × 474");
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_DRAWERS) {
    await region.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_DRAWERS,
    });
  }
  await page
    .getByLabel("NL dla Szuflada niska 1 (mm)", { exact: true })
    .fill("600");
  await expect(region).toContainText("Długość NL musi być dodatnia");
  await expect(region.getByRole("table")).toHaveCount(0);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(region).toContainText("889 × 474");
});
test("selected partition narrows the drawer compartment and deleting it blocks recalculation", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page
    .getByRole("button", { name: "Ustaw zestaw szuflad", exact: true })
    .click();
  await page.getByRole("button", { name: "+ Przegroda", exact: true }).click();
  const plateSelect = page.getByLabel("Wybierz płytę", { exact: true });
  const boundaryId = await plateSelect.inputValue();
  await plateSelect.selectOption({ label: "5. Szuflada niska 1" });
  await page.getByLabel("Szerokość płyty", { exact: true }).fill("478");
  await page
    .getByLabel("System dla Szuflada niska 1", { exact: true })
    .selectOption("amix-elite-standard");
  await page
    .getByLabel("Wariant boku dla Szuflada niska 1", { exact: true })
    .selectOption("84");
  await page
    .getByLabel("NL dla Szuflada niska 1 (mm)", { exact: true })
    .fill("500");
  await page
    .getByLabel("Prawa granica dla Szuflada niska 1", { exact: true })
    .selectOption(boundaryId);
  const region = page.getByRole("region", { name: "Systemy szuflad w meblu" });
  await expect(region).toContainText("407 × 474");
  await plateSelect.selectOption(boundaryId);
  await page.getByRole("button", { name: "Usuń płytę", exact: true }).click();
  await expect(region).toContainText("Brak jednoznacznych boków");
  await expect(region.getByRole("table")).toHaveCount(0);
});
test("drawer selections remain editable when saving fails on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await staffApi(page);
  await page.route("**/api/v2/furniture", async (route) => {
    if (route.request().method() === "PUT")
      return route.fulfill({
        status: 409,
        json: { blad: "Model został zmieniony. Szkic zachowany." },
      });
    return route.fallback();
  });
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page
    .getByRole("button", { name: "Ustaw zestaw szuflad", exact: true })
    .click();
  await page
    .getByLabel("System dla Szuflada niska 1", { exact: true })
    .selectOption("amix-elite-standard");
  await page
    .getByLabel("Wariant boku dla Szuflada niska 1", { exact: true })
    .selectOption("84");
  await page
    .getByLabel("NL dla Szuflada niska 1 (mm)", { exact: true })
    .fill("500");
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Model został zmieniony" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("NL dla Szuflada niska 1 (mm)", { exact: true }),
  ).toHaveValue("500");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
