import { test, expect } from "@playwright/test";
import { staffApi } from "./staff-api-fixture";
import { freshFurniture, carcass } from "../../src/core/furniture";
import { randomUUID } from "node:crypto";
test("client presentation exposes a frozen model and saves a note without entering staff panels", async ({
  page,
}) => {
  const model = freshFurniture();
  model.plates = carcass(model, randomUUID);
  const token = "b".repeat(64),
    comments: { id: string; text: string }[] = [];
  await staffApi(page);
  await page.route("**/api/v2/presentation/**", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      comments.push({ id: body.id, text: body.text });
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({
      json: {
        model,
        libraryVersion: 3,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        comments,
      },
    });
  });
  await page.goto(`/#/prezentacja/${token}`);
  await expect(
    page.getByRole("heading", { name: "Prezentacja mebla", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Nowy mebel · wersja 3/ }),
  ).toBeVisible();
  await page
    .getByLabel("Uwaga dla projektanta", { exact: true })
    .fill("Proszę zmienić układ półek");
  await page.getByRole("button", { name: "Zapisz uwagę", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Uwaga zapisana" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zapisz w bibliotece", exact: true }),
  ).toHaveCount(0);
  expect(comments).toHaveLength(1);
});

test("owner creates and revokes a link only after saving the current version", async ({
  page,
}) => {
  await staffApi(page, "owner");
  const presentations: {
    id: string;
    libraryVersion: number;
    expiresAt: string;
    revoked: boolean;
    comments: unknown[];
  }[] = [];
  await page.route("**/api/v2/furniture/*/presentations*", async (route) => {
    if (route.request().method() === "POST") {
      const item = {
        id: randomUUID(),
        libraryVersion: 1,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        revoked: false,
        comments: [],
      };
      presentations.push(item);
      return route.fulfill({ json: { ...item, token: "c".repeat(64) } });
    }
    return route.fulfill({ json: presentations });
  });
  await page.route("**/api/v2/presentations/*", async (route) => {
    presentations[0].revoked = true;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/#/panel/meble");
  await expect(
    page.getByRole("button", {
      name: "Utwórz link do zapisanej wersji",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Zapisz w bibliotece", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Utwórz link do zapisanej wersji",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Odnośnik do prezentacji", { exact: true }),
  ).toHaveValue(/#\/prezentacja\/c{64}$/);
  await page
    .getByRole("button", { name: "Wycofaj tę prezentację", exact: true })
    .click();
  await expect(
    page.getByLabel("Odnośnik do prezentacji", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/Wersja 1 · Wycofana/)).toBeVisible();
});
