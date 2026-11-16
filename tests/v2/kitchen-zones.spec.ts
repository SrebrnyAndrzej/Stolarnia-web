import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const phone of [false, true])
  test(`functional kitchen proposal has visible water and appliance zones (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/kreator-kuchni");
    await page
      .getByLabel("Jednostka wymiarów", { exact: true })
      .selectOption("mm");
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await page.getByRole("button", { name: "Wstaw proponowany układ" }).click();
    await page
      .getByText("Zlew, AGD i miejsce do pracy", { exact: true })
      .click();
    const zones = page.getByRole("region", {
      name: "Strefy funkcjonalne kuchni",
    });
    await expect(
      zones.getByRole("heading", { name: "Hydraulika", exact: true }),
    ).toBeVisible();
    await expect(
      zones.getByRole("heading", { name: "AGD i wentylacja" }),
    ).toBeVisible();
    await expect(
      zones.getByRole("heading", { name: "Przygotowanie" }),
    ).toBeVisible();
    await expect(zones.getByText(/Do dopracowania/)).toHaveCount(0);
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
    expect(
      stored.items.filter(
        (i: { catalogId: string }) => i.catalogId === "base-sink-600",
      ),
    ).toHaveLength(1);
    expect(
      stored.items.filter(
        (i: { catalogId: string }) => i.catalogId === "base-oven-600",
      ),
    ).toHaveLength(1);
    expect(
      stored.items.filter(
        (i: { catalogId: string }) => i.catalogId === "wall-hood-600",
      ),
    ).toHaveLength(1);
    await expect(
      page.locator(".kp-canvas svg").getByText("PIEKARNIK + PŁYTA"),
    ).toBeVisible();
    const axe = await new AxeBuilder({ page })
      .include(".kp-zones")
      .include(".kp-planning-tools")
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await zones.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await zones.screenshot({
      path: `../../outputs/Kuchnia-strefy-${phone ? "telefon" : "komputer"}-2026-11-14.png`,
    });
    await page
      .getByRole("combobox", { name: "Rodzaj szafek", exact: true })
      .selectOption("cooking");
    await expect(
      page.getByRole("button", { name: /Dodaj: Szafka wisząca pod okap 600/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Dodaj: Szafka pod zlew/ }),
    ).toHaveCount(0);
    if (!phone) {
      await page.getByRole("button", { name: "3D", exact: true }).click();
      await expect(page.locator(".kp-canvas canvas")).toBeVisible();
      await page.waitForTimeout(800);
      await page
        .locator(".kp-canvas")
        .screenshot({ path: "../../outputs/Kuchnia-strefy-3D-2026-11-14.png" });
      await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
      await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Pobierz wycenę PDF" }).click();
      await (
        await download
      ).saveAs("../../work/qa-zones-kitchen-2026-11-14.pdf");
    }
    await page.reload();
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await page
      .getByText("Zlew, AGD i miejsce do pracy", { exact: true })
      .click();
    await expect(
      zones.getByRole("button", { name: /Piekarnik \+ płyta/ }),
    ).toBeVisible();
  });

test("measured water zone on wall B persists and zone buttons select the actual cabinet", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByLabel("Jednostka wymiarów", { exact: true })
    .selectOption("mm");
  await page.getByRole("button", { name: "Układ L", exact: false }).click();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByText("Założenia kuchni · AGD i hydraulika", { exact: true })
    .click();
  await page.getByLabel("Ściana zlewu", { exact: true }).selectOption("b");
  await page
    .getByLabel("Środek zlewu od początku ściany (mm)", { exact: true })
    .fill("1550");
  await page.getByLabel("Zmywarka", { exact: true }).selectOption("450");
  await page.getByRole("button", { name: "Wstaw proponowany układ" }).click();
  await page.getByText("Zlew, AGD i miejsce do pracy", { exact: true }).click();
  const sink = page
    .getByRole("region", { name: "Strefy funkcjonalne kuchni" })
    .getByRole("button", { name: "Zlew · B · środek 1550 mm", exact: true });
  await sink.click();
  await expect(page.locator(".kp-placement summary")).toContainText(
    "początek 1250 mm",
  );
  await expect(page.locator(".kp-cabinet-editor")).toContainText("ściana B");
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  expect(before.planning).toEqual({
    waterWall: "b",
    sinkCenter: 1550,
    dishwasher: "450",
  });
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
      )
    ).items,
  ).toHaveLength(0);
  await expect(
    page.getByRole("region", { name: "Strefy funkcjonalne kuchni" }),
  ).toHaveCount(0);
});

test("an impossible full kitchen preserves the manually entered project and shows the correction path", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByLabel("Jednostka wymiarów", { exact: true })
    .selectOption("mm");
  await page.getByLabel("Długość ściany A").fill("1800");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", { name: /Dodaj: Szafka dolna z półkami 600/ })
    .click();
  const before = await page.evaluate(() =>
    localStorage.getItem("pan-stolarz.kuchnia.v1"),
  );
  await page
    .getByRole("button", { name: "Zastąp proponowanym układem" })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Nie mieści się spójny układ" }),
  ).toBeVisible();
  await expect(page.getByLabel("Ściana zlewu", { exact: true })).toBeFocused();
  expect(
    await page.evaluate(() => localStorage.getItem("pan-stolarz.kuchnia.v1")),
  ).toBe(before);
  await page
    .getByLabel("Środek zlewu od początku ściany (mm)", { exact: true })
    .fill("abc");
  await page
    .getByRole("button", { name: "Zastąp proponowanym układem" })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "całych milimetrach" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Środek zlewu od początku ściany (mm)", { exact: true }),
  ).toHaveValue("abc");
  expect(
    await page.evaluate(() => localStorage.getItem("pan-stolarz.kuchnia.v1")),
  ).toBe(before);
});

test("tail filling has an explicit purpose and does not pretend to add water or appliances", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByLabel("Jednostka wymiarów", { exact: true })
    .selectOption("mm");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByText("Uzupełnij kuchnię lub rząd", { exact: true }).click();
  await page.getByLabel("Cel uzupełniania").selectOption("preparation");
  await page.getByRole("button", { name: "Dopełnij ten rząd" }).click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  expect(
    stored.items.every(
      (i: { catalogId: string }) => i.catalogId === "base-drawers-600",
    ),
  ).toBe(true);
  await page.getByText("Zlew, AGD i miejsce do pracy", { exact: true }).click();
  await page.getByText(/Do dopracowania ·/).click();
  await expect(
    page.getByText("Brak zlewu w projekcie.", { exact: true }),
  ).toBeVisible();
});

test("automatic completion adds missing appliances and preserves the chosen fridge", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByLabel("Jednostka wymiarów", { exact: true })
    .selectOption("mm");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("combobox", { name: "Rodzaj szafek", exact: true })
    .selectOption("cooling");
  await page
    .getByRole("button", { name: /Dodaj: Słupek pod lodówkę 600/ })
    .click();
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!).items[0],
  );
  await page.getByText("Uzupełnij kuchnię lub rząd", { exact: true }).click();
  await page
    .getByRole("button", { name: "Uzupełnij brakujące strefy", exact: true })
    .click();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  expect(after.items[0]).toEqual(before);
  expect(
    after.items.filter(
      (i: { catalogId: string }) => i.catalogId === "tall-refrigerator-600",
    ),
  ).toHaveLength(1);
  await expect(page.getByText(/Do dopracowania ·/)).toHaveCount(0);
  await expect(
    page.locator(".kp-canvas svg").getByText("ZLEW", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
      )
    ).items,
  ).toEqual([before]);
});
