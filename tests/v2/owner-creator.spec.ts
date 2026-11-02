import { test, expect } from "@playwright/test";
test("demo staff page leads to real account management and keeps destination after login", async ({
  page,
}) => {
  let signedIn = false;
  const owner = {
    user_id: "owner-test",
    role: "owner",
    active: true,
    display_name: "Owner",
    email: "owner@example.com",
    project_ids: [],
  };
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn ? owner : {},
      });
    if (path.endsWith("/login")) {
      signedIn = true;
      return route.fulfill({ json: owner });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/podglad/owner/pracownicy");
  await expect(
    page.getByRole("button", { name: "Utwórz konto i link", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("link", {
      name: "Przejdź do zarządzania pracownikami",
      exact: true,
    })
    .click();
  await page.getByLabel("E-mail", { exact: true }).fill("owner@example.com");
  await page.getByLabel("Hasło", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/#\/panel\/pracownicy$/);
  await expect(
    page.getByRole("button", { name: "Utwórz konto i link", exact: true }),
  ).toBeVisible();
});
for (const width of [1440, 390]) {
  test(`owner opens creator immediately after login at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let signedIn = false;
    let libraryReads = 0;
    const owner = {
      user_id: "owner-test",
      role: "owner",
      active: true,
      display_name: "Właściciel",
      email: "owner@example.com",
      project_ids: [],
    };
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/config"))
        return route.fulfill({ json: { authReady: true } });
      if (path.endsWith("/session"))
        return route.fulfill({
          status: signedIn ? 200 : 401,
          json: signedIn ? owner : { blad: "Zaloguj się" },
        });
      if (path.endsWith("/login")) {
        signedIn = true;
        return route.fulfill({ json: owner });
      }
      if (path.endsWith("/furniture")) libraryReads++;
      return route.fulfill({ json: [] });
    });
    await page.goto("/#/logowanie");
    await page.getByLabel("E-mail", { exact: true }).fill("owner@example.com");
    await page.getByLabel("Hasło", { exact: true }).fill("test-only-password");
    await page
      .getByRole("button", { name: "Zaloguj się", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Panel właściciela", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Otwórz kreator mebla", exact: true })
      .click();
    await expect(page).toHaveURL(/#\/panel\/meble$/);
    await expect(
      page.getByRole("heading", { name: "Kreator mebla", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Tryb pokazowy/)).toHaveCount(0);
    await expect.poll(() => libraryReads).toBeGreaterThan(0);
  });
}
