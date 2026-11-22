import { openArchitectFiles } from "./kitchen-ui";
import { openKitchenList } from "./kitchen-ui";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import {
  kitchenInputSchema,
  suggestKitchen,
} from "../../src/core/kitchen-configuration";
const key = "pan-stolarz.kuchnia.v1";
function fixture() {
  const d = {
    ...kitchenInputSchema.parse({
      layout: "straight",
      width: 4200,
      depth: 3000,
      height: 2600,
      items: [],
    }),
    version: 1,
  };
  d.items = suggestKitchen(d, randomUUID);
  return d;
}
async function current(page: import("@playwright/test").Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ k, d }) => localStorage.setItem(k, JSON.stringify(d)),
    { k: key, d: fixture() },
  );
});
test("original architect file larger than one Vercel-safe chunk survives save and import on another device", async ({
  page,
  browser,
}) => {
  await page.goto("/#/kreator-kuchni");
  await openArchitectFiles(page);
  const bytes = Buffer.alloc(2 * 1024 * 1024 + 80, 32);
  bytes.write("%PDF-1.4\n");
  bytes.write("%%EOF", bytes.length - 5);
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles({
      name: "projekt-architekta.pdf",
      mimeType: "application/pdf",
      buffer: bytes,
    });
  await expect
    .poll(async () => (await current(page)).architectFiles?.length ?? 0)
    .toBe(1);
  await page
    .getByRole("button", { name: "Zapisz online i udostępnij", exact: true })
    .click();
  const link = page.getByLabel(
    "Link do podglądu — dla partnera lub projektanta",
  );
  await expect(link).toBeVisible();
  const device = await browser.newContext();
  try {
    const other = await device.newPage();
    await other.goto(await link.inputValue());
    const modal = other.getByRole("dialog", {
      name: "Projekt z prywatnego linku",
    });
    await expect(modal).toContainText("1 oryginalnych plików");
    await modal
      .getByRole("button", {
        name: "Utwórz własną kopię — zastąp szkic lokalny",
      })
      .click();
    await expect(modal).not.toBeVisible();
    const copied = await current(other);
    expect(copied.architectFiles[0].size).toBe(bytes.length);
    const original = await other.evaluate(async (id) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open("pan-stolarz-architect-files-v1", 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = reject;
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        const r = db.transaction("files").objectStore("files").get(id);
        r.onsuccess = () => resolve(r.result);
        r.onerror = reject;
      });
      db.close();
      return {
        size: blob.size,
        head: await blob.slice(0, 9).text(),
        end: await blob.slice(-5).text(),
      };
    }, copied.architectFiles[0].id);
    expect(original).toEqual({
      size: bytes.length,
      head: "%PDF-1.4\n",
      end: "%%EOF",
    });
  } finally {
    await device.close();
  }
});
test("private view and edit links open on a second device without silently replacing its local draft", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/#/kreator-kuchni");
  const source = await current(page);
  await page
    .getByRole("button", { name: "Zapisz online i udostępnij", exact: true })
    .click();
  const view = page.getByLabel(
      "Link do podglądu — dla partnera lub projektanta",
    ),
    edit = page.getByLabel("Link do edycji — zachowaj dla siebie");
  await expect(view).toBeVisible();
  const viewURL = await view.inputValue(),
    editURL = await edit.inputValue();
  expect(viewURL).not.toEqual(editURL);
  const device = await browser.newContext();
  try {
    const other = await device.newPage();
    await other.goto(viewURL);
    const modal = other.getByRole("dialog", {
      name: "Projekt z prywatnego linku",
    });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("tylko podgląd");
    await expect(modal.locator("strong")).toContainText(/zł/);
    expect((await current(other)).items).toHaveLength(0);
    expect(
      (
        await new AxeBuilder({ page: other })
          .include(".kp-online-dialog")
          .analyze()
      ).violations,
    ).toEqual([]);
    await modal
      .getByRole("button", {
        name: "Utwórz własną kopię — zastąp szkic lokalny",
      })
      .click();
    await expect(modal).not.toBeVisible();
    expect((await current(other)).items).toEqual(source.items);
    const editor = await device.newPage();
    await editor.goto(editURL);
    const editorDialog = editor.getByRole("dialog", {
      name: "Projekt z prywatnego linku",
    });
    await expect(editorDialog).toContainText("link edycji");
    await editorDialog
      .getByRole("button", { name: "Wczytaj do edycji — zastąp szkic lokalny" })
      .click();
    await expect(editorDialog).not.toBeVisible();
    await editor
      .getByRole("button", { name: "Zapisz online i udostępnij", exact: true })
      .click();
    await expect(editor.locator(".kp-online-links summary")).toContainText(
      "Wersja 2",
    );
  } finally {
    await device.close();
  }
  // This device still owns revision 1; an update from the other device must never be overwritten.
  await page
    .getByRole("button", { name: "Zapisz online i udostępnij", exact: true })
    .click();
  await expect(page.locator(".kp-online")).toContainText("nowszą wersję");
  expect((await current(page)).items).toEqual(source.items);
});
test("measurement checks, real storage dimensions, budget and cabinet locks are reachable on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: /Przejdź do szafek/ }).click();
  const extras = page.locator(".kp-project-extras");
  await extras.locator("summary").click();
  await extras.getByLabel("Długości ścian i przekątne").check();
  await expect(extras.locator("summary")).toContainText("1/4");
  await extras.getByLabel("Kwota brutto (zł), bez zakupu AGD").fill("25000");
  await extras
    .getByRole("button", { name: "Zapisz budżet", exact: true })
    .click();
  await extras.getByLabel("Nazwa, np. robot kuchenny").fill("Robot Darii");
  await extras.getByLabel("Szerokość (cm)", { exact: true }).fill("30");
  await extras.getByLabel("Wysokość (cm)", { exact: true }).fill("20");
  await extras.getByLabel("Głębokość (cm)", { exact: true }).fill("30");
  await extras.getByRole("button", { name: "Dodaj i sprawdź wymiary" }).click();
  await expect(extras.locator(".kp-object-results")).toContainText(
    "Gabaryt pasuje do światła półki",
  );
  expect((await current(page)).projectDetails.budget).toBe(25000);
  const shelfIndex = (await current(page)).items.findIndex(
    (i: { catalogId: string }) => i.catalogId === "base-shelves-600",
  );
  await openKitchenList(page);
  await page.locator(".kp-item-name").nth(shelfIndex).click();
  const lock = page.getByLabel(
    "Zachowaj tę szafkę i jej położenie przy automatycznym układaniu",
  );
  await lock.check();
  await expect(page.locator("#kp-cabinet-form input").first()).toBeDisabled();
  expect((await current(page)).items.some((i: any) => i.locked)).toBe(true);
  await lock.uncheck();
  await expect(page.locator("#kp-cabinet-form input").first()).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("handoff freezes the exact kitchen version in the inquiry instead of passing only prose", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  const source = await current(page);
  await page.getByRole("button", { name: /Przejdź do szafek/ }).click();
  await page
    .getByRole("button", { name: "Wycena i PDF", exact: false })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Przejdź do zapytania", exact: false })
    .click();
  await expect(page).toHaveURL(/zapytanie\/kuchnia/);
  const description = page.getByRole("textbox", { name: "Twój pomysł" });
  await expect(description).toHaveValue(/zamknięty szkic/);
  const text = await description.inputValue();
  expect(text).toContain("?projekt=");
  expect(text).toContain("klucz=");
  expect(text.length).toBeLessThanOrEqual(6000);
  const link = text.split("\n").find((l) => l.includes("?projekt="))!;
  const p = new URLSearchParams(link.split("?")[1]);
  const r = await page.request.get(
    `/api/public/kitchen-projects/${p.get("projekt")}`,
    { headers: { Authorization: `Kitchen ${p.get("klucz")}` } },
  );
  expect(r.status()).toBe(200);
  const frozen = await r.json();
  expect(frozen.frozen).toBe(true);
  expect(frozen.draft.items).toEqual(source.items);
});
