import { expect, type Page } from "@playwright/test";

/** The detailed list is intentionally collapsed in the compact customer UI. */
export async function openKitchenList(page: Page) {
  const list = page.locator("details.kp-arrangement");
  await expect(list).toBeVisible();
  if ((await list.getAttribute("open")) === null)
    await list.locator("summary").click();
}

export async function showKitchenCatalog(page: Page) {
  const back = page.getByRole("button", {
    name: "Wróć do podglądu",
    exact: true,
  });
  if (await back.isVisible()) await back.click();
  await expect(page.locator(".kp-cabinet-editor")).toHaveCount(0);
}

export async function openArchitectFiles(page: Page) {
  const files = page.locator("details.kp-architect-tools");
  await expect(files).toBeAttached();
  const extras = page.locator("details.kp-setup-extras");
  if (
    (await extras.isVisible()) &&
    (await extras.getAttribute("open")) === null
  )
    await extras.locator(":scope > summary").click();
  await expect(files).toBeVisible();
  if ((await files.getAttribute("open")) === null)
    await files.locator(":scope > summary").click();
}
