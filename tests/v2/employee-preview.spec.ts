import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";

test("employee preview opens directly and from login without a blank screen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await staffApi(page);
  await page.goto("/#/panel/projekty");
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
  await staffApi(page);
  await page.goto("/#/panel/projekty");
  await expect(
    page.getByRole("heading", { name: "Nie udało się otworzyć panelu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Odśwież stronę" }),
  ).toBeVisible();
});
