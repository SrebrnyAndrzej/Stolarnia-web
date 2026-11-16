import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const item = (n: number, catalogId = "base-shelves-600", gapBefore = 0) => ({
  id: uuid(n),
  catalogId,
  wall: "a",
  gapBefore,
});
async function open(page: Page, items: object[], width = 3600) {
  await page.addInitScript(
    ({ items, width }) => {
      if (!localStorage.getItem("pan-stolarz.kuchnia.v1"))
        localStorage.setItem(
          "pan-stolarz.kuchnia.v1",
          JSON.stringify({
            version: 1,
            layout: "straight",
            width,
            depth: 2400,
            returnLength: 3600,
            height: 2600,
            finish: "cashmere",
            quote: {
              front: "laminate",
              worktop: "laminate",
              drawers: "amix",
              installation: true,
            },
            items,
          }),
        );
    },
    { items, width },
  );
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
}
const stored = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );

test("projected deep side panels fit inside the plan drawing instead of being clipped", async ({
  page,
}) => {
  await open(page, [
    {
      ...item(1),
      depth: 600,
      surround: { left: true, right: true, projection: 100 },
    },
  ]);
  await page.getByRole("button", { name: "Rzut z góry", exact: true }).click();
  const inside = await page
    .locator(".kp-canvas svg")
    .evaluate((svg: SVGSVGElement) => {
      const v = svg.viewBox.baseVal;
      return [...svg.querySelectorAll("polygon[data-kitchen-surround]")].every(
        (polygon) =>
          [...(polygon as SVGPolygonElement).points].every(
            (point) =>
              point.x > v.x &&
              point.y > v.y &&
              point.x < v.x + v.width &&
              point.y < v.y + v.height,
          ),
      );
    });
  expect(inside).toBe(true);
  await expect(page.locator(".kp-canvas [data-kitchen-surround]")).toHaveCount(
    2,
  );
});

for (const phone of [false, true])
  test(`physical upper surround survives undo, reload and PDF (${phone ? "phone" : "desktop"})`, async ({
    page,
    request,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await open(page, [
      item(1),
      item(2),
      item(3, "tall-refrigerator-600"),
      item(4, "wall-shelves-600", 2000),
      item(5, "wall-shelves-600"),
    ]);
    const counts = page.getByLabel("Automatycznie wykryte ciągi");
    await expect(counts).toHaveText(/Dolny: 1.*Górny: 1.*Wysoki: 1/);
    const before = await stored(page);
    const basePrice = await (
      await request.post("/api/public/kitchen-estimate", { data: before })
    ).json();
    await page
      .getByText("Wykryte ciągi · blendy, boki i wieńce", { exact: true })
      .click();
    const run = page.getByLabel("Wykryty ciąg", { exact: true });
    await run.selectOption(`a:wall:${uuid(4)}`);
    await page
      .getByRole("button", { name: "Ustaw sugerowaną obudowę" })
      .click();
    await expect(
      page.getByLabel("Lewy bok osłonowy", { exact: true }),
    ).toBeChecked();
    await expect(
      page.getByLabel("Prawy bok osłonowy", { exact: true }),
    ).toBeChecked();
    const projection = page.getByLabel("Wysunięcie przed lico frontów (mm)", {
      exact: true,
    });
    await expect(projection).toHaveValue("20");
    await expect(page.locator(".kp-surround-checks label").first()).toHaveCSS(
      "display",
      "flex",
    );
    await expect(page.locator(".kp-run-change")).toContainText("600 → 564 mm");
    // Staging has no effect on the saved kitchen.
    expect(await stored(page)).toEqual(before);
    await projection.fill("101");
    await expect(
      page.getByRole("button", { name: "Zastosuj wykończenie ciągu" }),
    ).toBeDisabled();
    await expect(
      page.locator(".kp-surround-tools").getByRole("alert"),
    ).toContainText("0–100");
    await projection.fill("20");
    const axe = await new AxeBuilder({ page }).include(".kp-runs").analyze();
    expect(axe.violations).toEqual([]);
    await page
      .getByRole("button", { name: "Zastosuj wykończenie ciągu" })
      .click();
    await expect(run).toBeFocused();
    const after = await stored(page);
    expect(after.items[4].width).toBe(564);
    expect(after.items[2]).toEqual(before.items[2]);
    expect(after.items[3].surround).toMatchObject({
      left: true,
      top: true,
      bottom: true,
      projection: 20,
    });
    await expect(
      page.locator(".kp-canvas [data-kitchen-surround]"),
    ).toHaveCount(6);
    await page
      .locator(".kp-preview-toolbar")
      .evaluate((el) =>
        scrollTo(0, scrollY + el.getBoundingClientRect().top - 110),
      );
    await page.screenshot({
      path: `../../outputs/ciagi-i-obudowy-2026-11-15/podglad-${phone ? "telefon" : "komputer"}.png`,
    });
    await page
      .getByRole("button", { name: "Rzut z góry", exact: true })
      .click();
    await expect(
      page.locator(".kp-canvas [data-kitchen-surround]"),
    ).toHaveCount(6);
    const response = await request.post("/api/public/kitchen-estimate", {
      data: after,
    });
    expect(response.ok()).toBe(true);
    const estimate = await response.json();
    expect(estimate).toHaveProperty("gross");
    expect(estimate.gross).toBeGreaterThan(basePrice.gross);
    expect(JSON.stringify(estimate.scope)).toContain(
      "Boki i wieńce osłonowe: 6",
    );
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.locator(".kp-canvas canvas")).toBeVisible();
    await page.getByRole("button", { name: "Od przodu", exact: true }).click();
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    expect(await stored(page)).toEqual(before);
    await expect(
      page.locator(".kp-canvas [data-kitchen-surround]"),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Ustaw sugerowaną obudowę" })
      .click();
    await page
      .getByRole("button", { name: "Zastosuj wykończenie ciągu" })
      .click();
    await page
      .locator(".kp-run-finishing")
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `../../outputs/ciagi-i-obudowy-2026-11-15/obudowa-${phone ? "telefon" : "komputer"}.png`,
      fullPage: false,
    });
    await page.reload();
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await expect(
      page.locator(".kp-canvas [data-kitchen-surround]"),
    ).toHaveCount(6);
    await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
    await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
    if (!phone) {
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Pobierz wycenę PDF" }).click();
      await (
        await download
      ).saveAs("../../outputs/ciagi-i-obudowy-2026-11-15/oferta-obudowa.pdf");
    }
  });

