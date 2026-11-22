import { openKitchenList } from "./kitchen-ui";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const read = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
async function fixture(page: Page, reverse = false) {
  await page.addInitScript(
    ({ id, reverse }) => {
      if (!localStorage.getItem("pan-stolarz.kuchnia.v1"))
        localStorage.setItem(
          "pan-stolarz.kuchnia.v1",
          JSON.stringify({
            version: 1,
            layout: "straight",
            width: 1850,
            depth: 2400,
            height: 2600,
            returnLength: 3600,
            finish: "cashmere",
            quote: {
              front: "laminate",
              worktop: "laminate",
              drawers: "amix",
              installation: true,
            },
            items: [
              {
                id: id[0],
                catalogId: reverse ? "base-drawers-600" : "base-shelves-600",
                wall: "a",
                width: 564,
                height: 800,
                depth: 600,
                gapBefore: 50,
                surround: { left: true, right: true, projection: 20 },
                ...(reverse
                  ? {
                      drawers: 4,
                      drawerFronts: {
                        mode: "custom",
                        heightsFromTop: [150, null, null, null],
                      },
                    }
                  : { shelves: 3 }),
              },
              { id: id[1], catalogId: "dishwasher-front-600", wall: "a" },
              { id: id[2], catalogId: "base-shelves-600", wall: "a" },
            ],
          }),
        );
    },
    { id: [id(1), id(2), id(3)], reverse },
  );
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
}

