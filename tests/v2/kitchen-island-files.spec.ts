import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const saved = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
const seed = async (page: Page) => {
  await page.addInitScript((id) => {
    if (window.top !== window || localStorage.getItem("pan-stolarz.kuchnia.v1"))
      return;
    localStorage.setItem(
      "pan-stolarz.kuchnia.v1",
      JSON.stringify({
        version: 1,
        layout: "straight",
        width: 4800,
        depth: 4500,
        returnLength: 3600,
        height: 2600,
        finish: "oak",
        quote: {
          front: "laminate",
          worktop: "laminate",
          drawers: "amix",
          installation: true,
        },
        items: [{ id, catalogId: "base-shelves-600", wall: "a" }],
      }),
    );
  }, uuid(1));
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", { name: "Zastąp proponowanym układem", exact: true })
    .click();
};
const dxf = Buffer.from(
  "0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n8\nROOM\n90\n4\n70\n1\n10\n0\n20\n0\n10\n4800\n20\n0\n10\n4800\n20\n4500\n10\n0\n20\n4500\n0\nENDSEC\n0\nEOF\n",
);
const pdf = Buffer.from(
  "%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj\n3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>> endobj\ntrailer <</Root 1 0 R>>\n%%EOF",
);
const uploadFiles = [
  { name: "rzut.dxf", mimeType: "application/dxf", buffer: dxf },
  { name: "elewacja.pdf", mimeType: "application/pdf", buffer: pdf },
  {
    name: "oryginal.dwg",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("AC1032\0original"),
  },
  {
    name: "bledny.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a pdf"),
  },
];