test("one action fills interior and end gaps, proposes a filler and undoes the whole batch", async ({
  page,
}) => {
  await open(page, [item(1), item(2, "base-shelves-600", 50)], 1800);
  const before = await stored(page);
  await page.getByText("Uzupełnij kuchnię lub rząd", { exact: true }).click();
  await page
    .getByLabel("Cel uzupełniania", { exact: true })
    .selectOption("storage");
  await expect(
    page
      .getByLabel("Luka do uzupełnienia", { exact: true })
      .locator("option")
      .first(),
  ).toContainText("sugerowana blenda");
  await page
    .getByRole("button", { name: "Uzupełnij cały rząd", exact: true })
    .click();
  const after = await stored(page);
  expect(after.items).toHaveLength(4);
  expect(
    after.items.find(
      (i: { catalogId: string }) => i.catalogId === "base-filler-50",
    ).width,
  ).toBe(50);
  await expect(
    page.getByLabel("Rząd do dopełnienia", { exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect(await stored(page)).toEqual(before);
  await page
    .getByLabel("Luka do uzupełnienia", { exact: true })
    .selectOption("a:base:600:650");
  await page
    .getByRole("button", { name: "Dopełnij ten rząd", exact: true })
    .click();
  const interior = await stored(page);
  expect(interior.items).toHaveLength(3);
  expect(interior.items[2].id).toBe(uuid(2));
  expect(interior.items[2].gapBefore).toBe(0);
});

test("upper autofill avoids tall units and tall autofill uses actual pantry models", async ({
  page,
}) => {
  await open(page, [item(1, "tall-refrigerator-600")], 1850);
  await page.getByText("Uzupełnij kuchnię lub rząd", { exact: true }).click();
  await page
    .getByLabel("Cel uzupełniania", { exact: true })
    .selectOption("storage");
  await page
    .getByLabel("Rząd do dopełnienia", { exact: true })
    .selectOption("wall");
  await page
    .getByRole("button", { name: "Uzupełnij cały rząd", exact: true })
    .click();
  let draft = await stored(page);
  expect(draft.items[1].gapBefore).toBe(600);
  expect(
    draft.items
      .slice(1)
      .every((i: { catalogId: string }) => i.catalogId === "wall-shelves-600"),
  ).toBe(true);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await page
    .getByLabel("Rząd do dopełnienia", { exact: true })
    .selectOption("tall");
  await page
    .getByRole("button", { name: "Uzupełnij cały rząd", exact: true })
    .click();
  draft = await stored(page);
  expect(
    draft.items
      .slice(1)
      .every((i: { catalogId: string }) => i.catalogId === "tall-pantry-600"),
  ).toBe(true);
});

test("fixed appliance niche blocks an enclosure without room and never changes the saved module", async ({
  page,
}) => {
  await open(page, [item(1, "tall-refrigerator-600")]);
  const before = await stored(page);
  await page
    .getByText("Wykryte ciągi · blendy, boki i wieńce", { exact: true })
    .click();
  await page.getByLabel("Lewy bok osłonowy", { exact: true }).check();
  await expect(
    page.locator(".kp-surround-tools").getByRole("alert"),
  ).toContainText("Nie zmieniamy szerokości AGD");
  await expect(
    page.getByRole("button", { name: "Zastosuj wykończenie ciągu" }),
  ).toBeDisabled();
  expect(await stored(page)).toEqual(before);
  await page.getByLabel("Zachowaj szerokość ciągu", { exact: false }).uncheck();
  await page
    .getByRole("button", { name: "Zastosuj wykończenie ciągu" })
    .click();
  const after = await stored(page);
  expect(after.items[0].width).toBeUndefined();
  expect(after.items[0].surround.left).toBe(true);
});
