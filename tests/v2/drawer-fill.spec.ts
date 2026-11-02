import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
test("drawer fill follows a shelf and persists, manual front changes switch to fixed mode", async ({
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
  await expect(
    page.getByLabel("Wypełnij szufladami całą komorę", { exact: true }),
  ).toBeChecked();
  const options = page.getByLabel("Wybierz płytę", { exact: true });
  const high = options.locator("option").filter({ hasText: "Szuflada wysoka" });
  const highId = await high.getAttribute("value");
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_FILL_FULL) {
    await page.locator(".fc-drawing").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_FILL_FULL,
    });
  }
  await page.getByRole("button", { name: "+ Półka", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("800");
  await options.selectOption(highId!);
  const top =
    Number(await page.getByLabel("Pozycja Y", { exact: true }).inputValue()) +
    Number(
      await page.getByLabel("Wysokość płyty", { exact: true }).inputValue(),
    );
  expect(top).toBe(798);
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Zapisano we wspólnej bibliotece" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
  await page.getByRole("button", { name: /Nowy mebel.*Wersja 1/ }).click();
  await expect(
    page.getByLabel("Wypełnij szufladami całą komorę", { exact: true }),
  ).toBeChecked();
  await options.selectOption(highId!);
  await page.getByLabel("Wysokość płyty", { exact: true }).fill("200");
  await expect(
    page.getByLabel("Wypełnij szufladami całą komorę", { exact: true }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(
    page.getByLabel("Wypełnij szufladami całą komorę", { exact: true }),
  ).toBeChecked();
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_FILL) {
    await page.locator(".fc-drawing").scrollIntoViewIfNeeded();
    await page.screenshot({ path: process.env.PAN_STOLARZ_QA_SCREENSHOT_FILL });
  }
});

test("a custom count fills both desk cabinets and survives resizing and front replacement", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("desk-hutch");
  await page.getByLabel("Strona szafki", { exact: true }).selectOption("both");
  await page.getByLabel("Liczba: niskie", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Ustaw zestaw szuflad", exact: true })
    .click();
  const fronts = page
    .getByLabel("Wybierz płytę", { exact: true })
    .locator("option")
    .filter({ hasText: "Szuflada" });
  await expect(fronts).toHaveCount(8);
  await page
    .getByLabel("Wysokość całkowita z nadstawką", { exact: true })
    .fill("1500");
  await expect(fronts).toHaveCount(8);
  await page.getByLabel("Front szafki", { exact: true }).selectOption("door");
  await expect(fronts).toHaveCount(0);
  await page
    .getByLabel("Front szafki", { exact: true })
    .selectOption("drawers");
  await expect(fronts).toHaveCount(6);
});
