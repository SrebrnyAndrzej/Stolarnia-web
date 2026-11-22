import { openArchitectFiles } from "./kitchen-ui";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
const saved = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
const fixture = async (page: Page, mime = "image/jpeg") =>
  Buffer.from(
    await page.evaluate((mime) => {
      const c = document.createElement("canvas");
      c.width = 1200;
      c.height = 900;
      const g = c.getContext("2d")!;
      g.fillStyle = "white";
      g.fillRect(0, 0, 1200, 900);
      g.strokeStyle = "#333";
      g.lineWidth = 8;
      g.strokeRect(100, 100, 600, 500);
      g.strokeRect(700, 100, 350, 500);
      g.strokeRect(100, 600, 950, 200);
      g.font = "32px sans-serif";
      g.fillStyle = "#333";
      g.fillText("KUCHNIA", 300, 340);
      g.fillText("SALON", 760, 340);
      g.fillText("HOL", 480, 720);
      g.font = "22px sans-serif";
      g.fillText("360 cm", 350, 80);
      g.fillText("RZUT PARTERU", 400, 860);
      return c.toDataURL(mime).split(",")[1];
    }, mime),
    "base64",
  );
const close = (page: Page) =>
  page
    .getByRole("button", {
      name: "Zamknij podgląd i anuluj edycję",
      exact: true,
    })
    .click();
const upload = async (page: Page, name = "parter.jpg") => {
  await openArchitectFiles(page);
  const buffer = await fixture(page);
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles({ name, mimeType: "image/jpeg", buffer });
  await expect(page.locator(".kp-architect-list li")).toHaveCount(1);
  await page
    .getByRole("button", { name: `Otwórz ${name}`, exact: true })
    .click();
  await expect(page.locator(".kp-raster-preview image")).toHaveAttribute(
    "width",
    "1200",
  );
};
const exactCrop = async (page: Page) => {
  await page.getByText("Dokładny kadr i przesunięcie", { exact: true }).click();
  for (const [label, value] of [
    ["Kadr od lewej (px)", "100"],
    ["Kadr od góry (px)", "100"],
    ["Szerokość kadru (px)", "600"],
    ["Wysokość kadru (px)", "500"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByLabel("Rzeczywista szerokość kadru (cm)", { exact: true })
    .fill("360");
};
const point = async (page: Page, x: number, y: number) => {
  const p = await page.locator(".kp-raster-preview").evaluate(
    (s, p) => {
      const r = new DOMPoint(p.x, p.y).matrixTransform(
        (s as SVGSVGElement).getScreenCTM()!,
      );
      return { x: r.x, y: r.y };
    },
    { x, y },
  );
  await page.mouse.click(p.x, p.y);
};
for (const phone of [false, true])
  test(`JPG floor plan crop becomes a scaled editable kitchen (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/kreator-kuchni");
    await upload(page, "parter.jpeg");
    await exactCrop(page);
    await expect(page.locator("[data-image-dimensions]")).toContainText(
      "360 × 300 cm",
    );
    await page
      .getByRole("button", { name: "Przejdź do szafek", exact: false })
      .click();
    await expect(page.locator("[data-save-architect]")).toBeFocused();
    expect(
      (await saved(page)).architectFiles[0].imageReference,
    ).toBeUndefined();
    await page
      .getByRole("button", {
        name: "Przyjmij kadr jako wymiary pomieszczenia",
        exact: true,
      })
      .click();
    const d = await saved(page);
    expect([d.width, d.depth]).toEqual([3600, 3000]);
    expect(d.architectFiles[0].format).toBe("jpg");
    expect(d.architectFiles[0].imageReference.crop).toEqual({
      x: 100,
      y: 100,
      width: 600,
      height: 500,
    });
    expect(d.architectFiles[0].imageReference.mmPerPixel).toBe(6);
    await close(page);
    await page
      .getByRole("button", { name: "Przejdź do szafek", exact: false })
      .click();
    await page
      .getByRole("button", { name: "Wstaw proponowany układ", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Rzut z góry", exact: true })
      .click();
    await expect(page.locator("[data-architect-image] image")).toHaveCount(1);
    await expect(page.locator("[data-architect-image] svg")).toHaveAttribute(
      "viewBox",
      "100 100 600 500",
    );
    await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
    const response = await page.request.post("/api/public/kitchen-estimate", {
      data: await saved(page),
    });
    expect(response.ok()).toBeTruthy();
    await page
      .locator(".kp-preview-toolbar")
      .evaluate((el) =>
        scrollTo(0, scrollY + el.getBoundingClientRect().top - 110),
      );
    await page.screenshot({
      path: `../../outputs/rzut-jpg-2026-11-16/kuchnia-${phone ? "telefon" : "komputer"}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(
      axe.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact ?? ""),
      ),
    ).toEqual([]);
    await page.reload();
    await page
      .getByRole("button", { name: "Przejdź do szafek", exact: false })
      .click();
    await page
      .getByRole("button", { name: "Rzut z góry", exact: true })
      .click();
    await expect(page.locator("[data-architect-image] image")).toHaveCount(1);
  });
