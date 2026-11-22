import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fairKitchenSource } from "../../src/server/fair-kitchen-quote";
import type { Principal } from "../../src/server/access";
const person = {
  user_id: "00000000-0000-4000-8000-000000000001",
  role: "owner",
  active: true,
  display_name: "Właściciel QA",
  email: "qa@example.test",
  project_ids: [],
};
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v2/session", (route) =>
    route.fulfill({ json: person }),
  );
});
test("owner compares a capped multiplier, sees profit, and loses stale results after editing", async ({
  page,
}) => {
  await page.goto("/#/panel/wycena");
  await expect(
    page.getByRole("heading", { name: "Materiał ×2 i kontrola zarobku" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Wstaw przykład do porównania" })
    .click();
  await page.getByRole("button", { name: "Oblicz cenę i zarobek" }).click();
  await expect(page.locator(".fq-result h2")).toContainText(/17.?450/);
  await expect(page.locator(".fq-decision")).toContainText("Ograniczono");
  expect(
    (await new AxeBuilder({ page }).include(".fq-page").analyze()).violations,
  ).toEqual([]);
  await page.getByLabel("Produkcja — osobogodziny", { exact: true }).fill("60");
  await expect(page.locator(".fq-result h2")).toHaveText("Cena i zarobek");
  await page.getByRole("button", { name: "Oblicz cenę i zarobek" }).click();
  await expect(page.locator(".fq-decision")).toContainText("Podniesiono");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz kalkulację wewnętrzną JSON" })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "Pan-Stolarz-kalkulacja-wewnetrzna.json",
  );
});
test("mobile validation explains the margin floor and avoids overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/panel/wycena");
  await page
    .getByRole("button", { name: "Wstaw przykład do porównania" })
    .click();
  await page.locator(".fq-policy summary").click();
  await page
    .getByLabel("Minimalna marża od ceny netto (%)", { exact: true })
    .fill("40");
  await page.getByRole("button", { name: "Oblicz cenę i zarobek" }).click();
  await expect(page.locator(".ps-field-error")).toContainText("Docelowa marża");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("employee cannot see the owner's cost calculator or its navigation", async ({
  page,
}) => {
  await page.route("**/api/v2/session", (route) =>
    route.fulfill({
      json: { ...person, role: "employee", access_profile: "sprzedaz" },
    }),
  );
  await page.goto("/#/panel/wycena");
  await expect(
    page.getByRole("heading", { name: "Brak dostępu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Wyceniarka i zarobek" }),
  ).toHaveCount(0);
});
test("owner loads counted kitchen costs without replacing custom margin settings or the source draft", async ({
  page,
}) => {
  const draft = {
    version: 1,
    layout: "straight",
    width: 3600,
    depth: 3000,
    height: 2600,
    finish: "cashmere",
    items: [
      {
        id: "00000000-0000-4000-8000-000000000099",
        catalogId: "base-shelves-600",
        wall: "a",
      },
    ],
  };
  await page.route("**/api/v2/kitchen-pricing-source", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(draft);
    await route.fulfill({
      json: fairKitchenSource(
        person as Principal,
        route.request().postDataJSON(),
      ),
    });
  });
  await page.addInitScript(
    (d) => localStorage.setItem("pan-stolarz.kuchnia.v1", JSON.stringify(d)),
    draft,
  );
  await page.goto("/#/panel/wycena");
  await page.locator(".fq-policy summary").click();
  await page
    .getByLabel("Minimalna marża od ceny netto (%)", { exact: true })
    .fill("20");
  await page
    .getByRole("button", { name: "Wczytaj koszty bieżącej kuchni" })
    .click();
  await expect(
    page.getByLabel("Materiały i okucia netto (zł)", { exact: true }),
  ).not.toHaveValue("");
  await expect(
    page.getByLabel("Minimalna marża od ceny netto (%)", { exact: true }),
  ).toHaveValue("20");
  await page.getByRole("button", { name: "Oblicz cenę i zarobek" }).click();
  await expect(page.locator(".fq-result table")).toContainText(
    "Dotychczasowy kalkulator kuchni",
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    ),
  ).toEqual(draft);
});
