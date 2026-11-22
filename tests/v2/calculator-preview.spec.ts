import { test, expect } from "./staff-fixture";

test("authenticated employee recalculates through the legacy link while project API remains protected", async ({
  page,
}) => {
  await page.goto("/#/podglad/employee/szuflady");
  await expect(page).toHaveURL(/#\/panel\/szuflady$/);
  await expect(page.locator(".drawer-cut").first()).toBeVisible();
  await page.getByLabel("Światło korpusu LW", { exact: false }).fill("564");
  await page.getByLabel("Długość prowadnicy NL", { exact: false }).fill("550");
  await expect(page.locator(".drawer-cut").first()).toBeVisible();
  const result = await page.request.get(
    "/api/przelicznik-szuflad?LW=564&NL=550&profilId=amix-elite-standard&wariant=199",
  );
  expect(result.ok()).toBe(true);
  expect((await result.json()).LW).toBe(564);
  expect((await page.request.get("/api/v2/projects")).status()).toBe(401);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
