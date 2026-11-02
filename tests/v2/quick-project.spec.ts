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
