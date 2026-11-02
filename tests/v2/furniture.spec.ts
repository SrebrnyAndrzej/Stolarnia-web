import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
test("two side heights calculate saw limits and preserve them after saving", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByLabel("Obrys", { exact: true }).selectOption("slope");
  await page
    .getByLabel("Wysokość krótkiej ścianki", { exact: true })
    .fill("1500");
  await page
    .getByLabel("Wysokość długiej ścianki", { exact: true })
    .fill("2000");
  const cutting = page.getByRole("region", { name: "Kalkulator cięcia skosu" });
  await expect(cutting).toContainText("26,57°");
  await expect(cutting).toContainText("1509,0 mm");
  await page.getByLabel("Piła", { exact: true }).selectOption("track");
  await expect(cutting).toContainText("Zagłębiarka:");
  await page
    .getByLabel("Połączenie do obliczeń", { exact: true })
    .selectOption("mitre");
  await expect(cutting).toContainText("58,28°");
  await expect(cutting.getByRole("alert")).toContainText("przekracza 45°");
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
  await page.getByRole("button", { name: /Nowy mebel.*Wersja 1/ }).click();
  await expect(
    page.getByLabel("Wysokość krótkiej ścianki", { exact: true }),
  ).toHaveValue("1500");
});
test("employee creates a sloped model, edits a shelf, saves and reopens it", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await expect(
    page.getByRole("heading", { name: "Kreator mebla", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Nazwa mebla", { exact: true })
    .fill("Szafa pod skosem");
  await page.getByLabel("Obrys", { exact: true }).selectOption("slope");
  await page.getByRole("button", { name: "+ Półka", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("400");
  await page
    .getByRole("button", { name: "Ustaw zestaw szuflad", exact: true })
    .click();
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Zapisano we wspólnej bibliotece" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
  await page
    .getByRole("button", { name: /Szafa pod skosem.*Wersja 1/ })
    .click();
  await expect(page.getByLabel("Obrys", { exact: true })).toHaveValue("slope");
  await page
    .getByLabel("Wybierz płytę", { exact: true })
    .selectOption({ label: "5. Półka" });
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "400",
  );
  await page.getByRole("button", { name: "Usuń płytę", exact: true }).click();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(
    page
      .getByLabel("Wybierz płytę", { exact: true })
      .locator("option")
      .filter({ hasText: "Półka" }),
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("failed shared save keeps the draft and mobile view fits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill({
        json: {
          user_id: "test",
          role: "employee",
          active: true,
          display_name: "Test",
          email: "",
          project_ids: [],
        },
      });
    if (route.request().method() === "PUT")
      return route.fulfill({
        status: 409,
        json: { blad: "Model został zmieniony. Zapisz kopię." },
      });
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByLabel("Nazwa mebla", { exact: true }).fill("Schody testowe");
  await page.getByLabel("Obrys", { exact: true }).selectOption("stairs");
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Zapisz kopię");
  await expect(page.getByLabel("Nazwa mebla", { exact: true })).toHaveValue(
    "Schody testowe",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Zostań w kreatorze", exact: true })
    .click();
  await expect(page.getByLabel("Nazwa mebla", { exact: true })).toHaveValue(
    "Schody testowe",
  );
});
