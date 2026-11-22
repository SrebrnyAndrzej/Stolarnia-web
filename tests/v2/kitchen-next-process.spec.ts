import { openKitchenList } from "./kitchen-ui";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const saved = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );

test("pending room measurements are preserved and must be saved or cancelled before the price", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  const before = await saved(page);
  await page.getByText("Okna, drzwi i przyłącza", { exact: true }).click();
  await page.getByLabel("Od początku ściany (cm)", { exact: true }).fill("350");
  await page.getByText("Okna, drzwi i przyłącza", { exact: true }).click();
  await page
    .getByRole("button", { name: "Zobacz podsumowanie", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Dodaj do pomieszczenia", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByLabel("Od początku ściany (cm)", { exact: true }),
  ).toHaveValue("350");
  await expect(page.locator(".kp-live-price strong")).toHaveText(
    "Zastosuj zmiany",
  );
  expect(await saved(page)).toEqual(before);
  await page
    .getByRole("button", { name: "Dodaj do pomieszczenia", exact: true })
    .click();
  await expect(page.locator("#kp-room-feature-error")).toContainText(
    "nie mieści się",
  );
  expect(await saved(page)).toEqual(before);
  await page
    .getByRole("button", { name: "Anuluj edycję oznaczenia", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zobacz podsumowanie", exact: true })
    .click();
  await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
});

test("a variant remains in this tab across room navigation when local storage refuses it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "pan-stolarz.kuchnia.warianty.v1") throw new Error("quota");
      return original.call(this, key, value);
    };
  });
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await page.getByText("Porównaj dwa warianty kuchni", { exact: true }).click();
  await page
    .getByRole("button", {
      name: "Zapisz wariant A bieżącym projektem",
      exact: true,
    })
    .click();
  await expect(page.locator(".kp-variants")).toContainText(
    "Pamięć urządzenia jest niedostępna",
  );
  await page.getByRole("button", { name: "Kaszmir", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Zastąp wariant A bieżącym projektem",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Zastąpić wariant A?",
    exact: true,
  });
  await expect(
    dialog.getByRole("button", {
      name: "Zachowaj zapisany wariant",
      exact: true,
    }),
  ).toBeFocused();
  await dialog
    .getByRole("button", { name: "Zachowaj zapisany wariant", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Użyj wariantu A", exact: true })
    .click();
  expect((await saved(page)).finish).toBe("oak");
  await page.getByRole("button", { name: "Kaszmir", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Zastąp wariant A bieżącym projektem",
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", { name: "Zastąp zapisany wariant", exact: true })
    .click();
  await page.getByRole("button", { name: "Grafit", exact: true }).click();
  await page
    .getByRole("button", { name: "Użyj wariantu A", exact: true })
    .click();
  expect((await saved(page)).finish).toBe("cashmere");
  await page
    .getByRole("button", { name: "Wymiary pomieszczenia", exact: true })
    .click();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByText("Porównaj dwa warianty kuchni", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Użyj wariantu A", exact: true }),
  ).toBeVisible();
});

for (const phone of [false, true])
  test(`client uses cm, inserts in a gap, sees price changes and compares saved variants (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      ({ a, b }) =>
        localStorage.setItem(
          "pan-stolarz.kuchnia.v1",
          JSON.stringify({
            version: 1,
            layout: "straight",
            width: 3600,
            depth: 2400,
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
              { id: a, catalogId: "base-shelves-600", wall: "a" },
              {
                id: b,
                catalogId: "base-shelves-600",
                wall: "a",
                gapBefore: 650,
              },
            ],
          }),
        ),
      { a: uuid(1), b: uuid(2) },
    );
    await page.goto("/#/kreator-kuchni");
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
    const firstPrice = await page.locator(".kp-live-price strong").innerText();
    await page.locator('[data-kitchen-gap="a:base:600:1250"]').click();
    await expect(page.locator("#kp-catalog-title")).toBeFocused();
    await expect(
      page.getByLabel("Miejsce dodawania", { exact: true }),
    ).toHaveValue("a:base:600:1250");
    await page
      .getByLabel("Rodzaj szafek", { exact: true })
      .selectOption("drawers");
    await page
      .getByRole("button", {
        name: "Dodaj: Szafka dolna z szufladami 600",
        exact: false,
      })
      .click();
    const width = page.getByLabel("Szerokość szafki", { exact: true });
    await expect(width).toHaveValue("60");
    await expect(
      page.getByLabel("Jednostka edycji", { exact: true }),
    ).toHaveValue("cm");
    const a = await saved(page);
    expect(a.items).toHaveLength(3);
    expect(a.items[1].catalogId).toBe("base-drawers-600");
    expect(a.items[2].id).toBe(uuid(2));
    expect(a.items[2].gapBefore).toBe(50);
    await page
      .getByLabel("Jednostka edycji", { exact: true })
      .selectOption("mm");
    await expect(width).toHaveValue("600");
    await expect(page.locator(".kp-editor-pending")).toHaveCount(0);
    await page
      .getByLabel("Jednostka edycji", { exact: true })
      .selectOption("cm");
    await page
      .getByRole("button", { name: "Wróć do podglądu", exact: true })
      .click();
    await expect(page.locator(".kp-live-price strong")).not.toHaveText(
      firstPrice,
    );
    await expect(page.locator(".kp-live-price small").first()).toContainText(
      "Ostatnia zmiana",
    );
    await page
      .getByText("Porównaj dwa warianty kuchni", { exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Zapisz wariant A bieżącym projektem",
        exact: true,
      })
      .click();
    await openKitchenList(page);
    await page
      .locator(".kp-item-name")
      .filter({ hasText: "Szafka dolna z szufladami" })
      .click();
    await width.fill("50,5");
    await expect(page.locator(".kp-live-price strong")).toHaveText(
      "Zastosuj zmiany",
    );
    await page
      .getByRole("button", { name: "Zastosuj do szafki", exact: true })
      .click();
    expect((await saved(page)).items[1].width).toBe(505);
    await page
      .getByRole("button", { name: "Wróć do podglądu", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Zapisz wariant B bieżącym projektem",
        exact: true,
      })
      .click();
    await expect(
      page.locator(".kp-variant-grid article strong").first(),
    ).toHaveText(/\d.*zł/);
    await expect(
      page.locator(".kp-variant-grid article strong").last(),
    ).toHaveText(/\d.*zł/);
    expect(
      await page.locator(".kp-variant-grid article strong").first().innerText(),
    ).not.toBe(
      await page.locator(".kp-variant-grid article strong").last().innerText(),
    );
    await page
      .getByRole("button", { name: "Użyj wariantu A", exact: true })
      .click();
    await expect.poll(() => saved(page)).toEqual(a);
    await page
      .getByLabel("Miejsce dodawania", { exact: true })
      .selectOption("a:base:1200:1250");
    await expect(page.getByLabel("Rodzaj szafek", { exact: true })).toHaveValue(
      "fillers",
    );
    await page
      .getByRole("button", { name: "Dodaj: Blenda dolna 50", exact: false })
      .click();
    expect(
      (await saved(page)).items.some(
        (i: { catalogId: string; width: number }) =>
          i.catalogId === "base-filler-50" && i.width === 50,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Wróć do podglądu", exact: true })
      .click();
    const axe = await new AxeBuilder({ page }).include(".kp-main").analyze();
    expect(axe.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".kp-variants")
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.screenshot({
      path: `../../outputs/kreator-pelny-proces-2026-11-15/warianty-${phone ? "telefon" : "komputer"}.png`,
    });
    await page.reload();
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    await page
      .getByText("Porównaj dwa warianty kuchni", { exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Użyj wariantu A", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Użyj wariantu B", exact: true }),
    ).toBeVisible();
  });

test("measured room openings and water guide the proposal, persist and appear in the real PDF", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page.getByLabel("Długość ściany A", { exact: false }).fill("480");
  // Commit the room first, then add measurements to that room.
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByText("Okna, drzwi i przyłącza", { exact: true }).click();
  await page.getByLabel("Od początku ściany (cm)", { exact: true }).fill("80");
  await page.getByLabel("Wysokość otworu (cm)", { exact: true }).fill("100");
  await page
    .getByRole("button", { name: "Dodaj do pomieszczenia", exact: true })
    .click();
  await expect(page.locator(".kp-feature-list li")).toHaveCount(1);
  await page
    .getByLabel("Element pomieszczenia", { exact: true })
    .selectOption("water");
  await page.getByLabel("Od początku ściany (cm)", { exact: true }).fill("210");
  await page
    .getByRole("button", { name: "Dodaj do pomieszczenia", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Wstaw proponowany układ", exact: true })
    .click();
  const d = await saved(page);
  expect(d.features).toHaveLength(2);
  expect(d.planning.sinkCenter).toBe(2100);
  await expect(page.locator(".kp-canvas [data-room-feature]")).toHaveCount(2);
  await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
  await page.getByText(/Sprawdź projekt ·/).click();
  await expect(page.locator(".kp-project-review")).toContainText(
    "0 do poprawy",
  );
  await page
    .locator(".kp-preview-toolbar")
    .evaluate((el) =>
      scrollTo(0, scrollY + el.getBoundingClientRect().top - 110),
    );
  await page.screenshot({
    path: "../../outputs/kreator-pelny-proces-2026-11-15/pomieszczenie.png",
  });
  await page
    .getByRole("button", { name: "Zobacz podsumowanie", exact: true })
    .click();
  await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz wycenę PDF", exact: true })
    .click();
  await (
    await download
  ).saveAs("../../outputs/kreator-pelny-proces-2026-11-15/oferta-okno.pdf");
});

test("a catalog blind corner replaces storage at the L turn and undo restores it", async ({
  page,
}) => {
  await page.addInitScript(
    (ids) =>
      localStorage.setItem(
        "pan-stolarz.kuchnia.v1",
        JSON.stringify({
          version: 1,
          layout: "l",
          width: 3600,
          depth: 3000,
          returnLength: 3000,
          height: 2600,
          finish: "oak",
          items: ids.map((id) => ({
            id,
            catalogId: "base-shelves-600",
            wall: "a",
          })),
        }),
      ),
    Array.from({ length: 6 }, (_, i) => uuid(i + 1)),
  );
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  const before = await saved(page);
  await page.getByText("Zabudowa narożnika L / U", { exact: true }).click();
  await page
    .getByRole("button", { name: "Zastosuj narożnik ślepy", exact: true })
    .click();
  expect(
    (await saved(page)).items.some(
      (i: { catalogId: string }) => i.catalogId === "base-blind-corner-1100",
    ),
  ).toBe(true);
  await expect(page.locator(".kp-arrangement")).toContainText(
    "Szafka narożna ślepa 1100",
  );
  await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect.poll(() => saved(page)).toEqual(before);
});
