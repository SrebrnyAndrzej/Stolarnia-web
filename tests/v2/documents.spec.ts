import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { demoProject, demoProjects } from "../../web/src/v2/demo";
const pdf = readFileSync("web/public/documents/demo-montazowe.pdf");
const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});
for (const role of ["owner", "employee"] as const) {
  test(`${role} can prepare and download scoped technical documentation`, async ({
    page,
  }) => {
    const urls: string[] = [];
    let fail = true;
    await page.setViewportSize({
      width: role === "employee" ? 390 : 1488,
      height: 1056,
    });
    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      urls.push(url.pathname + url.search);
      if (url.pathname.endsWith("/session"))
        return route.fulfill(
          json({
            user_id: role,
            role,
            active: true,
            display_name: "Test",
            project_ids: [demoProjects[0].id],
          }),
        );
      if (url.pathname === "/api/v2/projects")
        return route.fulfill(json([demoProjects[0]]));
      if (url.pathname.endsWith("/documents.pdf"))
        return fail
          ? route.fulfill(json({ blad: "Testowy błąd generowania" }, 503))
          : route.fulfill({ contentType: "application/pdf", body: pdf });
      if (url.pathname.endsWith("/documents"))
        return route.fulfill(
          json({
            currentRevision: 3,
            selectedRelease: role === "employee" ? "release-1" : null,
            releases: [
              {
                id: "release-1",
                number: 1,
                revision: 2,
                createdAt: "2026-10-31T10:00:00Z",
                ready: false,
              },
            ],
            document: {
              revision: role === "employee" ? 2 : 3,
              generatedAt: "2026-10-31",
              ready: false,
              parts: 8,
              operations: 12,
              diagnostics: [
                {
                  code: "MISSING",
                  level: "brakDanych",
                  description: "Brak potwierdzonych danych okuć.",
                },
              ],
              modules: [{ id: "m1", name: "Szafka testowa", parts: 8 }],
            },
          }),
        );
      if (url.pathname === `/api/v2/projects/${demoProjects[0].id}`)
        return route.fulfill(json(demoProject(demoProjects[0].id)));
      return route.fulfill(json({ blad: "Brak dostępu w teście" }, 403));
    });
    await page.goto("/#/panel/projekty");
    const entry = page.getByRole("button", {
      name: "Dokumentacja techniczna",
      exact: true,
    });
    await expect(entry).toBeVisible({ timeout: 15000 });
    expect(urls.some((u) => u.includes("/documents"))).toBe(false);
    await entry.click();
    await expect(
      page.getByRole("heading", { name: "Karty techniczne i montażowe" }),
    ).toBeVisible();
    if (role === "employee") {
      await expect(
        page.getByText(/drukujesz wybrane, wcześniejsze wydanie/),
      ).toBeVisible();
      await expect(
        page.getByLabel("Wersja dokumentacji").locator("option"),
      ).toHaveCount(1);
    }
    await page.getByLabel("Zakres wydruku").selectOption("m1");
    await page
      .getByRole("button", { name: "Przygotuj karty montażowe", exact: true })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Karty techniczne i montażowe" })
        .getByRole("alert"),
    ).toContainText("Testowy błąd generowania");
    await expect(page.getByLabel("Zakres wydruku")).toHaveValue("m1");
    fail = false;
    await page
      .getByRole("button", { name: "Przygotuj karty montażowe", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Otwórz PDF do druku (nowa karta)" }),
    ).toHaveAttribute("href", /^blob:/);
    const requested = new URL(
      urls.findLast((u) => u.includes("/documents.pdf"))!,
      "http://test",
    );
    expect(requested.searchParams.get("modul")).toBe("m1");
    expect(requested.searchParams.get("rodzaj")).toBe("montazowe");
    expect(requested.searchParams.get("rewizja")).toBe(
      role === "employee" ? "2" : "3",
    );
    expect(requested.searchParams.get("wydanie")).toBe(
      role === "employee" ? "release-1" : null,
    );
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Pobierz PDF", exact: true }).click();
    expect((await download).suggestedFilename()).toBe("karty-montazowe.pdf");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (role === "employee")
      expect(urls.some((u) => u.includes("/api/projekty/"))).toBe(false);
    await page
      .getByRole("button", { name: "Odśwież dokumentację", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Pobierz PDF", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Zakres wydruku")).toHaveValue("");
    await page.getByRole("button", { name: "Zamknij dokumentację" }).click();
    await expect(entry).toBeFocused();
  });
}
test("employee without a release cannot print live documentation", async ({
  page,
}) => {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill(
        json({
          user_id: "employee",
          role: "employee",
          active: true,
          display_name: "Test",
          project_ids: [demoProjects[0].id],
        }),
      );
    if (path === "/api/v2/projects")
      return route.fulfill(json([demoProjects[0]]));
    if (path.endsWith("/documents"))
      return route.fulfill(
        json({
          currentRevision: 1,
          releases: [],
          selectedRelease: null,
          document: null,
        }),
      );
    return route.fulfill(json(demoProject(demoProjects[0].id)));
  });
  await page.goto("/#/panel/projekty");
  await page
    .getByRole("button", { name: "Dokumentacja techniczna", exact: true })
    .click();
  await expect(
    page.getByText(/Nie ma jeszcze zapisanego wydania/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Przygotuj karty techniczne",
      exact: true,
    }),
  ).toHaveCount(0);
});
test("demo provides a real sample PDF without accessing private project documentation", async ({
  page,
}) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.goto("/#/podglad/employee/projekty");
  await page
    .getByRole("button", { name: "Dokumentacja techniczna", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Przygotuj karty techniczne", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Pobierz PDF", exact: true }),
  ).toBeVisible();
  expect(urls.some((u) => u.includes("/api/v2/projects/"))).toBe(false);
});
