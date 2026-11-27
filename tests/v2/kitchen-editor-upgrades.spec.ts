import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const id = "00000000-0000-4000-8000-000000000001";
async function fixture(page: Page, appliance = false) {
  await page.addInitScript(
    ({ id, appliance }) => {
      localStorage.setItem(
        "pan-stolarz.kuchnia.v1",
        JSON.stringify({
          version: 1,
          layout: "straight",
          width: 3600,
          depth: 2600,
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
              id,
              wall: "a",
              catalogId: appliance ? "base-oven-600" : "base-drawers-600",
            },
          ],
        }),
      );
    },
    { id, appliance },
  );
  await page.goto("/#/kreator-kuchni?ui=studio");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
}
const saved = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );

test("appliance requirements remain a draft when the actual niche is too small", async ({
  page,
}) => {
  await fixture(page, true);
  await page.locator(`[data-kitchen-cabinet="${id}"]`).click();
  await page
    .getByText("Model AGD i sprawdzenie niszy", { exact: true })
    .click();
  await page
    .getByLabel("Model urządzenia", { exact: true })
    .fill("Fixture Oven");
  await page
    .getByLabel("Min. szerokość niszy (mm)", { exact: true })
    .fill("560");
  await page
    .getByLabel("Min. wysokość niszy (mm)", { exact: true })
    .fill("590");
  await page
    .getByLabel("Min. głębokość niszy (mm)", { exact: true })
    .fill("550");
  await expect(page.locator(".kp-appliance-card")).toContainText(
    "dostępne 577 mm",
  );
  await page
    .getByRole("button", { name: "Zastosuj do szafki", exact: true })
    .click();
  await expect(page.locator("#kp-editor-error")).toContainText("590 mm");
  expect((await saved(page)).items[0].appliance).toBeUndefined();
  await page
    .getByLabel("Min. wysokość niszy (mm)", { exact: true })
    .fill("570");
  await expect(page.locator(".kp-appliance-card")).toContainText(
    "Sprawdź jeszcze wentylację",
  );
  await page
    .getByRole("button", { name: "Zastosuj do szafki", exact: true })
    .click();
  await expect
    .poll(async () => (await saved(page)).items[0].appliance?.model)
    .toBe("Fixture Oven");
});

for (const phone of [false, true])
  test(`common front and inner drawers, keyed price comparison, cancel and stable preview (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await fixture(page);
    const preview = page.locator(".kp-canvas");
    const initial = (await preview.boundingBox())!.height;
    await page.locator(`[data-kitchen-cabinet="${id}"]`).click();
    expect((await preview.boundingBox())!.height).toBeGreaterThanOrEqual(
      phone ? 280 : 340,
    );
    expect((await preview.boundingBox())!.height).toBeGreaterThanOrEqual(
      initial - 20,
    );
    await page.getByRole("button", { name: /Edytuj szerokość ·/ }).click();
    await expect(page.locator("[data-cabinet-width]")).toBeFocused();
    await page
      .getByLabel("Szuflady ukryte za wspólnym frontem")
      .selectOption("3");
    await expect(
      page.getByLabel("Liczba szuflad", { exact: true }),
    ).toHaveValue("1");
    expect((await saved(page)).items[0].innerDrawers).toBeUndefined();
    await expect(page.locator(".kp-price-preview")).toContainText(
      "Po zmianie:",
    );
    await expect(page.locator(".kp-price-preview")).toContainText("Różnica: +");
    await page
      .getByRole("button", { name: "Anuluj zmiany", exact: true })
      .click();
    await expect(
      page.getByLabel("Szuflady ukryte za wspólnym frontem"),
    ).toHaveValue("0");
    await page
      .getByLabel("Szuflady ukryte za wspólnym frontem")
      .selectOption("2");
    const axe = await new AxeBuilder({ page })
      .include(".kp-cabinet-editor")
      .analyze();
    expect(axe.violations).toEqual([]);
    await page
      .getByRole("button", { name: "Zastosuj do szafki", exact: true })
      .click();
    await expect
      .poll(async () => (await saved(page)).items[0].innerDrawers)
      .toBe(2);
    await page.getByRole("button", { name: /Zbliż wybraną szafkę/ }).click();
    await expect(
      page.getByRole("button", { name: "Pokaż całą ścianę" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    await expect
      .poll(async () => (await saved(page)).items[0].innerDrawers)
      .toBeUndefined();
    if (phone)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
  });

test("linked dimensions keep an invalid draft, cancel and apply with undo", async ({
  page,
}) => {
  await fixture(page);
  await page
    .getByText("Wspólne wymiary kuchni · cokół, blat i górne szafki", {
      exact: true,
    })
    .click();
  await page.getByLabel("Wysokość cokołu (mm)", { exact: true }).fill("500");
  await page
    .getByRole("button", { name: "Zastosuj wspólne wymiary", exact: true })
    .click();
  await expect(page.locator(".kp-standards-tools")).toContainText(
    "Cokół: 80–200 mm",
  );
  expect((await saved(page)).standards).toBeUndefined();
  await page.getByLabel("Wysokość cokołu (mm)", { exact: true }).fill("150");
  await page
    .getByLabel("Wysokość dolnych korpusów", { exact: true })
    .selectOption("800");
  await page
    .getByRole("button", { name: "Zastosuj wspólne wymiary", exact: true })
    .click();
  await expect
    .poll(async () => (await saved(page)).standards?.plinth)
    .toBe(150);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect.poll(async () => (await saved(page)).standards).toBeUndefined();
});
