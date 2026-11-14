import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("shelf cabinet can be edited on a phone with visible shelf clearances", async ({
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
  await page
    .getByRole("combobox", { name: "Liczba półek", exact: true })
    .selectOption("3");
  await page
    .getByRole("combobox", { name: "Głębokość szafki", exact: true })
    .selectOption("600");
  await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
  await expect(page.locator(".kp-cabinet-editor")).toContainText("157,5 mm");
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  expect(stored.items[0].shelves).toBe(3);
  expect(stored.items[0].depth).toBe(600);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../outputs/Kuchnia-edytor-telefon-2026-11-13.png",
    fullPage: true,
  });
});

test("suggested kitchen can be edited, undone and transferred to the drawer calculator", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByRole("button", { name: "Wstaw proponowany układ" }).click();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(12);
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Szafka dolna z szufladami 600" })
    .click();
  await page.getByLabel("Szerokość szafki", { exact: true }).fill("500");
  await page
    .getByRole("combobox", { name: "Liczba szuflad", exact: true })
    .selectOption("4");
  await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
  await expect(
    page.getByLabel("Szerokość szafki", { exact: true }),
  ).toHaveValue("500");
  let saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  expect(saved.items[0].drawers).toBe(4);
  expect(saved.items[0].width).toBe(500);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(
    page.getByLabel("Szerokość szafki", { exact: true }),
  ).toHaveValue("600");
  await page.getByLabel("Szerokość szafki", { exact: true }).fill("500");
  await page
    .getByRole("combobox", { name: "Liczba szuflad", exact: true })
    .selectOption("4");
  await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "../../outputs/Kuchnia-edytor-szafki-2026-11-13.png",
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page })
    .include(".kp-cabinet-editor")
    .analyze();
  expect(axe.violations).toEqual([]);
  await page
    .getByRole("link", { name: "Przelicz szufladę tej szafki" })
    .click();
  await expect(
    page.getByText(/Wczytano wymiary pierwszej szuflady/),
  ).toBeVisible();
  await expect(
    page.getByLabel("Światło korpusu LW", { exact: false }),
  ).toHaveValue("464");
  await expect(
    page.getByLabel("Długość prowadnicy NL", { exact: false }),
  ).toHaveValue("500");
  await expect(page.locator(".drawer-cut").first()).toBeVisible();
  await page.getByRole("link", { name: "Wróć do kreatora kuchni" }).click();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Szafka dolna z szufladami 500" })
    .click();
  await page.getByLabel("Szerokość szafki", { exact: true }).fill("1200");
  await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "poza ścianę" }),
  ).toBeVisible();
  saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  expect(saved.items[0].width).toBe(500);
});

test("public front split distinguishes gaps, persists inputs and hides invalid results", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/kalkulatory/fronty");
  await expect(page.locator(".pc-front-results")).toContainText("480,5");
  await page
    .getByLabel("Szczelina przy każdej krawędzi", { exact: true })
    .fill("0");
  await expect(page.locator(".pc-front-results")).toContainText("483,5");
  await page.reload();
  await expect(
    page.getByLabel("Szczelina przy każdej krawędzi", { exact: true }),
  ).toHaveValue("0");
  await expect(page.locator(".pc-front-results")).toContainText("483,5");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../outputs/Kalkulator-frontow-telefon-2026-11-13.png",
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page }).include(".pc-main").analyze();
  expect(axe.violations).toEqual([]);
  await page.getByLabel("Łączna szerokość", { exact: true }).fill("20");
  await expect(page.locator(".pc-front-results")).toHaveCount(0);
  await expect(
    page.getByRole("alert").filter({ hasText: "Za mało miejsca" }),
  ).toBeVisible();
});

test("slope calculator gives roof dimensions, mirrors geometry and refuses impossible settings", async ({
  page,
}) => {
  await page.goto("/#/kalkulatory/skosy");
  await expect(
    page.getByRole("heading", { name: "Kalkulator skosu", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Długość górnej krawędzi po skosie", { exact: true }),
  ).toBeVisible();
  const before = await page
    .locator(".fc-cut svg path")
    .first()
    .getAttribute("d");
  await page
    .getByRole("checkbox", { name: "Długi bok po lewej stronie" })
    .check();
  expect(
    await page.locator(".fc-cut svg path").first().getAttribute("d"),
  ).not.toBe(before);
  await page.screenshot({
    path: "../../outputs/Kalkulator-skosu-komputer-2026-11-13.png",
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page }).include(".pc-main").analyze();
  expect(axe.violations).toEqual([]);
  await page.getByLabel("Krótki bok", { exact: true }).fill("2400");
  await expect(page.locator(".fc-cut")).toHaveCount(0);
  await page.getByLabel("Krótki bok", { exact: true }).fill("600");
  await expect(
    page.getByRole("alert").filter({ hasText: "przekracza 45" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Krótki bok", { exact: true })).toHaveValue(
    "600",
  );
  await page.getByRole("tab", { name: "Skosy i wieniec" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Podział frontów" }),
  ).toHaveAttribute("aria-selected", "true");
});
