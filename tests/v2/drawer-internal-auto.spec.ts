import { test, expect } from "./staff-fixture";
import AxeBuilder from "@axe-core/playwright";

for (const phone of [false, true])
  test(`internal front automatically follows clear opening minus hinge spacer (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/kalkulatory/szuflady");
    await page
      .getByRole("button", { name: "Wewnętrzny Za drzwiami lub wpuszczany" })
      .click();
    const automatic = page.getByRole("checkbox", {
      name: /Automatyczna szerokość frontu/,
    });
    const width = page.getByRole("textbox", { name: /^Szerokość frontu/ });
    const light = page.getByLabel("Światło korpusu LW", { exact: true });
    await expect(automatic).toBeChecked();
    await expect(width).toHaveValue("528");
    await expect(width).toHaveJSProperty("readOnly", true);
    await expect(page.getByText(/564 − 36 = 528 mm/)).toBeVisible();
    await page
      .getByRole("button", { name: "Zawiasy z prawej", exact: true })
      .click();
    await expect(width).toHaveValue("528");
    await page
      .getByRole("button", { name: "Wymiar zewnętrzny", exact: true })
      .click();
    await page.getByLabel("Szerokość korpusu", { exact: true }).fill("800");
    await expect(width).toHaveValue("728");
    await page
      .getByRole("button", { name: "Światło między bokami", exact: true })
      .click();
    await light.fill("764");
    await automatic.uncheck();
    await expect(width).toHaveValue("728");
    await width.fill("726");
    await light.fill("864");
    await expect(width).toHaveValue("726");
    const response = page.waitForResponse((r) => {
      const u = new URL(r.url());
      return (
        u.pathname.endsWith("/przelicznik-szuflad") &&
        u.searchParams.get("LW") === "864" &&
        u.searchParams.get("szerokoscFrontu") === "828"
      );
    });
    await automatic.check();
    const data = await (await response).json();
    expect(data.LW).toBe(828);
    expect(data.zaDrzwiami.szerokoscFrontu).toBe(828);
    await expect(width).toHaveValue("828");
    await expect(
      page.getByRole("region", { name: "Wymiar frontu meblowego" }),
    ).toContainText("828 × 357");
    await page.reload();
    await expect(automatic).toBeChecked();
    await expect(width).toHaveValue("828");
    await light.fill("35");
    await expect(width).toHaveValue("");
    await expect(page.locator(".drawer-cut")).toHaveCount(0);
    await expect(page.locator(".drawer-drilling")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Pokaż rozkrój i wiercenia" })
      .click();
    await expect(light).toBeFocused();
    await light.fill("564");
    await expect(page.locator(".drawer-cut").first()).toBeVisible();
    await expect(page.locator(".drawer-collision")).not.toContainText(
      "Podaj osobną szerokość",
    );
    const axe = await new AxeBuilder({ page })
      .include(".drawer-calculator")
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await automatic.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `../../outputs/Szuflada-wewnetrzna-auto-${phone ? "telefon" : "komputer"}-2026-11-14.png`,
    });
  });
