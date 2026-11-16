import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { kitchenCollisions } from "../../src/core/kitchen-collisions";
import { kitchenModules } from "../../src/core/kitchen-configuration";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const saved = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
for (const phone of [false, true])
  test(`blocked U corner is visible, unpriced, recoverable and kept on undo (${phone ? "phone" : "desktop"})`, async ({
    page,
    request,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    const bad = {
      version: 1,
      layout: "u",
      width: 3600,
      depth: 3000,
      returnLength: 3600,
      height: 2600,
      finish: "oak",
      items: [
        {
          id: uuid(1),
          catalogId: "base-shelves-600",
          wall: "a",
          gapBefore: 3000,
        },
        { id: uuid(2), catalogId: "tall-refrigerator-600", wall: "b" },
      ],
    };
    await page.addInitScript((d) => {
      if (
        window.top === window &&
        !localStorage.getItem("pan-stolarz.kuchnia.v1")
      )
        localStorage.setItem("pan-stolarz.kuchnia.v1", JSON.stringify(d));
    }, bad);
    await page.goto("/#/kreator-kuchni");
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await expect(page.locator(".kp-collision-summary")).toContainText(
      "Zablokowane otwieranie",
    );
    await expect(page.locator(".kp-live-price strong")).not.toHaveText(
      /\d.*zł/,
    );
    await page
      .getByRole("button", { name: "Rzut z góry", exact: true })
      .click();
    await expect(
      page.locator('.kp-canvas [data-kitchen-collision="true"]'),
    ).toHaveCount(2);
    const response = await request.post("/api/public/kitchen-estimate", {
      headers: { Origin: "https://panstolarz.pro" },
      data: bad,
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).gross).toBeNull();
    const pdf = await request.post("/api/public/kitchen-estimate/pdf", {
      headers: { Origin: "https://panstolarz.pro" },
      data: bad,
    });
    expect(pdf.status()).toBe(422);
    await page.locator(".kp-collision-summary").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `../../outputs/narozniki-2026-11-16/konflikt-${phone ? "telefon" : "komputer"}.png`,
    });
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(
      axe.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      ),
    ).toEqual([]);
    await page
      .getByRole("button", { name: /Popraw: Słupek pod lodówkę/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Wybrana szafka", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Wróć do podglądu", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Zastąp proponowanym układem", exact: true })
      .click();
    await expect(page.locator(".kp-collision-summary")).toHaveCount(0);
    await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
    const d = await saved(page);
    expect(kitchenCollisions(d, kitchenModules(d))).toEqual([]);
    expect(kitchenModules(d).some((m) => m.scianaId === "b")).toBeTruthy();
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    expect((await saved(page)).items).toEqual(bad.items);
    await expect(page.locator(".kp-collision-summary")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });

test("U proposal leaves both turns free and row autofill never offers the reserved corner", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Układ U", exact: false }).click();
  await page.getByLabel("Długość ściany B", { exact: false }).fill("300");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  const d = await saved(page),
    modules = kitchenModules(d);
  expect(kitchenCollisions(d, modules)).toEqual([]);
  expect(
    modules
      .filter((m) => m.scianaId === "a")
      .every((m) => m.pozycjaXMM + m.szerokoscMM <= 2950),
  ).toBeTruthy();
  expect(
    modules
      .filter((m) => m.scianaId === "b")
      .every((m) => m.pozycjaXMM + m.szerokoscMM <= 2350),
  ).toBeTruthy();
  const fridge = modules.find((m) => m.konstrukcja === "refrigerator")!;
  expect(
    (fridge.scianaId === "a" && fridge.pozycjaXMM === 0) ||
      (fridge.scianaId === "c" &&
        fridge.pozycjaXMM + fridge.szerokoscMM === d.returnLength),
  ).toBeTruthy();
  await expect(page.locator(".kp-canvas [data-kitchen-gap]")).toHaveCount(0);
  await page.getByRole("button", { name: "Rzut z góry", exact: true }).click();
  await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
  await page
    .locator(".kp-preview-toolbar")
    .evaluate((el) =>
      scrollTo(0, scrollY + el.getBoundingClientRect().top - 110),
    );
  await page.screenshot({
    path: "../../outputs/narozniki-2026-11-16/uklad-u-poprawiony.png",
  });
});
