import { test, expect } from "@playwright/test";
const sales = {
  user_id: "sales",
  role: "employee",
  access_profile: "sprzedaz",
  active: true,
  display_name: "Bartek",
  project_ids: [],
  email: "s@example.com",
};
const production = { ...sales, user_id: "prod", access_profile: "produkcja" };
const wall = { id: "w1", nazwa: "Ściana A", dlugoscMM: 3000, wysokoscMM: 2600 };
const preview = (usunieto: number, podglad: boolean) => ({
  podglad,
  pomieszczenieId: "r1",
  sciany: [wall],
  moduly: [
    {
      id: "m1",
      scianaId: "w1",
      pozycjaXMM: 0,
      pozycjaYMM: 0,
      szerokoscMM: 600,
      wysokoscMM: 720,
      rola: "szafka",
    },
  ],
  rezerwacje: [],
  usunieto,
  ostrzezenia: ["Odstęp lodówka–zlew spada do 100 mm."],
  zalozenia: ["Blenda narożna 50 mm (założenie)."],
});

test("sales fills dimensions, sees warnings and must confirm replacing existing modules", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const layoutCalls: Record<string, unknown>[] = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let body: unknown = {};
    if (path.endsWith("/session")) body = sales;
    else if (path === "/api/projekty" && method === "POST") body = { id: "p1" };
    else if (path.endsWith("/szybki-uklad")) {
      const input = route.request().postDataJSON();
      layoutCalls.push(input);
      body = preview(2, !!input.podglad);
    } else if (path.endsWith("/styl"))
      body = {
        pomieszczenieId: "r1",
        korpus: null,
        front: null,
        blat: null,
        modulyZWlasnymMaterialem: 0,
        okucia: null,
      };
    else if (path === "/api/dekory") body = [];
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.goto("/#/szybki");
  await expect(
    page.getByRole("heading", { name: "Nowa kuchnia przy kliencie" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ściana 1 (od lodówki): więcej" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Ściana 1 (od lodówki)" }),
  ).toHaveValue("3100");
  await page.getByRole("button", { name: /Dalej: podgląd/ }).click();
  await expect(
    page.getByRole("heading", { name: "Podgląd układu" }),
  ).toBeVisible();
  expect(layoutCalls[0]).toMatchObject({
    podglad: true,
    zastap: true,
    typ: "L",
    dlugosciScianMM: [3100, 2400],
  });
  await expect(
    page.getByText("Odstęp lodówka–zlew spada do 100 mm."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zastosuj układ" }).click();
  await expect(page.getByText("Zastąpić istniejące?")).toBeVisible();
  expect(layoutCalls).toHaveLength(1);
  await page.getByRole("button", { name: "Tak, zastąp" }).click();
  await expect(page.getByRole("heading", { name: "Dekory" })).toBeVisible();
  expect(layoutCalls[1]).toMatchObject({ zastap: true });
  expect(layoutCalls[1].podglad).toBeUndefined();
  for (const b of await page.getByRole("button").all()) {
    if (!(await b.isVisible())) continue;
    const box = await b.boundingBox();
    if (box && box.height < 40)
      throw new Error(
        `Za mały cel dotyku: ${await b.textContent()} (${box.height}px)`,
      );
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("production profile cannot open quick project", async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(production),
    }),
  );
  await page.goto("/#/szybki");
  await expect(
    page.getByRole("heading", { name: "Brak dostępu" }),
  ).toBeVisible();
});

// OCENA-kreatora-2026-11-02: ponowne wejście w zapisany projekt i niezapisane dekory.
const savedProject = {
  projekt: {
    id: "p1",
    nazwa: "Kuchnia Testowa",
    klient: { nazwa: "Klient" },
    pomieszczenia: [{ id: "r1", nazwa: "Kuchnia", sciany: [wall] }],
    moduly: [{ id: "m1" }],
  },
  warianty: [],
  zbudowane: [],
};
const decor = {
  key: "egger-H1385",
  id: "H1385 ST40",
  name: "Dąb Casella naturalny",
  manufacturer: "Egger",
  obraz: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
};
async function mockSaved(page: import("@playwright/test").Page) {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path.endsWith("/session")) body = sales;
    else if (path.endsWith("/analiza")) body = savedProject;
    else if (path.endsWith("/styl"))
      body = { pomieszczenieId: "r1", korpus: null, front: null, blat: null, modulyZWlasnymMaterialem: 0, okucia: null };
    else if (path === "/api/dekory") body = [decor];
    else if (path.endsWith("/okucia-projektu/opcje"))
      body = { systemySzuflad: [], zawiasy: [], podnosniki: [], profileSzuflad: [], profilDomyslny: "domyślny" };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/#/szybki/p1");
  await expect(page.getByRole("heading", { name: "Dekory" })).toBeVisible();
}

