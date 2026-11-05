import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
import AxeBuilder from "@axe-core/playwright";

test("solid 3D desk rotates, zooms, selects parts and keeps edits when returning to 2D", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("desk-hutch");
  await page.getByLabel("Strona szafki", { exact: true }).selectOption("both");
  await page
    .getByLabel("Front szafki", { exact: true })
    .selectOption("drawers");
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  const canvas = page.getByTestId("furniture-scene").locator("canvas");
  await expect(canvas).toBeVisible();
  // The controls invoke a synchronous depth-buffered render after lazy loading.
  await page
    .getByRole("button", { name: "Widok początkowy", exact: true })
    .click();
  const before = await canvas.screenshot();
  expect(before.length).toBeGreaterThan(5000);
  await page
    .getByRole("button", { name: "Z lewej strony", exact: true })
    .click();
  expect((await canvas.screenshot()).equals(before)).toBeFalsy();
  await page
    .getByRole("button", { name: "Przybliż mebel", exact: true })
    .click();
  await page.getByRole("button", { name: "Oddal mebel", exact: true }).click();
  await page
    .getByRole("button", { name: "Widok początkowy", exact: true })
    .click();
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT_3D) {
    await page.locator(".fc-drawing").scrollIntoViewIfNeeded();
    await page.screenshot({ path: process.env.PAN_STOLARZ_QA_SCREENSHOT_3D });
  }
  const box = (await canvas.boundingBox())!;
  await canvas.click({
    position: { x: box.width * 0.3, y: box.height * 0.62 },
  });
  await expect(page.getByLabel("Nazwa płyty", { exact: true })).toHaveValue(
    "Wewnętrzny bok szafki (lewa)",
  );
  const accessibility = await new AxeBuilder({ page })
    .include(".fc-drawing")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  // Keyboard-accessible list selects the same solid in 3D without changing geometry.
  const options = page.getByLabel("Wybierz płytę", { exact: true });
  await options.selectOption({ label: "3. Blat biurka" });
  await expect(page.getByLabel("Nazwa płyty", { exact: true })).toHaveValue(
    "Blat biurka",
  );
  await page.getByRole("button", { name: "Przód 2D", exact: true }).click();
  await expect(page.locator(".fc-drawing svg")).toBeVisible();
  await expect(page.getByLabel("Strona szafki", { exact: true })).toHaveValue(
    "both",
  );
  expect(errors).toEqual([]);
});

test("3D supports slope, stairs and narrow screens without leaking canvases", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  for (const shape of ["slope", "stairs"]) {
    await page.getByLabel("Obrys", { exact: true }).selectOption(shape);
    await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
    const canvas = page.getByTestId("furniture-scene").locator("canvas");
    await expect(canvas).toHaveCount(1);
    await page
      .getByRole("button", { name: "Widok początkowy", exact: true })
      .click();
    expect((await canvas.screenshot()).length).toBeGreaterThan(5000);
    if (shape === "slope" && process.env.PAN_STOLARZ_QA_SCREENSHOT_3D_SLOPE) {
      await page.locator(".fc-drawing").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: process.env.PAN_STOLARZ_QA_SCREENSHOT_3D_SLOPE,
      });
    }
    await page.getByRole("button", { name: "Przód 2D", exact: true }).click();
    await expect(page.locator(".fc-drawing canvas")).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  await expect(
    page.getByTestId("furniture-scene").locator("canvas"),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Obszar kreatora" })
    .getByRole("button", { name: "Inspektor", exact: true })
    .click();
  await page.getByRole("button", { name: "Obróć w lewo", exact: true }).focus();
  await page.keyboard.press("Enter");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("unavailable WebGL leaves a clear recovery path and preserves the draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page.getByLabel("Nazwa mebla", { exact: true }).fill("Szkic zachowany");
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Nie udało się uruchomić widoku 3D",
  );
  await page.getByRole("button", { name: "Przód 2D", exact: true }).click();
  await expect(page.getByLabel("Nazwa mebla", { exact: true })).toHaveValue(
    "Szkic zachowany",
  );
  await expect(page.locator(".fc-drawing svg")).toBeVisible();
});
