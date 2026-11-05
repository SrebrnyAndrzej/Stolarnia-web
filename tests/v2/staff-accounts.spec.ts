import { test, expect } from "@playwright/test";
const owner = { user_id: "owner", role: "owner", active: true, display_name: "Owner", project_ids: [], email: "owner@example.com" };
test("owner can create employee and preserve data after failure on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let attempts = 0;
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    let status = 200;
    if (path.endsWith("/session")) body = owner;
    if (path.endsWith("/members") && route.request().method() === "POST") {
      const input = route.request().postDataJSON();
      expect(input.role).toBeUndefined();
      expect(input.job_role).toBe("Montażysta");
      expect(input.access_profile).toBe("montaz");
      attempts++;
      if (attempts === 1) { status = 503; body = { blad: "Błąd testowy. Spróbuj ponownie." }; }
      else body = { activation_url: "https://panstolarz.pro/#/aktywacja?token=example&type=invite" };
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/#/panel/pracownicy");
  await page.getByRole("button", { name: "Utwórz konto i link" }).click();
  await expect(page.getByLabel("Imię i nazwisko", { exact: true })).toBeFocused();
  await page.getByLabel("Imię i nazwisko", { exact: true }).fill("Jan Testowy");
  await page.getByLabel("E-mail pracownika", { exact: true }).fill("jan@example.com");
  await page.getByLabel("Funkcja w zespole", { exact: true }).fill("Montażysta");
  await page.getByRole("radio", { name: /^Montaż/ }).check();
  await page.getByRole("button", { name: "Utwórz konto i link" }).click();
  await expect(page.getByRole("alert")).toContainText("Błąd testowy");
  await expect(page.getByLabel("E-mail pracownika", { exact: true })).toHaveValue("jan@example.com");
  await page.getByRole("button", { name: "Utwórz konto i link" }).click();
  await expect(page.getByLabel("Jednorazowy link")).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Pokaż link", exact: true }).click();
  await expect(page.getByLabel("Jednorazowy link")).toHaveAttribute("type", "text");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("employee cannot open account management", async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...owner, role: "employee" }) }));
  await page.goto("/#/panel/pracownicy");
  await expect(page.getByRole("heading", { name: "Brak dostępu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Utwórz konto i link" })).toHaveCount(0);
});
test("activation consumes token only after valid passwords and clears fragment", async ({ page }) => {
  let submitted = false;
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/activate")) {
      submitted = true;
      expect(route.request().postDataJSON().token_hash).toBe("activation-test-hash-12345");
      return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ blad: "Link wygasł lub został użyty." }) });
    }
    return route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
  });
  await page.goto("/#/aktywacja?token=activation-test-hash-12345&type=invite");
  await expect(page).toHaveURL(/#\/aktywacja$/);
  await page.getByRole("button", { name: "Ustaw hasło i wejdź do panelu" }).click();
  expect(submitted).toBe(false);
  await page.getByLabel("Nowe hasło", { exact: true }).fill("test-password-1234");
  await page.getByLabel("Powtórz hasło", { exact: true }).fill("test-password-1234");
  await page.getByRole("button", { name: "Ustaw hasło i wejdź do panelu" }).click();
  await expect(page.getByRole("alert")).toContainText("Link wygasł");
  await expect(page.getByLabel("Nowe hasło", { exact: true })).toHaveValue("");
});
