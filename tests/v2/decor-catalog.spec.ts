import { test, expect } from "@playwright/test";
test("catalog selection persists in planner, supports search and phone layout", async ({
  page,
  request,
}) => {
  await page.route("**/api/**", async (route) => {
    const u = new URL(route.request().url());
    await route.fulfill({
      response: await request.get(
        "http://127.0.0.1:3219" + u.pathname + u.search,
      ),
    });
  });
  await page.goto("/#/katalog-dekorow");
  await expect(
    page.getByRole("heading", { name: "Katalog dekorów", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Szukaj dekoru").fill("H1384");
  await expect(
    page.getByRole("link", { name: "Wybierz do kuchni" }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Wybierz do kuchni" }).first().click();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await expect(
    page.getByText("Dąb Casella biały", { exact: false }).first(),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("pan-stolarz.kuchnia.v1")),
    )
    .not.toBeNull();
  await page.reload();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await expect(
    page.getByText("Dąb Casella biały", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Wybierz dekor z katalogu" }).click();
  await page.getByLabel("Szukaj dekoru").fill("nieistniejacy-dekor");
  await expect(
    page.getByText("Nie znaleziono dekorów.", { exact: false }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("home exposes decor navigation and manual brand carousel", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Katalog dekorów", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Następne logotypy" })
    .scrollIntoViewIfNeeded();
  await expect(
    page
      .getByRole("region", { name: "Marki materiałów i okuć" })
      .getByRole("img"),
  ).toHaveCount(19);
  await page.getByRole("button", { name: "Następne logotypy" }).click();
});
