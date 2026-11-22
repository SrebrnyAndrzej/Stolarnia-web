import { openKitchenList } from "./kitchen-ui";
import { test, expect } from "./staff-fixture";
import AxeBuilder from "@axe-core/playwright";

for (const phone of [false, true])
  test(`kitchen front locks persist, reject bad plans and transfer a chosen front (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/kreator-kuchni");
    await page
      .getByLabel("Jednostka wymiarów", { exact: true })
      .selectOption("mm");
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await page
      .getByRole("combobox", { name: "Rodzaj szafek", exact: true })
      .selectOption("drawers");
    await page
      .getByRole("button", {
        name: "Dodaj: Szafka dolna z szufladami 600",
        exact: false,
      })
      .click();
    const layout = page.getByLabel("Podział frontów", { exact: true });
    if (!phone) {
      await layout.press("Space");
      await page.screenshot({
        path: "../../outputs/Kuchnia-podzial-frontow-wybor-2026-11-14.png",
      });
      await layout.press("Escape");
      await expect(layout).toHaveValue("standard");
    }
    await layout.selectOption("custom");
    const top = page.getByLabel("Front 1 od góry (mm)", { exact: true });
    await top.fill("140,5");
    await expect(page.locator(".kp-front-preview")).toContainText(
      "140,5 / 285,8 / 285,7 mm",
    );
    await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
    let stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
    expect(stored.items[0].drawerFronts.heightsFromTop).toEqual([
      140.5,
      null,
      null,
    ]);
    await expect(page.getByLabel("Front do przeliczenia")).toHaveValue(
      "FRONT-SZ03",
    );
    const frontChoice = page.getByLabel("Front do przeliczenia");
    await frontChoice.selectOption("FRONT-SZ02");
    const link = page.getByRole("link", {
      name: "Przelicz szufladę tej szafki",
    });
    expect(
      new URLSearchParams((await link.getAttribute("href"))!.split("?")[1]).get(
        "height",
      ),
    ).toBe("285.8");
    await frontChoice.selectOption("FRONT-SZ03");
    await link.click();
    await expect(
      page.getByText(/Wczytano wymiary wybranej szuflady/),
    ).toBeVisible();
    await expect(
      page.getByLabel("Wysokość frontu", { exact: false }).first(),
    ).toHaveValue("140.5");
    await page.getByRole("link", { name: "Wróć do kreatora kuchni" }).click();
    await expect(page.getByLabel("Front do przeliczenia")).toHaveValue(
      "FRONT-SZ03",
    );
    await openKitchenList(page);
    await page
      .locator(".kp-item-name")
      .filter({ hasText: "Szafka dolna z szufladami" })
      .click();
    await expect(top).toHaveValue("140.5");
    await top.fill("700");
    await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /nie mieszczą się/ }),
    ).toBeVisible();
    await expect(top).toBeFocused();
    await expect(page.locator(".kp-front-preview")).toHaveCount(0);
    stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
    expect(stored.items[0].drawerFronts.heightsFromTop[0]).toBe(140.5);
    await top.fill("140");
    await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
    await layout.selectOption("equal");
    await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
    await expect(layout).toHaveValue("equal");
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    await expect(layout).toHaveValue("custom");
    await expect(top).toHaveValue("140");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const axe = await new AxeBuilder({ page })
      .include(".kp-cabinet-editor")
      .include(".kp-drawer-choice")
      .analyze();
    expect(axe.violations).toEqual([]);
    await page.locator(".kp-cabinet-editor").screenshot({
      path: `../../outputs/Kuchnia-podzial-frontow-${phone ? "telefon" : "komputer"}-2026-11-14.png`,
    });
  });

test("fit selected cabinet respects row, applies explicitly and undoes in one step", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByLabel("Jednostka wymiarów", { exact: true })
    .selectOption("mm");
  await page.getByLabel("Długość ściany A").fill("3650");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByRole("button", { name: "Wstaw proponowany układ" }).click();
  await openKitchenList(page);
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Szafka dolna z szufladami" })
    .click();
  const width = page.getByLabel("Szerokość szafki", { exact: true });
  await width.fill("500");
  await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
  await page
    .getByRole("button", { name: "Dopasuj szerokość do wolnego miejsca" })
    .click();
  await expect(width).toHaveValue("600");
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
      )
    ).items.find(
      (i: { catalogId: string }) => i.catalogId === "base-drawers-600",
    ).width,
  ).toBe(500);
  await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
  await expect(width).toHaveValue("600");
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(width).toHaveValue("500");
  await openKitchenList(page);
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Zabudowa zmywarki" })
    .click();
  await expect(width).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Dopasuj szerokość do wolnego miejsca" }),
  ).toHaveCount(0);
});
