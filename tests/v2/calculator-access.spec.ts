import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a customer can design and price a kitchen without seeing workshop calculators", async ({
  page,
}) => {
  const privateCalls: string[] = [];
  page.on("request", (r) => {
    if (/\/(systemy-szuflad|przelicznik-szuflad)(\?|$)/.test(r.url()))
      privateCalls.push(r.url());
  });
  await page.goto("/#/");
  await expect(page.locator('a[href^="#/kalkulatory"]')).toHaveCount(0);
  await page.goto("/#/kreator-kuchni");
  await expect(page.getByRole("link", { name: /Kalkulatory/ })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Szafka dolna z szufladami" })
    .click();
  await expect(page.locator(".kp-cabinet-editor")).toBeVisible();
  await expect(page.locator(".kp-drawer-choice")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Przelicz szufladę/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
  await expect(
    page.getByText("ORIENTACYJNA CENA WSTĘPNA", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz wycenę PDF" }).click();
  await (
    await download
  ).saveAs("../../work/customer-kitchen-access-2026-11-15.pdf");
  expect(privateCalls).toEqual([]);
  expect(
    (await new AxeBuilder({ page }).include(".kp-main").analyze()).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "../../outputs/Kuchnia-klienta-2026-11-15.png",
  });
});

for (const route of [
  "#/kalkulatory/szuflady",
  "#/kalkulatory/skosy",
  "#/kalkulatory/fronty",
  "#/panel/szuflady",
  "#/szuflady",
])
  test(`anonymous direct calculator link requires login: ${route}`, async ({
    page,
  }) => {
    const calculations: string[] = [];
    page.on("request", (r) => {
      if (/\/(systemy-szuflad|przelicznik-szuflad)(\?|$)/.test(r.url()))
        calculations.push(r.url());
    });
    await page.goto(`/${route}`);
    await expect(
      page.getByRole("textbox", { name: /E-mail|Adres e-mail/i }),
    ).toBeVisible();
    await expect(
      page.locator(".drawer-calculator, .pc-slope, .pc-front-results"),
    ).toHaveCount(0);
    expect(calculations).toEqual([]);
  });

test("calculator API including old demo URLs is unavailable anonymously", async ({
  request,
}) => {
  for (const prefix of ["/api", "/api/demo"])
    for (const path of [
      "systemy-szuflad",
      "przelicznik-szuflad?LW=564&NL=500&wysokoscFrontu=300",
    ]) {
      const response = await request.get(`${prefix}/${path}`);
      expect(response.status()).toBe(401);
      expect(response.headers()["cache-control"]).toContain("no-store");
    }
});

for (const role of ["owner", "employee"])
  test(`staff panel exposes all calculators to ${role}`, async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      { name: "pan_stolarz_qa_staff", value: role, url: baseURL! },
    ]);
    await page.goto("/#/panel/szuflady");
    await expect(
      page
        .getByRole("navigation", { name: "Panel stolarni" })
        .getByRole("link", { name: "Kalkulatory stolarza" }),
    ).toBeVisible();
    await expect(page.locator(".drawer-cut").first()).toBeVisible();
    await page
      .getByRole("tab", { name: "Skosy i wieniec", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Kalkulator skosu", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("tab", { name: "Podział frontów", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Podział frontów", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("tab", { name: "Podział frontów", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      (await new AxeBuilder({ page }).include("#ps-content").analyze())
        .violations,
    ).toEqual([]);
    if (role === "owner")
      await page.screenshot({
        path: "../../outputs/Kalkulatory-panel-2026-11-15.png",
      });
  });

for (const person of [
  { role: "client", active: true },
  { role: "employee", active: false },
])
  test(`non-staff session is denied: ${person.role}, active=${person.active}`, async ({
    page,
  }) => {
    await page.route("**/api/v2/session", (route) =>
      route.fulfill({
        json: {
          ...person,
          user_id: "00000000-0000-4000-8000-000000000009",
          email: "invalid@example.test",
          display_name: "QA",
          project_ids: [],
        },
      }),
    );
    await page.goto("/#/kalkulatory/szuflady");
    await expect(
      page.getByRole("heading", { name: "Brak dostępu", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".drawer-calculator")).toHaveCount(0);
  });

test("calculator stays closed until the session check finishes", async ({
  page,
}) => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/v2/session", async (route) => {
    await pending;
    await route.fulfill({ status: 401, json: { blad: "Zaloguj się" } });
  });
  await page.goto("/#/kalkulatory/szuflady");
  await expect(
    page.getByText("Sprawdzamy sesję…", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".drawer-calculator")).toHaveCount(0);
  finish();
  await expect(
    page.getByRole("textbox", { name: /E-mail|Adres e-mail/i }),
  ).toBeVisible();
});

for (const status of [401, 403])
  test(`expired or revoked access closes the calculator (${status})`, async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      { name: "pan_stolarz_qa_staff", value: "employee", url: baseURL! },
    ]);
    await page.goto("/#/kalkulatory/szuflady");
    await expect(page.locator(".drawer-cut").first()).toBeVisible();
    await page.route("**/api/przelicznik-szuflad?*", (route) =>
      route.fulfill({
        status,
        json: { blad: "Dostęp wygasł lub został cofnięty" },
      }),
    );
    await page.getByLabel("Światło korpusu LW", { exact: true }).fill("664");
    await expect(
      page.getByRole("textbox", { name: /E-mail|Adres e-mail/i }),
    ).toBeVisible();
    await expect(page.locator(".drawer-calculator")).toHaveCount(0);
    await expect(
      page.getByText(
        "Sesja wygasła lub dostęp został cofnięty. Zaloguj się ponownie.",
        { exact: true },
      ),
    ).toBeVisible();
  });
