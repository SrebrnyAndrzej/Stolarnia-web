import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
test("employee applies a reusable standard, sizes the back and saves the resulting parts", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByLabel("Układ startowy", { exact: true })
    .selectOption("empty");
  await page.getByLabel("Plecy", { exact: true }).selectOption("applied");
  await page.getByLabel("Materiał korpusu", { exact: true }).fill("Laminat");
  await page.getByLabel("Dekor korpusu", { exact: true }).fill("Biały");
  await page.getByLabel("Materiał pleców", { exact: true }).fill("HDF");
  await page.getByLabel("Dekor pleców", { exact: true }).fill("Biały");
  await page.getByLabel("Domyślne obrzeże", { exact: true }).fill("ABS");
  await page
    .getByLabel("Znaczenie wymiarów", { exact: true })
    .selectOption("finished");
  await page
    .getByRole("button", { name: "Uzupełnij brakujące opisy", exact: true })
    .click();
  if (process.env.PAN_STOLARZ_QA_SCREENSHOT) {
    await page
      .getByRole("heading", { name: "Kreator mebla", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: process.env.PAN_STOLARZ_QA_SCREENSHOT });
  }
  await page
    .getByLabel("Wybierz płytę", { exact: true })
    .selectOption({ label: "1. Bok lewy" });
  await expect(page.getByLabel("Pozycja Z", { exact: true })).toHaveValue("3");
  await expect(page.getByLabel("Głębokość płyty", { exact: true })).toHaveValue(
    "557",
  );
  await expect(page.getByLabel("Materiał płyty", { exact: true })).toHaveValue(
    "Laminat",
  );
  await page
    .getByLabel("Kierunek usłojenia", { exact: true })
    .selectOption("none");
  await page.getByText("Zestawienie części · 5", { exact: true }).click();
  await expect(page.getByRole("table")).toContainText("556 × 2");
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
  await expect(page.getByLabel("Plecy", { exact: true })).toHaveValue(
    "applied",
  );
  await expect(
    page.getByLabel("Materiał korpusu", { exact: true }),
  ).toHaveValue("Laminat");
});
