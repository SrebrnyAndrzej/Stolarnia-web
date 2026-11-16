import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const phone of [false, true])
  test(`whole kitchen starts directly from room measurements (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/kreator-kuchni");
    await page
      .getByLabel("Jednostka wymiarów", { exact: true })
      .selectOption("mm");
    await page.getByLabel("Długość ściany A", { exact: false }).fill("3700");
    await page
      .getByText("Założenia kuchni · AGD i hydraulika", { exact: true })
      .click();
    await page.getByLabel("Zmywarka", { exact: true }).selectOption("450");
    await page
      .getByLabel("Środek zlewu od początku ściany (mm)", { exact: true })
      .fill("1500");
    expect(
      (await new AxeBuilder({ page }).include(".kp-main").analyze()).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `../../outputs/Kuchnia-start-ustawienia-${phone ? "telefon" : "komputer"}-2026-11-14.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
      .click();
    await page
      .getByText("Zlew, AGD i miejsce do pracy", { exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Strefy funkcjonalne kuchni" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Zlew · A · środek 1500 mm",
        exact: true,
      }),
    ).toBeVisible();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
    expect(stored.width).toBe(3700);
    expect(stored.planning.dishwasher).toBe("450");
    for (const type of [
      "base-oven-600",
      "wall-hood-600",
      "base-sink-600",
      "tall-refrigerator-600",
      "dishwasher-front-450",
    ])
      expect(
        stored.items.filter((i: { catalogId: string }) => i.catalogId === type),
      ).toHaveLength(1);
    await expect(page.getByText(/Do dopracowania ·/)).toHaveCount(0);
    expect(
      (await new AxeBuilder({ page }).include(".kp-main").analyze()).violations,
    ).toEqual([]);
    await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
    await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
    await page.screenshot({
      path: `../../outputs/Kuchnia-start-${phone ? "telefon" : "komputer"}-2026-11-14.png`,
    });
  });

test("whole-kitchen start rejects incomplete dimensions without changing the saved room", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByLabel("Jednostka wymiarów", { exact: true })
    .selectOption("mm");
  await page.getByLabel("Długość ściany A", { exact: false }).fill("1700");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "1800–8000" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Długość ściany A", { exact: false }),
  ).toBeFocused();
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
      )
    ).items,
  ).toEqual([]);
  await page.getByLabel("Długość ściany A", { exact: false }).fill("3600");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
      )
    ).items,
  ).toEqual([]);
});
