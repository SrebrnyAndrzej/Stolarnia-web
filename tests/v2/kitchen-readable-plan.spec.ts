import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const saved = (page: Page) =>
  page.evaluate(() => localStorage.getItem("pan-stolarz.kuchnia.v1"));
async function openPlan(page: Page) {
  await page.addInitScript(
    (ids) => {
      if (localStorage.getItem("pan-stolarz.kuchnia.v1")) return;
      localStorage.setItem(
        "pan-stolarz.kuchnia.v1",
        JSON.stringify({
          version: 1,
          layout: "parallel",
          width: 3600,
          depth: 2400,
          returnLength: 3600,
          height: 2600,
          finish: "sage",
          quote: {
            front: "laminate",
            worktop: "laminate",
            drawers: "amix",
            installation: true,
          },
          items: [
            { id: ids[0], wall: "a", catalogId: "base-oven-600" },
            { id: ids[1], wall: "a", catalogId: "base-shelves-600" },
            { id: ids[2], wall: "a", catalogId: "dishwasher-front-600" },
            { id: ids[3], wall: "a", catalogId: "tall-refrigerator-600" },
            {
              id: ids[4],
              wall: "c",
              catalogId: "base-sink-600",
              gapBefore: 1800,
            },
            {
              id: ids[5],
              wall: "c",
              catalogId: "base-shelves-600",
              width: 1200,
            },
          ],
        }),
      );
    },
    Array.from({ length: 6 }, (_, i) => id(i + 1)),
  );
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Przejdź do szafek", exact: false })
    .click();
  await page.getByRole("button", { name: "Rzut z góry", exact: true }).click();
}
for (const phone of [false, true])
  test(`readable plan keeps a draft intact and measures edited geometry (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openPlan(page);
    for (const kind of ["oven", "sink", "dishwasherFront", "refrigerator"])
      await expect(
        page.locator(`[data-kitchen-plan-function="${kind}"]`),
      ).toHaveCount(1);
    await expect(page.locator("[data-kitchen-worktop]")).toHaveCount(5);
    await expect(page.locator("[data-kitchen-passage]")).toHaveAttribute(
      "data-kitchen-passage",
      "1240",
    );
    await expect(page.locator("[data-passage-summary]")).toHaveText(
      "Przejście: 124 cm",
    );
    const before = await saved(page);
    await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
    const checkbox = page.getByRole("checkbox", {
      name: "Oznaczenia AGD i zlewu",
      exact: true,
    });
    await checkbox.uncheck();
    await expect(page.locator("[data-kitchen-plan-function]")).toHaveCount(0);
    expect(await saved(page)).toBe(before);
    await checkbox.check();
    expect(await saved(page)).toBe(before);
    const c = page.locator(`[data-kitchen-cabinet="${id(6)}"]`);
    await c.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#kp-editor-title")).toBeFocused();
    await expect(page.locator(".kp-arrangement h2")).toHaveText(
      "Szafki · ściana C",
    );
    await expect(c).toHaveAttribute("aria-pressed", "true");
    const a = page.locator(`[data-kitchen-cabinet="${id(2)}"]`);
    await a.focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".kp-arrangement h2")).toHaveText(
      "Szafki · ściana A",
    );
    await page
      .getByLabel("Głębokość szafki", { exact: true })
      .selectOption("600");
    await page
      .getByRole("button", { name: "Zastosuj do szafki", exact: true })
      .click();
    await expect(page.locator("[data-kitchen-passage]")).toHaveAttribute(
      "data-kitchen-passage",
      "1200",
    );
    await expect(page.locator("[data-passage-summary]")).toHaveText(
      "Przejście: 120 cm",
    );
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    await expect(page.locator("[data-kitchen-passage]")).toHaveAttribute(
      "data-kitchen-passage",
      "1240",
    );
    await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
    await page
      .locator(".kp-preview-toolbar")
      .evaluate((el) =>
        scrollTo(0, scrollY + el.getBoundingClientRect().top - 100),
      );
    await page.screenshot({
      path: `../../outputs/kreator-rzut-2026-11-20-${phone ? "telefon" : "komputer"}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(axe.violations).toEqual([]);
    expect(errors).toEqual([]);
  });

test("hiding an architect underlay preserves its framing, original and project data", async ({
  page,
}) => {
  await openPlan(page);
  await page
    .getByRole("button", { name: "Wymiary pomieszczenia", exact: true })
    .click();
  await page.locator(".kp-architect-tools summary").click();
  const dxf = Buffer.from(
    "0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n8\nROOM\n90\n4\n70\n1\n10\n0\n20\n0\n10\n3600\n20\n0\n10\n3600\n20\n2400\n10\n0\n20\n2400\n0\nENDSEC\n0\nEOF\n",
  );
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles({
      name: "rzut-test.dxf",
      mimeType: "application/dxf",
      buffer: dxf,
    });
  await expect(page.locator(".kp-architect-list li")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Otwórz rzut-test.dxf", exact: true })
    .click();
  await page.getByLabel("Pokaż jako podkład rzutu", { exact: true }).check();
  await page.getByLabel("Warstwa DXF", { exact: true }).selectOption("ROOM");
  await page
    .getByRole("button", { name: "Zapisz ustawienia pliku", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Zamknij podgląd i anuluj edycję",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Przejdź do szafek", exact: false })
    .click();
  await page.getByRole("button", { name: "Rzut z góry", exact: true }).click();
  const underlay = page.locator("[data-architect-underlay]");
  await expect(underlay.locator("polyline")).not.toHaveCount(0);
  const before = await saved(page),
    frame = await page.locator(".kp-canvas svg.elev").getAttribute("viewBox");
  const toggle = page.getByRole("checkbox", {
    name: "Podkład rzutu",
    exact: true,
  });
  await toggle.uncheck();
  await expect(underlay).toHaveAttribute("visibility", "hidden");
  expect(await saved(page)).toBe(before);
  expect(
    await page.locator(".kp-canvas svg.elev").getAttribute("viewBox"),
  ).toBe(frame);
  await toggle.check();
  await expect(underlay).not.toHaveAttribute("visibility", "hidden");
  expect(await saved(page)).toBe(before);
});
