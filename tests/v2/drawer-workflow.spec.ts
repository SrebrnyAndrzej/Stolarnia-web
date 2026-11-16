import { test, expect } from "./staff-fixture";
import AxeBuilder from "@axe-core/playwright";

for (const phone of [false, true])
  test(`drawer workflow preserves calculator work and returns to the same front (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      if (!localStorage.getItem("stolarnia.kalkulator-szuflad.v1"))
        localStorage.setItem(
          "stolarnia.kalkulator-szuflad.v1",
          JSON.stringify({ lw: "700" }),
        );
    });
    await page.goto("/#/kreator-kuchni");
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await page
      .getByRole("combobox", { name: "Rodzaj szafek", exact: true })
      .selectOption("drawers");
    await page
      .getByRole("button", { name: /Dodaj: Szafka dolna z szufladami 600/ })
      .click();
    await page
      .getByLabel("Front do przeliczenia", { exact: true })
      .selectOption("FRONT-SZ02");
    const link = page.getByRole("link", {
      name: "Przelicz szufladę tej szafki",
    });
    const q = new URLSearchParams(
      (await link.getAttribute("href"))!.split("?")[1],
    );
    const originalHeight = q.get("height")!,
      editedHeight = String(Number(originalHeight) + 5);
    await link.click();
    const hole = page.getByLabel("Pierwszy otwór od dołu frontu opcjonalnie", {
      exact: true,
    });
    const height = page.getByLabel("Wysokość frontu", { exact: true });
    await height.fill(editedHeight);
    await hole.fill("50");
    await expect(
      page.getByRole("region", { name: "Wymiar frontu meblowego" }),
    ).toContainText(Number(editedHeight).toLocaleString("pl-PL"));
    await expect(page.locator(".drawer-hole-list ol")).toBeVisible();
    await page.reload();
    await expect(height).toHaveValue(editedHeight);
    await expect(hole).toHaveValue("50");
    await page
      .getByRole("tab", { name: "Skosy i wieniec", exact: true })
      .click();
    await page.getByRole("tab", { name: "Szuflady", exact: true }).click();
    await expect(height).toHaveValue(editedHeight);
    await expect(hole).toHaveValue("50");
    await page.getByRole("link", { name: "Wróć do kreatora kuchni" }).click();
    await expect(
      page.getByLabel("Front do przeliczenia", { exact: true }),
    ).toHaveValue("FRONT-SZ02");
    await expect(
      page.getByLabel("Front do przeliczenia", { exact: true }),
    ).toBeFocused();
    await expect(page.locator(".kp-cabinet-editor")).toContainText(
      "Szafka dolna z szufladami 600",
    );
    const source = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
    expect(source.items).toHaveLength(1);
    expect(source.items[0].drawerFronts).toBeUndefined();
    await link.click();
    await expect(hole).toHaveValue("50");
    await page
      .getByRole("button", { name: "Przywróć dane z projektu" })
      .click();
    await expect(height).toHaveValue(originalHeight);
    await expect(hole).toHaveValue("");
    await expect(page.locator(".drawer-cut").first()).toBeVisible();
    await expect(page.locator(".drawer-hole-list ol")).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "Wymiar frontu meblowego" }),
    ).toContainText(Number(originalHeight).toLocaleString("pl-PL"));
    const axe = await new AxeBuilder({ page })
      .include(".drawer-calculator")
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Pokaż rozkrój i wiercenia" })
      .click();
    await expect(
      page.getByRole("region", { name: "Wyniki kalkulatora", exact: true }),
    ).toBeFocused();
    const resultBox = await page.locator(".drawer-results").boundingBox(),
      headerBox = await page.locator(".ps-public-header").boundingBox();
    expect(resultBox!.y).toBeGreaterThanOrEqual(
      headerBox!.y + headerBox!.height,
    );
    await page.screenshot({
      path: `../../outputs/Szuflady-przeplyw-${phone ? "telefon" : "komputer"}-2026-11-14.png`,
    });
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("stolarnia.kalkulator-szuflad.v1")!)
            .lw,
      ),
    ).toBe("700");
    await page.goto("/#/kalkulatory/szuflady");
    await expect(
      page.getByLabel("Światło korpusu LW", { exact: true }),
    ).toHaveValue("700");
  });

test("changed source dimensions clear old holes, missing source is recoverable and invalid input removes results", async ({
  page,
}) => {
  const query =
    "lw=564&nl=500&width=596&height=300&system=amix&cabinet=00000000-0000-4000-8000-000000000009&front=FRONT-SZ02";
  await page.goto(`/#/kalkulatory/szuflady?${query}`);
  const hole = page.getByLabel("Pierwszy otwór od dołu frontu opcjonalnie", {
    exact: true,
  });
  await hole.fill("50");
  await expect(page.locator(".drawer-hole-list ol")).toBeVisible();
  await page.goto(
    `/#/kalkulatory/szuflady?${query.replace("lw=564", "lw=764").replace("width=596", "width=796")}`,
  );
  await expect(hole).toHaveValue("");
  await expect(
    page.getByLabel("Światło korpusu LW", { exact: true }),
  ).toHaveValue("764");
  await expect(
    page.getByRole("region", { name: "Wymiar frontu meblowego" }),
  ).toContainText("796 × 300");
  const width = page.getByLabel("Szerokość frontu opcjonalnie", {
    exact: true,
  });
  await width.fill("invalid");
  await expect(page.locator(".drawer-front-summary")).toHaveCount(0);
  await expect(page.locator(".drawer-cut")).toHaveCount(0);
  await width.fill("796");
  await expect(page.locator(".drawer-cut").first()).toBeVisible();
  await page.getByRole("link", { name: "Wróć do kreatora kuchni" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Wybrana szafka nie jest dostępna" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Przejdź do szafek" }),
  ).toBeVisible();
});

test("blocked local storage still permits a source calculation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "getItem", {
      value() {
        throw new Error("blocked");
      },
    });
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto(
    "/#/kalkulatory/szuflady?lw=564&nl=500&width=596&height=300&system=amix",
  );
  await expect(
    page.getByLabel("Światło korpusu LW", { exact: true }),
  ).toHaveValue("564");
  await expect(page.locator(".drawer-cut").first()).toBeVisible();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Wymiary pozostają w formularzu" }),
  ).toBeVisible();
});