test("two-point calibration, rotation, cancel, undo and transfer preserve original raster", async ({
  page,
  browser,
}) => {
  await page.goto("/#/kreator-kuchni");
  await upload(page);
  await page.locator(".kp-raster-preview").scrollIntoViewIfNeeded();
  await point(page, 100, 100);
  await point(page, 700, 600);
  await page
    .getByRole("button", { name: "Wskaż znany wymiar", exact: true })
    .click();
  await page.locator(".kp-raster-preview").scrollIntoViewIfNeeded();
  await point(page, 100, 100);
  await point(page, 700, 100);
  await page.getByLabel("Długość zaznaczonego odcinka (cm)").fill("360");
  await page.getByLabel("Obrót obrazu", { exact: true }).selectOption("90");
  await expect(page.locator("[data-image-dimensions]")).toContainText("cm");
  await page
    .getByRole("button", {
      name: "Przyjmij kadr jako wymiary pomieszczenia",
      exact: true,
    })
    .click();
  const original = await saved(page);
  expect(Math.abs(original.width - 3000)).toBeLessThan(20);
  expect(Math.abs(original.depth - 3600)).toBeLessThan(20);
  expect(original.architectFiles[0].imageReference.rotation).toBe(90);
  await page.getByLabel("Obrót obrazu", { exact: true }).selectOption("180");
  await close(page);
  expect((await saved(page)).architectFiles).toEqual(original.architectFiles);
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz projekt z plikami", exact: true })
    .click();
  const path = "../../outputs/rzut-jpg-2026-11-16/projekt-z-rzutem.json";
  await (await dl).saveAs(path);
  const bundle = JSON.parse(await readFile(path, "utf8"));
  expect(bundle.files[0].data.length).toBeGreaterThan(100);
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto(page.url());
  await openArchitectFiles(other);
  await other
    .getByLabel("Wczytaj paczkę projektu", { exact: true })
    .setInputFiles(path);
  await expect(other.locator(".kp-architect-list li")).toHaveCount(1);
  await other
    .getByRole("button", { name: "Otwórz parter.jpg", exact: true })
    .click();
  await expect(other.locator("[data-image-dimensions]")).toContainText(
    `${original.width / 10} × ${original.depth / 10} cm`,
  );
  expect((await saved(other)).architectFiles[0].id).not.toBe(
    original.architectFiles[0].id,
  );
  await context.close();
  await page
    .getByRole("button", { name: "Przejdź do szafek", exact: false })
    .click();
  await openArchitectFiles(page);
  await page
    .getByRole("button", { name: "Usuń z projektu parter.jpg", exact: true })
    .click();
  expect((await saved(page)).architectFiles).toEqual([]);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  expect((await saved(page)).architectFiles).toEqual(original.architectFiles);
});
test("invalid image and unknown scale never change dimensions or discard valid PNG", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await openArchitectFiles(page);
  const png = await fixture(page, "image/png");
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles([
      { name: "pietro.png", mimeType: "image/png", buffer: png },
      {
        name: "zly.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("not a photo"),
      },
    ]);
  await expect(page.locator(".kp-architect-list li")).toHaveCount(1);
  await expect(page.locator(".kp-architect-tools")).toContainText(
    "nieprawidłowy nagłówek obrazu",
  );
  await page
    .getByRole("button", { name: "Otwórz pietro.png", exact: true })
    .click();
  await page
    .getByLabel("Pokaż obraz jako podkład rzutu", { exact: true })
    .check();
  const before = await saved(page);
  await page
    .getByRole("button", {
      name: "Przyjmij kadr jako wymiary pomieszczenia",
      exact: true,
    })
    .click();
  await expect(page.locator(".kp-architect-tools")).toContainText(
    "Ustaw skalę",
  );
  expect(await saved(page)).toEqual(before);
  await exactCrop(page);
  await page
    .getByRole("button", { name: "Zapisz ustawienia pliku", exact: true })
    .click();
  await page.getByText("Dokładny kadr i przesunięcie", { exact: true }).click();
  await page.getByLabel("Kadr od lewej (px)", { exact: true }).fill("1190");
  await page
    .getByLabel("Rzeczywista szerokość kadru (cm)", { exact: true })
    .fill("360");
  await page
    .getByRole("button", { name: "Zapisz ustawienia pliku", exact: true })
    .click();
  expect((await saved(page)).architectFiles[0].imageReference.crop.x).toBe(100);
});
