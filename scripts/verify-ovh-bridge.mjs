// Stateless probes only: no credentials, account creation, project or library writes.
import assert from "node:assert/strict";
// Optional read-only synthetic project: verifies Authorization survives Apache/PHP, not just cookies.
if (process.env.PAN_STOLARZ_QA_PROJECT_LINK) {
  const link = new URL(process.env.PAN_STOLARZ_QA_PROJECT_LINK);
  assert.equal(link.origin, "https://panstolarz.pro");
  const params = new URLSearchParams(link.hash.split("?")[1] ?? "");
  const id = params.get("projekt"),
    token = params.get("klucz");
  assert.match(id ?? "", /^[a-f0-9-]{36}$/);
  assert.match(token ?? "", /^[a-f0-9]{64}$/);
  const responses = await Promise.all(
    ["https://backend.panstolarz.pro", "https://panstolarz.pro"].map(
      async (base) => {
        const r = await fetch(`${base}/api/public/kitchen-projects/${id}`, {
          headers: { Authorization: `Kitchen ${token}` },
          signal: AbortSignal.timeout(20000),
        });
        assert.equal(
          r.status,
          200,
          "Private project Authorization was not forwarded",
        );
        return r.json();
      },
    ),
  );
  assert.deepEqual(responses[0], responses[1]);
  console.log(
    "GET private kitchen project: direct = bridge = 200 (Authorization preserved)",
  );
}
const checks = [
  { path: "/api/v2/config", status: 200 },
  { path: "/api/v2/session", status: 401 },
  { path: "/api/v2/furniture", status: 401 },
  {
    path: "/api/v2/furniture",
    method: "PUT",
    body: "{}",
    origin: "https://panstolarz.pro",
    status: 401,
  },
  {
    path: "/api/v2/login",
    method: "POST",
    body: "{}",
    origin: "https://panstolarz.pro",
    status: 400,
  },
  {
    path: "/api/v2/login",
    method: "POST",
    body: "{}",
    origin: "https://example.invalid",
    status: 403,
  },
  {
    path: "/api/v2/logout",
    method: "POST",
    body: "{}",
    origin: "https://panstolarz.pro",
    status: 200,
    cookie: true,
  },
  { path: "/api/v2/projects/not-a-project/documents.pdf", status: 401 },
];
for (const check of checks) {
  const results = await Promise.all(
    ["https://backend.panstolarz.pro", "https://panstolarz.pro"].map(
      async (base) => {
        const response = await fetch(base + check.path, {
          method: check.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            ...(check.origin ? { Origin: check.origin } : {}),
          },
          body: check.body,
          redirect: "manual",
          signal: AbortSignal.timeout(20000),
        });
        const body = await response.json();
        assert.equal(response.status, check.status, `${base} ${check.path}`);
        assert.match(
          response.headers.get("content-type") ?? "",
          /application\/json/,
        );
        assert.match(response.headers.get("cache-control") ?? "", /no-store/);
        if (check.path.endsWith("/config")) assert.equal(body.authReady, true);
        if (check.cookie) {
          const cookie = response.headers.get("set-cookie") ?? "";
          assert.match(cookie, /pan_stolarz_session=;/);
          assert.match(cookie, /HttpOnly/i);
          assert.match(cookie, /Secure/i);
          assert.match(cookie, /SameSite=Strict/i);
          assert.ok(!/Domain=/i.test(cookie));
        }
        return { base, status: response.status, body };
      },
    ),
  );
  assert.deepEqual(
    results[0].body,
    results[1].body,
    `Proxy changed response: ${check.path}`,
  );
  console.log(
    `${check.method ?? "GET"} ${check.path}: direct = bridge = ${check.status}${check.cookie ? " (host-only, Secure, HttpOnly, SameSite=Strict)" : ""}`,
  );
}
