import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAccess, mayReadProject, type Membership } from "./access.js";
import { technicalView } from "./technical.js";
import { Magazyn } from "../store/store.js";
import { Stolarnia } from "../service.js";

test("role and active membership control project scope", () => {
  const employee: Membership = {
    user_id: "employee",
    role: "employee",
    active: true,
    project_ids: ["a"],
    display_name: "",
  };
  assert.equal(mayReadProject(employee, "a"), true);
  assert.equal(mayReadProject(employee, "b"), false);
  assert.equal(mayReadProject({ ...employee, active: false }, "a"), false);
  assert.equal(mayReadProject({ ...employee, role: "owner" }, "b"), true);
  assert.equal(mayReadProject({ ...employee, role: "client" }, "b"), false);
});
test("missing auth configuration fails closed", async () => {
  const access = createAccess({});
  assert.equal(access.configured, false);
  await assert.rejects(
    access.identify({ get: () => undefined } as never),
    /Zaloguj/,
  );
  await assert.rejects(
    access.identify({
      get: (name: string) =>
        name === "authorization" ? "Bearer invalid" : undefined,
    } as never),
    /nie zostało jeszcze/,
  );
});
test("technical project output excludes financial, personal and unknown fields recursively", () => {
  const directory = mkdtempSync(join(tmpdir(), "pan-stolarz-access-"));
  const original = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY,
    old: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const store = new Magazyn(directory);
    const service = new Stolarnia(store);
    const p = service.utworzProjekt({
      nazwa: "Techniczny",
      klient: { nazwa: "PRIVATE CUSTOMER", email: "private@example.com" },
    });
    store.zmien((b) => {
      const saved = b.projekty.find((x) => x.id === p.id)!;
      saved.cenaUzgodnionaBrutto = 99999;
      saved.notatki = "PRIVATE FINANCIAL NOTE";
      saved.notatkiRobocze = [
        { id: "note", tekst: "PRIVATE NOTE", utworzono: "", zalatwiona: false },
      ];
      Object.assign(saved, { futureFinancialField: 12345, secret: "SECRET" });
    });
    const view = technicalView(service, p.id);
    const serialized = JSON.stringify(view);
    for (const forbidden of [
      "cenaUzgodniona",
      "warianty",
      "PRIVATE",
      "private@example",
      "99999",
      "12345",
      "SECRET",
      "notatki",
      "marza",
      "narzut",
      "cenaNetto",
      "umovy",
      "wydania",
    ])
      assert.equal(serialized.includes(forbidden), false, forbidden);
    assert.equal(view.projekt.id, p.id);
    assert.ok(Array.isArray(view.zbudowane));
  } finally {
    rmSync(directory, { recursive: true, force: true });
    for (const [key, value] of [
      ["SUPABASE_URL", original.url],
      ["SUPABASE_SECRET_KEY", original.key],
      ["SUPABASE_SERVICE_ROLE_KEY", original.old],
    ]) {
      if (value === undefined) delete process.env[key!];
      else process.env[key!] = value;
    }
  }
});
