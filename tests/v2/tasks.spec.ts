import { test, expect } from "@playwright/test";
for (const role of ["owner", "employee"] as const) {
  test(`${role} task workflow and conflict recovery on phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let status = "todo";
    let conflict = false;
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      let code = 200;
      if (path.endsWith("/session"))
        data = {
          user_id: "worker",
          role,
          active: true,
          display_name: "Bartek",
          project_ids: ["p"],
          email: "test@example.com",
        };
      else if (path.endsWith("/projects"))
        data = [{ id: "p", nazwa: "Kuchnia testowa", status: "produkcja" }];
      else if (path.endsWith("/members"))
        data = [
          {
            user_id: "worker",
            display_name: "Bartek",
            role: "employee",
            active: true,
            project_ids: ["p"],
          },
        ];
      else if (path === "/api/v2/tasks" && route.request().method() === "GET")
        data = [
          {
            id: "t",
            project_id: "p",
            assignee_id: "worker",
            title: "Przygotuj korpusy",
            status,
            version: 1,
          },
        ];
      else if (path === "/api/v2/tasks/t") {
        if (conflict) {
          code = 409;
          data = { blad: "Zadanie zmieniło się. Odśwież listę." };
        } else {
          status = route.request().postDataJSON().status;
          data = { ok: true };
        }
      }
      await route.fulfill({
        status: code,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });
    await page.goto("/#/panel/zadania");
    await expect(
      page.getByRole("heading", {
        name: role === "owner" ? "Plan pracy" : "Moja praca",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Rozpocznij pracę" }).click();
    await expect(
      page.getByRole("button", { name: "Wstrzymaj", exact: true }),
    ).toBeVisible();
    conflict = true;
    await page.getByRole("button", { name: "Zakończ zadanie" }).click();
    await expect(page.getByRole("alert")).toContainText("Zadanie zmieniło się");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (role === "employee")
      await expect(
        page.getByRole("heading", { name: "Nowe zadanie" }),
      ).toHaveCount(0);
  });
}
