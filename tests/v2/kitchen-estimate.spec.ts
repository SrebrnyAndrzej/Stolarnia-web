import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("customer configures kitchen, gets server price, PDF and persistent selections", async ({
  page,
  request,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 600",
      exact: false,
    })
    .click();
  for (let i = 0; i < 2; i++)
    await page
      .getByRole("button", {
        name: "Dodaj: Szafka dolna z półkami 600",
        exact: false,
      })
      .click();
  await page
    .getByRole("combobox", { name: "Rodzaj szafek", exact: true })
    .selectOption("drawers");
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z szufladami 600",
      exact: false,
    })
    .click();
  await page
    .getByRole("combobox", { name: "Rodzaj szafek", exact: true })
    .selectOption("appliance");
  await page
    .getByRole("button", { name: "Dodaj: Szafka pod zlew 600", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Dodaj: Zabudowa zmywarki 600", exact: false })
    .click();
  await page
    .getByRole("combobox", { name: "Rodzaj szafek", exact: true })
    .selectOption("wall");
  for (let i = 0; i < 6; i++)
    await page
      .getByRole("button", {
        name: "Dodaj: Szafka wisząca z półkami 600",
        exact: false,
      })
      .click();
  await page.getByRole("button", { name: "Kaszmir", exact: true }).click();
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  const price = page.locator(".kp-quote-price strong");
  await expect(price).toHaveText(/\d.*zł/);
  const original = await price.innerText();
  await page
    .getByRole("combobox", { name: "Wykończenie frontów", exact: true })
    .selectOption("fluted");
  await expect(price).not.toHaveText(original);
  await expect(price).toHaveText(/\d.*zł/);
  await page
    .getByRole("combobox", { name: "Rodzaj blatu", exact: true })
    .selectOption("compact");
  await expect(
    page.getByRole("button", { name: "Pobierz wycenę PDF" }),
  ).toBeEnabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz wycenę PDF" }).click();
  await (
    await download
  ).saveAs("../../outputs/Kalkulator-kuchni-przykladowa-oferta-2026-11-13.pdf");
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "../../outputs/Kalkulator-kuchni-komputer-2026-11-13.png",
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page }).include(".kp-quote").analyze();
  expect(axe.violations).toEqual([]);
  await page.reload();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  await expect(
    page.getByRole("combobox", { name: "Wykończenie frontów", exact: true }),
  ).toHaveValue("fluted");
  await page.getByRole("button", { name: "Przejdź do zapytania" }).click();
  await expect(page.locator('textarea[name="description"]')).toHaveValue(
    /MDF ryflowany/,
  );
  const input = {
    layout: "straight",
    width: 3600,
    depth: 2400,
    height: 2600,
    items: [],
    finish: "white",
  };
  const empty = await request.post("/api/public/kitchen-estimate", {
    data: input,
  });
  expect((await empty.json()).gross).toBeNull();
  expect(
    (
      await request.post("/api/public/kitchen-estimate/pdf", { data: input })
    ).status(),
  ).toBe(422);
  expect(
    (
      await request.post("/api/public/kitchen-estimate", {
        data: { ...input, items: Array(25).fill({}) },
      })
    ).status(),
  ).toBe(400);
});
test("mobile quote has no horizontal overflow; failed recalculation removes old price", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 600",
      exact: false,
    })
    .click();
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  const price = page.locator(".kp-quote-price strong");
  await expect(price).toHaveText(/\d.*zł/);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "../../outputs/Kalkulator-kuchni-telefon-2026-11-13.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.route("**/api/public/kitchen-estimate", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ blad: "Test: brak połączenia" }),
    }),
  );
  await page
    .getByRole("combobox", { name: "Wykończenie frontów", exact: true })
    .selectOption("fluted");
  await expect(price).toHaveText("Cena niedostępna");
  await expect(
    page.getByRole("button", { name: "Pobierz wycenę PDF" }),
  ).toBeDisabled();
  await expect(page.getByText("Test: brak połączenia")).toBeVisible();
});
