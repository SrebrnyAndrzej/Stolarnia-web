import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Magazyn } from "./store/store.js";
import { Stolarnia } from "./service.js";
import type { Principal } from "./server/access.js";
import {
  projectFileObjects,
  uploadProjectFile,
  listProjectFiles,
  readProjectFile,
  validateCadUpload,
} from "./server/project-files.js";
import { cadPreview } from "./core/cad-preview.js";
const dxf =
  "0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n6\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nSCIANY\n10\n0\n20\n0\n11\n4\n21\n3\n0\nTEXT\n1\nPRIVATE TEXT\n10\n0\n20\n0\n40\n2\n0\nENDSEC\n0\nEOF\n";
const owner = {
  role: "owner",
  active: true,
  project_ids: [],
  user_id: randomUUID(),
  display_name: "Test",
  email: "test@example.test",
} as Principal;
test("cloud CAD objects require a private bucket and preserve bytes on retry", async () => {
  const objects = new Map<string, Buffer>();
  let exists = false,
    isPublic = false;
  const api = {
    storage: {
      async getBucket() {
        return exists
          ? { data: { public: isPublic }, error: null }
          : { data: null, error: { message: "missing" } };
      },
      async createBucket(
        _name: string,
        options: { public: boolean; fileSizeLimit: number },
      ) {
        assert.equal(options.public, false);
        assert.equal(options.fileSizeLimit, 3 * 1024 * 1024);
        exists = true;
        return { error: null };
      },
      from() {
        return {
          async upload(key: string, bytes: Buffer) {
            if (objects.has(key)) return { error: { message: "duplicate" } };
            objects.set(key, Buffer.from(bytes));
            return { error: null };
          },
          async download(key: string) {
            const bytes = objects.get(key);
            return bytes
              ? { data: new Blob([bytes]), error: null }
              : { data: null, error: { message: "missing" } };
          },
        };
      },
    },
  };
  const store = new Magazyn("unused", {
    url: "https://storage.invalid",
    klucz: "test",
  });
  const storage = projectFileObjects(store, api as never);
  await storage.put("key", Buffer.from("original"));
  await storage.put("key", Buffer.from("original"));
  assert.equal((await storage.get("key")).toString(), "original");
  await assert.rejects(
    storage.put("key", Buffer.from("changed")),
    /zapisać pliku/,
  );
  isPublic = true;
  await assert.rejects(storage.get("key"), /Prywatny magazyn/);
});
test("CAD originals survive reload, deduplicate retries and enforce roles, projects and integrity", async () => {
  const root = mkdtempSync(join(tmpdir(), "cad-files-"));
  try {
    const store = new Magazyn(root, undefined),
      service = new Stolarnia(store);
    const p = service.utworzProjekt({ nazwa: "CAD" });
    const objects = projectFileObjects(store, null);
    const input = {
      id: randomUUID(),
      name: "Rzut architekta.dxf",
      base64: Buffer.from(dxf).toString("base64"),
    };
    const file = await uploadProjectFile(store, objects, owner, p.id, input);
    assert.equal(file.name, input.name);
    assert.ok(!("objectKey" in file));
    assert.deepEqual(
      await uploadProjectFile(store, objects, owner, p.id, {
        ...input,
        id: randomUUID(),
      }),
      file,
    );
    assert.equal(
      listProjectFiles(new Magazyn(root, undefined), owner, p.id).length,
      1,
    );
    const data = await readProjectFile(store, objects, owner, p.id, file.id);
    assert.equal(Buffer.from(data.base64, "base64").toString(), dxf);
    const tech = {
      ...owner,
      role: "employee",
      access_profile: "produkcja",
      project_ids: [p.id],
    } as Principal;
    assert.throws(() => listProjectFiles(store, tech, p.id), /Oryginały/);
    await assert.rejects(
      readProjectFile(store, objects, owner, "other-project", file.id),
      /projektu/,
    );
    const sales = { ...tech, access_profile: "sprzedaz" } as Principal;
    assert.equal(listProjectFiles(store, sales, p.id).length, 1);
    const key = store.odczytaj().projectFiles![0].objectKey;
    await objects.put(key, Buffer.from("corrupted"));
    await assert.rejects(
      readProjectFile(store, objects, owner, p.id, file.id),
      /integralności/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("CAD upload checks size, extension, signature, path and strict base64", () => {
  const input = {
    id: randomUUID(),
    name: "plan.dxf",
    base64: Buffer.from(dxf).toString("base64"),
  };
  for (const bad of [
    { ...input, name: "plan.dwg" },
    { ...input, name: "../plan.dxf" },
    { ...input, name: "plan.svg" },
    { ...input, base64: input.base64 + "!" },
    { ...input, base64: Buffer.alloc(3 * 1024 * 1024 + 1).toString("base64") },
  ])
    assert.throws(() => validateCadUpload(bad));
  assert.equal(
    validateCadUpload({
      ...input,
      name: "plan.DWG",
      base64: Buffer.from("AC1032" + "\0".repeat(50)).toString("base64"),
    }).format,
    "dwg",
  );
});
test("DXF preview reads units and layers, reports omitted geometry and never guesses missing units", () => {
  const p = cadPreview(dxf);
  assert.equal(p.unit, "m");
  assert.equal(p.paths[0].layer, "SCIANY");
  assert.deepEqual(p.paths[0].points, [
    [0, -0],
    [4, -3],
  ]);
  assert.equal(p.skipped, 1);
  assert.equal(
    cadPreview(dxf.replace("$INSUNITS\n70\n6", "$INSUNITS\n70\n0")).unit,
    null,
  );
  assert.throws(() => cadPreview("AutoCAD Binary DXF"), /tekstowego DXF/);
});