for (const phone of [false, true])
  test(`a kitchen without free cabinet space replaces shelves with custom drawers in place (${phone ? "phone" : "desktop"})`, async ({
    page,
    request,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await fixture(page);
    const before = await read(page);
    const firstPrice = await (
      await request.post("/api/public/kitchen-estimate", { data: before })
    ).json();
    await expect(page.getByText("50 mm wolne", { exact: true })).toBeVisible();
    // A click in the drawing reveals and focuses the actual editor, including on a phone.
    await page
      .locator(`[data-kitchen-cabinet="${id(1)}"]`)
      .dispatchEvent("pointerdown", { pointerType: "touch", pointerId: 1 });
    await expect(page.locator(".kp-cabinet-editor")).toHaveCount(0);
    await page.locator(`[data-kitchen-cabinet="${id(1)}"]`).click();
    await expect(page.locator("#kp-editor-title")).toBeFocused();
    await expect(page.locator("#kp-editor-title")).toBeInViewport();
    await page
      .getByLabel("Jednostka edycji", { exact: true })
      .selectOption("mm");
    const mode = page.getByLabel("Wyposażenie szafki", { exact: true });
    await mode.selectOption("drawers");
    expect(await read(page)).toEqual(before);
    await page
      .getByRole("button", { name: "Wróć do podglądu", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Zastosuj do szafki", exact: true }),
    ).toBeFocused();
    await expect(page.locator(".kp-cabinet-editor")).toBeVisible();
    await page
      .getByRole("button", { name: "Anuluj zmiany", exact: true })
      .click();
    await expect(mode).toHaveValue("shelves");
    await mode.selectOption("drawers");
    await mode.selectOption("shelves");
    await expect(page.locator(".kp-editor-pending")).toHaveCount(0);
    await mode.selectOption("drawers");
    await page.getByLabel("Liczba szuflad", { exact: true }).selectOption("4");
    await page
      .getByLabel("Podział frontów", { exact: true })
      .selectOption("custom");
    await page.getByLabel("Front 1 od góry (mm)", { exact: true }).fill("150");
    await expect(
      page.getByLabel("Front 4 od góry (mm)", { exact: true }),
    ).toHaveValue("");
    const axe = await new AxeBuilder({ page })
      .include(".kp-cabinet-editor")
      .analyze();
    expect(axe.violations).toEqual([]);
    const width = page.getByLabel("Szerokość szafki", { exact: true });
    await width.fill("1200");
    await page
      .getByRole("button", { name: "Zastosuj do szafki", exact: true })
      .click();
    await expect(page.locator("#kp-editor-error")).toContainText("poza ścianę");
    expect(await read(page)).toEqual(before);
    await expect(mode).toHaveValue("drawers");
    await width.fill("564");
    await page
      .getByRole("button", { name: "Zastosuj do szafki", exact: true })
      .click();
    await expect(page.locator("#kp-editor-title")).toBeFocused();
    const after = await read(page);
    expect(after.items).toHaveLength(3);
    expect(after.items[0]).toMatchObject({
      id: id(1),
      catalogId: "base-drawers-600",
      width: 564,
      height: 800,
      depth: 600,
      gapBefore: 50,
      surround: before.items[0].surround,
      drawers: 4,
      drawerFronts: { mode: "custom", heightsFromTop: [150, null, null, null] },
    });
    expect(after.items[0]).not.toHaveProperty("shelves");
    expect(after.items.slice(1)).toEqual(before.items.slice(1));
    await expect(page.locator(".kp-arrangement li").nth(1)).toContainText(
      "od 650 mm",
    );
    const price = await (
      await request.post("/api/public/kitchen-estimate", { data: after })
    ).json();
    expect(price.status).toBe("estimated");
    expect(price.gross).toBeGreaterThan(firstPrice.gross);
    await page
      .locator(".kp-cabinet-editor")
      .evaluate((el) =>
        scrollTo(0, scrollY + el.getBoundingClientRect().top - 110),
      );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `../../outputs/edycja-klienta-2026-11-15/szafka-${phone ? "telefon" : "komputer"}.png`,
    });
    await page
      .getByRole("button", { name: "Wróć do podglądu", exact: true })
      .click();
    await expect(page.locator(".kp-cabinet-editor")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Od przodu", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Od przodu", exact: true }),
    ).toBeInViewport();
    await page
      .getByRole("button", { name: "Rzut z góry", exact: true })
      .click();
    await page.locator(`[data-kitchen-cabinet="${id(1)}"]`).click();
    await expect(page.locator("#kp-editor-title")).toBeFocused();
    await page
      .getByRole("button", { name: "Wróć do podglądu", exact: true })
      .click();
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Pobierz szkic", exact: true })
      .click();
    const path = `../../outputs/edycja-klienta-2026-11-15/szkic-${phone ? "telefon" : "komputer"}.json`;
    await (await download).saveAs(path);
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    expect(await read(page)).toEqual(before);
    await page
      .getByLabel("Plik szkicu kuchni", { exact: true })
      .setInputFiles(path);
    await expect.poll(() => read(page)).toEqual(after);
    await page.reload();
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await expect(page.locator(".kp-arrangement li")).toHaveCount(3);
    await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
    await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
  });

test("replacing custom drawers removes drawer-only parameters and undo restores their exact arrangement", async ({
  page,
}) => {
  await fixture(page, true);
  const before = await read(page);
  await openKitchenList(page);
  await page.locator(".kp-item-name").first().click();
  await page
    .getByLabel("Wyposażenie szafki", { exact: true })
    .selectOption("shelves");
  await page.getByLabel("Liczba półek", { exact: true }).selectOption("2");
  await page
    .getByRole("button", { name: "Zastosuj do szafki", exact: true })
    .click();
  const after = await read(page);
  expect(after.items[0].catalogId).toBe("base-shelves-600");
  expect(after.items[0].shelves).toBe(2);
  expect(after.items[0]).not.toHaveProperty("drawerFronts");
  expect(after.items[0]).not.toHaveProperty("drawers");
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect(await read(page)).toEqual(before);
  await openKitchenList(page);
  await page.locator(".kp-item-name").nth(1).click();
  await expect(
    page.getByLabel("Wyposażenie szafki", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Szerokość szafki", { exact: true }),
  ).toBeDisabled();
});
