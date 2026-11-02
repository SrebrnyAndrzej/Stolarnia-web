import { createHash, randomBytes, randomUUID } from "node:crypto";
import { AccessError, type Principal } from "./access.js";
import type { Magazyn } from "../store/store.js";
import type { FurnitureModel } from "../core/furniture.js";
export interface FurniturePresentation {
  id: string;
  libraryId: string;
  libraryVersion: number;
  tokenHash: string;
  expiresAt: string;
  revoked: boolean;
  createdBy: string;
  createdAt: string;
  model: FurnitureModel;
  comments: Array<{
    id: string;
    text: string;
    partId?: string;
    createdAt: string;
  }>;
}
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const owner = (p: Principal) => {
  if (p.role !== "owner" || !p.active)
    throw new AccessError(
      403,
      "Prezentacje dla klienta tworzy i wycofuje właściciel.",
    );
};
export function createFurniturePresentation(
  store: Magazyn,
  p: Principal,
  libraryId: string,
  version: number,
) {
  owner(p);
  const entry = store
    .odczytaj()
    .furnitureLibrary?.find((e) => e.id === libraryId);
  if (!entry) throw new AccessError(404, "Nie znaleziono zapisanego modelu.");
  if (entry.version !== version)
    throw new AccessError(
      409,
      "Wersja modelu zmieniła się. Otwórz aktualny model przed udostępnieniem.",
    );
  const token = randomBytes(32).toString("hex"),
    m = entry.model;
  const model: FurnitureModel = {
    name: m.name,
    width: m.width,
    height: m.height,
    depth: m.depth,
    thickness: m.thickness,
    shape: m.shape,
    lowHeight: m.lowHeight,
    steps: m.steps,
    reverse: m.reverse,
    ...(m.compartments
      ? { compartments: structuredClone(m.compartments) }
      : {}),
    plates: m.plates.map((q) => ({
      id: q.id,
      name: q.name,
      kind: q.kind,
      x: q.x,
      y: q.y,
      z: q.z,
      width: q.width,
      height: q.height,
      depth: q.depth,
      ...(q.layoutSlot ? { layoutSlot: q.layoutSlot } : {}),
      ...(q.specification
        ? {
            specification: {
              material: q.specification.material,
              decor: q.specification.decor,
              face: q.specification.face,
              grain: q.specification.grain,
              edges: Object.fromEntries(
                Object.entries(q.specification.edges).map(([k, v]) => [
                  k,
                  {
                    state: v.state,
                    material: v.material,
                    thickness: v.thickness,
                  },
                ]),
              ) as NonNullable<typeof q.specification>["edges"],
            },
          }
        : {}),
    })),
  };
  const item: FurniturePresentation = {
    id: randomUUID(),
    libraryId,
    libraryVersion: version,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: p.user_id,
    revoked: false,
    model,
    comments: [],
  };
  store.zmien((db) => {
    const list = (db.furniturePresentations ??= []);
    if (list.length >= 100)
      throw new AccessError(
        400,
        "Osiągnięto limit 100 prezentacji. Skontaktuj się z administratorem w sprawie archiwizacji.",
      );
    list.push(item);
  });
  return {
    id: item.id,
    token,
    expiresAt: item.expiresAt,
    libraryVersion: version,
  };
}
function find(store: Magazyn, token: string) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new AccessError(404, "Prezentacja jest niedostępna lub wygasła.");
  const item = store
    .odczytaj()
    .furniturePresentations?.find((p) => p.tokenHash === hash(token));
  if (!item || item.revoked || Date.parse(item.expiresAt) <= Date.now())
    throw new AccessError(404, "Prezentacja jest niedostępna lub wygasła.");
  return item;
}
export function readFurniturePresentation(store: Magazyn, token: string) {
  const p = find(store, token);
  return structuredClone({
    model: p.model,
    libraryVersion: p.libraryVersion,
    createdAt: p.createdAt,
    expiresAt: p.expiresAt,
    comments: p.comments,
  });
}
export function commentFurniturePresentation(
  store: Magazyn,
  token: string,
  input: unknown,
) {
  const data = input as { id?: string; text?: string; partId?: string };
  if (
    !data ||
    typeof data.text !== "string" ||
    !data.text.trim() ||
    data.text.length > 1000 ||
    !data.id ||
    !/^[0-9a-f-]{36}$/.test(data.id)
  )
    throw new AccessError(400, "Wpisz uwagę do 1000 znaków.");
  const p = find(store, token);
  if (data.partId && !p.model.plates.some((q) => q.id === data.partId))
    throw new AccessError(400, "Wybierz część z tej prezentacji.");
  if (p.comments.some((c) => c.id === data.id)) return { ok: true };
  if (p.comments.length >= 20)
    throw new AccessError(
      400,
      "Ta prezentacja ma już 20 uwag. Przekaż kolejne bezpośrednio projektantowi.",
    );
  store.zmien((db) =>
    db
      .furniturePresentations!.find((q) => q.id === p.id)!
      .comments.push({
        id: data.id!,
        text: data.text!.trim(),
        ...(data.partId ? { partId: data.partId } : {}),
        createdAt: new Date().toISOString(),
      }),
  );
  return { ok: true };
}
export function listFurniturePresentations(
  store: Magazyn,
  p: Principal,
  libraryId: string,
) {
  owner(p);
  return (store.odczytaj().furniturePresentations ?? [])
    .filter((q) => q.libraryId === libraryId)
    .map(({ id, libraryVersion, expiresAt, revoked, createdAt, comments }) => ({
      id,
      libraryVersion,
      expiresAt,
      revoked,
      createdAt,
      comments: structuredClone(comments),
    }));
}
export function revokeFurniturePresentation(
  store: Magazyn,
  p: Principal,
  id: string,
) {
  owner(p);
  store.zmien((db) => {
    const q = db.furniturePresentations?.find((q) => q.id === id);
    if (!q) throw new AccessError(404, "Nie znaleziono prezentacji.");
    q.revoked = true;
  });
  return { ok: true };
}
