import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Magazyn } from "../store/store.js";
import {
  KitchenProjectRecords,
  registerKitchenProjects,
  KITCHEN_FILE_CHUNK,
} from "./kitchen-projects.js";
import { AccessError } from "./access.js";
import {
  kitchenInputSchema,
  suggestKitchen,
} from "../core/kitchen-configuration.js";
const headers = {
  "Content-Type": "application/json",
  Origin: "https://example.test",
};
test("online flow persists independent projects, limits capabilities, preserves originals and freezes the handoff", async () => {
  const root = await mkdtemp(join(tmpdir(), "kitchen-online-")),
    store = new Magazyn(root, undefined),
    objects = new Map<string, Buffer>();
  const records = new KitchenProjectRecords(join(root, "online"), undefined),
    app = express();
  app.use(express.json({ limit: "4mb" }));
  registerKitchenProjects(app, {
    store,
    admin: null,
    records,
    checkOrigin: (r) => {
      if (r.method !== "GET" && r.get("origin") !== headers.Origin)
        throw new AccessError(403, "Origin");
    },
    identify: async (r) => {
      if (r.get("cookie") === "owner=1") return { role: "owner" };
      throw new AccessError(401, "Zaloguj się");
    },
    objects: {
      put: async (k, b) => {
        if (objects.has(k) && !objects.get(k)!.equals(b))
          throw new AccessError(409, "immutable");
        objects.set(k, b);
      },
      get: async (k) => {
        if (!objects.has(k)) throw new AccessError(404, "missing original");
        return objects.get(k)!;
      },
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.on("listening", r));
  const port = (server.address() as { port: number }).port;
  const call = async (
    method: string,
    path: string,
    body?: unknown,
    token?: string,
    extra: Record<string, string> = {},
  ) => {
    const r = await fetch(
      `http://127.0.0.1:${port}/api/public/kitchen-projects${path}`,
      {
        method,
        headers: {
          ...headers,
          ...(token ? { Authorization: `Kitchen ${token}` } : {}),
          ...extra,
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    const raw = await r.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
    return { status: r.status, data, raw, headers: r.headers };
  };
  try {
    const d = {
      ...kitchenInputSchema.parse({
        layout: "straight",
        width: 4200,
        depth: 3000,
        height: 2600,
        items: [],
      }),
      version: 1 as const,
    };
    d.items = suggestKitchen(d, randomUUID);
    const bytes = Buffer.alloc(KITCHEN_FILE_CHUNK + 16, 71),
      file = {
        id: randomUUID(),
        name: "rzut.pdf",
        format: "pdf",
        size: bytes.length,
        room: "Kuchnia",
        role: "plan",
      };
    const draft = { ...d, architectFiles: [file] };
    const created = await call("POST", "", { draft, clientId: randomUUID() });
    assert.equal(created.status, 201, created.raw);
    const { id, editToken, readToken, revision } = created.data;
    assert.equal(revision, 1);
    assert.equal(editToken.length, 64);
    assert.notEqual(editToken, readToken);
    const read = await call("GET", `/${id}`, undefined, readToken);
    assert.equal(read.status, 200);
    assert.equal(read.data.canEdit, false);
    assert.ok(!read.raw.includes("editHash"));
    assert.ok(!read.raw.includes(editToken));
    assert.equal(
      (await call("GET", `/${id}`, undefined, "a".repeat(64))).status,
      404,
    );
    assert.equal(
      (await call("PUT", `/${id}`, { draft, revision }, readToken)).status,
      404,
    );
    assert.equal(
      (await call("POST", `/${id}/handoff`, { revision }, editToken)).status,
      404,
      "missing original must block handoff",
    );
    for (let part = 0; part < 2; part++)
      assert.equal(
        (
          await call(
            "PUT",
            `/${id}/files/${file.id}`,
            {
              part,
              base64: bytes
                .subarray(
                  part * KITCHEN_FILE_CHUNK,
                  (part + 1) * KITCHEN_FILE_CHUNK,
                )
                .toString("base64"),
            },
            editToken,
          )
        ).status,
        200,
      );
    assert.equal(
      (
        await call(
          "PUT",
          `/${id}/files/${randomUUID()}`,
          { part: 0, base64: "AA==" },
          editToken,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await call(
          "PUT",
          `/${id}/files/${file.id}`,
          { part: 0, base64: "AA==" },
          editToken,
        )
      ).status,
      400,
    );
    const frozen = await call(
      "POST",
      `/${id}/handoff`,
      { revision },
      editToken,
    );
    assert.equal(frozen.status, 201, frozen.raw);
    assert.equal(frozen.data.frozen, true);
    const retry = await call("POST", `/${id}/handoff`, { revision }, editToken);
    assert.equal(retry.data.id, frozen.data.id);
    assert.equal(retry.data.readToken, frozen.data.readToken);
    assert.equal(
      (
        await call(
          "POST",
          `/${frozen.data.id}/workshop-packet`,
          {},
          frozen.data.readToken,
        )
      ).status,
      401,
    );
    const packet = await call(
      "POST",
      `/${frozen.data.id}/workshop-packet`,
      {},
      frozen.data.readToken,
      { Cookie: "owner=1" },
    );
    assert.equal(packet.status, 200, packet.raw);
    assert.ok(packet.data.partsByMaterial.length >= 3);
    assert.match(packet.data.csv, /po oklejeniu/);
    assert.ok(packet.data.hardware.length);
    assert.ok(!packet.raw.includes("cenaNetto"));
    const updated = await call(
      "PUT",
      `/${id}`,
      { draft: { ...draft, finish: "cashmere" }, revision },
      editToken,
    );
    assert.equal(updated.status, 200);
    assert.equal(updated.data.revision, 2);
    assert.equal(
      (await call("PUT", `/${id}`, { draft, revision }, editToken)).status,
      409,
    );
    const snapshot = await call(
      "GET",
      `/${frozen.data.id}`,
      undefined,
      frozen.data.readToken,
    );
    assert.equal(snapshot.data.draft.finish, draft.finish);
    assert.equal(snapshot.data.sourceRevision, 1);
    assert.equal(snapshot.headers.get("cache-control"), "private, no-store");
    const f = await fetch(
      `http://127.0.0.1:${port}/api/public/kitchen-projects/${frozen.data.id}/files/${file.id}?part=1`,
      { headers: { Authorization: `Kitchen ${frozen.data.readToken}` } },
    );
    assert.equal(f.status, 200);
    assert.deepEqual(
      Buffer.from(await f.arrayBuffer()),
      bytes.subarray(KITCHEN_FILE_CHUNK),
    );
    assert.equal(
      (
        await call("POST", "", { draft }, undefined, {
          Origin: "https://evil.test",
        })
      ).status,
      403,
    );
    assert.deepEqual(
      store.odczytaj().projekty,
      [],
      "public drafts never enter or overwrite the workshop document",
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    await rm(root, { recursive: true, force: true });
  }
});
test("local revision compare-and-swap rejects one of two simultaneous updates", async () => {
  const root = await mkdtemp(join(tmpdir(), "kitchen-cas-"));
  try {
    const records = new KitchenProjectRecords(root, undefined),
      id = `kitchen:${randomUUID()}`;
    const a = await records.put(id, {} as never);
    const results = await Promise.allSettled([
      records.put(id, {} as never, a.wersja),
      records.put(id, {} as never, a.wersja),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal((await records.get(id))?.wersja, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
