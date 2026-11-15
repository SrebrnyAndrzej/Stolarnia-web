import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
import AxeBuilder from "@axe-core/playwright";
test("drawing dimensions edit the draft with keyboard, validation and undo", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByRole("button", { name: "+ Półka", exact: true }).click();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("500");
  await page.getByLabel("Pokaż wymiary", { exact: true }).check();
  const gap = page.getByRole("button", {
    name: "Zmień prześwit 1: 482 mm",
    exact: true,
  });
  await gap.focus();
  await gap.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Zmień wymiar na rysunku" });
  await dialog.getByRole("textbox").fill("350");
  if (process.env.PAN_STOLARZ_QA_DIMENSION_SCREENSHOT)
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_DIMENSION_SCREENSHOT,
    });
  await dialog
    .getByRole("button", { name: "Zastosuj wymiar", exact: true })
    .click();
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "368",
  );
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "500",
  );
  await page
    .getByRole("button", {
      name: "Zmień szerokość mebla: 1000 mm",
      exact: true,
    })
    .click();
  await dialog.getByRole("textbox").fill("1200");
  await dialog
    .getByRole("button", { name: "Zastosuj wymiar", exact: true })
    .click();
  await expect(page.getByLabel("Szerokość", { exact: true })).toHaveValue(
    "1200",
  );
  await page
    .getByRole("button", {
      name: "Zmień szerokość mebla: 1200 mm",
      exact: true,
    })
    .click();
  await dialog.getByRole("textbox").fill("-1");
  await dialog
    .getByRole("button", { name: "Zastosuj wymiar", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Szerokość", { exact: true })).toHaveValue(
    "1200",
  );
  expect(
    (await new AxeBuilder({ page }).include(".fc-dimension-dialog").analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(
    (await new AxeBuilder({ page }).include(".fc").analyze()).violations,
  ).toEqual([]);
});
test("click a compartment dimension to lock, resize, save and restore automatic sizing", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.getByRole("tab", { name: "Komora", exact: true }).click();
  await page
    .getByRole("button", { name: "Rozpocznij układ komór", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Podziel poziomo", exact: true })
    .click();
  const first = page.locator('.fc-compartment-area [role="button"]').first();
  await first.click();
  const dialog = page.getByRole("dialog", { name: "Zmień wymiar na rysunku" });
  await dialog.getByRole("textbox").fill("350");
  await dialog
    .getByRole("button", { name: "Ustaw i zablokuj", exact: true })
    .click();
  await page.getByLabel("Szybka wysokość", { exact: true }).fill("2400");
  const select = page.getByLabel("Wybierz komorę", { exact: true });
  const options = await select.locator("option").all();
  await select.selectOption((await options[1].getAttribute("value"))!);
  await expect(
    page.getByLabel("Zablokowany wymiar komory", { exact: true }),
  ).toHaveValue("350");
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
  await page.getByRole("tab", { name: "Biblioteka", exact: true }).click();
  await page.getByRole("button", { name: /Nowy mebel.*Wersja 1/ }).click();
  await page.locator('.fc-compartment-area [role="button"]').first().click();
  await expect(dialog.getByRole("textbox")).toHaveValue("350");
  await dialog
    .getByRole("button", { name: "Przywróć wymiar automatyczny", exact: true })
    .click();
  await select.selectOption(
    (await select.locator("option").nth(1).getAttribute("value"))!,
  );
  await expect(
    page.getByLabel("Zablokuj wysokość tej komory", { exact: true }),
  ).not.toBeChecked();
});
