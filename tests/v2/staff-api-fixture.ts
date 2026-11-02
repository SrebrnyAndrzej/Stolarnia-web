import type { Page } from "@playwright/test";
import type { FurnitureEntry } from "../../src/core/furniture";
export async function staffApi(page: Page, role = "employee") {
  let library: FurnitureEntry[] = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session"))
      return route.fulfill({
        json: {
          user_id: "staff-test",
          role,
          active: true,
          display_name: "Test",
          email: "test@example.com",
          project_ids: [],
        },
      });
    if (path.endsWith("/furniture")) {
      if (route.request().method() === "PUT") {
        const body = route.request().postDataJSON();
        const entry = {
          ...body,
          version: body.version + 1,
          createdBy: "staff-test",
          updatedBy: "staff-test",
          updatedAt: new Date().toISOString(),
        };
        library = [entry, ...library.filter((x) => x.id !== entry.id)];
        return route.fulfill({ json: entry });
      }
      return route.fulfill({ json: library });
    }
    return route.fulfill({ json: [] });
  });
}
