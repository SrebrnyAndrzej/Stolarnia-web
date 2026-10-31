import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function scrollProgress(page: Page, progress: number) {
  await page.evaluate((p) => {
    const el = document.querySelector<HTMLElement>(".ps-home-intro")!;
    window.scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * p);
  }, progress);
}
const time = (page: Page) =>
  page
    .locator(".ps-intro-film video")
    .evaluate((v: HTMLVideoElement) => v.currentTime);

test("intro timeline follows scroll in both directions and can be paused", async ({
  page,
}) => {
  test.setTimeout(45000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/");
  await expect
    .poll(
      () =>
        page
          .locator(".ps-intro-film video")
          .evaluate((v: HTMLVideoElement) => v.readyState),
      { timeout: 15000 },
    )
    .toBeGreaterThanOrEqual(2);
  await scrollProgress(page, 0.65);
  await expect.poll(() => time(page)).toBeGreaterThan(8);
  await scrollProgress(page, 0.2);
  await expect.poll(() => time(page)).toBeLessThan(4);
  await page.getByRole("button", { name: "Wstrzymaj animację" }).click();
  const frozen = await time(page);
  await scrollProgress(page, 0.7);
  await expect.poll(() => time(page)).toBeCloseTo(frozen, 1);
  await page.getByRole("button", { name: "Wznów animację" }).click();
  await expect.poll(() => time(page)).toBeGreaterThan(8);
  expect(
    await page
      .locator(".ps-intro-film video")
      .evaluate((v: HTMLVideoElement) => v.autoplay),
  ).toBe(false);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await page.screenshot({ path: "qa/home-intro-desktop.png", fullPage: false });
  expect(errors).toEqual([]);
});

test("reduced motion keeps a static intro without downloading the movie", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) requests.push(r.url());
  });
  await page.goto("/#/");
  await expect(page.locator(".ps-intro-film img")).toBeVisible();
  await expect(page.locator(".ps-intro-film video")).toHaveCount(0);
  expect(
    await page
      .locator(".ps-home-intro h1")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
  await expect(page.locator(".ps-home-intro")).not.toHaveClass(/has-motion/);
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Włącz animację" }).click();
  await expect(page.locator(".ps-intro-film video")).toHaveCount(1);
});

test("phone video fills the hero background and keeps working navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/");
  await expect
    .poll(
      () =>
        page
          .locator(".ps-intro-film video")
          .evaluate((v: HTMLVideoElement) => v.readyState),
      { timeout: 15000 },
    )
    .toBeGreaterThanOrEqual(2);
  await scrollProgress(page, 0.5);
  await expect.poll(() => time(page)).toBeGreaterThan(5);
  const box = await page.locator(".ps-intro-film").boundingBox();
  const hero = await page.locator(".ps-home-intro > .ps-hero").boundingBox();
  expect(box!.width).toBeCloseTo(hero!.width, 0);
  expect(box!.height).toBeCloseTo(hero!.height, 0);
  expect(
    await page
      .locator(".ps-intro-film video")
      .evaluate((v) => getComputedStyle(v).objectFit),
  ).toBe("cover");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "qa/home-intro-mobile.png", fullPage: false });
  await page
    .locator(".ps-home-intro")
    .getByRole("link", { name: "Zaprojektuj kuchnię", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Zaplanuj swoją kuchnię" }),
  ).toBeVisible();
});

test("failed media retains poster, content and normal page scrolling", async ({
  page,
}) => {
  await page.route("**/animations/*.mp4", (r) => r.abort());
  await page.goto("/#/");
  await expect(
    page.getByText("Wizualizacja kuchni · podgląd statyczny"),
  ).toBeVisible();
  await expect(page.locator(".ps-intro-film img")).toBeVisible();
  await expect(page.locator(".ps-home-intro")).not.toHaveClass(/has-motion/);
  await page
    .getByRole("link", { name: "Opowiedz o projekcie", exact: true })
    .click();
  await expect(page.locator('input[name="name"]')).toBeVisible();
});

test("hero copy reveals with scroll while actions remain available", async ({
  page,
}) => {
  await page.goto("/#/");
  const title = page.locator(".ps-home-intro h1");
  const opacity = () =>
    title.evaluate((el) => Number(getComputedStyle(el).opacity));
  await expect.poll(opacity).toBe(0);
  await expect(
    page
      .locator(".ps-home-intro")
      .getByRole("link", { name: "Zaprojektuj kuchnię", exact: true }),
  ).toBeVisible();
  await scrollProgress(page, 0.4);
  await expect.poll(opacity).toBe(1);
  await scrollProgress(page, 0.1);
  await expect.poll(opacity).toBeLessThan(0.5);
  await page
    .locator(".ps-home-intro")
    .getByRole("link", { name: "Zaprojektuj kuchnię", exact: true })
    .focus();
  await expect.poll(opacity).toBe(1);
});

test("large scroll input is damped instead of jumping through the kitchen", async ({
  page,
}) => {
  await page.goto("/#/");
  await expect
    .poll(
      () =>
        page
          .locator(".ps-intro-film video")
          .evaluate((v: HTMLVideoElement) => v.readyState),
      { timeout: 15000 },
    )
    .toBeGreaterThanOrEqual(2);
  const range = await page
    .locator(".ps-home-intro")
    .evaluate(
      (el) => (el.getBoundingClientRect().height - innerHeight) / innerHeight,
    );
  expect(range).toBeCloseTo(2.6, 1);
  const immediate = await page.evaluate(async () => {
    const el = document.querySelector<HTMLElement>(".ps-home-intro")!;
    scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * 0.85);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
    );
    return document.querySelector("video")!.currentTime;
  });
  expect(immediate).toBeLessThan(1.2);
  await expect.poll(() => time(page), { timeout: 7000 }).toBeGreaterThan(10);
  await scrollProgress(page, 0.15);
  await expect.poll(() => time(page), { timeout: 7000 }).toBeLessThan(3);
});
