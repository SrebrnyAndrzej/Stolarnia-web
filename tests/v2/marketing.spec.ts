import { test, expect } from "@playwright/test";

// Panel publikacji: tylko właściciel, wyraźny tryb symulacji, akceptacja wersji przez API.
const owner = { user_id: "o", role: "owner", active: true, display_name: "Mateusz", project_ids: [], email: "o@example.test" };
const sales = { ...owner, user_id: "s", role: "employee", access_profile: "sprzedaz" };
const post = {
  id: "FEED-N01",
  wersja: "v1",
  zaakceptowana: null,
  potwierdzenie: null,
  utworzono: "2026-11-15T10:00:00Z",
  zmieniono: "2026-11-15T10:00:00Z",
  tresc: {
    title: "Wnęka pod Twoje rzeczy.",
    captionInstagram: "Tekst IG",
    captionFacebook: "Tekst FB",
    scheduledAt: "2026-11-20T17:30:00Z",
    timezone: "Europe/Warsaw",
    channels: ["facebook", "instagram"],
    assets: [{ publicUrl: "https://example.test/n01.jpg", sha256: "a".repeat(64), altText: "Szafa", mimeType: "image/jpeg" }],
    kind: "feed",
    sourceType: "photo",
    requiresAvailabilityConfirmation: false,
    offerValidUntil: null,
  },
  dostarczenia: [
    { postId: "FEED-N01", wersja: "v1", kanal: "facebook", stan: "pending", zmieniono: "" },
    { postId: "FEED-N01", wersja: "v1", kanal: "instagram", stan: "pending", zmieniono: "" },
  ],
  problem: null,
  historia: [],
};

test("właściciel: panel w trybie symulacji, akceptacja wersji", async ({ page }) => {
  const akceptacje: string[] = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session")) return route.fulfill({ json: owner });
    if (path === "/api/marketing") return route.fulfill({ json: { konfiguracja: { tryb: "symulacja", facebook: false, instagram: false, automat: false, wersjaApi: "v21.0" }, posty: [post] } });
    if (path.endsWith("/akceptuj")) {
      akceptacje.push(path);
      return route.fulfill({ json: "FEED-N01" });
    }
    return route.fulfill({ json: [] });
  });
  await page.route("https://example.test/**", (r) => r.fulfill({ status: 404 }));
  await page.goto("/#/panel/marketing");
  await expect(page.getByRole("heading", { name: "Publikacje" })).toBeVisible();
  await expect(page.getByText("Symulacja — nic nie trafia na Facebook ani Instagram")).toBeVisible();
  await expect(page.getByText("Wnęka pod Twoje rzeczy.")).toBeVisible();
  await page.getByRole("button", { name: "Zaakceptuj" }).click();
  await expect(page.getByText("Zaakceptowano FEED-N01")).toBeVisible();
  expect(akceptacje).toEqual(["/api/marketing/posty/FEED-N01/akceptuj"]);
});

test("pracownik nie widzi panelu publikacji", async ({ page }) => {
  await page.route("**/api/**", (route) => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith("/session") ? sales : [] }));
  await page.goto("/#/panel/projekty");
  await expect(page.getByRole("link", { name: "Marketing" })).toHaveCount(0);
  await page.goto("/#/panel/marketing");
  await expect(page.getByRole("heading", { name: "Brak dostępu" })).toBeVisible();
});
