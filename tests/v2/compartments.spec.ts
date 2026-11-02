import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
test("compartments lock dimensions, resize shelves, save, reopen and export documentation", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByRole("button", { name: "Rozpocznij układ komór", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Podziel pionowo", exact: true })
    .click();
  const select = page.getByLabel("Wybierz komorę", { exact: true });
  const options = await select.locator("option").all();
  const left = (await options[1].getAttribute("value"))!,
    right = (await options[2].getAttribute("value"))!;
  await select.selectOption(left);
  await page
    .getByLabel("Zablokuj szerokość tej komory", { exact: true })
    .check();
  await page
    .getByLabel("Zablokowany wymiar komory", { exact: true })
    .fill("300");
  await page
    .getByLabel("Wyposażenie komory", { exact: true })
    .selectOption("shelves");
  await select.selectOption(right);
  await page
    .getByLabel("Front komory", { exact: true })
    .selectOption("drawers");
  await page.getByLabel("Szerokość", { exact: true }).fill("1400");
  await select.selectOption(left);
  await expect(
    page.getByLabel("Zablokowany wymiar komory", { exact: true }),
  ).toHaveValue("300");
  await expect(
    page.getByText("300 × 1964 × 560 mm", { exact: true }),
  ).toBeVisible();
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
  await select.selectOption(right);
  await expect(page.getByLabel("Front komory", { exact: true })).toHaveValue(
    "drawers",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz części CSV", exact: true })
    .click();
  const csv = await download;
  expect(await readFile((await csv.path())!, "utf8")).toContain(
    "SZKIC — nie do produkcji",
  );
  const labelDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz etykiety części z QR", exact: true })
    .click();
  const labels = await readFile((await (await labelDownload).path())!, "utf8");
  expect(labels).toContain("data:image/png;base64,");
  expect(labels).toContain("wersja biblioteki się zmieni");
  const dxfDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz obrysy DXF", exact: true })
    .click();
  const dxf = await readFile((await (await dxfDownload).path())!, "utf8");
  expect(dxf.includes("LWPOLYLINE")).toBeTruthy();
  const libraryId = csv
    .suggestedFilename()
    .match(/^czesci-(.+)-v1-szkic.csv$/)![1];
  const partId = await page
    .getByLabel("Wybierz płytę", { exact: true })
    .locator("option")
    .nth(1)
    .getAttribute("value");
  await page.goto(`/#/panel/meble?model=${libraryId}&version=1&part=${partId}`);
  await expect(
    page.getByRole("status").filter({ hasText: "Otworzono część z etykiety" }),
  ).toBeVisible();
  await expect(page.getByLabel("Wybierz płytę", { exact: true })).toHaveValue(
    partId!,
  );
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  await expect(
    page.getByTestId("furniture-scene").locator("canvas"),
  ).toBeVisible();
  await page.getByLabel("Otwórz fronty", { exact: true }).check();
  await page.getByLabel("Widok rozstrzelony", { exact: true }).check();
  await page.getByLabel("Widok rozstrzelony", { exact: true }).uncheck();
  await page.getByLabel("Otwórz fronty", { exact: true }).uncheck();
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_COMPARTMENTS) {
    await page.locator(".fc-drawing").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_COMPARTMENTS,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const axe = await new AxeBuilder({ page })
    .include(".fc-compartments")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    axe.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
});
test("invalid locks are recoverable and niche obstacles are saved separately from furniture dimensions", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByRole("button", { name: "Rozpocznij układ komór", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Podziel pionowo", exact: true })
    .click();
  await page
    .getByLabel("Wybierz komorę", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByLabel("Zablokuj szerokość tej komory", { exact: true })
    .check();
  await page
    .getByLabel("Zablokowany wymiar komory", { exact: true })
    .fill("5000");
  await expect(
    page.locator(".fc-compartments").getByRole("alert"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await page
    .getByLabel("Sprawdzaj dopasowanie do wnęki", { exact: true })
    .check();
  await page.getByLabel("Szerokość wnęki", { exact: true }).fill("800");
  await expect(page.getByLabel("Szerokość", { exact: true })).toHaveValue(
    "1000",
  );
  await page
    .getByRole("button", { name: "Dodaj przeszkodę", exact: true })
    .click();
  await expect(
    page.getByLabel("Nazwa przeszkody", { exact: true }),
  ).toHaveValue("Belka / przeszkoda");
  await page.getByText(/Kontrola konstrukcji i wnęki ·/).click();
  await expect(
    page.getByText("Mebel i luzy boczne przekraczają szerokość wnęki.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("library furniture is placed as a pinned version in the room", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Zapisano we wspólnej bibliotece" }),
  ).toBeVisible();
  await page
    .getByLabel("Sprawdzaj dopasowanie do wnęki", { exact: true })
    .check();
  await page.getByLabel("Szerokość wnęki", { exact: true }).fill("4000");
  await page
    .getByLabel("Model do wstawienia", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("button", { name: "Wstaw mebel z biblioteki", exact: true })
    .click();
  await expect(
    page.getByLabel("Mebel w pomieszczeniu: X", { exact: true }),
  ).toHaveValue("1100");
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  await expect(
    page.getByTestId("furniture-scene").locator("canvas"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Widok początkowy", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Zapisano we wspólnej bibliotece" }),
  ).toBeVisible();
});
