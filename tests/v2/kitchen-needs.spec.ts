import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const draft = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );

test("needs guide changes actual interiors, persists, highlights a proposed cupboard and survives undo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/kreator-kuchni");
  const form = page.getByRole("region", { name: "Potrzeby domowników" });
  await form.getByLabel("Ile osób korzysta z kuchni?").selectOption("3-4");
  await form.getByLabel("Jak często gotujesz?").selectOption("daily");
  await expect(
    page.getByRole("button", { name: "Ułóż całą kuchnię", exact: true }),
  ).toBeDisabled();
  await expect((await draft(page)).needs).toBeUndefined();
  await form.getByRole("button", { name: "Dalej", exact: true }).click();
  await form.getByLabel("Sztućce i przybory").check();
  await form.getByLabel("Garnki i patelnie").check();
  await form.getByLabel("Segregacja odpadów").check();
  expect(
    (await new AxeBuilder({ page }).include(".kp-needs").analyze()).violations,
  ).toEqual([]);
  await form.getByRole("button", { name: "Dalej", exact: true }).click();
  await form.getByRole("radio", { name: /Wygodne przechowywanie/ }).check();
  await form
    .getByRole("button", { name: "Zapisz potrzeby", exact: true })
    .click();
  await expect(page.locator("#kp-width")).toBeFocused();
  const preferences = (await draft(page)).needs;
  expect(preferences.storage).toEqual(["cutlery", "cookware", "recycling"]);
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  const generated = await draft(page);
  expect(
    generated.items.filter(
      (i: { catalogId: string }) => i.catalogId === "base-drawers-600",
    ).length,
  ).toBeGreaterThan(1);
  const review = page.locator(".kp-needs-review");
  await expect(review).toContainText("Kosza nie dodano do wyceny");
  await review
    .getByRole("listitem")
    .filter({ hasText: "Garnki i patelnie" })
    .getByRole("button", { name: "Pokaż szafkę" })
    .click();
  await expect(page.locator("#kp-editor-title")).toBeFocused();
  await expect(page.locator(".kp-cabinet-editor")).toContainText(
    "Szafka dolna z szufladami",
  );
  await page
    .getByRole("button", { name: "Wymiary pomieszczenia", exact: true })
    .click();
  await form
    .getByRole("button", { name: "Zmień potrzeby", exact: true })
    .click();
  await form.getByLabel("Ile osób korzysta z kuchni?").selectOption("1-2");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await expect(form.locator("[data-save-needs]")).toBeFocused();
  await form
    .getByRole("button", { name: "Anuluj odpowiedzi", exact: true })
    .click();
  expect((await draft(page)).needs).toEqual(preferences);
  expect((await draft(page)).items).toEqual(generated.items);
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect((await draft(page)).items).toEqual(generated.items);
  await page.reload();
  expect((await draft(page)).needs).toEqual(preferences);
});

test("mobile: needs stay visible, keyboard and cancellation work, saved preference does not rebuild the kitchen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/kreator-kuchni");
  const form = page.getByRole("region", { name: "Potrzeby domowników" });
  await expect(form).toBeVisible();
  const needsBox = await form.boundingBox();
  const layoutBox = await page
    .getByRole("heading", { name: "Jaki układ planujesz?" })
    .boundingBox();
  expect(needsBox!.y).toBeLessThan(layoutBox!.y);
  await form.getByRole("button", { name: "Dalej", exact: true }).click();
  await expect(
    form.getByRole("heading", { name: "Co chcesz przechowywać?" }),
  ).toBeFocused();
  await form.getByLabel("Garnki i patelnie").focus();
  await page.keyboard.press("Space");
  await expect(form.getByLabel("Garnki i patelnie")).toBeChecked();
  await form.getByRole("button", { name: "Anuluj odpowiedzi" }).click();
  expect((await draft(page)).needs).toBeUndefined();
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  const initialItems = (await draft(page)).items;
  await page
    .getByRole("button", { name: "Wymiary pomieszczenia", exact: true })
    .click();
  await form.getByRole("button", { name: "Dalej", exact: true }).click();
  await form.getByLabel("Garnki i patelnie").check();
  await form.getByRole("button", { name: "Dalej", exact: true }).click();
  await form.getByRole("radio", { name: /Prostsze wyposażenie/ }).check();
  await form
    .getByRole("button", { name: "Zapisz potrzeby", exact: true })
    .click();
  expect((await draft(page)).items).toEqual(initialItems);
  expect((await draft(page)).needs.priority).toBe("economy");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).include(".kp-main").analyze()).violations,
  ).toEqual([]);
});
