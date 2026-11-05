import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
test("one-click equipment and adjacent copy are reversible and the readiness list opens the exact part", async ({
  page,
}) => {
  await staffApi(page);
  await page.goto("/#/panel/meble");
  await page
    .getByRole("button", { name: "Rozpocznij układ komór", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Podziel pionowo", exact: true })
    .click();
  const select = page.getByLabel("Wybierz komorę", { exact: true });
  await select.selectOption(
    (await select.locator("option").nth(1).getAttribute("value"))!,
  );
  await page
    .getByRole("group", { name: "Gotowe wyposażenie komory" })
    .getByRole("button", { name: "3 szuflady", exact: true })
    .click();
  await expect(page.getByLabel("Front komory", { exact: true })).toHaveValue(
    "drawers",
  );
  await page
    .getByRole("button", { name: /Skopiuj do sąsiedniej komory:/ })
    .click();
  await select.selectOption(
    (await select.locator("option").nth(2).getAttribute("value"))!,
  );
  await expect(page.getByLabel("Front komory", { exact: true })).toHaveValue(
    "drawers",
  );
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect(page.getByLabel("Front komory", { exact: true })).toHaveValue(
    "none",
  );
  const readiness = page.getByRole("region", {
    name: "Braki przed zamówieniem i produkcją",
  });
  await readiness.getByText(/Materiały, obrzeża i wymiary części/).click();
  const item = readiness.getByRole("button", { name: /Uzupełnij:/ }).first();
  const name = (await item.innerText()).replace("Uzupełnij: ", "");
  await item.click();
  await expect(page.getByLabel("Nazwa płyty", { exact: true })).toHaveValue(
    name,
  );
  await expect(
    page.getByLabel("Materiał płyty", { exact: true }),
  ).toBeFocused();
  await readiness.getByText(/Szuflady i okucia ·/).click();
  const drawerButton = readiness
    .locator("details")
    .filter({ hasText: "Szuflady i okucia" })
    .getByRole("button")
    .first();
  const drawerName = await drawerButton.innerText();
  await drawerButton.click();
  await expect(
    page.getByLabel(`System dla ${drawerName}`, { exact: true }),
  ).toBeFocused();
  await readiness.getByText(/Połączenia i wiercenia/).click();
  await expect(readiness).toContainText(
    "nie jest zatwierdzonym wydaniem produkcyjnym",
  );
  if (process.env.PAN_STOLARZ_QA_WORKFLOW_SCREENSHOT) {
    await readiness.getByText(/Materiały, obrzeża i wymiary części/).click();
    await readiness.scrollIntoViewIfNeeded();
    await readiness.screenshot({
      path: process.env.PAN_STOLARZ_QA_WORKFLOW_SCREENSHOT,
    });
  }
});
