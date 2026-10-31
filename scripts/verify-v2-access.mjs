// Isolated integration checks. Supabase responses are mocked; no real credentials
// or production database are used. Exercises the actual Express middleware/routes.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
process.env.SUPABASE_URL = "https://auth-test.invalid";
process.env.SUPABASE_PUBLISHABLE_KEY = "test-public-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";
const { Magazyn } = await import("../src/store/store.ts");
const { Stolarnia } = await import("../src/service.ts");
const directory = mkdtempSync(join(tmpdir(), "pan-stolarz-integration-"));
const envUrl = process.env.SUPABASE_URL;
delete process.env.SUPABASE_URL;
const local = new Magazyn(directory);
process.env.SUPABASE_URL = envUrl;
const service = new Stolarnia(local);
const project = service.utworzProjekt({
  nazwa: "Allowed technical project",
  klient: { nazwa: "PRIVATE NAME", email: "private@example.com" },
});
const other = service.utworzProjekt({ nazwa: "Other private project" });
const database = local.odczytaj();
database.projekty[0].cenaUzgodnionaBrutto = 99999;
database.projekty[0].notatki = "FINANCIAL SECRET";
const ids = {
  owner: "00000000-0000-4000-8000-000000000001",
  employee: "00000000-0000-4000-8000-000000000002",
  client: "00000000-0000-4000-8000-000000000003",
};
let active = true;
let role = "employee";
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  if (!url.startsWith("https://auth-test.invalid"))
    return originalFetch(input, init);
  const headers = new Headers(init.headers);
  if (url.includes("/auth/v1/user")) {
    const token = headers.get("authorization");
    if (!token?.includes("valid"))
      return Response.json({ message: "invalid" }, { status: 401 });
    return Response.json({
      id: ids[role],
      email: "test@example.com",
      aud: "authenticated",
      role: "authenticated",
    });
  }
  if (url.includes("pan_stolarz_members"))
    return Response.json([
      {
        user_id: ids[role],
        role,
        active,
        display_name: "Test",
        project_ids: [project.id],
      },
    ]);
  if (url.includes("stolarnia_baza"))
    return Response.json([{ dane: database, wersja: 1 }]);
  throw new Error(`Unexpected test request: ${new URL(url).pathname}`);
};
const { app } = await import("../src/server/app.ts");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let checks = 0;
const get = async (path, options = {}) => {
  const response = await originalFetch(base + path, {
    headers: { authorization: "Bearer valid" },
    ...options,
  });
  return { response, text: await response.text() };
};
try {
  const anonymous = await originalFetch(base + "/api/projekty");
  assert.equal(anonymous.status, 401);
  checks++;
  for (const path of [
    "/api/projekty",
    `/api/projekty/${project.id}/analiza`,
    `/api/projekty/${project.id}/umowy`,
    `/api/projekty/${project.id}/dokumentacja.pdf`,
    `/api/projekty/${project.id}/formatki.csv`,
    "/api/cennik/materialow",
    "/api/materialy",
    "/api/ustawienia",
    "/api/v2/members",
    "/api/v2/requests",
  ]) {
    assert.equal((await get(path)).response.status, 403, path);
    checks++;
  }
  assert.equal(
    (
      await get("/mcp", {
        method: "POST",
        body: "{}",
        headers: {
          authorization: "Bearer valid",
          "content-type": "application/json",
        },
      })
    ).response.status,
    403,
  );
  checks++;
  const list = await get("/api/v2/projects");
  assert.equal(list.response.status, 200);
  assert.equal(JSON.parse(list.text).length, 1);
  checks++;
  const technical = await get(`/api/v2/projects/${project.id}`);
  assert.equal(technical.response.status, 200);
  for (const forbidden of [
    "FINANCIAL SECRET",
    "PRIVATE NAME",
    "private@example",
    "cenaUzgodniona",
    "99999",
    "warianty",
    "marza",
    "narzut",
    "cenaNetto",
  ])
    assert.equal(technical.text.includes(forbidden), false, forbidden);
  checks++;
  assert.equal(
    (await get(`/api/v2/projects/${other.id}`)).response.status,
    403,
  );
  checks++;
  assert.equal((await get("/api/systemy-szuflad")).response.status, 200);
  checks++;
  assert.equal(
    (await get("/api/przelicznik-szuflad?LW=564&NL=500")).response.status,
    200,
  );
  checks++;
  active = false;
  assert.equal(
    (await get(`/api/v2/projects/${project.id}`)).response.status,
    403,
  );
  checks++;
  active = true;
  role = "client";
  assert.equal((await get("/api/systemy-szuflad")).response.status, 403);
  checks++;
  assert.equal(
    (await get(`/api/v2/projects/${project.id}`)).response.status,
    200,
  );
  checks++;
  role = "owner";
  assert.equal(
    (await get(`/api/projekty/${project.id}/analiza`)).response.status,
    200,
  );
  checks++;
  const csrf = await originalFetch(base + "/api/v2/logout", {
    method: "POST",
    headers: {
      cookie: "pan_stolarz_session=valid",
      origin: "https://evil.invalid",
    },
  });
  assert.equal(csrf.status, 403);
  checks++;
  console.log(
    JSON.stringify({
      passed: checks,
      database: "isolated fixture",
      productionAccessed: false,
    }),
  );
} finally {
  globalThis.fetch = originalFetch;
  await new Promise((resolve) => server.close(resolve));
  rmSync(directory, { recursive: true, force: true });
}
