import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { staffApi } from "./staff-api-fixture";
test("compact furniture card has real clearances, no long part index and printable diagrams", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByRole("button", { name: "+ Półka", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("500");
  await page.getByRole("button", { name: "Dokumentacja", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz kartę do druku / PDF", exact: true })
    .click();
  const file = await downloading;
  const html = await readFile((await file.path())!, "utf8");
  await page.setContent(html);
  await expect(
    page.getByRole("img", { name: "Wnętrze i światło między półkami" }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Prześwity", exact: true }),
  ).toContainText("482");
  await expect(
    page.getByRole("table", { name: "Prześwity", exact: true }),
  ).toContainText("1464");
  await expect(
    page.getByRole("heading", { name: "Indeks części" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Biblioteka mebli nie zawiera", { exact: false }),
  ).toBeVisible();
  if (process.env.PAN_STOLARZ_QA_CARD_PDF) {
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: process.env.PAN_STOLARZ_QA_CARD_PDF,
      preferCSSPageSize: true,
      printBackground: true,
    });
  }
});
