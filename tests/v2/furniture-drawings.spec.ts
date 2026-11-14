import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import {
  freshFurniture,
  carcass,
  resizeFurniture,
  applySuggestedLayout,
} from "../../src/core/furniture";
import { furnitureDocument } from "../../web/src/v2/furniture-document";
import { staffApi } from "./staff-api-fixture";
test("slope in either direction and stairs retain drawing references and legible geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1047, height: 718 });
  for (const shape of ["slope", "stairs"] as const)
    for (const reverse of [false, true]) {
      const m = freshFurniture();
      m.plates = carcass(m, randomUUID);
      const model = applySuggestedLayout(
        resizeFurniture(
          m,
          {
            shape,
            reverse,
            height: 2000,
            lowHeight: 1100,
            width: 1800,
            steps: 3,
          },
          randomUUID,
        ),
        "shelves",
        randomUUID,
      );
      model.name = `Próba ${shape} ${reverse ? "odwrócony" : "zwykły"}`;
      await page.setContent(furnitureDocument(model, "ksztalt-testowy", 1));
      const front = page.getByRole("img", {
        name: "Wnętrze i światło między półkami",
        exact: true,
      });
      await expect(front).toContainText("1100");
      await expect(front).toContainText("2000");
      await expect(
        page.getByRole("img", {
          name: "Widok rozstrzelony korpusu z oznaczeniami części",
          exact: true,
        }),
      ).toBeVisible();
      const clipped = await page.locator("svg text").evaluateAll((nodes) =>
        nodes
          .filter((n) => {
            const a = n.getBoundingClientRect(),
              s = n.closest("svg")!.getBoundingClientRect();
            return (
              a.left < s.left - 1 ||
              a.right > s.right + 1 ||
              a.top < s.top - 1 ||
              a.bottom > s.bottom + 1
            );
          })
          .map((n) => n.textContent),
      );
      expect(clipped).toEqual([]);
      if (shape === "slope")
        await expect(
          page.getByText("Wieniec pod skosem:", { exact: false }),
        ).toBeVisible();
      await page.emulateMedia({ media: "print" });
      const pdf = await page.pdf({
        path: `../../work/rysunki-${shape}-${reverse}.pdf`,
        preferCSSPageSize: true,
        printBackground: true,
      });
      // Chromium's PDF writer emits uncompressed Page objects (Pages is excluded).
      expect(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)).toHaveLength(
        2,
      );
      await page
        .locator(".technical")
        .screenshot({ path: `../../work/rysunki-${shape}-${reverse}.png` });
      await page.emulateMedia({ media: "screen" });
    }
});
for (const mobile of [false, true])
  test(`technical and assembly preview exports the same draft, is accessible and fits (${mobile ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await staffApi(page, mobile ? "owner" : "employee");
    const model = freshFurniture();
    model.name = "Szafka z półką — przykład";
    model.plates = carcass(model, randomUUID);
    model.plates.push({
      id: randomUUID(),
      name: "Półka regulowana",
      kind: "board",
      x: 18,
      y: 500,
      z: 3,
      width: 964,
      height: 18,
      depth: 500,
    });
    model.plates.push({
      id: randomUUID(),
      name: "Plecy",
      anchor: "back",
      kind: "board",
      x: 0,
      y: 0,
      z: 0,
      width: 1000,
      height: 2000,
      depth: 3,
    });
    const entry = {
      id: randomUUID(),
      version: 3,
      model,
      createdBy: "staff-test",
      updatedBy: "staff-test",
      updatedAt: new Date().toISOString(),
    };
    let writes = 0;
    await page.route("**/api/v2/furniture", (r) => {
      if (r.request().method() !== "GET") writes++;
      return r.fulfill({ json: [entry] });
    });
    await page.goto(`/#/panel/meble?model=${entry.id}&version=3`);
    await page
      .getByRole("button", { name: "Dokumentacja", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Podgląd rysunków", exact: true })
      .click();
    const preview = page.frameLocator(
      'iframe[title="Podgląd rysunków technicznych i montażowych"]',
    );
    await expect(
      preview.getByRole("table", { name: "Prześwity", exact: true }),
    ).toContainText("482");
    await expect(
      preview.getByRole("table", { name: "Prześwity", exact: true }),
    ).toContainText("1464");
    await expect(
      preview.getByRole("table", { name: "Prześwity", exact: true }),
    ).toContainText("964");
    await expect(
      preview.getByRole("table", { name: "Poziomy półek", exact: true }),
    ).toContainText("500");
    await expect(
      preview.getByRole("table", { name: "Poziomy półek", exact: true }),
    ).toContainText("518");
    await expect(
      preview.getByRole("img", {
        name: "Widok rozstrzelony korpusu z oznaczeniami części",
      }),
    ).toBeVisible();
    expect(
      await preview
        .locator("body")
        .evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    expect(
      (
        await new AxeBuilder({ page })
          .include(".fc-studio-sheet")
          .exclude("iframe")
          .analyze()
      ).violations,
    ).toEqual([]);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", {
        name: "Pobierz kartę do druku / PDF",
        exact: true,
      })
      .click();
    const html = await readFile((await (await download).path())!, "utf8");
    expect(html).toContain("wersja bazowa 3");
    expect(html).toContain("Półka regulowana");
    const print = await page.context().newPage();
    await print.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1100, height: 800 },
    );
    await print.setContent(html);
    expect(
      (await new AxeBuilder({ page: print }).analyze()).violations,
    ).toEqual([]);
    if (!mobile) {
      await print.emulateMedia({ media: "print" });
      const pdf = await print.pdf({
        path: "../../outputs/Rysunki-techniczne-montazowe-przyklad-2026-11-12.pdf",
        preferCSSPageSize: true,
        printBackground: true,
      });
      expect(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)).toHaveLength(
        2,
      );
      await print.locator(".technical").screenshot({
        path: "../../outputs/Rysunek-techniczny-2026-11-12.png",
      });
      await print
        .locator(".assembly")
        .screenshot({ path: "../../outputs/Rysunek-montazowy-2026-11-12.png" });
    }
    await print.close();
    await page
      .getByRole("button", { name: "Ukryj podgląd rysunków", exact: true })
      .click();
    await expect(page.locator(".fc-document-preview")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Dokumentacja", exact: true }),
    ).toBeFocused();
    expect(writes).toBe(0);
  });
