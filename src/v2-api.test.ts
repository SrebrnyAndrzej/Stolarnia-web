import { test } from "node:test";
import assert from "node:assert/strict";
import { request, requestPdf } from "../web/src/v2/api.js";

test("successful API response preserves the actual array rather than an empty fallback", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(JSON.stringify([{ id: "decor" }])),
  );
  assert.deepEqual(await request("/test"), [{ id: "decor" }]);
});
test("successful malformed JSON is an actionable error, never a successful empty object", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("broken JSON", { status: 200 }),
  );
  await assert.rejects(request("/test"), /nieprawidłową odpowiedź/);
});
test("abort during response parsing is preserved instead of becoming empty data", async (t) => {
  const controller = new AbortController();
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      ({
        ok: true,
        json: async () => {
          controller.abort();
          throw new DOMException("Body read aborted", "AbortError");
        },
      }) as unknown as Response,
  );
  await assert.rejects(request("/test", { signal: controller.signal }), {
    name: "AbortError",
  });
});
test("a valid body arriving after cancellation cannot replace the new screen's data", async (t) => {
  const controller = new AbortController();
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      ({
        ok: true,
        json: async () => {
          controller.abort();
          return [{ id: "stale" }];
        },
      }) as unknown as Response,
  );
  await assert.rejects(request("/test", { signal: controller.signal }), {
    name: "AbortError",
  });
});
test("non-JSON error response retains the HTTP failure instead of becoming a parsing success", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("upstream unavailable", { status: 503 }),
  );
  await assert.rejects(request("/test"), /503/);
});
test("PDF download also rejects a body completed after cancellation", async (t) => {
  const controller = new AbortController();
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      ({
        ok: true,
        headers: new Headers({ "Content-Type": "application/pdf" }),
        blob: async () => {
          controller.abort();
          return new Blob(["%PDF-test"]);
        },
      }) as unknown as Response,
  );
  await assert.rejects(requestPdf("/test", controller.signal), {
    name: "AbortError",
  });
});
