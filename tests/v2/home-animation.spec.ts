import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const film = (page: import("@playwright/test").Page) =>
  page.locator(".ps-intro-film video");

test("hero plays without scrolling and moves to the next section when finished", async ({
  page,
}) => {
  await page.goto("/");
  await expect
    .poll(() => film(page).evaluate((v: HTMLVideoElement) => v.currentTime), {
      timeout: 15000,
    })
    .toBeGreaterThan(0.2);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(
    await film(page).evaluate((v: HTMLVideoElement) => v.playbackRate),
  ).toBe(0.75);
  expect(await film(page).evaluate((v: HTMLVideoElement) => v.muted)).toBe(
    true,
  );
  await film(page).evaluate((v: HTMLVideoElement) => {
    v.currentTime = v.duration - 0.15;
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.querySelector(".ps-proof-strip")!.getBoundingClientRect()
              .top,
        ),
      { timeout: 10000 },
    )
    .toBeLessThan(125);
  await expect(
    page.getByRole("heading", { name: "Zacznij tak, jak Ci wygodnie." }),
  ).toBeInViewport();
});
test("pause and resume work independently of scrolling", async ({ page }) => {
  await page.goto("/");
  await expect
    .poll(() => film(page).evaluate((v: HTMLVideoElement) => v.currentTime), {
      timeout: 15000,
    })
    .toBeGreaterThan(0.2);
  await page
    .getByRole("button", { name: "Wstrzymaj animację", exact: true })
    .click();
  const before = await film(page).evaluate(
    (v: HTMLVideoElement) => v.currentTime,
  );
  await page.waitForTimeout(500);
  expect(
    await film(page).evaluate((v: HTMLVideoElement) => v.currentTime),
  ).toBeCloseTo(before, 1);
  await page
    .getByRole("button", { name: "Wznów animację", exact: true })
    .click();
  await expect
    .poll(() => film(page).evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(before + 0.2);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
});
test("reduced motion keeps a static hero without fetching the movie", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const movies: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) movies.push(r.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Włącz animację", exact: true }),
  ).toBeVisible();
  await expect(film(page)).toHaveCount(0);
  expect(movies).toEqual([]);
  expect(
    await page
      .locator(".ps-hero-copy h1")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
});
test("phone film covers the hero and the creator remains reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect
    .poll(() => film(page).evaluate((v: HTMLVideoElement) => v.currentTime), {
      timeout: 15000,
    })
    .toBeGreaterThan(0.2);
  const box = await page.locator(".ps-intro-film").boundingBox();
  const hero = await page.locator(".ps-home-intro > .ps-hero").boundingBox();
  expect(box!.width).toBeCloseTo(hero!.width, 0);
  expect(box!.height).toBeCloseTo(hero!.height, 0);
  expect(await film(page).evaluate((v) => getComputedStyle(v).objectFit)).toBe(
    "cover",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "qa/home-intro-mobile.png" });
  await page
    .getByRole("link", { name: "Otwórz kreator kuchni", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Zaplanuj swoją kuchnię" }),
  ).toBeVisible();
});
test("failed film retains readable content and a static poster", async ({
  page,
}) => {
  await page.route("**/animations/*.mp4", (r) => r.abort());
  await page.goto("/");
  await expect(film(page)).toHaveCount(0);
  await expect(
    page.getByText("Wizualizacja kuchni · podgląd statyczny", { exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".ps-hero-copy h1")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
  await page
    .getByRole("link", { name: "Opisz swój pomysł", exact: true })
    .click();
  await expect(page.getByLabel("Imię", { exact: true })).toBeVisible();
});
test("manual navigation prevents an automatic jump and the hero has no long scroll spacer", async ({
  page,
}) => {
  await page.goto("/");
  await expect
    .poll(() => film(page).evaluate((v: HTMLVideoElement) => v.currentTime), {
      timeout: 15000,
    })
    .toBeGreaterThan(0.2);
  const size = await page
    .locator(".ps-home-intro")
    .evaluate((el) => el.getBoundingClientRect().height / innerHeight);
  expect(size).toBeLessThan(1.5);
  await page.mouse.wheel(0, 80);
  await page.waitForTimeout(300);
  await page.evaluate(() => scrollTo(0, 0));
  await film(page).evaluate((v: HTMLVideoElement) => {
    v.currentTime = v.duration - 0.15;
  });
  await expect
    .poll(() => film(page).evaluate((v: HTMLVideoElement) => v.ended))
    .toBe(true);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("blocked autoplay offers a play button and readable copy", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      return Promise.reject(
        new DOMException("Autoplay blocked", "NotAllowedError"),
      );
    };
  });
  await page.goto("/");
  await expect(
    page.getByText("Uruchom animację przyciskiem", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Włącz animację", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".ps-hero-copy h1")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
});
