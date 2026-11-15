import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { staffApi } from "./staff-api-fixture";
test("two selected shelves show surface gap in 2D and 3D, update on edit and undo, fit mobile", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  for (const y of ["500", "800"]) {
    await page.getByRole("button", { name: "+ Półka", exact: true }).click();
    await page.getByLabel("Pozycja Y", { exact: true }).fill(y);
  }
  await page.getByRole("tab", { name: "Części", exact: true }).click();
  const checked = page.getByLabel("Zaznacz część: Półka", { exact: true });
  await checked.nth(0).check();
  await checked.nth(1).check();
  const measurement = page.getByRole("region", {
    name: "Pomiar między częściami",
  });
  await expect(
    measurement.getByLabel("Najmniejsza odległość między bryłami"),
  ).toHaveText("282 mm");
  await expect(page.getByLabel("Linia pomiaru między częściami")).toContainText(
    "Odstęp 282 mm",
  );
  await page.getByLabel("Pozycja Y", { exact: true }).fill("900");
  await expect(
    measurement.getByLabel("Najmniejsza odległość między bryłami"),
  ).toHaveText("382 mm");
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(
    measurement.getByLabel("Najmniejsza odległość między bryłami"),
  ).toHaveText("282 mm");
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  const canvas = page.locator(".fc-drawing canvas");
  await expect(canvas).toBeVisible();
  await expect(
    measurement.getByLabel("Najmniejsza odległość między bryłami"),
  ).toBeInViewport();
  const withLine = await canvas.screenshot();
  await page
    .getByRole("button", { name: "Wyczyść zaznaczenie", exact: true })
    .click();
  expect((await canvas.screenshot()).equals(withLine)).toBeFalsy();
  await checked.nth(0).check();
  await checked.nth(1).check();
  expect(
    (await new AxeBuilder({ page }).include(".fc-studio").analyze()).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "../../outputs/Kreator-pomiar-2026-11-07.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("group", { name: "Obszar kreatora" })
    .getByRole("button", { name: "Narzędzia", exact: true })
    .click();
  await expect(measurement).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
