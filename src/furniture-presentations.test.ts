import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  freshFurniture,
  carcass,
  type FurnitureEntry,
} from "./core/furniture.js";
import {
  createFurniturePresentation,
  readFurniturePresentation,
  commentFurniturePresentation,
  revokeFurniturePresentation,
  listFurniturePresentations,
} from "./server/furniture-presentations.js";
import { AccessError, type Principal } from "./server/access.js";
import type { Magazyn, BazaDanych } from "./store/store.js";
test("presentation is owner-created, frozen, token-scoped, expiring and revocable", () => {
  const m = freshFurniture();
  m.plates = carcass(m, randomUUID);
  m.appearance = { bodyColor: "#c5ab83", frontColor: "#435058" };
  (m.appearance as unknown as Record<string, unknown>).cost =
    "SECRET-APPEARANCE-COST";
  (m as unknown as Record<string, unknown>).cost = "SECRET-COST";
  const entry = { id: randomUUID(), version: 1, model: m } as FurnitureEntry;
  const db = { furnitureLibrary: [entry] } as BazaDanych;
  const store = {
    odczytaj: () => db,
    zmien: (fn: (db: BazaDanych) => unknown) => fn(db),
  } as Magazyn;
  const owner = {
    role: "owner",
    active: true,
    user_id: randomUUID(),
  } as Principal;
  assert.throws(
    () =>
      createFurniturePresentation(
        store,
        { ...owner, role: "employee" },
        entry.id,
        1,
      ),
    (e) => e instanceof AccessError && e.status === 403,
  );
  assert.throws(
    () => createFurniturePresentation(store, owner, entry.id, 2),
    (e) => e instanceof AccessError && e.status === 409,
  );
  const result = createFurniturePresentation(store, owner, entry.id, 1);
  assert.match(result.token, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(db.furniturePresentations).includes(result.token));
  m.width = 9999;
  m.appearance.frontColor = "#ffffff";
  const shown = readFurniturePresentation(store, result.token);
  assert.equal(shown.model.width, 1000);
  assert.deepEqual(shown.model.appearance, {
    bodyColor: "#c5ab83",
    frontColor: "#435058",
  });
  assert.ok(!JSON.stringify(shown).includes("SECRET-APPEARANCE-COST"));
  assert.ok(!JSON.stringify(shown).includes("SECRET-COST"));
  shown.model.width = 123;
  assert.equal(
    readFurniturePresentation(store, result.token).model.width,
    1000,
  );
  assert.throws(
    () => readFurniturePresentation(store, "a".repeat(64)),
    (e) => e instanceof AccessError && e.status === 404,
  );
  const note = {
    id: randomUUID(),
    text: "Zmień półkę",
    partId: m.plates[0].id,
  };
  commentFurniturePresentation(store, result.token, note);
  commentFurniturePresentation(store, result.token, note);
  assert.equal(
    readFurniturePresentation(store, result.token).comments.length,
    1,
  );
  assert.throws(
    () =>
      commentFurniturePresentation(store, result.token, {
        ...note,
        id: randomUUID(),
        partId: randomUUID(),
      }),
    (e) => e instanceof AccessError && e.status === 400,
  );
  assert.equal(
    listFurniturePresentations(store, owner, entry.id)[0].comments[0].text,
    note.text,
  );
  revokeFurniturePresentation(store, owner, result.id);
  assert.throws(
    () => readFurniturePresentation(store, result.token),
    (e) => e instanceof AccessError && e.status === 404,
  );
  const expiry = createFurniturePresentation(store, owner, entry.id, 1);
  db.furniturePresentations!.find((p) => p.id === expiry.id)!.expiresAt =
    "2000-01-01T00:00:00Z";
  assert.throws(
    () => readFurniturePresentation(store, expiry.token),
    (e) => e instanceof AccessError && e.status === 404,
  );
});
