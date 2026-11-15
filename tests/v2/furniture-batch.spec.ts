import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { prepareFurnitureBatch } from "../../src/server/furniture-batch-preparation";
import { preparationMaterials } from "../../src/server/furniture-preparation";
import { furnitureBatchFixture } from "./furniture-batch-fixture";
async function setup(page: Page) {
  const fixture = furnitureBatchFixture();
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill({ json: fixture.person });
    if (path.endsWith("/furniture/materials"))
      return route.fulfill({
        json: preparationMaterials(fixture.store, fixture.person),
      });
    if (path.endsWith("/batch-preparation"))
      try {
        return route.fulfill({
          json: prepareFurnitureBatch(
            fixture.store,
            fixture.person,
            route.request().postDataJSON(),
          ),
        });
      } catch (e) {
        const error = e as { status?: number; message: string };
        return route.fulfill({
          status: error.status ?? 400,
          json: { blad: error.message },
        });
      }
    if (path.endsWith("/furniture"))
      return route.fulfill({ json: fixture.entries });
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/panel/meble");
  await page.getByRole("tab", { name: "Biblioteka", exact: true }).click();
  await page
    .getByRole("button", { name: "Wspólny rozkrój biblioteki", exact: true })
    .click();
  return fixture;
}
async function selectModels(page: Page) {
  for (const name of ["Mebel 1 · v1", "Mebel 2 · v1"])
    await page.getByRole("checkbox", { name, exact: true }).check();
}
async function assign(page: Page) {
  await page
    .getByLabel("Materiał zbiorczy zestawu", { exact: true })
    .selectOption("catalog");
  await page
    .getByRole("button", {
      name: "Przypisz materiał do zgodnych płyt zestawu",
      exact: true,
    })
    .click();
}
test("shared sheet planning blocks incomplete models, namespaces repeated parts, exports frozen sources and fits mobile", async ({
  page,
}) => {
  const f = await setup(page);
  await selectModels(page);
  await page
    .getByRole("button", { name: "Oblicz wspólny rozkrój", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Wspólny rozkrój wstrzymany",
  );
  await assign(page);
  await page.getByLabel("Sztuki: Mebel 1", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Oblicz wspólny rozkrój", exact: true })
    .click();
  await expect(page.getByText("Formatki: 3", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Arkusze wspólnie: 1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Arkusze osobno: 3 (każda sztuka oddzielnie)", {
      exact: true,
    }),
  ).toBeVisible();
  const sheet = page.getByRole("group", {
    name: "Plan arkusza 1",
    exact: true,
  });
  const part = sheet.getByRole("button").first();
  await part.focus();
  await part.press("Enter");
  await expect(part).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("status").filter({ hasText: /rdzeń 400 × 300 mm/ }),
  ).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Pobierz pakiet zestawu JSON", exact: true })
    .click();
  const packet = JSON.parse(
    await readFile((await (await downloading).path())!, "utf8"),
  );
  expect(packet.planning.formatki).toHaveLength(3);
  expect(
    new Set(packet.planning.formatki.map((p: { id: string }) => p.id)).size,
  ).toBe(3);
  expect(
    packet.source.items.map((i: { libraryId: string }) => i.libraryId).sort(),
  ).toEqual(f.entries.map((e) => e.id).sort());
  expect(packet.readyForProduction).toBe(false);
  expect(JSON.stringify(packet)).not.toContain("7654321");
  expect(
    (await new AxeBuilder({ page }).include(".fc-studio-sheet").analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: "../../outputs/Wspolny-rozkroj-2026-11-09.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(
    page.getByRole("dialog", { name: "Wspólny rozkrój biblioteki" }),
  ).toBeVisible();
});
test("a version conflict is repaired explicitly after refreshing and discards old mappings", async ({
  page,
}) => {
  const f = await setup(page);
  await selectModels(page);
  await assign(page);
  f.entries[0].version = 2;
  await page
    .getByRole("button", { name: "Oblicz wspólny rozkrój", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("zmienił się");
  await page
    .getByRole("button", { name: "Odśwież modele zestawu", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Użyj bieżącej wersji: Mebel 1",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Oblicz wspólny rozkrój", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Użyj bieżącej wersji: Mebel 1", exact: true })
    .click();
  await assign(page);
  await page
    .getByRole("button", { name: "Oblicz wspólny rozkrój", exact: true })
    .click();
  await expect(page.getByText("Formatki: 2", { exact: true })).toBeVisible();
  await page.getByLabel("Sztuki: Mebel 1", { exact: true }).fill("3");
  await expect(
    page.getByRole("button", {
      name: "Pobierz pakiet zestawu JSON",
      exact: true,
    }),
  ).toHaveCount(0);
});
test("closing a pending batch aborts its result and reopening keeps selection ready for recalculation", async ({
  page,
}) => {
  const f = await setup(page);
  await selectModels(page);
  await assign(page);
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  let started!: () => void;
  const requested = new Promise<void>((r) => (started = r));
  await page.route("**/api/v2/furniture/batch-preparation", async (route) => {
    const packet = prepareFurnitureBatch(
      f.store,
      f.person,
      route.request().postDataJSON(),
    );
    started();
    await held;
    try {
      await route.fulfill({ json: { ...packet, checksum: "outdated-result" } });
    } catch {}
  });
  await page
    .getByRole("button", { name: "Oblicz wspólny rozkrój", exact: true })
    .click();
  await requested;
  await page
    .getByRole("button", { name: "Zamknij panel", exact: true })
    .click();
  release();
  await page
    .getByRole("button", { name: "Wspólny rozkrój biblioteki", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Mebel 1 · v1", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Oblicz wspólny rozkrój", exact: true }),
  ).toBeEnabled();
  await expect(page.getByText(/outdated-result/)).toHaveCount(0);
});
