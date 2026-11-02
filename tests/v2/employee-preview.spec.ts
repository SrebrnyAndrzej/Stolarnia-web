import { test, expect } from "@playwright/test";

test("employee preview opens directly and from login without a blank screen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#/logowanie");
  await page.getByText("Zobacz podgląd wersji 2.0", { exact: true }).click();
  await page
    .getByRole("link", { name: "Widok pracownika", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Panel pracownika", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Panel pracownika", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Moja praca", exact: true }).click();
  await expect(page.locator("#ps-content")).not.toBeEmpty();
  await page.getByRole("link", { name: "Projekty", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Panel pracownika", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("unavailable panel chunk shows recovery instead of a blank screen", async ({
  page,
}) => {
  await page.route("**/assets/Workspace-*.js", (route) =>
    route.abort("failed"),
  );
  await page.goto("/#/podglad/employee");
  await expect(
    page.getByRole("heading", { name: "Nie udało się otworzyć panelu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Odśwież stronę" }),
  ).toBeVisible();
});
