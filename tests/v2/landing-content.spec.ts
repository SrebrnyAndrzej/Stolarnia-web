import { test, expect } from "@playwright/test";
import { AREAS, HOME_TITLE } from "../../web/src/v2/landing-content";

test("public copy has verified contact, six steps, structured data and no placeholders", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page).toHaveTitle(HOME_TITLE);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Zobaczysz mebel w 3D, zanim powstanie pierwsza formatka.",
  );
  await expect(
    page.getByRole("link", { name: "Umów pomiar", exact: true }),
  ).toHaveAttribute("href", "tel:+48572548957");
  await expect(page.locator(".ps-process-grid article")).toHaveCount(6);
  await expect(page.locator(".ps-offer-links > a")).toHaveCount(4);
  await expect(page.locator(".ps-gallery-grid figure")).toHaveCount(2);
  await expect(page.locator(".ps-benefits-grid article")).toHaveCount(3);
  await expect(page.locator(".ps-faq-list details")).toHaveCount(10);
  const sample = await page.request.get("/documents/demo-techniczne.pdf");
  expect(sample.status()).toBe(200);
  expect(sample.headers()["content-type"]).toContain("application/pdf");
  await expect(page.locator(".ps-service-area li")).toHaveText(AREAS);
  const schema = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  );
  expect(schema.telephone).toBe("+48572548957");
  expect(schema.address.addressLocality).toBe("Zielona Góra");
  expect(schema.address.streetAddress).toBeUndefined();
  expect(schema.email).toBeUndefined();
  expect(schema.sameAs).toBeUndefined();
  expect(await page.locator("main").innerText()).not.toMatch(
    /\[DO UZUPEŁNIENIA|\[DECYZJA|\[DO POTWIERDZENIA|\[DOMENA\]/,
  );
  await page
    .locator(".ps-home-intro")
    .getByRole("link", { name: "Zobacz wizualizacje", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Tak wyglądają nasze projekty, zanim trafią do produkcji",
      exact: true,
    }),
  ).toBeInViewport();
  await page
    .getByText("Czy mogę zmierzyć sam i przysłać wymiary?", { exact: true })
    .click();
  await expect(
    page.getByText(
      "Wyślij je. Wystarczą do wstępnej wyceny. Do produkcji mierzymy zawsze sami, bo ściany rzadko są proste, a kilka milimetrów decyduje o tym, czy szafka wejdzie i czy szczeliny frontów będą równe.",
      { exact: true },
    ),
  ).toBeVisible();
});
