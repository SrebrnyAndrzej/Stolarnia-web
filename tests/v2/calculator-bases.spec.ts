import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { staffApi } from "./staff-api-fixture";
for (const mobile of [false, true])
  test(`calculator explicitly distinguishes runner reference bases (${mobile ? "phone" : "desktop"})`, async ({
    page,
    request,
    baseURL,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await staffApi(page);
    await page.route(
      /\/api\/(?:systemy-szuflad|przelicznik-szuflad)(?:\?|$)/,
      async (r) => {
        const u = new URL(r.request().url());
        const response = await request.get(
          new URL(
            u.pathname.replace("/api/", "/api/demo/") + u.search,
            baseURL,
          ).toString(),
        );
        await r.fulfill({ response });
      },
    );
    await page.goto("/#/panel/szuflady");
    await page.getByRole("checkbox", { name: /Rozstaw kilku szuflad/ }).check();
    const thickness = page.getByLabel("Grubość dolnego wieńca opcjonalnie", {
      exact: true,
    });
    const results = page.getByRole("region", {
      name: "Wysokości prowadnic",
      exact: true,
    });
    await expect(results).toContainText("Brak wymiaru nie oznacza 0 mm");
    await thickness.fill("18");
    await expect(results.locator("tbody tr").nth(0)).toHaveText("1321");
    await expect(results.locator("tbody tr").nth(1)).toHaveText("2363381");
    await expect(
      page.getByText("Obliczenie robocze", { exact: true }),
    ).toBeVisible();
    await thickness.fill("101");
    await expect(
      page.getByText("Grubość wieńca nie może przekraczać 100 mm.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(results).toHaveCount(0);
    await thickness.fill("18");
    await expect(results).toBeVisible();
    await results.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page }).include(".drawer-calculator").analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({
      path: `../../outputs/Kalkulator-dwie-bazy-${mobile ? "telefon" : "desktop"}-2026-11-12.png`,
    });
    await thickness.fill("");
    await expect(results).toContainText("Brak wymiaru nie oznacza 0 mm");
    await expect(results.locator("tbody tr").first()).toContainText("—");
  });
