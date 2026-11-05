import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
import AxeBuilder from "@axe-core/playwright";
test("separate 3D colours persist and undo without changing workshop materials", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("drawers");
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  await page
    .getByRole("button", { name: "Grafitowe fronty", exact: true })
    .click();
  await expect(
    page.getByLabel("Kolor frontów (podgląd)", { exact: true }),
  ).toHaveValue("#435058");
  await expect(
    page.getByLabel("Kolor korpusu (podgląd)", { exact: true }),
  ).toHaveValue("#cfba94");
  await page.getByRole("button", { name: "Materiały", exact: true }).click();
  const material = await page
    .getByLabel("Materiał korpusu", { exact: true })
    .inputValue();
  expect(material).toBe("");
  await page
    .getByRole("button", { name: "Zamknij panel", exact: true })
    .click();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(
    page.getByLabel("Kolor frontów (podgląd)", { exact: true }),
  ).toHaveValue("#e2d9c8");
  await page.getByRole("button", { name: "Ponów", exact: true }).click();
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
  await page.getByRole("tab", { name: "Biblioteka", exact: true }).click();
  await page.getByRole("button", { name: /Nowy mebel.*Wersja 1/ }).click();
  await expect(
    page.getByLabel("Kolor frontów (podgląd)", { exact: true }),
  ).toHaveValue("#435058");
  expect(
    (await new AxeBuilder({ page }).include(".fc-drawing").analyze())
      .violations,
  ).toEqual([]);
  if (process.env.PAN_STOLARZ_QA_APPEARANCE_SCREENSHOT) {
    await page.locator(".fc-drawing canvas").waitFor();
    await page
      .locator(".fc-drawing")
      .screenshot({ path: process.env.PAN_STOLARZ_QA_APPEARANCE_SCREENSHOT });
  }
});
test("3D compartment picking shares selection with the equipment editor", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.getByRole("tab", { name: "Komora", exact: true }).click();
  await page
    .getByRole("button", { name: "Rozpocznij układ komór", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Podziel pionowo", exact: true })
    .click();
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  await page
    .getByRole("button", { name: "Zaznaczaj komory", exact: true })
    .click();
  await expect(
    page.getByLabel("Pokaż fronty", { exact: true }),
  ).not.toBeChecked();
  const pick = page.getByLabel("Komora w widoku 3D", { exact: true });
  const second = await pick.locator("option").nth(2).getAttribute("value");
  await pick.selectOption(second!);
  await page.getByRole("tab", { name: "Widok", exact: true }).click();
  await page
    .getByRole("button", { name: "Pokaż ustawienia komory", exact: true })
    .click();
  await expect(page.getByLabel("Wybierz komorę", { exact: true })).toHaveValue(
    second!,
  );
  await expect(
    page.getByLabel("Wybierz komorę", { exact: true }),
  ).toBeFocused();
  await page.getByRole("tab", { name: "Widok", exact: true }).click();
  await page.getByRole("button", { name: "Na wprost", exact: true }).click();
  await pick.selectOption("");
  const canvas = page.locator(".fc-drawing canvas");
  const box = await canvas.boundingBox();
  for (const ratio of [0.44, 0.48, 0.52, 0.56]) {
    await canvas.click({
      position: { x: box!.width * ratio, y: box!.height * 0.5 },
    });
    if (await pick.inputValue()) break;
  }
  await expect(pick).not.toHaveValue("");
});
