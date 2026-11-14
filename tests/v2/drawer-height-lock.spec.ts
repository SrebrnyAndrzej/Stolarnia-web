import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
import AxeBuilder from "@axe-core/playwright";
for (const mobile of [false, true])
  test(`one drawer stays locked while others resize, persists and undo restores lock (${mobile ? "phone" : "desktop"})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await staffApi(page, mobile ? "owner" : "employee");
    await page.goto("/#/panel/meble");
    if (mobile)
      await page
        .getByRole("button", { name: "Narzędzia", exact: true })
        .click();
    await page
      .getByLabel("Układ startowy", { exact: true })
      .selectOption("drawers");
    if (mobile)
      await page
        .getByRole("button", { name: "Inspektor", exact: true })
        .click();
    const pick = page.getByLabel("Wybierz płytę", { exact: true }),
      first = pick
        .locator("option")
        .filter({ hasText: "Front sugerowany" })
        .first();
    const id = (await first.getAttribute("value"))!;
    await pick.selectOption(id);
    await page.getByLabel("Stała wysokość frontu", { exact: true }).check();
    await page.getByLabel("Wysokość płyty", { exact: true }).fill("140");
    await expect(
      page.getByLabel("Wysokość płyty", { exact: true }),
    ).toHaveValue("140");
    if (mobile)
      await page.getByRole("button", { name: "Projekt", exact: true }).click();
    await page.getByLabel("Szybka wysokość", { exact: true }).fill("2400");
    if (mobile)
      await page
        .getByRole("button", { name: "Inspektor", exact: true })
        .click();
    await expect(
      page.getByLabel("Wysokość płyty", { exact: true }),
    ).toHaveValue("140");
    await page.getByLabel("Wysokość płyty", { exact: true }).fill("10000");
    await expect(page.getByRole("alert")).toContainText("Stałe wysokości");
    await expect(
      page.getByLabel("Wysokość płyty", { exact: true }),
    ).toHaveValue("140");
    await page.getByLabel("Stała wysokość frontu", { exact: true }).uncheck();
    await page.getByRole("button", { name: "Cofnij", exact: true }).click();
    await expect(
      page.getByLabel("Stała wysokość frontu", { exact: true }),
    ).toBeChecked();
    const saved = page.waitForRequest(
      (r) => r.method() === "PUT" && r.url().endsWith("/api/v2/furniture"),
    );
    await page
      .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
      .click();
    const body = (await saved).postDataJSON();
    expect(
      body.model.plates.find((p: { id: string }) => p.id === id)
        .drawerHeightLock,
    ).toBe(140);
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Zapisano we wspólnej bibliotece" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
    if (mobile)
      await page
        .getByRole("button", { name: "Narzędzia", exact: true })
        .click();
    await page.getByRole("tab", { name: "Biblioteka", exact: true }).click();
    await page.getByRole("button", { name: /Nowy mebel.*Wersja 1/ }).click();
    if (mobile)
      await page
        .getByRole("button", { name: "Inspektor", exact: true })
        .click();
    await pick.selectOption(id);
    await expect(
      page.getByLabel("Stała wysokość frontu", { exact: true }),
    ).toBeChecked();
    await expect(
      page.getByLabel("Wysokość płyty", { exact: true }),
    ).toHaveValue("140");
    expect(
      (await new AxeBuilder({ page }).include(".fc-studio").analyze())
        .violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: mobile
        ? "../../outputs/Kreator-stala-wysokosc-telefon-2026-11-12.png"
        : "../../outputs/Kreator-stala-wysokosc-2026-11-12.png",
    });
  });
