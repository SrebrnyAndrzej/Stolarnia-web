import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const fixture = {
  version: 1,
  layout: "straight",
  width: 4200,
  depth: 3000,
  returnLength: 3600,
  height: 2600,
  finish: "cashmere",
  items: [],
  quote: {
    front: "laminate",
    worktop: "laminate",
    drawers: "amix",
    installation: true,
  },
  needs: {
    household: "3-4",
    cooking: "daily",
    storage: ["cutlery", "cookware", "recycling"],
    priority: "storage",
  },
};
const draft = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (initial) =>
      localStorage.setItem("pan-stolarz.kuchnia.v1", JSON.stringify(initial)),
    fixture,
  );
});

test("customer compares actual prices and interiors without saving until selection, cancel restores focus and undo restores the kitchen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/kreator-kuchni");
  const before = await draft(page);
  const trigger = page.getByRole("button", {
    name: "Porównaj propozycje kuchni",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Wybierz swoją kuchnię" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("article")).toHaveCount(3);
  for (const card of await dialog.getByRole("article").all())
    await expect(card.locator(".kp-proposal-price strong")).toHaveText(
      /\d.*zł/,
    );
  expect(await draft(page)).toEqual(before);
  expect(
    (await new AxeBuilder({ page }).include(".kp-proposals-dialog").analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await draft(page)).toEqual(before);
  await trigger.click();
  await dialog
    .getByRole("article", { name: "Prostsze wyposażenie", exact: true })
    .getByRole("button", { name: "Wybierz tę kuchnię" })
    .click();
  await expect(dialog).not.toBeVisible();
  const selected = await draft(page);
  expect(selected.needs.priority).toBe("economy");
  expect(selected.items.length).toBeGreaterThan(0);
  expect(selected.finish).toBe(before.finish);
  expect(selected.quote).toEqual(before.quote);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect(await draft(page)).toEqual(before);
});

test("mobile comparison switches a single visible card without changing the draft and blocks stale proposals", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/kreator-kuchni");
  const before = await draft(page);
  await page
    .getByRole("button", { name: "Porównaj propozycje kuchni", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Wybierz swoją kuchnię" });
  await expect(dialog.locator(".kp-proposal-card:visible")).toHaveCount(1);
  await dialog
    .getByRole("button", { name: "2. Prostsze wyposażenie", exact: true })
    .click();
  await expect(
    dialog.getByRole("article", { name: "Prostsze wyposażenie", exact: true }),
  ).toBeVisible();
  expect(await draft(page)).toEqual(before);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  // The same storage event is delivered when another tab saves a different kitchen.
  await page.evaluate(() =>
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "pan-stolarz.kuchnia.v1",
        newValue: localStorage.getItem("pan-stolarz.kuchnia.v1"),
      }),
    ),
  );
  await expect(dialog).toContainText("stan edycji zmienił się");
  await expect(
    dialog.getByRole("button", { name: "Wybierz tę kuchnię" }),
  ).toBeDisabled();
  await expect(
    dialog.locator(".kp-proposal-price strong").filter({ visible: true }),
  ).toHaveText("Odśwież propozycje");
  await dialog
    .getByRole("button", { name: "Wróć bez zmian", exact: true })
    .click();
  expect(await draft(page)).toEqual(before);
});

test("failed proposal prices can be retried without hiding the valid design or losing the source", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  const before = await draft(page);
  await page.route("**/api/public/kitchen-estimate", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ blad: "Wycena chwilowo niedostępna." }),
    }),
  );
  await page
    .getByRole("button", { name: "Porównaj propozycje kuchni", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Wybierz swoją kuchnię" });
  const first = dialog.getByRole("article").first();
  await expect(first.locator(".kp-proposal-price strong")).toHaveText(
    "Cena niedostępna",
  );
  expect(await draft(page)).toEqual(before);
  await page.unroute("**/api/public/kitchen-estimate");
  await first
    .getByRole("button", { name: "Ponów wycenę", exact: true })
    .click();
  await expect(first.locator(".kp-proposal-price strong")).toHaveText(/\d.*zł/);
  await dialog
    .getByRole("button", { name: "Wróć bez zmian", exact: true })
    .click();
  expect(await draft(page)).toEqual(before);
});

test("a server-rejected proposal explains the issue and cannot be applied", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  const before = await draft(page);
  await page.route("**/api/public/kitchen-estimate", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "blocked",
        gross: null,
        issues: ["Sprawdź rezerwę otwierania przy narożniku."],
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Porównaj propozycje kuchni", exact: true })
    .click();
  const first = page.getByRole("dialog").getByRole("article").first();
  await expect(first).toContainText(
    "Sprawdź rezerwę otwierania przy narożniku.",
  );
  await expect(
    first.getByRole("button", { name: "Wybierz tę kuchnię" }),
  ).toBeDisabled();
  expect(await draft(page)).toEqual(before);
});