test("re-entering a saved project: Preview step explains instead of rendering an empty card", async ({ page }) => {
  await mockSaved(page);
  await page.getByRole("button", { name: "Krok 2: Podgląd" }).click();
  await expect(page.getByRole("heading", { name: "Podgląd układu" })).toBeVisible();
  await expect(page.getByText("Układ jest już zapisany w projekcie.")).toBeVisible();
  await page.getByRole("button", { name: /Dalej: styl/ }).click();
  await expect(page.getByRole("heading", { name: "Dekory" })).toBeVisible();
});

test("unsaved decor picks block 'Dalej' and can only be discarded explicitly", async ({ page }) => {
  await mockSaved(page);
  await expect(page.getByText("Wybierz z galerii 1 dekorów")).toBeVisible();
  await page.getByRole("button", { name: /Fronty/ }).click();
  await page.getByRole("button", { name: /Egger H1385 ST40/ }).click();
  await expect(page.getByText("Egger H1385 ST40 · Dąb Casella naturalny")).toBeVisible();
  await expect(page.getByText("Wybrane dekory nie są jeszcze zapisane")).toBeVisible();
  await expect(page.getByRole("button", { name: /Dalej: okucia/ })).toBeDisabled();
  await page.getByRole("button", { name: "Odrzuć wybór i dalej" }).click();
  await expect(page.getByRole("heading", { name: "Okucia projektu" })).toBeVisible();
  await page.getByRole("button", { name: "Krok 3: Styl" }).click();
  await expect(page.getByText("Egger H1385 ST40 · Dąb Casella naturalny")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Dalej bez zmian|Pomiń styl/ })).toBeVisible();
});

