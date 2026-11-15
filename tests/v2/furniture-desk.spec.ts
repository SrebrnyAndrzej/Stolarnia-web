import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
test("desk preset applies researched dimensions and persists an editable desk", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.getByLabel("Układ startowy", { exact: true }).selectOption("desk");
  await expect(page.getByLabel("Wysokość", { exact: true })).toHaveValue("740");
  await expect(page.getByLabel("Głębokość", { exact: true })).toHaveValue(
    "800",
  );
  await expect(page.getByLabel("Szerokość", { exact: true })).toHaveValue(
    "1600",
  );
  await expect(page.getByLabel("Obrys", { exact: true })).toBeDisabled();
  await expect(
    page
      .getByLabel("Wybierz płytę", { exact: true })
      .locator("option")
      .filter({ hasText: "Blat biurka" }),
  ).toHaveCount(1);
  await page.getByLabel("Wysokość", { exact: true }).fill("750");
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
  await expect(page.getByLabel("Układ startowy", { exact: true })).toHaveValue(
    "desk",
  );
  await expect(page.getByLabel("Wysokość", { exact: true })).toHaveValue("750");
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_DESK) {
    await page.locator(".fc-drawing").scrollIntoViewIfNeeded();
    await page.screenshot({ path: process.env.PAN_STOLARZ_QA_SCREENSHOT_DESK });
  }
});
test("compact desk preset and undo work on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.getByLabel("Układ startowy", { exact: true }).selectOption("desk");
  await page
    .getByRole("button", { name: "Biurko kompaktowe 120 × 80 cm", exact: true })
    .click();
  await expect(page.getByLabel("Szerokość", { exact: true })).toHaveValue(
    "1200",
  );
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(page.getByLabel("Szerokość", { exact: true })).toHaveValue(
    "1600",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
