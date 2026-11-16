import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("customer measures in cm, can switch units without changing the room, and corrects only the invalid field", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  const unit = page.getByLabel("Jednostka wymiarów", { exact: true });
  const width = page.getByLabel("Długość ściany A", { exact: false });
  const height = page.getByLabel("Wysokość pomieszczenia", { exact: false });
  await expect(unit).toHaveValue("cm");
  await expect(width).toHaveValue("360");
  await width.fill("370,5");
  await unit.selectOption("mm");
  await expect(width).toHaveValue("3705");
  await unit.selectOption("cm");
  await expect(width).toHaveValue("370.5");
  await height.fill("200");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await expect(height).toBeFocused();
  await expect(height).toHaveAttribute("aria-invalid", "true");
  await expect(width).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByRole("alert")).toContainText("230–350 cm");
  await height.fill("260");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await expect(page.locator(".kp-arrangement li").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!).width,
    ),
  ).toBe(3705);
  await page
    .getByRole("button", { name: "Wymiary pomieszczenia", exact: true })
    .click();
  await unit.selectOption("mm");
  await page.reload();
  await expect(unit).toHaveValue("mm");
  await expect(width).toHaveValue("3705");
});

test("on a phone the proposed kitchen and next action appear before the catalog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  const canvas = await page.locator(".kp-canvas").boundingBox();
  const catalog = await page.locator(".kp-catalog").boundingBox();
  const actions = await page.locator(".kp-bottom-actions").boundingBox();
  expect(canvas!.y).toBeGreaterThan(60);
  expect(canvas!.y + canvas!.height).toBeLessThan(actions!.y);
  expect(catalog!.y).toBeGreaterThan(canvas!.y + canvas!.height);
  await expect(
    page.getByText("Zlew, AGD i miejsce do pracy", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zobacz podsumowanie" }),
  ).toBeInViewport();
  expect(
    (await new AxeBuilder({ page }).include(".kp-main").analyze()).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "../../outputs/audyt-klienta-2026-11-15/telefon-po-test.png",
  });
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
  await expect(page.getByText(/Wycena i PDF są w następnym kroku/)).toHaveCount(
    0,
  );
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz PDF", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe(
    "Pan-Stolarz-wstepna-wycena-kuchni.pdf",
  );
});

test("unapplied cabinet changes cannot silently reach the price or get lost by selecting another cabinet", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Szafka dolna z szufladami" })
    .click();
  const width = page.getByLabel("Szerokość szafki", { exact: true });
  await page.getByLabel("Jednostka edycji", { exact: true }).selectOption("mm");
  await width.fill("500");
  await expect(page.locator(".kp-editor-pending")).toBeVisible();
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  await expect(page.locator(".kp-quote")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Zastosuj do szafki", exact: true }),
  ).toBeFocused();
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Szafka pod zlew" })
    .click();
  await expect(width).toHaveValue("500");
  await page
    .getByRole("button", { name: "Anuluj zmiany", exact: true })
    .click();
  await expect(width).toHaveValue("600");
  await expect(page.locator(".kp-editor-pending")).toHaveCount(0);
  await width.fill("500");
  await page
    .getByRole("button", { name: "Zastosuj do szafki", exact: true })
    .click();
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!).items.find(
          (i: { catalogId: string }) => i.catalogId === "base-drawers-600",
        ).width,
    ),
  ).toBe(500);
});

test("editing from the quote immediately hides the price and PDF until applied or cancelled", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Szafka dolna z szufladami" })
    .click();
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  const price = page.locator(".kp-quote-price strong");
  await expect(price).toHaveText(/\d.*zł/);
  const before = await price.innerText();
  await page.getByLabel("Jednostka edycji", { exact: true }).selectOption("mm");
  await page.getByLabel("Szerokość szafki", { exact: true }).fill("500");
  await expect(price).toHaveText("Popraw układ");
  await expect(
    page.getByRole("button", { name: "Pobierz wycenę PDF", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Pobierz PDF", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Anuluj zmiany", exact: true })
    .click();
  await expect(price).toHaveText(before);
  await page.getByLabel("Szerokość szafki", { exact: true }).fill("500");
  await page
    .getByRole("button", { name: "Zastosuj do szafki", exact: true })
    .click();
  await expect(price).toHaveText(/\d.*zł/);
  await expect(price).not.toHaveText(before);
  expect(
    (await new AxeBuilder({ page }).include(".kp-main").analyze()).violations,
  ).toEqual([]);
});

test("an explicit new-kitchen confirmation can discard a pending cabinet edit", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await page
    .locator(".kp-item-name")
    .filter({ hasText: "Szafka dolna z szufladami" })
    .click();
  await page.getByLabel("Szerokość szafki", { exact: true }).fill("500");
  await page
    .getByRole("button", { name: "Zacznij od nowa", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Zachowaj szkic", exact: true })
    .click();
  await expect(
    page.getByLabel("Szerokość szafki", { exact: true }),
  ).toHaveValue("500");
  await page
    .getByRole("button", { name: "Zacznij od nowa", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Rozpocznij nowy szkic", exact: true })
    .click();
  await expect(
    page.getByLabel("Jednostka wymiarów", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".kp-cabinet-editor")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!).items,
    ),
  ).toEqual([]);
});

test("PDF action stays locked while downloading and a failure leads to a visible retry without losing the kitchen", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  const pdf = page.getByRole("button", { name: "Pobierz PDF", exact: true });
  await expect(pdf).toBeEnabled();
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let requests = 0;
  await page.route("**/api/public/kitchen-estimate/pdf", async (route) => {
    requests++;
    await gate;
    await route.fulfill({
      status: 503,
      json: { blad: "Przerwa w przygotowaniu PDF. Ponów pobieranie." },
    });
  });
  await pdf.click();
  await expect(
    page.locator('.kp-bottom-actions button[type="submit"]'),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Przygotowujemy PDF…", exact: true }),
  ).toHaveCount(2);
  finish();
  await expect(page.locator("#kp-pdf-error")).toBeFocused();
  await expect(page.locator("#kp-pdf-error")).toContainText("Ponów pobieranie");
  await expect(pdf).toBeEnabled();
  expect(requests).toBe(1);
  expect(await page.locator(".kp-arrangement li").count()).toBe(11);
});