// Zmiana 2 z oceny: rzut z góry i położenia punktów stałych (opcja B — pola liczbowe).
test("fixed points: positions and windows go to the engine; engine error lands at the field", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const calls: Record<string, any>[] = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path.endsWith("/session")) return route.fulfill({ json: sales });
    if (path === "/api/projekty" && method === "POST") return route.fulfill({ json: { id: "p1" } });
    if (path.endsWith("/szybki-uklad")) {
      const input = route.request().postDataJSON();
      calls.push(input);
      if (input.zlew?.xMM === 1600)
        return route.fulfill({ status: 400, json: { blad: "zlew: pozycja 1600–2800 mm poza wolnym odcinkiem (Ściana B: 628–2400 mm)." } });
      return route.fulfill({ json: preview(0, true) });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto("/#/szybki");
  await expect(page.getByRole("img", { name: "Rzut kuchni z góry" })).toBeVisible();
  await page.locator("#qp-pos-zlew").fill("1600");
  await page.getByRole("group", { name: "Ściana", exact: true }).first().getByRole("button", { name: "2" }).click();
  await page.getByRole("button", { name: /\+ Okno/ }).click();
  // Element na rzucie przenosi do swojego pola.
  await page.getByRole("button", { name: "Z: zmień położenie" }).click();
  await expect(page.locator("#qp-pos-zlew")).toBeFocused();
  await page.getByRole("button", { name: /Dalej: podgląd/ }).click();
  await expect(page.getByText("zlew: pozycja 1600–2800 mm poza wolnym odcinkiem")).toBeVisible();
  await expect(page.locator("#qp-pos-zlew")).toHaveAttribute("aria-invalid", "true");
  expect(calls[0]).toMatchObject({ zlew: { sciana: 1, xMM: 1600 }, przerwyWiszacych: [{ sciana: 1, odMM: 1000, doMM: 2200 }] });
  await page.locator("#qp-pos-zlew").fill("700");
  await page.getByRole("button", { name: /Dalej: podgląd/ }).click();
  await expect(page.getByRole("heading", { name: "Podgląd układu" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Rzut kuchni z góry" })).toBeVisible();
});

// Zmiana 3 z oceny: tryb „przy kliencie” i opis wariantów.
const owner = { ...sales, user_id: "owner", role: "owner", access_profile: undefined };
const pos = (nazwa: string, kategoria: string, koszt = 100, blad = false) => ({ nazwa, kategoria, ilosc: 1, jednostka: "szt.", kosztNetto: koszt, jestBledemWyceny: blad });
const variant = (wariant: string, nazwa: string, cena: number, hw: string[], blad = false) => ({
  wariant,
  nazwa,
  cenaBrutto: cena,
  cenaNetto: cena / 1.23,
  pozycje: [pos("Korpus • Egger W1100", "plyty", 900, blad), ...hw.map((h) => pos(h, "okucia")), pos("Produkcja", "robocizna")],
});
const quote = (blad = false) => ({
  ...savedProject,
  warianty: [
    variant("eco", "Eco", 35000, ["GTV Zawias puszkowy — 110°", "GTV Modern Box — L=450"], blad),
    variant("standard", "Standard", 38000, ["GTV Zawias puszkowy — 110°", "GTV Modern Box — L=450"], blad),
    variant("premium", "Premium", 48000, ["Blum Clip Top Blumotion — 110°", "Blum Tandembox — Antaro"], blad),
    variant("vip", "VIP", 54000, ["Blum Clip Top — 155°", "Blum Legrabox — Pure"], blad),
  ],
});
async function mockQuote(page: import("@playwright/test").Page, person: unknown, blad = false, extra?: (path: string, route: import("@playwright/test").Route) => Promise<boolean>) {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (extra && (await extra(path, route))) return;
    let body: unknown = {};
    if (path.endsWith("/session")) body = person;
    else if (path.endsWith("/analiza")) body = quote(blad);
    else if (path.endsWith("/styl")) body = { pomieszczenieId: "r1", korpus: null, front: null, blat: null, modulyZWlasnymMaterialem: 0, okucia: null };
    else if (path === "/api/dekory" || path === "/api/materialy") body = [];
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/#/szybki/p1");
  await expect(page.getByRole("heading", { name: "Dekory" })).toBeVisible();
  await page.getByRole("button", { name: "Krok 5: Wycena" }).click();
  await expect(page.getByRole("heading", { name: "Wycena" })).toBeVisible();
}

test("client mode is on by default: owner sees no purchase costs until switching it off; variants explain differences", async ({ page }) => {
  await mockQuote(page, owner);
  await expect(page.getByRole("list", { name: "Co w środku: Standard" })).toContainText("Te same okucia co Eco");
  await expect(page.getByRole("list", { name: "Co w środku: Standard" })).toContainText("Różnica: zakres robocizny");
  await expect(page.getByRole("list", { name: "Co w środku: Premium" })).toContainText("+ Blum Tandembox");
  await expect(page.getByRole("list", { name: "Co w środku: Eco" })).toContainText("GTV Modern Box");
  await page.getByRole("button", { name: /Pokaż wszystkie pozycje/ }).click();
  await expect(page.getByRole("columnheader", { name: "Koszt netto" })).toHaveCount(0);
  await page.getByRole("button", { name: "Przy kliencie: koszty ukryte" }).click();
  await expect(page.getByRole("columnheader", { name: "Koszt netto" })).toBeVisible();
});

test("sales profile has no client-mode switch", async ({ page }) => {
  await mockQuote(page, sales);
  await expect(page.getByRole("button", { name: /Przy kliencie|Koszty widoczne/ })).toHaveCount(0);
});

// Zmiana 4 z oceny: propozycja wstępna przy brakach cen.
test("missing prices: full offer disabled, preliminary proposal requested with wstepna flag", async ({ page }) => {
  const pdfCalls: Record<string, unknown>[] = [];
  await mockQuote(page, owner, true, async (path, route) => {
    if (!path.endsWith("/oferta.pdf")) return false;
    pdfCalls.push(route.request().postDataJSON());
    await route.fulfill({ contentType: "application/pdf", body: Buffer.from("%PDF-1.4\n%%EOF") });
    return true;
  });
  await expect(page.getByRole("button", { name: "Oferta PDF", exact: true })).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Propozycja wstępna PDF" }).click();
  expect((await download).suggestedFilename()).toMatch(/^Propozycja wstępna/);
  expect(pdfCalls[0]).toMatchObject({ wariant: "standard", wstepna: true });
});
