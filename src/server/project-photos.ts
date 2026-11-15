import { createHash } from "node:crypto";
import { z } from "zod";
import { CAD_FILE_LIMIT } from "../core/project-files.js";
import type { Magazyn } from "../store/store.js";
import { AccessError, mayReadProject, type Principal } from "./access.js";
import type { FileObjects } from "./project-files.js";
import { profilOsoby } from "./uprawnienia.js";

// Zdjęcia przy projekcie (ST-APP-005): pomiar, montaż i inne. Prywatny magazyn jak pliki architekta,
// ale dostęp ma każdy, komu projekt jest przydzielony (montaż dokumentuje odbiór, produkcja — braki).
// Przeglądarka zmniejsza zdjęcie i zapisuje je jako JPEG (także HEIC z iPhone'a), serwer sprawdza zawartość.

export const PHOTO_LIMIT = CAD_FILE_LIMIT; // ten sam limit co bucket (3 MiB)
export const PHOTOS_PER_PROJECT = 200;
export const KATEGORIE_ZDJEC = ["pomiar", "montaz", "problem", "inne"] as const;
export type KategoriaZdjecia = (typeof KATEGORIE_ZDJEC)[number];

export interface ProjectPhoto {
  id: string;
  projectId: string;
  name: string;
  mime: "image/jpeg" | "image/png" | "image/webp";
  size: number;
  sha256: string;
  kategoria: KategoriaZdjecia;
  opis: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
}
export interface StoredProjectPhoto extends ProjectPhoto {
  objectKey: string;
}

const schema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(180).refine((x) => !/[\u0000-\u001f\u007f/\\]/.test(x), "Niepoprawna nazwa pliku"),
    base64: z.string().min(4).max(Math.ceil(PHOTO_LIMIT / 3) * 4),
    kategoria: z.enum(KATEGORIE_ZDJEC),
    opis: z.string().trim().max(200).default(""),
  })
  .strict();

/** Typ obrazu z pierwszych bajtów; inne pliki są odrzucane bez względu na rozszerzenie. */
export function photoMime(b: Buffer): ProjectPhoto["mime"] | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

function requireAssigned(store: Magazyn, person: Principal, projectId: string) {
  if (!mayReadProject(person, projectId) || !store.odczytaj().projekty.some((x) => x.id === projectId))
    throw new AccessError(404, "Nie znaleziono udostępnionego projektu.");
}
const publicPhoto = ({ objectKey: _k, ...p }: StoredProjectPhoto): ProjectPhoto => p;

export function listProjectPhotos(store: Magazyn, person: Principal, projectId: string) {
  requireAssigned(store, person, projectId);
  return (store.odczytaj().projectPhotos ?? []).filter((x) => x.projectId === projectId).map(publicPhoto);
}

export async function uploadProjectPhoto(store: Magazyn, objects: FileObjects, person: Principal, projectId: string, input: unknown) {
  requireAssigned(store, person, projectId);
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new AccessError(400, "Wybierz zdjęcie (JPEG, PNG lub WebP do 3 MiB) i kategorię.");
  const { id, name, base64, kategoria, opis } = parsed.data;
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || bytes.length > PHOTO_LIMIT || bytes.toString("base64") !== base64) throw new AccessError(400, "Zdjęcie jest puste, za duże albo uszkodzone. Limit: 3 MiB.");
  const mime = photoMime(bytes);
  if (!mime) throw new AccessError(400, "To nie jest zdjęcie JPEG, PNG ani WebP.");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const photos = store.odczytaj().projectPhotos ?? [];
  const sameId = photos.find((x) => x.id === id);
  if (sameId && (sameId.projectId !== projectId || sameId.sha256 !== sha256)) throw new AccessError(409, "Identyfikator zdjęcia jest już używany. Wybierz zdjęcie ponownie.");
  const existing = photos.find((x) => x.projectId === projectId && x.sha256 === sha256);
  if (existing) return publicPhoto(existing);
  if (photos.filter((x) => x.projectId === projectId).length >= PHOTOS_PER_PROJECT) throw new AccessError(409, `Projekt ma już ${PHOTOS_PER_PROJECT} zdjęć.`);
  const objectKey = `${createHash("sha256").update(projectId).digest("hex")}/${id}`;
  await objects.put(objectKey, bytes);
  const photo: StoredProjectPhoto = {
    id,
    projectId,
    name,
    mime,
    size: bytes.length,
    sha256,
    kategoria,
    opis,
    addedBy: person.user_id,
    addedByName: person.display_name ?? "",
    objectKey,
    createdAt: new Date().toISOString(),
  };
  store.zmien((db) => {
    (db.projectPhotos ??= []).push(photo);
  });
  await store.utrwal();
  return publicPhoto(photo);
}

export async function readProjectPhoto(store: Magazyn, objects: FileObjects, person: Principal, projectId: string, id: string) {
  requireAssigned(store, person, projectId);
  const photo = (store.odczytaj().projectPhotos ?? []).find((x) => x.projectId === projectId && x.id === id);
  if (!photo) throw new AccessError(404, "Nie znaleziono zdjęcia w tym projekcie.");
  const bytes = await objects.get(photo.objectKey);
  if (bytes.length !== photo.size || createHash("sha256").update(bytes).digest("hex") !== photo.sha256) throw new AccessError(503, "Nie można potwierdzić integralności zdjęcia. Spróbuj ponownie później.");
  return { mime: photo.mime, bytes };
}

/** Usuwa wpis zdjęcia (właściciel albo osoba, która je dodała). Obiekt w magazynie zostaje do sprzątania kopii. */
export async function deleteProjectPhoto(store: Magazyn, person: Principal, projectId: string, id: string) {
  requireAssigned(store, person, projectId);
  const photo = (store.odczytaj().projectPhotos ?? []).find((x) => x.projectId === projectId && x.id === id);
  if (!photo) throw new AccessError(404, "Nie znaleziono zdjęcia w tym projekcie.");
  if (profilOsoby(person) !== "wlasciciel" && photo.addedBy !== person.user_id) throw new AccessError(403, "Zdjęcie usuwa właściciel albo osoba, która je dodała.");
  store.zmien((db) => {
    db.projectPhotos = (db.projectPhotos ?? []).filter((x) => x.id !== id);
  });
  await store.utrwal();
  return { usunieto: id };
}
