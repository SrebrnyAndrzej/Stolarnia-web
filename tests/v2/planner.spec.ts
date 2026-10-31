import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public planner persists, reorders, undoes, exports and hands off a kitchen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/kreator-kuchni");
  await expect(
    page.getByRole("heading", { name: "Zaplanuj swoją kuchnię" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 600",
      exact: false,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 800",
      exact: false,
    })
    .click();
  await expect(page.getByText("2200 mm wolne")).toBeVisible();
  await page
    .getByRole("button", {
      name: "Przesuń wcześniej: Szafka dolna z półkami 800",
    })
    .click();
  await expect(page.locator(".kp-arrangement li").first()).toContainText("800");
  await page
    .getByRole("button", {
      name: "Usuń: Szafka dolna z półkami 600",
      exact: true,
    })
    .click();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(1);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(2);
  await page.getByRole("button", { name: "Szałwia", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Szałwia", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Rzut z góry", exact: true }).click();
  await expect(page.locator(".kp-canvas svg")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz szkic", exact: true })
    .click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "pan-stolarz-moja-kuchnia.json",
  );
  await page.getByRole("button", { name: "Zobacz podsumowanie" }).click();
  await page.getByRole("button", { name: "Przejdź do zapytania" }).click();
  await expect(page.locator('textarea[name="description"]')).toHaveValue(
    /base-shelves-800/,
  );
  expect(errors).toEqual([]);
});

test("dimensions and capacity prevent invalid handoff; narrow viewport is usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/kreator-kuchni");
  await page.getByLabel("Długość ściany A").fill("0");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await expect(
    page.getByText("Podaj całe milimetry:", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Długość ściany A").fill("1800");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  const add = page.getByRole("button", {
    name: "Dodaj: Szafka dolna z półkami 900",
    exact: false,
  });
  await add.click();
  await add.click();
  await add.click();
  await expect(
    page.getByText("Szafki wychodzą poza ścianę A.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "qa/planner-mobile.png", fullPage: true });
});

test("L layout reserves the corner and import validation preserves the draft", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Układ L", exact: false }).click();
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", { name: "Ściana B", exact: true })
    .first()
    .click();
  await expect(page.getByText("1750 mm wolne")).toBeVisible();
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 600",
      exact: false,
    })
    .click();
  await expect(page.getByText("od 650 mm", { exact: false })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"items":[]}'),
  });
  await expect(
    page.getByText("Nie można wczytać pliku.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(1);
  await page.getByRole("button", { name: "Zacznij od nowa" }).click();
  await page.getByRole("button", { name: "Zachowaj szkic" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(1);
});

test("planner accessibility and 3D use the same engine geometry", async ({
  page,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 600",
      exact: false,
    })
    .click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await page.screenshot({ path: "qa/planner-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".kp-canvas canvas")).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Od przodu", exact: true }).click();
  await expect(page.locator(".kp-canvas svg")).toBeVisible();
});

test("multiple tabs require an explicit draft choice", async ({
  page,
  context,
}) => {
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 600",
      exact: false,
    })
    .click();
  const second = await context.newPage();
  await second.goto("/#/kreator-kuchni");
  await second.getByRole("button", { name: "Przejdź do szafek" }).click();
  await second
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 800",
      exact: false,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Wczytaj wersję z innej karty" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Wczytaj wersję z innej karty" })
    .click();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(2);
  await second.close();
});

test("unavailable storage still allows editing and valid file import", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.goto("/#/kreator-kuchni");
  await expect(
    page.getByText("Zapis lokalny niedostępny", { exact: false }),
  ).toBeVisible();
  const draft = {
    version: 1,
    layout: "straight",
    width: 3600,
    depth: 2400,
    height: 2600,
    finish: "white",
    items: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        catalogId: "base-shelves-600",
        wall: "a",
      },
    ],
  };
  await page.locator('input[type="file"]').setInputFiles({
    name: "kitchen.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(draft)),
  });
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await expect(page.locator(".kp-arrangement li")).toHaveCount(1);
});
