import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";

for (const role of ["owner", "employee"]) {
  test(`${role} preserves part materials, edges and IDs across resize and library save`, async ({
    page,
  }) => {
    await staffApi(page, role);
    await page.goto("/#/panel/meble");
    const select = page.getByLabel("Wybierz płytę", { exact: true });
    await select.selectOption({ label: "1. Bok lewy" });
    const id = await select.inputValue();
    await page
      .getByRole("button", {
        name: "Materiał i obrzeża tej płyty",
        exact: true,
      })
      .click();
    await expect(
      page.getByLabel("Materiał płyty", { exact: true }),
    ).toBeFocused();
    await page
      .getByLabel("Materiał płyty", { exact: true })
      .fill("Płyta laminowana");
    await page
      .getByLabel("Dekor / powierzchnia", { exact: true })
      .fill("W1100 ST9");
    await page
      .getByLabel("Płaszczyzna płyty", { exact: true })
      .selectOption("yz");
    await page
      .getByLabel("Kierunek usłojenia", { exact: true })
      .selectOption("v");
    await page.getByLabel("Obrzeże U0", { exact: true }).selectOption("band");
    await page
      .getByLabel("Oznaczenie obrzeża U0", { exact: true })
      .fill("ABS biały");
    await page.getByLabel("Grubość obrzeża U0 (mm)", { exact: true }).fill("2");
    for (const key of ["U1", "V0", "V1"])
      await page
        .getByLabel(`Obrzeże ${key}`, { exact: true })
        .selectOption("none");
    await page.getByLabel("Grubość płyty", { exact: true }).fill("22");
    await expect(select).toHaveValue(id);
    await expect(page.getByText("22 mm", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
      .click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Zapisano we wspólnej bibliotece" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Nowy mebel", exact: true }).click();
    await page.getByRole("button", { name: /Nowy mebel.*Wersja 1/ }).click();
    await select.selectOption(id);
    const downloadEvent = page.waitForEvent("download");
    await page
      .getByRole("button", {
        name: "Pobierz kartę konstrukcji JSON",
        exact: true,
      })
      .click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toContain("-v1.json");
    await expect(
      page.getByLabel("Materiał płyty", { exact: true }),
    ).toHaveValue("Płyta laminowana");
    await expect(
      page.getByLabel("Grubość obrzeża U0 (mm)", { exact: true }),
    ).toHaveValue("2");
    await page
      .getByText("Karta części · dane materiałowe", { exact: true })
      .click();
    await expect(page.locator(".fc-part-review")).toContainText(
      "Dane materiałowe uzupełnione",
    );
  });
}

test("changing the local frame clears edge decisions, undo restores them on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Wybierz płytę", { exact: true })
    .selectOption({ label: "1. Bok lewy" });
  await page
    .getByLabel("Płaszczyzna płyty", { exact: true })
    .selectOption("yz");
  await page.getByLabel("Obrzeże U0", { exact: true }).selectOption("none");
  await page
    .getByLabel("Płaszczyzna płyty", { exact: true })
    .selectOption("xy");
  await expect(page.getByLabel("Obrzeże U0", { exact: true })).toHaveValue(
    "unset",
  );
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(page.getByLabel("Obrzeże U0", { exact: true })).toHaveValue(
    "none",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
