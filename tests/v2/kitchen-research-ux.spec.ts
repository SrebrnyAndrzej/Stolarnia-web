import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("research UX: full run offers a change, selected cabinet stays beside the whole preview, presets preserve geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  const draft = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
  const before = await draft();
  await expect(page.locator(".kp-catalog-empty")).toContainText(
    "Brak pasujących",
  );
  await expect(page.locator(".kp-catalog-items button")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Wybierz szafkę do zmiany", exact: true })
    .click();
  await expect(page.locator("#kp-editor-title")).toBeFocused();
  const canvas = await page.locator(".kp-canvas").boundingBox();
  const editor = await page.locator(".kp-cabinet-editor").boundingBox();
  const actions = await page.locator(".kp-bottom-actions").boundingBox();
  expect(editor!.x).toBeGreaterThan(canvas!.x + canvas!.width);
  expect(canvas!.y + canvas!.height).toBeLessThanOrEqual(actions!.y);
  await page
    .getByRole("button", { name: "Sztućce i garnki", exact: true })
    .click();
  await expect(page.locator(".kp-editor-pending")).toBeVisible();
  expect(await draft()).toEqual(before);
  await page
    .getByRole("button", { name: "Zastosuj do szafki", exact: true })
    .click();
  const after = await draft();
  const changed = after.items.find(
    (i: { catalogId: string }) =>
      i.catalogId === "base-drawers-600" &&
      i.drawerFronts?.mode === "graduated",
  );
  expect(changed).toBeTruthy();
  const old = before.items.find((i: { id: string }) => i.id === changed.id);
  expect(changed.wall).toBe(old.wall);
  expect(changed.width).toBe(old.width);
  expect(after.items.map((i: { id: string }) => i.id)).toEqual(
    before.items.map((i: { id: string }) => i.id),
  );
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".widok3d canvas")).toBeVisible();
  await page.getByRole("button", { name: "Pokaż całość", exact: true }).click();
  expect(await draft()).toEqual(after);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect(await draft()).toEqual(before);
  expect(
    (await new AxeBuilder({ page }).include(".kp-main").analyze()).violations,
  ).toEqual([]);
});

test("research UX: mobile keeps cabinet editor before auxiliary tools and preserves pending changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/kreator-kuchni");
  await page
    .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
    .click();
  const catalog = await page.locator(".kp-catalog").boundingBox();
  const tools = await page.locator(".kp-design-tools").boundingBox();
  expect(catalog!.y).toBeLessThan(tools!.y);
  await page
    .getByRole("button", { name: "Wybierz szafkę do zmiany", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Dwie wysokie szuflady", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zobacz podsumowanie", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Zastosuj do szafki", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Anuluj zmiany", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Wróć do podglądu", exact: true })
    .click();
  await expect(page.locator(".kp-cabinet-editor")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
