import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  mussiOrderCsv,
  purchaseIssues,
  MUSSI_CONNECTION,
} from "./core/purchasing.js";
import { savePurchaseOrder, exportPurchaseOrder } from "./server/purchasing.js";
import type { Magazyn, BazaDanych } from "./store/store.js";
import type { Principal } from "./server/access.js";
const owner = {
  user_id: randomUUID(),
  role: "owner",
  active: true,
  email: "",
  display_name: "Test",
  project_ids: [],
} as Principal;
const line = () => ({
  id: randomUUID(),
  label: "Zawias",
  sku: "BLU-CLIP-110",
  quantity: 4,
  unit: "szt" as const,
  notes: 'Front "lewy"; próba',
});
const draft = () => ({
  id: randomUUID(),
  version: 0,
  title: "Kuchnia testowa",
  projectId: "p1",
  projectRevision: 4,
  lines: [line()],
});
function fixture() {
  const db = {
    projekty: [{ id: "p1", rewizja: 4 }],
    purchaseOrders: [],
  } as unknown as BazaDanych;
  return {
    db,
    store: {
      zmien: (fn: (db: BazaDanych) => unknown) => fn(db),
      odczytaj: () => db,
    } as Magazyn,
  };
}
test("only active owners save orders and stale edits cannot overwrite a new version", () => {
  const { db, store } = fixture();
  const input = draft();
  const saved = savePurchaseOrder(store, owner, input);
  assert.equal(saved.status, "draft");
  assert.equal(saved.version, 1);
  assert.throws(
    () => savePurchaseOrder(store, { ...owner, role: "employee" }, input),
    /właściciel/,
  );
  assert.throws(
    () => savePurchaseOrder(store, { ...owner, active: false }, input),
    /właściciel/,
  );
  assert.throws(() => savePurchaseOrder(store, owner, input), /innym oknie/);
  assert.equal(db.purchaseOrders!.length, 1);
  assert.throws(
    () =>
      savePurchaseOrder(store, owner, { ...input, version: 1, status: "sent" }),
    /Uzupełnij/,
  );
});
test("saved project revision and saved order version are required for export", () => {
  const { db, store } = fixture();
  const input = draft();
  savePurchaseOrder(store, owner, input);
  const file = exportPurchaseOrder(store, owner, input.id, 1);
  assert.equal(file.sent, false);
  assert.match(file.filename, /v1.csv$/);
  assert.throws(() => exportPurchaseOrder(store, owner, input.id, 0), /Wersja/);
  db.projekty[0].rewizja = 5;
  assert.throws(
    () => exportPurchaseOrder(store, owner, input.id, 1),
    /Projekt zmienił/,
  );
  assert.throws(
    () => savePurchaseOrder(store, owner, { ...input, version: 1 }),
    /Rewizja projektu/,
  );
});
test("draft can preserve missing SKU but export requires explicit supplier index and correct unit", () => {
  const { store } = fixture();
  const input = draft();
  input.lines[0].sku = "";
  savePurchaseOrder(store, owner, input);
  assert.throws(
    () => exportPurchaseOrder(store, owner, input.id, 1),
    /indeksu Mussi/,
  );
  assert.ok(
    purchaseIssues({ lines: [{ ...line(), quantity: 1.5 }] }).some((s) =>
      s.includes("całkowitej"),
    ),
  );
  assert.ok(
    purchaseIssues({ lines: [{ ...line(), sku: "=IMPORTDATA(A1)" }] }).length,
  );
  assert.ok(
    purchaseIssues({ lines: [line(), { ...line(), unit: "mb" }] }).some((s) =>
      s.includes("różne jednostki"),
    ),
  );
});
test("CSV matches Mussi SKU basket contract with escaping and spreadsheet protection", () => {
  const csv = mussiOrderCsv({ lines: [line()] });
  assert.equal(
    csv,
    '\uFEFFindeks;ilosc;jednostka;uwagi\r\n"BLU-CLIP-110";4;"szt";"Front ""lewy""; próba"\r\n',
  );
  assert.match(
    mussiOrderCsv({ lines: [{ ...line(), notes: "=1+1" }] }),
    /"'=1\+1"/,
  );
  assert.equal(MUSSI_CONNECTION.automaticSendingAvailable, false);
  assert.equal(MUSSI_CONNECTION.code, "receiver_not_durable");
});
