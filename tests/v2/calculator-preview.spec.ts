import { test, expect } from "@playwright/test";
test("calculator works without login, recalculates, and leaves project API protected", async ({
  page,
  request,
}) => {
  const api = "http://127.0.0.1:3219";
  const catalog = await request.get(api + "/api/demo/systemy-szuflad");
  expect(catalog.ok()).toBe(true);
  const response = await request.get(
    api +
      "/api/demo/przelicznik-szuflad?LW=564&NL=550&profilId=amix-elite-standard&wariant=199",
  );
  expect(response.ok()).toBe(true);
  expect((await response.json()).LW).toBe(564);
  expect((await request.get(api + "/api/v2/projects")).ok()).toBe(false);
  await page.route("**/api/demo/**", async (route) => {
    const u = new URL(route.request().url());
    await route.fulfill({
      response: await request.get(api + u.pathname + u.search),
    });
  });
  await page.goto("/#/podglad/employee/szuflady");
  await expect(
    page.getByText("Domyślne ustawienia konstrukcji", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Zaloguj się do kalkulatora" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Nie udało się pobrać systemów szuflad."),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
