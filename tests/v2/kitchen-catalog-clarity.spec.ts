import { test, expect } from "@playwright/test";
import { newDraft, STORAGE_KEY } from "../../web/src/v2/planner/model";

for (const studio of [false, true]) {
  test(`catalog promises the fitted width before adding, ${studio ? "Studio" : "standard"}`, async ({
    page,
  }) => {
    const draft = {
      ...newDraft(),
      width: 2020,
      items: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          catalogId: "base-shelves-600",
          wall: "a",
        },
        {
          id: "00000000-0000-4000-8000-000000000002",
          catalogId: "base-shelves-600",
          wall: "a",
          gapBefore: 410,
        },
      ],
    };
    await page.addInitScript(
      ({ key, draft }) => localStorage.setItem(key, JSON.stringify(draft)),
      { key: STORAGE_KEY, draft },
    );
    await page.goto(`/#/kreator-kuchni${studio ? "?ui=studio" : ""}`);
    await page.getByRole("button", { name: "Przejdź do szafek" }).click();
    const baseSpace = page.locator('[data-kitchen-space="base"]');
    await expect(baseSpace).toContainText("41 cm wolne");
    await expect(baseSpace).toContainText("łącznie 82 cm w 2 miejscach");
    await page
      .getByLabel("Miejsce dodawania", { exact: true })
      .selectOption("a:base:600:1010");
    if (studio) {
      const search = page.getByRole("searchbox", {
        name: "Szukaj szafki lub wyposażenia",
      });
      await search.fill("nieistniejąca");
      await page
        .getByRole("button", { name: "Wyczyść wyszukiwanie szafek" })
        .click();
      await expect(search).toHaveValue("");
      await expect(search).toBeFocused();
      await search.fill("półki 41 cm");
    }
    const card = page.getByRole("button", {
      name: /Dodaj: Szafka dolna z półkami 410/,
    });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("41 ×");
    await expect(card).toContainText("Dopasowana do wybranego miejsca");
    await card.click();
    await expect(
      page.getByLabel("Szerokość szafki", { exact: true }),
    ).toHaveValue("41");
    await expect(
      page.getByLabel("Jednostka edycji", { exact: true }),
    ).toHaveValue("cm");
  });
}
