import { test, expect } from "@playwright/test";

// Pracownik nie widzi panelu właściciela: Warsztat z rolą z profilu konta, bez przełącznika ról,
// bez przeglądu właściciela i bez menu starego panelu (Projekty, Materiały, Ustawienia).
const employee = (access_profile: string) => ({ user_id: `u-${access_profile}`, role: "employee", active: true, display_name: "Kuba", project_ids: ["p1"], email: "k@example.test", access_profile });
const projekty = [
  { id: "p1", nazwa: "Kuchnia Kowalskich", klient: "", status: "produkcja", liczbaModulow: 4, zmieniono: "2026-11-15T10:00:00Z", otwarteNotatki: 0 },
  { id: "p2", nazwa: "Szafa Nowaków", klient: "", status: "gotoweDoMontazu", liczbaModulow: 2, zmieniono: "2026-11-15T10:00:00Z", otwarteNotatki: 0 },
];
async function mock(page: import("@playwright/test").Page, person: unknown) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path.endsWith("/session")) body = person;
    else if (path === "/api/projekty") body = projekty;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
}

for (const [profil, widoczny, ukryty] of [
  ["produkcja", "Kuchnia Kowalskich", "Szafa Nowaków"],
  ["montaz", "Szafa Nowaków", "Kuchnia Kowalskich"],
] as const) {
  test(`${profil}: Warsztat bez panelu właściciela`, async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await mock(page, employee(profil));
    // Nawet zapamiętana rola „właściciel” z innego konta na tym tablecie nie otwiera przeglądu właściciela.
    await page.addInitScript(() => localStorage.setItem("warsztat.rola", "wlasciciel"));
    await page.goto("/#/warsztat");
    await expect(page.getByRole("heading", { name: widoczny })).toBeVisible();
    await expect(page.getByRole("heading", { name: ukryty })).toHaveCount(0);
    await expect(page.getByRole("tablist", { name: "Widok roli" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Właściciel" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Menu główne" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ustawienia" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Materiały i okucia" })).toHaveCount(0);
  });
}

test("pracownik nie otwiera widoków właściciela z adresu", async ({ page }) => {
  await mock(page, employee("produkcja"));
  for (const hash of ["#/ustawienia", "#/materialy", "#/panel/zapytania", "#/panel/pracownicy", "#/p/p1"]) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole("heading", { name: "Brak dostępu" })).toBeVisible();
  }
});
