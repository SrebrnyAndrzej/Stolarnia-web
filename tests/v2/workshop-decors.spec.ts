import { test, expect } from "@playwright/test";
import { USTAWIENIA_DOMYSLNE } from "../../src/core/settings";
import AxeBuilder from "@axe-core/playwright";
test("owner saves and removes a workshop decor through a keyboard-contained picker", async ({
  page,
}) => {
  let keys: string[] = [];
  const decor = {
    key: "egger:test",
    id: "TEST",
    manufacturer: "Egger",
    name: "Dąb testowy",
    obraz: "/brand/pan-stolarz.png",
    maBlat: false,
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill({
        json: {
          role: "owner",
          active: true,
          user_id: "test",
          project_ids: [],
          display_name: "Test",
        },
      });
    if (path.endsWith("/ustawienia"))
      return route.fulfill({ json: USTAWIENIA_DOMYSLNE });
    if (path.endsWith("/dekory-stolarni")) {
      if (route.request().method() === "PUT")
        keys = route.request().postDataJSON().klucze;
      return route.fulfill({
        json: { zrodlo: keys.length ? "stolarnia" : "brak", klucze: keys },
      });
    }
    if (path.endsWith("/dekory")) return route.fulfill({ json: [decor] });
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/ustawienia");
  await page.getByRole("button", { name: "Dodaj dekor", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Dekor: dodaj do dekorów stolarni",
  });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(el=>el.matches(":modal"))).toBe(true);
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await dialog.getByText("Dąb testowy", { exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Usuń dekor Dąb testowy", exact: true }),
  ).toBeVisible();
  expect(keys).toEqual([decor.key]);
  const a11y = await new AxeBuilder({ page })
    .include('[data-testid="workshop-decors"]')
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Usuń dekor Dąb testowy", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Usuń dekor Dąb testowy", exact: true }),
  ).toHaveCount(0);
  expect(keys).toEqual([]);
});
