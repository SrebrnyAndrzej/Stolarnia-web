import { openKitchenList } from "./kitchen-ui";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const phone of [false, true])
  test(`kitchen gaps and tail fillers survive save, undo and a real estimate (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    // A previously saved manual run remains valid independently of the functional starter proposal.
    await page.addInitScript(() => {
      if (!localStorage.getItem("pan-stolarz.kuchnia.v1"))
        localStorage.setItem(
          "pan-stolarz.kuchnia.v1",
          JSON.stringify({
            version: 1,
            layout: "straight",
            width: 3700,
            depth: 2400,
            returnLength: 3600,
            height: 2600,
            finish: "oak",
            quote: {
              front: "laminate",
              worktop: "laminate",
              drawers: "amix",
              installation: true,
            },
            items: Array.from({ length: 6 }, (_, i) => [
              {
                id: crypto.randomUUID(),
                catalogId: i === 0 ? "base-drawers-600" : "base-shelves-600",
                wall: "a",
              },
              {
                id: crypto.randomUUID(),
                catalogId: "wall-shelves-600",
                wall: "a",
              },
            ]).flat(),
          }),
        );
    });
    await page.goto("/#/kreator-kuchni");
    await page
      .getByLabel("Jednostka wymiarów", { exact: true })
      .selectOption("mm");
    await page.getByLabel("Długość ściany A").fill("3700");
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await openKitchenList(page);
    await page
      .locator(".kp-item-name")
      .filter({ hasText: "Szafka dolna z szufladami" })
      .click();
    await page.locator(".kp-placement summary").click();
    const gap = page.getByLabel("Przerwa przed elementem (mm)", {
      exact: true,
    });
    await gap.fill("50");
    await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
    await expect(page.locator(".kp-placement summary")).toContainText(
      "początek 50 mm",
    );
    let stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
    expect(stored.items[0].gapBefore).toBe(50);
    const initialIds = stored.items.map((i: { id: string }) => i.id);
    await page.getByText("Uzupełnij kuchnię lub rząd", { exact: true }).click();
    await page
      .getByLabel("Cel uzupełniania", { exact: true })
      .selectOption("storage");
    await page.getByRole("button", { name: "Dopełnij ten rząd" }).click();
    await expect(page.locator(".kp-arrangement li")).toHaveCount(13);
    stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
    expect(stored.items.slice(0, 12).map((i: { id: string }) => i.id)).toEqual(
      initialIds,
    );
    expect(stored.items[12].catalogId).toBe("base-filler-50");
    expect(stored.items[12].width).toBe(50);
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    await expect(page.locator(".kp-arrangement li")).toHaveCount(12);
    await page.getByRole("button", { name: "Dopełnij ten rząd" }).click();
    await page
      .getByLabel("Rząd do dopełnienia", { exact: true })
      .selectOption("wall");
    await page.getByRole("button", { name: "Dopełnij ten rząd" }).click();
    await expect(page.locator(".kp-arrangement li")).toHaveCount(14);
    await openKitchenList(page);
    await page
      .locator(".kp-item-name")
      .filter({ hasText: "Blenda wisząca 100" })
      .click();
    await expect(
      page.getByLabel("Szerokość blendy", { exact: true }),
    ).toHaveValue("100");
    await expect(
      page.getByLabel("Głębokość szafki", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Zastosuj do blendy" }),
    ).toBeVisible();
    const axe = await new AxeBuilder({ page })
      .include(".kp-cabinet-editor")
      .include(".kp-run-tools")
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".kp-cabinet-editor")
      .evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.locator(".kp-cabinet-editor").screenshot({
      path: `../../outputs/Kuchnia-blenda-${phone ? "telefon" : "komputer"}-2026-11-14.png`,
    });
    await page.reload();
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await expect(page.locator(".kp-arrangement li")).toHaveCount(14);
    await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
    await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
    if (!phone) {
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Pobierz wycenę PDF" }).click();
      await (
        await download
      ).saveAs("../../work/qa-west-kitchen-2026-11-14.pdf");
    }
  });

test("run autofill adds custom shelf sizes and refuses a completed or blocked row", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByLabel("Jednostka wymiarów", { exact: true })
    .selectOption("mm");
  await page.getByLabel("Długość ściany A").fill("1851");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByText("Uzupełnij kuchnię lub rząd", { exact: true }).click();
  await page
    .getByLabel("Cel uzupełniania", { exact: true })
    .selectOption("storage");
  await page.getByRole("button", { name: "Dopełnij ten rząd" }).click();
  let stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  expect(stored.items.map((i: { width: number }) => i.width)).toEqual([
    463, 463, 462, 463,
  ]);
  await page.getByRole("button", { name: "Dopełnij ten rząd" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "już wypełniony" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Rząd do dopełnienia", { exact: true }),
  ).toBeFocused();
  await openKitchenList(page);
  await page.locator(".kp-item-name").first().click();
  await page.locator(".kp-placement summary").click();
  await page
    .getByLabel("Przerwa przed elementem (mm)", { exact: true })
    .fill("100");
  await page.getByRole("button", { name: "Zastosuj do szafki" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "poza ścianę" }),
  ).toBeVisible();
  stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  expect(stored.items[0].gapBefore ?? 0).toBe(0);
});
