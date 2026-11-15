import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
import AxeBuilder from "@axe-core/playwright";
test("compact studio keeps drawing fixed and preserves edits between panels", async ({
  page,
}) => {
  await staffApi(page);
  await page.setViewportSize({ width: 1488, height: 1056 });
  await page.goto("/#/panel/meble");
  const root = page.locator(".fc-studio");
  await expect(root).toBeVisible();
  const drawing = page.locator(".fc-drawing");
  const before = await drawing.boundingBox();
  await page.getByRole("tab", { name: "Części", exact: true }).click();
  await expect(page.getByRole("searchbox")).toBeVisible();
  await page.getByRole("tab", { name: "Układ", exact: true }).click();
  await expect(drawing).toBeVisible();
  const after = await drawing.boundingBox();
  expect(after!.height).toBeCloseTo(before!.height, 0);
  await page.getByRole("button", { name: "Bryła 3D", exact: true }).click();
  const canvas = page.locator(".fc-drawing canvas");
  await expect(canvas).toBeVisible();
  await canvas.evaluate((e) => e.setAttribute("data-persist", "yes"));
  await page.getByRole("tab", { name: "Płyta", exact: true }).click();
  await page.getByRole("tab", { name: "Widok", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-persist", "yes");
  await page.getByRole("button", { name: "Materiały", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Materiały i standard" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Materiały", exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    (await new AxeBuilder({ page }).include(".fc-studio").analyze()).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "../../outputs/Kreator-kompaktowy-2026-11-05.png",
  });
});
test("mobile studio switches tools without losing drawing", async ({
  page,
}) => {
  await staffApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/panel/meble");
  const areas = page.getByRole("group", { name: "Obszar kreatora" });
  await expect(page.locator(".fc-drawing")).toBeVisible();
  await areas.getByRole("button", { name: "Narzędzia", exact: true }).click();
  await expect(
    page.getByLabel("Układ startowy", { exact: true }),
  ).toBeVisible();
  await areas.getByRole("button", { name: "Inspektor", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Płyta", exact: true }),
  ).toBeVisible();
  await areas.getByRole("button", { name: "Projekt", exact: true }).click();
  await expect(page.locator(".fc-drawing")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "../../outputs/Kreator-kompaktowy-mobile-2026-11-05.png",
  });
});
