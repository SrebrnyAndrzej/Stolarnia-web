import { openArchitectFiles } from "./kitchen-ui";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  kitchenInputSchema,
  kitchenModules,
} from "../../src/core/kitchen-configuration";
import { scianyNaRzucie, punktNaRzucie } from "../../src/core/geometry";
import { kitchenRoomWalls } from "../../src/core/kitchen-island";
test("mapped floor plan preserves the 60 cm reference and opposite appliance positions", async ({
  page,
}) => {
  test.skip(
    !process.env.PAN_STOLARZ_QA_MAPPED_PROJECT,
    "Optional local customer fixture",
  );
  await page.goto("/#/kreator-kuchni");
  await openArchitectFiles(page);
  await page
    .getByLabel("Wczytaj paczkę projektu", { exact: true })
    .setInputFiles(process.env.PAN_STOLARZ_QA_MAPPED_PROJECT!);
  await expect(page.locator(".kp-architect-list li")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Otwórz parter.jpg", exact: true })
    .click();
  await expect(
    page.getByLabel("Długość zaznaczonego odcinka (cm)", { exact: true }),
  ).toHaveValue("60");
  await expect(page.locator(".kp-raster-preview line")).toHaveAttribute(
    "y1",
    "468",
  );
  await expect(page.locator("[data-image-dimensions]")).toContainText(
    "289.5 × 238.5 cm",
  );
  await page.locator(".kp-architect-preview").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "../../outputs/kuchnia-6-2026-11-16/kalibracja-blatem-60.png",
  });
  await page
    .getByRole("button", {
      name: "Zamknij podgląd i anuluj edycję",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Przejdź do szafek", exact: false })
    .click();
  await page.getByRole("button", { name: "Rzut z góry", exact: true }).click();
  await expect(page.locator("[data-architect-image] image")).toHaveCount(1);
  await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
  const raw = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
  );
  const d = kitchenInputSchema.parse(raw),
    modules = kitchenModules(d),
    walls = scianyNaRzucie({ sciany: kitchenRoomWalls(d) });
  const cook = modules.find((m) => m.konstrukcja === "oven")!,
    sink = modules.find((m) => m.konstrukcja === "sink")!;
  expect(cook.scianaId).toBe("a");
  expect(sink.scianaId).toBe("c");
  expect(
    punktNaRzucie(walls[0], cook.pozycjaXMM + cook.szerokoscMM / 2, 0)[0],
  ).toBe(1455);
  expect(
    punktNaRzucie(walls[1], sink.pozycjaXMM + sink.szerokoscMM / 2, 0)[0],
  ).toBe(1440);
  await page
    .locator(".kp-preview-toolbar")
    .evaluate((el) =>
      scrollTo(0, scrollY + el.getBoundingClientRect().top - 110),
    );
  await page.screenshot({
    path: "../../outputs/kuchnia-6-2026-11-16/zmapowana-kuchnia-6.png",
  });
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".widok3d canvas")).toBeVisible();
  await page.screenshot({
    path: "../../outputs/kuchnia-6-2026-11-16/zmapowana-kuchnia-6-3d.png",
  });
});
for (const phone of [false, true])
  test(`parallel kitchen has opposite rows, no fake corner and an editable priced proposal (${phone ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/kreator-kuchni");
    await page
      .getByRole("button", {
        name: "Dwie ściany naprzeciwko siebie",
        exact: false,
      })
      .click();
    await page
      .getByLabel("Długość ciągów A i C", { exact: false })
      .fill("289.5");
    await page
      .getByLabel("Odległość między ścianami A i C", { exact: false })
      .fill("238.5");
    await page
      .getByRole("button", { name: "Ułóż całą kuchnię", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Rzut z góry", exact: true })
      .click();
    await expect(page.locator(".kp-live-price strong")).toHaveText(/\d.*zł/);
    const raw = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pan-stolarz.kuchnia.v1")!),
    );
    const d = kitchenInputSchema.parse(raw),
      modules = kitchenModules(d),
      walls = scianyNaRzucie({ sciany: kitchenRoomWalls(d) });
    expect(d.layout).toBe("parallel");
    expect(walls.map((w) => w.sciana.id)).toEqual(["a", "c"]);
    expect(new Set(modules.map((m) => m.scianaId))).toEqual(
      new Set(["a", "c"]),
    );
    expect(punktNaRzucie(walls[1], 0, 0)).toEqual([2895, 2385]);
    expect(
      modules.filter((m) => m.scianaId === "c").some((m) => m.pozycjaXMM === 0),
    ).toBeTruthy();
    await expect(page.locator("main")).not.toContainText(
      "W propozycji zostawiamy po 65 cm",
    );
    await page
      .getByRole("group", { name: "Ściana podglądu", exact: true })
      .getByRole("button", { name: /^Ściana C/ })
      .click();
    await expect(page.locator(".kp-arrangement h2")).toHaveText(
      "Szafki · ściana C",
    );
    await page
      .locator(".kp-preview-toolbar")
      .evaluate((el) =>
        scrollTo(0, scrollY + el.getBoundingClientRect().top - 110),
      );
    await page.screenshot({
      path: `../../outputs/kuchnia-6-2026-11-16/rownolegle-${phone ? "telefon" : "komputer"}.png`,
    });
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(
      axe.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact ?? ""),
      ),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.locator(".widok3d canvas")).toBeVisible();
    await page
      .getByRole("button", { name: "Zobacz podsumowanie", exact: true })
      .click();
    await expect(page.locator(".kp-quote-price strong")).toHaveText(/\d.*zł/);
    await page.getByText("Parametry szkicu", { exact: true }).click();
    await expect(page.locator(".kp-summary")).toContainText("Odległość A–C");
    await page.reload();
    await expect(
      page.getByRole("button", {
        name: "Dwie ściany naprzeciwko siebie",
        exact: false,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });
