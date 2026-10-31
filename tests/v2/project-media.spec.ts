import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("project renders load as public images without requesting private project data", async ({
  page,
}) => {
  const privateRequests: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/(projekty|v2\/projects)/.test(r.url()))
      privateRequests.push(r.url());
  });
  await page.goto("/#/");
  await page.locator(".ps-render-section").scrollIntoViewIfNeeded();
  const images = page.locator(".ps-render-grid img");
  await expect(images).toHaveCount(3);
  for (const image of await images.all())
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBe(1920);
  await expect(page.locator(".ps-render-grid")).toContainText("16 modułów");
  await expect(page.locator(".ps-render-grid")).toContainText("11 modułów");
  await expect(page.locator(".ps-render-grid")).toContainText("12 modułów");
  expect(privateRequests).toEqual([]);
  await page.screenshot({
    path: "qa/project-renders-desktop.png",
    fullPage: false,
  });
});
test("cabinet assembly plays on demand and keeps mobile layout accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/");
  const video = page.getByLabel("Poglądowa animacja składania korpusu szafki");
  expect(await video.evaluate((v: HTMLVideoElement) => v.autoplay)).toBe(false);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await page.locator(".ps-assembly").scrollIntoViewIfNeeded();
  await video.evaluate((v: HTMLVideoElement) => v.play());
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), {
      timeout: 15000,
    })
    .toBeGreaterThan(1);
  expect(await video.evaluate((v: HTMLVideoElement) => v.duration)).toBeCloseTo(
    8,
    0,
  );
  await video.evaluate((v: HTMLVideoElement) => v.pause());
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .include(".ps-assembly")
    .include(".ps-render-section")
    .analyze();
  expect(
    results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await page.screenshot({
    path: "qa/cabinet-assembly-mobile.png",
    fullPage: false,
  });
});
test("assembly failure leaves a labelled static preview", async ({ page }) => {
  await page.route("**/animations/skladanie-szafki.mp4", (r) => r.abort());
  await page.goto("/#/");
  await page.locator(".ps-assembly").scrollIntoViewIfNeeded();
  await page
    .getByLabel("Poglądowa animacja składania korpusu szafki")
    .evaluate((v: HTMLVideoElement) => {
      v.load();
    });
  await expect(
    page.getByText("Film jest niedostępny. Możesz obejrzeć statyczny podgląd."),
  ).toBeVisible();
  await expect(page.locator(".ps-assembly-film img")).toBeVisible();
});
