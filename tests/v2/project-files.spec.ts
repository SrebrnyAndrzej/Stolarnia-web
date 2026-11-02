import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { demoProject, demoProjects } from "../../web/src/v2/demo";
const text =
  "0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n6\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n8\nSCIANY\n90\n4\n70\n1\n10\n0\n20\n0\n10\n4\n20\n0\n10\n4\n20\n3\n10\n0\n20\n3\n0\nLINE\n8\nZABUDOWA\n10\n0\n20\n0\n11\n2.4\n21\n0.6\n0\nENDSEC\n0\nEOF\n";
for (const role of ["owner", "sales", "production"]) {
  test(`${role} architect files: upload recovery, private original and bounded DXF preview`, async ({
    page,
  }) => {
    let files: any[] = [],
      failUpload = true;
    const project = demoProjects[0];
    const base = `/api/v2/projects/${project.id}/files`;
    if (role === "sales")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      if (path.endsWith("/session"))
        return route.fulfill({
          json: {
            user_id: "cad-test",
            role: role === "owner" ? "owner" : "employee",
            access_profile: role === "sales" ? "sprzedaz" : "produkcja",
            active: true,
            display_name: "Test",
            project_ids: [project.id],
          },
        });
      if (path === "/api/v2/projects")
        return route.fulfill({ json: [project] });
      if (path.endsWith("/analiza"))
        return route.fulfill({ json: { warianty: [] } });
      if (path === `/api/v2/projects/${project.id}`)
        return route.fulfill({ json: demoProject(project.id) });
      if (path === base && method === "GET")
        return route.fulfill({ json: files.map(({ base64, ...f }) => f) });
      if (path === base && method === "POST") {
        if (failUpload) {
          failUpload = false;
          return route.fulfill({
            status: 503,
            json: { blad: "Testowy błąd zapisu. Ponów import." },
          });
        }
        const body = route.request().postDataJSON();
        const file = {
          ...body,
          projectId: project.id,
          format: body.name.endsWith("dwg") ? "dwg" : "dxf",
          size: Buffer.from(body.base64, "base64").length,
          createdAt: "2026-11-02T10:00:00Z",
          sha256: "test",
        };
        files.push(file);
        return route.fulfill({ json: file });
      }
      if (path.endsWith("/content"))
        return route.fulfill({ json: files.find((f) => path.includes(f.id)) });
      return route.fulfill({
        status: 403,
        json: { blad: "Brak dostępu w teście" },
      });
    });
    await page.goto("/#/panel/projekty");
    const entry = page.getByRole("button", {
      name: "Pliki od architekta",
      exact: true,
    });
    if (role === "production") {
      await expect(
        page.getByRole("heading", { name: project.nazwa, exact: true }),
      ).toBeVisible();
      await expect(entry).toHaveCount(0);
      return;
    }
    await entry.click();
    await expect(
      page.getByText("Brak plików od architekta.", { exact: false }),
    ).toBeVisible();
    const input = page.getByLabel("Wybierz DXF lub DWG", { exact: true });
    await input.setInputFiles({
      name: "rzut-architekta.dxf",
      mimeType: "application/octet-stream",
      buffer: Buffer.from(text),
    });
    await page
      .getByRole("button", { name: "Zapisz plik w projekcie", exact: true })
      .click();
    await expect(
      page.getByText("Testowy błąd zapisu. Ponów import.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/gotowy do zapisania/)).toBeVisible();
    await page
      .getByRole("button", { name: "Zapisz plik w projekcie", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Podgląd DXF rzut-architekta.dxf",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("img", { name: "Rzut 2D z pliku DXF" }),
    ).toBeVisible();
    await expect(
      page.getByText("Gabaryt widocznego rysunku: 4000 × 3000 mm.", {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByLabel("Warstwa rysunku", { exact: true })
      .selectOption("ZABUDOWA");
    await expect(
      page.getByText("Gabaryt widocznego rysunku: 2400 × 600 mm.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByLabel("Warstwa rysunku", { exact: true }).selectOption("");
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", {
        name: "Pobierz oryginał rzut-architekta.dxf",
        exact: true,
      })
      .click();
    const dxfPath = await (await download).path();
    expect((await readFile(dxfPath!)).toString()).toEqual(text);
    const dwg = Buffer.from("AC1032" + "\0".repeat(80));
    await input.setInputFiles({
      name: "oryginal.dwg",
      mimeType: "application/octet-stream",
      buffer: dwg,
    });
    await page
      .getByRole("button", { name: "Zapisz plik w projekcie", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Pobierz oryginał oryginal.dwg",
        exact: true,
      }),
    ).toBeVisible();
    const getDwg = page.waitForEvent("download");
    await page
      .getByRole("button", {
        name: "Pobierz oryginał oryginal.dwg",
        exact: true,
      })
      .click();
    const filePath = await (await getDwg).path();
    expect(await readFile(filePath!)).toEqual(dwg);
    await input.setInputFiles({
      name: "bledny.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("text"),
    });
    await expect(page.getByText(/Wybierz niepusty plik DXF/)).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Zapisz plik w projekcie",
        exact: true,
      }),
    ).toBeDisabled();
    const a11y = await new AxeBuilder({ page })
      .include(".ps-project-files")
      .analyze();
    expect(a11y.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    if (role === "owner" && process.env.PAN_STOLARZ_QA_SCREENSHOT_FILES) {
      await input.setInputFiles({
        name: "rzut-architekta.dxf",
        mimeType: "application/octet-stream",
        buffer: Buffer.from(text),
      });
      await page
        .getByRole("button", { name: "Wyczyść wybór", exact: true })
        .click();
      await page
        .getByRole("img", { name: "Rzut 2D z pliku DXF" })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: process.env.PAN_STOLARZ_QA_SCREENSHOT_FILES,
      });
    }
    await page
      .getByRole("button", { name: "Zamknij pliki", exact: true })
      .click();
    await expect(entry).toBeFocused();
  });
}
