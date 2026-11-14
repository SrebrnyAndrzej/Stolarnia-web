import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { freshFurniture, carcass } from "../../src/core/furniture";
import { furnitureDrawerCalculations } from "../../src/core/furniture-drawers";
import { staffApi } from "./staff-api-fixture";
for (const mobile of [false, true])
  test(`calculator shares mounting coordinates and labels Y without keeping stale holes (${mobile ? "phone" : "desktop"})`, async ({
    page,
    request,
    baseURL,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await staffApi(page);
    await page.route(
      /\/api\/(?:systemy-szuflad|przelicznik-szuflad)(?:\?|$)/,
      async (r) => {
        const u = new URL(r.request().url());
        const response = await request.get(
          new URL(
            u.pathname.replace("/api/", "/api/demo/") + u.search,
            baseURL,
          ).toString(),
        );
        await r.fulfill({ response });
      },
    );
    await page.goto("/#/panel/szuflady");
    await page.getByLabel("Światło korpusu LW", { exact: true }).fill("964");
    await page.getByLabel("Długość prowadnicy NL", { exact: true }).fill("500");
    await page.getByRole("button", { name: "84", exact: true }).click();
    await page
      .getByLabel("Szerokość frontu opcjonalnie", { exact: true })
      .fill("960");
    await page.getByLabel("Wysokość frontu", { exact: true }).fill("140");
    const input = page.getByLabel("Pierwszy otwór od dołu frontu opcjonalnie", {
      exact: true,
    });
    await input.fill("50");
    const svg = page.getByRole("img", {
      name: "Wiercenia na tylnej stronie frontu",
      exact: true,
    });
    await expect(svg).toHaveAccessibleDescription(
      /Lewa oś 12,5 mm.*prawa 12,5 mm.*50, 82 mm/,
    );
    await expect(svg).toContainText("Y od dołu");
    await expect(svg.locator(".drawing-hole")).toHaveCount(4);
    const clipped = await svg.locator("text").evaluateAll((nodes) =>
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
    await svg.screenshot({
      path: `../../outputs/Kalkulator-osie-XY-${mobile ? "telefon" : "komputer"}-2026-11-13.png`,
    });
    expect(
      (await new AxeBuilder({ page }).include(".drawer-calculator").analyze())
        .violations,
    ).toEqual([]);
    await input.fill("1");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(svg).toHaveCount(0);
    await input.fill("50");
    await expect(svg.locator(".drawing-hole")).toHaveCount(4);
    await input.fill("");
    await expect(svg.locator(".drawing-hole")).toHaveCount(0);
  });
for (const mobile of [false, true])
  test(`creator mounting shares calculator geometry, saves, undoes and clears errors (${mobile ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await staffApi(page, mobile ? "owner" : "employee");
    const m = freshFurniture();
    m.name = "Komoda — próba mocowań";
    m.height = 720;
    m.plates = carcass(m, randomUUID);
    const front = {
      id: randomUUID(),
      name: "Front próbny",
      kind: "drawer" as const,
      x: 20,
      y: 20,
      z: 560,
      width: 960,
      height: 140,
      depth: 18,
    };
    m.plates.push(front);
    m.drawerAssemblies = [
      {
        frontId: front.id,
        profileId: "amix-elite-standard",
        variant: "84",
        nominalLength: 500,
      },
    ];
    let entry = {
      id: randomUUID(),
      version: 1,
      model: m,
      createdBy: "staff-test",
      updatedBy: "staff-test",
      updatedAt: new Date().toISOString(),
      drawerCalculations: furnitureDrawerCalculations(m),
    };
    await page.route("**/api/v2/furniture", (r) => {
      if (r.request().method() === "PUT") {
        const b = r.request().postDataJSON();
        entry = {
          ...entry,
          ...b,
          version: b.version + 1,
          drawerCalculations: furnitureDrawerCalculations(b.model),
        };
      }
      return r.fulfill({
        json: r.request().method() === "GET" ? [entry] : entry,
      });
    });
    await page.goto(
      `/#/panel/meble?model=${entry.id}&version=1&part=${front.id}`,
    );
    if (mobile)
      await page
        .getByRole("button", { name: "Inspektor", exact: true })
        .click();
    await page.getByRole("tab", { name: "System", exact: true }).click();
    await page
      .getByText("Mocowanie frontu · osie X/Y", { exact: true })
      .click();
    const region = page.locator(".fc-drawer-mounting");
    const input = region.getByLabel(
      "Pierwszy otwór od dołu dla Front próbny (mm)",
      { exact: true },
    );
    await expect(input).toHaveValue("");
    await expect(region.locator(".drawing-hole")).toHaveCount(0);
    await input.fill("50");
    await expect(region.locator(".drawing-hole")).toHaveCount(4);
    await expect(region.getByRole("img")).toHaveAccessibleDescription(
      /Otwory od dołu: 50, 82 mm/,
    );
    await input.fill("1");
    await expect(region.getByRole("alert")).toContainText("co najmniej 49.5");
    await expect(region.getByRole("img")).toHaveCount(0);
    await expect(
      page.getByRole("table").filter({ hasText: "Formatki skrzynki" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    await expect(input).toHaveValue("50");
    await expect(region.locator(".drawing-hole")).toHaveCount(4);
    const save = page.waitForRequest(
      (r) => r.method() === "PUT" && r.url().endsWith("/api/v2/furniture"),
    );
    await page
      .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
      .click();
    expect(
      (await save).postDataJSON().model.drawerAssemblies[0].firstHoleFromBottom,
    ).toBe(50);
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Zapisano we wspólnej bibliotece" }),
    ).toBeVisible();
    await page.goto(
      `/#/panel/meble?model=${entry.id}&version=${entry.version}&part=${front.id}`,
    );
    await page.reload();
    if (mobile)
      await page
        .getByRole("button", { name: "Inspektor", exact: true })
        .click();
    await page.getByRole("tab", { name: "System", exact: true }).click();
    await page
      .getByText("Mocowanie frontu · osie X/Y", { exact: true })
      .click();
    await expect(input).toHaveValue("50");
    await expect(region.locator(".drawing-hole")).toHaveCount(4);
    expect(
      (await new AxeBuilder({ page }).include(".fc-studio").analyze())
        .violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await region.screenshot({
      path: `../../outputs/Szuflady-mocowania-${mobile ? "telefon" : "komputer"}-2026-11-13.png`,
    });
    await input.fill("");
    await expect(region.locator(".drawing-hole")).toHaveCount(0);
  });
