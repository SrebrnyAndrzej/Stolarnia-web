import { test, expect } from "@playwright/test";
test("owner saves a draft, reopens it, and exports Mussi CSV without sending", async ({
  page,
}) => {
  let orders: any[] = [];
  let exports = 0;
  let writes = 0;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill({
        json: {
          user_id: "owner",
          role: "owner",
          active: true,
          display_name: "Test",
          email: "",
          project_ids: [],
        },
      });
    if (path.endsWith("/purchase-orders/connection"))
      return route.fulfill({
        json: {
          automaticSendingAvailable: false,
          message: "Mussi nie zapisuje jeszcze zamówień trwale.",
        },
      });
    if (path.endsWith("/purchase-orders/projects"))
      return route.fulfill({
        json: [{ id: "p1", nazwa: "Kuchnia", rewizja: 4 }],
      });
    if (path.endsWith("/export")) {
      exports++;
      return route.fulfill({
        json: {
          filename: "mussi-test.csv",
          csv: 'indeks;ilosc;jednostka;uwagi\r\n"BLU-CLIP-110";4;"szt";""\r\n',
          sent: false,
        },
      });
    }
    if (path.endsWith("/purchase-orders")) {
      if (route.request().method() === "PUT") {
        writes++;
        const input = route.request().postDataJSON();
        expect(input.status).toBeUndefined();
        expect(input.createdBy).toBeUndefined();
        const entry = {
          ...input,
          status: "draft",
          version: input.version + 1,
          createdBy: "owner",
          updatedBy: "owner",
          updatedAt: new Date().toISOString(),
        };
        orders = [entry];
        return route.fulfill({ json: entry });
      }
      return route.fulfill({ json: orders });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/panel/zamowienia");
  await page
    .getByLabel("Nazwa zamówienia", { exact: true })
    .fill("Materiały do kuchni");
  await page.getByLabel("Projekt źródłowy", { exact: true }).selectOption("p1");
  await page.getByLabel("Nazwa pozycji", { exact: true }).fill("Zawias");
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Zapisano szkic zamówienia" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Pobierz CSV koszyka Mussi",
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByLabel("Indeks Mussi", { exact: true }).fill("BLU-CLIP-110");
  await page.getByLabel("Ilość", { exact: true }).fill("4");
  await page.getByLabel("Jednostka", { exact: true }).selectOption("szt");
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Automatyczne wysłanie — niedostępne",
      exact: true,
    }),
  ).toBeDisabled();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz CSV koszyka Mussi", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("mussi-test.csv");
  await expect(
    page.getByRole("status").filter({ hasText: "Pobrano CSV koszyka" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Nowe zamówienie", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Materiały do kuchni.*Wersja 2/ })
    .click();
  await expect(page.getByLabel("Indeks Mussi", { exact: true })).toHaveValue(
    "BLU-CLIP-110",
  );
  expect(writes).toBe(2);
  expect(exports).toBe(1);
});
test("employee cannot see or create purchase orders", async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: {
        user_id: "employee",
        role: "employee",
        active: true,
        display_name: "Test",
        email: "",
        project_ids: [],
      },
    }),
  );
  await page.goto("/#/panel/zamowienia");
  await expect(
    page.getByRole("heading", { name: "Brak dostępu", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zapisz szkic", exact: true }),
  ).toHaveCount(0);
});
test("mobile failed save preserves lines and guards navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill({
        json: {
          user_id: "owner",
          role: "owner",
          active: true,
          display_name: "Test",
          email: "",
          project_ids: [],
        },
      });
    if (route.request().method() === "PUT")
      return route.fulfill({
        status: 409,
        json: { blad: "Szkic zmienił się w innym oknie." },
      });
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/panel/zamowienia");
  await page
    .getByLabel("Nazwa zamówienia", { exact: true })
    .fill("Zamówienie testowe");
  await page.getByLabel("Nazwa pozycji", { exact: true }).fill("Płyta");
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("innym oknie");
  await expect(page.getByLabel("Nazwa pozycji", { exact: true })).toHaveValue(
    "Płyta",
  );
  await page
    .getByRole("button", { name: "Nowe zamówienie", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Zostań w edytorze", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
