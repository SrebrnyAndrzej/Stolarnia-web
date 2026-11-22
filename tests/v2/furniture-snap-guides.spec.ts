import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { freshFurniture } from "../../src/core/furniture";
import { staffApi } from "./staff-api-fixture";

async function fixture(page: Page) {
  await staffApi(page);
  const model = freshFurniture();
  model.name = "Test prowadnic";
  model.height = model.lowHeight = 1000;
  model.plates = [
    {
      id: "moving",
      name: "Półka ruchoma",
      kind: "board",
      x: 100,
      y: 300,
      z: 0,
      width: 100,
      height: 18,
      depth: 500,
    },
    {
      id: "target",
      name: "Przegroda",
      kind: "board",
      x: 500,
      y: 700,
      z: 0,
      width: 18,
      height: 18,
      depth: 500,
    },
  ];
  const id = randomUUID();
  await page.route("**/api/v2/furniture", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          json: [
            {
              id,
              version: 1,
              model,
              createdBy: "staff-test",
              updatedBy: "staff-test",
              updatedAt: new Date().toISOString(),
            },
          ],
        })
      : route.fallback(),
  );
  await page.goto(`/#/panel/meble?model=${id}&version=1`);
  await expect(
    page.getByRole("heading", { name: model.name, exact: true }),
  ).toBeVisible();
  const svg = page.locator(".fc-drawing > svg");
  const at = (x: number, y: number) =>
    svg.evaluate(
      (s, p) => {
        const svg = s as SVGSVGElement;
        const point = svg.createSVGPoint();
        point.x = p.x;
        point.y = 1000 - p.y;
        const screen = point.matrixTransform(svg.getScreenCTM()!);
        return { x: screen.x, y: screen.y };
      },
      { x, y },
    );
  const move = async (x: number, y: number) => {
    const p = await at(x, y);
    await page.mouse.move(p.x, p.y);
  };
  return { svg, move, at };
}

for (const mobile of [false, true]) {
  test(`snap guides match placement, Shift is precise and Undo restores one gesture (${mobile ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const { svg, move } = await fixture(page);
    await move(150, 309);
    await page.mouse.down();
    // Pointer starts at the panel centre: raw origin 405,685 -> actual 400,682.
    await move(455, 694);
    await expect(page.locator(".fc-snap-guides")).toBeVisible();
    await expect(svg.locator('[data-snap-axis="x"]')).toHaveAttribute(
      "x1",
      "500",
    );
    await expect(svg.locator('[data-snap-axis="y"]')).toHaveAttribute(
      "y1",
      "300",
    );
    await expect(page.locator(".fc-snap-status")).toContainText("Przegroda");
    await expect(page.locator(".fc-snap-status")).toContainText(
      "X: 400 · Y: 682 mm",
    );
    await svg.dispatchEvent("pointermove", {
      pointerId: 999,
      clientX: 1,
      clientY: 1,
    });
    await svg.dispatchEvent("pointerup", { pointerId: 999 });
    await expect(page.locator(".fc-snap-guides")).toBeVisible();
    await page.screenshot({
      path: `../../outputs/free-furniture-transfer-20261122/guides-${mobile ? "phone" : "desktop"}.png`,
    });
    await page.keyboard.down("Shift");
    await move(457, 696);
    await expect(page.locator(".fc-snap-guides")).toHaveCount(0);
    await expect(page.locator(".fc-snap-status")).toContainText(
      "Ruch swobodny",
    );
    await expect(page.locator(".fc-snap-status")).toContainText(
      "X: 407 · Y: 687 mm",
    );
    await page.mouse.up();
    await page.keyboard.up("Shift");
    await expect(page.locator(".fc-snap-status")).toBeHidden();
    const saved = page.waitForRequest(
      (r) => r.url().endsWith("/api/v2/furniture") && r.method() === "PUT",
    );
    await page
      .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
      .click();
    const body = (await saved).postDataJSON();
    const p = body.model.plates.find((p: { id: string }) => p.id === "moving");
    expect(p.x).toBe(407);
    expect(p.y).toBe(687);
    expect(p).not.toHaveProperty("guides");
    expect(p).not.toHaveProperty("targetName");
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Cofnij", exact: true }),
    ).toBeDisabled();
    if (mobile)
      await page
        .getByRole("group", { name: "Obszar kreatora" })
        .getByRole("button", { name: "Inspektor", exact: true })
        .click();
    await expect(page.getByLabel("Pozycja X", { exact: true })).toHaveValue(
      "100",
    );
    await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
      "300",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("disabled snapping, pointer cancellation and tap preserve usable editing; accessibility", async ({
  page,
}) => {
  const { move } = await fixture(page);
  await page
    .getByLabel("Przyciąganie do krawędzi i siatki 10 mm", { exact: true })
    .uncheck();
  await move(150, 309);
  await page.mouse.down();
  await move(455, 694);
  await expect(page.locator(".fc-snap-status")).toContainText(
    "X: 405 · Y: 685 mm",
  );
  await expect(page.locator(".fc-snap-guides")).toHaveCount(0);
  await page
    .locator(".fc-drawing > svg")
    .dispatchEvent("pointercancel", { pointerId: 1 });
  await expect(page.locator(".fc-snap-status")).toBeHidden();
  await page.mouse.up();
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await move(150, 309);
  await page.mouse.down();
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Cofnij", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("333");
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "333",
  );
  expect(
    (await new AxeBuilder({ page }).include(".fc-studio").analyze()).violations,
  ).toEqual([]);
});

test("touch drag keeps the mobile drawing visible and a tap still opens the inspector", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { at } = await fixture(page);
  const cdp = await page.context().newCDPSession(page);
  const start = await at(150, 309),
    end = await at(455, 694);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...start, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...end, id: 1 }],
  });
  await expect(page.locator(".fc-drawing")).toBeVisible();
  await expect(page.locator(".fc-snap-status")).toContainText(
    "X: 400 · Y: 682 mm",
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".fc-snap-status")).toBeHidden();
  const moved = await at(450, 691);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...moved, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "682",
  );
  await expect(page.locator(".fc-drawing")).toBeHidden();
  await page.getByLabel("Pozycja Y", { exact: true }).fill("650");
  await expect(page.getByLabel("Pozycja Y", { exact: true })).toHaveValue(
    "650",
  );
  await cdp.detach();
});
