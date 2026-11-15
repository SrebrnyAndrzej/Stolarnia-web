import { test, expect } from "@playwright/test";
test("home and kitchen draft work when HTTP context lacks crypto.randomUUID", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Katalog dekorów", exact: true }),
  ).toBeVisible();
  await page.goto("/#/kreator-kuchni");
  await page.getByRole("button", { name: "Przejdź do szafek" }).click();
  await page
    .getByRole("button", {
      name: "Dodaj: Szafka dolna z półkami 600",
      exact: false,
    })
    .click();
  expect(errors).toEqual([]);
});
