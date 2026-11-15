import { z } from "zod";
import type { Principal } from "./access.js";
import { AccessError } from "./access.js";
import { requireOwner } from "./members.js";
import type { Magazyn } from "../store/store.js";
import {
  PURCHASE_UNITS,
  mussiOrderCsv,
  type PurchaseOrder,
} from "../core/purchasing.js";
const purchaseInput = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().min(0),
    title: z.string().trim().min(2).max(120),
    projectId: z.string().min(1).max(100).nullable(),
    projectRevision: z.number().int().min(0).nullable(),
    lines: z
      .array(
        z
          .object({
            id: z.string().uuid(),
            label: z.string().trim().min(1).max(120),
            sku: z.string().trim().max(100),
            quantity: z.number().finite().positive().max(1_000_000),
            unit: z.enum(PURCHASE_UNITS),
            notes: z.string().trim().max(300),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();
export function savePurchaseOrder(
  store: Magazyn,
  person: Principal,
  body: unknown,
): PurchaseOrder {
  requireOwner(person);
  const parsed = purchaseInput.safeParse(body);
  if (!parsed.success)
    throw new AccessError(
      400,
      "Uzupełnij tytuł i pozycje zamówienia: nazwa, ilość i jednostka. Maksymalnie 500 pozycji.",
    );
  const data = parsed.data;
  if (new Set(data.lines.map((l) => l.id)).size !== data.lines.length)
    throw new AccessError(400, "Pozycje muszą mieć różne identyfikatory.");
  return store.zmien((db) => {
    const list = (db.purchaseOrders ??= []);
    const old = list.find((o) => o.id === data.id);
    if ((old?.version ?? 0) !== data.version)
      throw new AccessError(
        409,
        "Zamówienie zmieniło się w innym oknie. Szkic pozostał w formularzu. Otwórz bieżącą wersję lub utwórz kopię.",
      );
    if (data.projectId) {
      const project = db.projekty.find((p) => p.id === data.projectId);
      if (!project)
        throw new AccessError(404, "Projekt zamówienia nie istnieje.");
      if (project.rewizja !== data.projectRevision)
        throw new AccessError(
          409,
          "Rewizja projektu zmieniła się. Sprawdź ilości i wybierz bieżący projekt ponownie przed zapisem.",
        );
    } else if (data.projectRevision !== null)
      throw new AccessError(400, "Rewizja wymaga wybranego projektu.");
    const saved: PurchaseOrder = {
      ...data,
      status: "draft",
      version: data.version + 1,
      createdBy: old?.createdBy ?? person.user_id,
      updatedBy: person.user_id,
      updatedAt: new Date().toISOString(),
    };
    if (old) list[list.indexOf(old)] = saved;
    else list.push(saved);
    return saved;
  });
}
export function exportPurchaseOrder(
  store: Magazyn,
  person: Principal,
  id: string,
  version: number,
) {
  requireOwner(person);
  const db = store.odczytaj();
  const order = db.purchaseOrders?.find((o) => o.id === id);
  if (!order) throw new AccessError(404, "Nie znaleziono zamówienia.");
  if (order.version !== version)
    throw new AccessError(
      409,
      "Wersja zamówienia zmieniła się. Otwórz je ponownie przed eksportem.",
    );
  if (
    order.projectId &&
    db.projekty.find((p) => p.id === order.projectId)?.rewizja !==
      order.projectRevision
  )
    throw new AccessError(
      409,
      "Projekt zmienił się od przygotowania zamówienia. Sprawdź ilości i zapisz zamówienie dla bieżącej rewizji.",
    );
  let csv: string;
  try {
    csv = mussiOrderCsv(order);
  } catch (e) {
    throw new AccessError(400, (e as Error).message);
  }
  return {
    filename: `mussi-${order.id}-v${order.version}.csv`,
    csv,
    orderVersion: order.version,
    sent: false,
  };
}
