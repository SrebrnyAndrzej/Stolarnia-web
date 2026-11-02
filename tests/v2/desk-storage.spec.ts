import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";

test("desk cabinets and hutch remain editable and persist in the library", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("desk-hutch");
  await expect(
    page.getByLabel("Wysokość blatu roboczego", { exact: true }),
  ).toHaveValue("740");
  await page.getByLabel("Strona szafki", { exact: true }).selectOption("both");
  await expect(
    page.getByLabel("Szerokość szafki bocznej", { exact: true }),
  ).toHaveValue("375");
  await page
    .getByLabel("Front szafki", { exact: true })
    .selectOption("drawers");
  await expect(
    page
      .getByLabel("Wybierz płytę", { exact: true })
      .locator("option")
      .filter({ hasText: "Szuflada szafki" }),
  ).toHaveCount(6);
  await page
    .getByLabel("Wysokość nadstawki nad blatem", { exact: true })
    .fill("760");
  await expect(
    page.getByLabel("Wysokość całkowita z nadstawką", { exact: true }),
  ).toHaveValue("1500");
  await expect(
    page.getByLabel("Wysokość blatu roboczego", { exact: true }),
  ).toHaveValue("740");
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
  await expect(page.getByLabel("Strona szafki", { exact: true })).toHaveValue(
    "both",
  );
  await expect(page.getByLabel("Front szafki", { exact: true })).toHaveValue(
    "drawers",
  );
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_DESK_STORAGE) {
    await page.locator(".fc-drawing").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_DESK_STORAGE,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Front szafki", { exact: true }).selectOption("door");
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(page.getByLabel("Front szafki", { exact: true })).toHaveValue(
    "drawers",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