for (const phone of [false, true])
  test(`island has priced geometry, editable cabinets, collision recovery and undo (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
    const price = await page.locator(".kp-live-price strong").textContent();
    await page.getByText("Dodaj wyspę kuchenną", { exact: true }).click();
    await page
      .getByRole("button", { name: "Wyspa 180 cm · 3 szafki", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Zobacz podsumowanie", exact: true })
      .click();
    await expect(page.locator("[data-save-island]")).toBeFocused();
    expect((await saved(page)).island).toBeUndefined();
    await page
      .getByRole("button", { name: "Zastosuj wyspę", exact: true })
      .click();
    await expect(page.locator(".kp-live-price strong")).not.toHaveText(price!);
    const original = (await saved(page)).island;
    expect(original.items).toHaveLength(3);
    await expect(
      page.locator(".kp-canvas [data-architect-underlay]"),
    ).toHaveCount(1);
    await page.locator(".kp-island-tools summary").click();
    await page.getByLabel("Od góry (cm)", { exact: true }).fill("0");
    await page.getByLabel("Od lewej (cm)", { exact: true }).fill("0");
    await page
      .getByRole("button", { name: "Zastosuj wyspę", exact: true })
      .click();
    await expect(page.locator(".kp-island-tools")).toContainText("koliduje");
    expect((await saved(page)).island).toEqual(original);
    await page
      .getByRole("button", { name: "Anuluj zmiany wyspy", exact: true })
      .click();
    await page.getByLabel("Obrót", { exact: true }).selectOption("90");
    await page
      .getByLabel("Szafka 1 · szerokość (cm)", { exact: true })
      .fill("80");
    await page
      .getByRole("button", { name: "Zastosuj wyspę", exact: true })
      .click();
    expect((await saved(page)).island.rotation).toBe(90);
    expect((await saved(page)).island.items[0].width).toBe(800);
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    expect((await saved(page)).island).toEqual(original);
    await page.getByText("Rzut z góry", { exact: true }).click();
    await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
    await expect(page.locator("[data-island-worktop]")).toHaveCount(3);
    await page
      .locator(".kp-preview-toolbar")
      .evaluate((el) =>
        scrollTo(0, scrollY + el.getBoundingClientRect().top - 110),
      );
    await page.screenshot({
      path: `../../outputs/kuchnia-wyspa-pliki-2026-11-15/wyspa-${phone ? "telefon" : "komputer"}.png`,
    });
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(
      axe.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      ),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    if (!phone) {
      await page.getByRole("button", { name: "3D", exact: true }).click();
      await expect(page.locator(".widok3d canvas")).toBeVisible();
      await page.screenshot({
        path: "../../outputs/kuchnia-wyspa-pliki-2026-11-15/wyspa-3d.png",
      });
    }
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
    ).saveAs(
      `../../outputs/kuchnia-wyspa-pliki-2026-11-15/oferta-wyspa-${phone ? "telefon" : "komputer"}.pdf`,
    );
  });

test("multiple originals persist, DXF underlays combine and a complete project package transfers files", async ({
  page,
  browser,
}) => {
  await seed(page);
  await page.locator(".kp-architect-tools summary").click();
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles(uploadFiles);
  await expect(page.locator(".kp-architect-list li")).toHaveCount(3);
  await expect(page.locator(".kp-architect-tools")).toContainText(
    "nieprawidłowy nagłówek PDF",
  );
  await page
    .getByRole("button", { name: "Otwórz rzut.dxf", exact: true })
    .click();
  await page.getByLabel("Pokaż jako podkład rzutu", { exact: true }).check();
  await page.getByLabel("Warstwa DXF", { exact: true }).selectOption("ROOM");
  await expect(page.locator(".kp-architect-preview")).toContainText(
    "480 × 450 cm",
  );
  await page
    .getByRole("button", { name: "Zapisz ustawienia pliku", exact: true })
    .click();
  await expect(
    page.locator(".kp-canvas [data-architect-underlay] polyline"),
  ).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Zamknij podgląd i anuluj edycję",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles([{ ...uploadFiles[0], name: "instalacje.dxf" }]);
  await expect(page.locator(".kp-architect-list li")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Otwórz instalacje.dxf", exact: true })
    .click();
  await page.getByLabel("Pokaż jako podkład rzutu", { exact: true }).check();
  await page.getByLabel("Przesunięcie X (cm)", { exact: true }).fill("10");
  await page
    .getByLabel("Rodzaj rysunku", { exact: true })
    .selectOption("installation");
  await page
    .getByRole("button", { name: "Zapisz ustawienia pliku", exact: true })
    .click();
  await expect(
    page.locator(".kp-canvas [data-architect-underlay] polyline"),
  ).toHaveCount(2);
  await page.locator(".kp-architect-preview").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "../../outputs/kuchnia-wyspa-pliki-2026-11-15/pliki-architekta.png",
  });
  await page
    .getByRole("button", {
      name: "Zamknij podgląd i anuluj edycję",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Otwórz elewacja.pdf", exact: true })
    .click();
  await expect(
    page.getByLabel("PDF: elewacja.pdf", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Pomieszczenie", { exact: true }).fill("Łazienka");
  await page
    .getByRole("button", { name: "Zobacz podsumowanie", exact: true })
    .click();
  await expect(page.locator("[data-save-architect]")).toBeFocused();
  await page
    .getByRole("button", { name: "Zapisz ustawienia pliku", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Zamknij podgląd i anuluj edycję",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Otwórz oryginal.dwg", exact: true })
    .click();
  await expect(page.locator(".kp-architect-preview")).toContainText(
    "eksport ASCII DXF",
  );
  await page
    .getByRole("button", {
      name: "Zamknij podgląd i anuluj edycję",
      exact: true,
    })
    .click();
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz projekt z plikami", exact: true })
    .click();
  const dl = await wait;
  const path =
    "../../outputs/kuchnia-wyspa-pliki-2026-11-15/projekt-z-plikami.json";
  await dl.saveAs(path);
  const bundle = JSON.parse(await readFile(path, "utf8"));
  expect(bundle.files).toHaveLength(4);
  expect(
    bundle.draft.architectFiles.find(
      (f: { format: string }) => f.format === "pdf",
    ).room,
  ).toBe("Łazienka");
  await page.reload();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page.getByText("Rzut z góry", { exact: true }).click();
  await expect(
    page.locator(".kp-canvas [data-architect-underlay] polyline"),
  ).toHaveCount(2);
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto(page.url());
  await other.locator(".kp-architect-tools summary").click();
  await other
    .getByLabel("Wczytaj paczkę projektu", { exact: true })
    .setInputFiles(path);
  await expect(other.locator(".kp-architect-list li")).toHaveCount(4);
  await other
    .getByRole("button", { name: "Otwórz rzut.dxf", exact: true })
    .click();
  await expect(other.locator(".kp-architect-preview")).toContainText(
    "480 × 450 cm",
  );
  await context.close();
});

test("unavailable storage gives a recoverable error without losing the draft", async ({
  page,
}) => {
  await seed(page);
  const before = await saved(page);
  await page.locator(".kp-architect-tools summary").click();
  await page.evaluate(() => {
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      get() {
        throw new Error("Pamięć urządzenia jest niedostępna.");
      },
    });
  });
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles([uploadFiles[0]]);
  await expect(page.locator(".kp-architect-tools")).toContainText(
    "Pamięć urządzenia jest niedostępna",
  );
  expect(await saved(page)).toEqual(before);
});

test("a missing original is explicit and an oversized DXF remains downloadable without a misleading preview", async ({
  page,
}) => {
  await seed(page);
  const d = await saved(page);
  const missing = {
    id: uuid(99),
    name: "brak.dxf",
    format: "dxf",
    size: dxf.length,
    room: "Kuchnia",
    role: "plan",
    reference: { unit: "mm", layer: "", rotation: 0, x: 0, y: 0 },
  };
  await page.evaluate(
    (value) =>
      localStorage.setItem("pan-stolarz.kuchnia.v1", JSON.stringify(value)),
    { ...d, architectFiles: [missing] },
  );
  await page.reload();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await expect(page.getByText(/brak.dxf: brak oryginału/)).toBeVisible();
  await page.locator(".kp-architect-tools summary").click();
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles({ ...uploadFiles[0], name: "brak.dxf" });
  await expect(page.locator(".kp-architect-list li")).toHaveCount(1);
  await expect(
    page.locator(".kp-canvas [data-architect-underlay] polyline"),
  ).toHaveCount(1);
  await page
    .getByLabel("Dodaj pliki architekta", { exact: true })
    .setInputFiles({
      name: "duzy.dxf",
      mimeType: "application/dxf",
      buffer: Buffer.concat([dxf, Buffer.alloc(1024 * 1024, 32)]),
    });
  await expect(page.locator(".kp-architect-list li")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Otwórz duzy.dxf", exact: true })
    .click();
  await expect(page.locator(".kp-architect-tools")).toContainText(
    "Podgląd i podkład DXF: do 1 MiB",
  );
  const download = page.waitForEvent("download");
  await page
    .locator(".kp-architect-list li")
    .filter({ hasText: "duzy.dxf" })
    .getByRole("button", { name: "Pobierz oryginał", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("duzy.dxf");
});
