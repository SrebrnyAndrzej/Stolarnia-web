import { test, expect } from "@playwright/test";
for (const role of ["owner", "employee", "client"]) {
  test(`old ${role} preview requires actual login`, async ({ page }) => {
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 401, json: { blad: "Zaloguj się" } }),
    );
    await page.goto(`/#/podglad/${role}/meble`);
    await expect(page).toHaveURL(/#\/panel\/meble$/);
    await expect(
      page.getByRole("button", { name: "Zaloguj się", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Kreator mebla", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Zobacz podgląd wersji 2.0", { exact: true }),
    ).toHaveCount(0);
    await expect(page.locator('a[href*="#/podglad/"]')).toHaveCount(0);
  });
}
test("old owner URL never grants owner permissions to an employee", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: {
        user_id: "test",
        role: "employee",
        active: true,
        display_name: "Test",
        email: "",
        project_ids: [],
      },
    }),
  );
  await page.goto("/#/podglad/owner/pracownicy");
  await expect(
    page.getByRole("heading", { name: "Brak dostępu", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Utwórz konto i link", exact: true }),
  ).toHaveCount(0);
});
