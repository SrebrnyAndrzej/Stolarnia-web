import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("owner records order and partial delivery with revision checks and preserved edits after error", async ({
  page,
}) => {
  let state: any = { stan: "doZamowienia" },
    fail = true;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill({
        json: {
          user_id: "owner",
          role: "owner",
          active: true,
          project_ids: [],
          display_name: "Test",
        },
      });
    if (path.endsWith("/purchase-orders/projects"))
      return route.fulfill({
        json: [{ id: "project", nazwa: "Projekt testowy", rewizja: 3 }],
      });
    if (path.endsWith("/connection"))
      return route.fulfill({
        json: {
          automaticSendingAvailable: false,
          message: "Wysyłka wyłączona",
        },
      });
    if (path.endsWith("/zamowienie/status")) {
      const body = route.request().postDataJSON();
      expect(body.expectedRevision).toBe(3);
      expect(body.expectedQuantity).toBe(2);
      expect(body.expectedUpdatedAt).toBe(state.zmieniono ?? null);
      if (fail) {
        fail = false;
        return route.fulfill({
          status: 503,
          json: { blad: "Testowy błąd zapisu" },
        });
      }
      state = {
        stan: body.stan,
        zmieniono: new Date().toISOString(),
        iloscDostarczona: body.iloscDostarczona,
      };
      return route.fulfill({ json: { status: state } });
    }
    if (path.endsWith("/zamowienie"))
      return route.fulfill({
        json: {
          projekt: { id: "project", nazwa: "Projekt testowy", rewizja: 3 },
          zrodlo: { rodzaj: "rewizja", rewizja: 3 },
          wariant: "standard",
          pozycje: [
            {
              klucz: "plyta|test|18",
              rodzaj: "plyta",
              kod: "TEST-18",
              nazwa: "Płyta testowa",
              ilosc: 2,
              jednostka: "ark.",
              uwagi: [],
              status: state,
            },
          ],
          grupy: [{ dostawca: "Dostawca", klucze: ["plyta|test|18"] }],
          nieaktualne: [],
          ostrzezenia: [],
        },
      });
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/panel/zamowienia");
  await page
    .getByText("Zestawienie projektu i dostawy", { exact: true })
    .click();
  await page
    .getByLabel("Projekt do zestawienia", { exact: true })
    .selectOption("project");
  await page
    .getByRole("button", { name: "Zmień status Płyta testowa", exact: true })
    .click();
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(page.getByText(/Testowy błąd zapisu/)).toBeVisible();
  await expect(page.getByLabel("Nowy status")).toHaveValue("zamowione");
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await page
    .getByRole("button", { name: "Zmień status Płyta testowa", exact: true })
    .click();
  await page.getByLabel("Nowy status").selectOption("czesciowo");
  await page.getByLabel("Dostarczona ilość").fill("1");
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(page.getByText("częściowo", { exact: true })).toBeVisible();
  const result = await new AxeBuilder({ page })
    .include(".po-supplier-table")
    .analyze();
  expect(result.violations).toEqual([]);
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_SUPPLIER)
    await page.screenshot({
      path: process.env.PAN_STOLARZ_QA_SCREENSHOT_SUPPLIER,
    });
});
