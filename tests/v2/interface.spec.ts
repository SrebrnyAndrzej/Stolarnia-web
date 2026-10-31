import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demoProject, demoProjects } from "../../web/src/v2/demo";

const json = (data: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(data),
});
async function signedIn(page: Page, role: "owner" | "employee" | "client") {
  const person = {
    user_id: role,
    role,
    active: true,
    display_name: "Konto testowe",
    project_ids: [demoProjects[0].id],
    email: "test@example.com",
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v2/session" || path === "/api/v2/login")
      return route.fulfill(json(person));
    if (path === "/api/v2/projects")
      return route.fulfill(json([demoProjects[0]]));
    if (path.startsWith("/api/v2/projects/"))
      return route.fulfill(json(demoProject(demoProjects[0].id)));
    if (path.endsWith("/analiza") && role === "owner")
      return route.fulfill(
        json({
          warianty: [{ wariant: "standard", cenaBrutto: 32400, pozycje: [] }],
        }),
      );
    return route.fulfill(json({ blad: "Odmowa w atrapie testowej" }, 403));
  });
}

test("client page reflows on phone and preserves the enquiry after a server error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Twoje wnętrze",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Opowiedz o projekcie" }).click();
  await page.getByRole("button", { name: "Wyślij zapytanie" }).click();
  await expect(page.getByLabel("Imię", { exact: true })).toBeFocused();
  await page.getByLabel("Imię", { exact: true }).fill("Test");
  await page.getByLabel("E-mail", { exact: true }).fill("test@example.com");
  await page.getByLabel("Miejscowość realizacji").fill("Przykład");
  await page
    .getByLabel("Twój pomysł")
    .fill("Kuchnia do ustalenia na pomiarze.");
  await page.route("**/api/v2/requests", (route) =>
    route.fulfill(json({ blad: "Testowy błąd zapisu" }, 503)),
  );
  await page.getByRole("button", { name: "Wyślij zapytanie" }).click();
  await expect(page.getByRole("alert")).toContainText("Testowy błąd zapisu");
  await expect(page.getByLabel("Twój pomysł")).toHaveValue(
    "Kuchnia do ustalenia na pomiarze.",
  );
  await page.route("**/api/v2/requests", (route) =>
    route.fulfill(json({ id: "testowe-zgloszenie" }, 201)),
  );
  await page.getByRole("button", { name: "Wyślij zapytanie" }).click();
  await expect(
    page.getByRole("heading", { name: "Zapytanie zapisane" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("owner project workspace includes finance and existing tool links", async ({
  page,
}) => {
  await signedIn(page, "owner");
  await page.goto("/#/panel/projekty");
  await expect(
    page.getByRole("heading", { name: "Panel właściciela", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Zarządzaj dostępem", exact: true }),
  ).toHaveAttribute("href", "#/panel/pracownicy");
  await expect(
    page.getByRole("heading", { name: "Kuchnia • Projekt A", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Wycena orientacyjna", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Przygotuj ofertę" }),
  ).toHaveAttribute("href", /oferta$/);
  await page.getByRole("button", { name: "Rzut 2D", exact: true }).click();
  await page.screenshot({
    path: "qa/owner-authenticated.png",
    fullPage: false,
  });
  const search = page.getByRole("searchbox", { name: "Szukaj projektów" });
  await search.fill("nieistniejący");
  await expect(
    page.getByText("Nie ma projektów pasujących do wyszukiwania."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Wyczyść wyszukiwanie", exact: true })
    .first()
    .click();
  await expect(search).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "Kuchnia • Projekt A", exact: true }),
  ).toBeVisible();
});

test("employee gets technical data only, with mobile navigation and 403 screen", async ({
  page,
}) => {
  const financialRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/projekty\/.+\/(analiza|wycena|oferta)/.test(request.url()))
      financialRequests.push(request.url());
  });
  await signedIn(page, "employee");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/panel/projekty");
  await expect(
    page.getByRole("heading", { name: "Kuchnia • Projekt A", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Wycena orientacyjna", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Przygotuj ofertę" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Panel pracownika", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Otwórz kalkulator szuflad", exact: true }),
  ).toHaveAttribute("href", "#/panel/szuflady");
  expect(financialRequests).toEqual([]);
  await page.getByRole("button", { name: "Otwórz menu" }).click();
  await expect(
    page.getByRole("link", { name: "Kalkulator szuflad", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Pracownicy", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/#/p/pokaz-kuchnia/wycena");
  await expect(
    page.getByRole("heading", { name: "Brak dostępu" }),
  ).toBeVisible();
});

test("client account gets assigned projects without workshop tools or internal costs", async ({
  page,
}) => {
  await signedIn(page, "client");
  await page.goto("/#/panel/projekty");
  await expect(
    page.getByRole("heading", { name: "Moje projekty" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Kalkulator szuflad", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Wycena orientacyjna", { exact: true }),
  ).toHaveCount(0);
});

test("demo supports 3D and 2D and is explicitly not a login", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/podglad/owner");
  await expect(
    page.getByText("Podgląd · dane przykładowe", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "Rzut 2D", exact: true }).click();
  await expect(page.locator(".ps-visual svg.elev")).toBeVisible();
  expect(errors).toEqual([]);
});

test("public page and owner 2D view have no serious accessibility findings", async ({
  page,
}) => {
  await page.goto("/");
  const client = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    client.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await signedIn(page, "owner");
  await page.goto("/#/panel/projekty");
  await page.reload(); // new server session fixture must be read on a fresh document
  await page.getByRole("button", { name: "Rzut 2D", exact: true }).click();
  const owner = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    owner.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
});
