import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  CAD_FILE_LIMIT,
  type ProjectFile,
  type StoredProjectFile,
} from "../core/project-files.js";
import type { Magazyn } from "../store/store.js";
import { AccessError, mayReadProject, type Principal } from "./access.js";
import { profilOsoby } from "./uprawnienia.js";

export interface FileObjects {
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
}
const BUCKET = "pan-stolarz-project-files";
/** Private objects only; the API checks the current project assignment on every read. */
export function projectFileObjects(
  store: Magazyn,
  admin: SupabaseClient | null,
): FileObjects {
  if (!store.wChmurze) {
    const root = join(dirname(store.plik), "project-files");
    const path = (key: string) => {
      if (!/^[a-f0-9]{64}\/[a-f0-9-]{36}$/.test(key))
        throw new Error("Invalid object key");
      return join(root, key);
    };
    return {
      async put(key, bytes) {
        await mkdir(dirname(path(key)), { recursive: true });
        await writeFile(path(key), bytes);
      },
      async get(key) {
        return readFile(path(key));
      },
    };
  }
  const storage = () => {
    if (!admin)
      throw new AccessError(
        503,
        "Magazyn plików jest niedostępny. Spróbuj ponownie później.",
      );
    return admin.storage;
  };
  const privateBucket = async () => {
    const api = storage();
    let result = await api.getBucket(BUCKET);
    if (result.error) {
      await api.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: CAD_FILE_LIMIT,
        allowedMimeTypes: ["application/octet-stream"],
      });
      result = await api.getBucket(BUCKET);
    }
    if (result.error || !result.data || result.data.public)
      throw new AccessError(
        503,
        "Prywatny magazyn plików nie jest gotowy. Spróbuj ponownie później.",
      );
    return api.from(BUCKET);
  };
  return {
    async put(key, bytes) {
      const bucket = await privateBucket();
      const { error } = await bucket.upload(key, bytes, {
        contentType: "application/octet-stream",
        upsert: false,
      });
      if (error) {
        // Retry after a lost response or a metadata conflict: never overwrite different content.
        const existing = await bucket.download(key);
        if (
          existing.error ||
          !existing.data ||
          !Buffer.from(await existing.data.arrayBuffer()).equals(bytes)
        )
          throw new AccessError(
            503,
            "Nie udało się zapisać pliku. Zachowano wybór — ponów import.",
          );
      }
    },
    async get(key) {
      const bucket = await privateBucket();
      const { data, error } = await bucket.download(key);
      if (error || !data)
        throw new AccessError(
          503,
          "Nie udało się pobrać oryginału. Spróbuj ponownie.",
        );
      return Buffer.from(await data.arrayBuffer());
    },
  };
}
const schema = z
  .object({
    id: z.string().uuid(),
    name: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .refine(
        (x) => !/[\u0000-\u001f\u007f/\\]/.test(x),
        "Niepoprawna nazwa pliku",
      ),
    base64: z
      .string()
      .min(4)
      .max(Math.ceil(CAD_FILE_LIMIT / 3) * 4),
  })
  .strict();
function requireProject(store: Magazyn, person: Principal, projectId: string) {
  if (!["wlasciciel", "sprzedaz"].includes(profilOsoby(person)))
    throw new AccessError(
      403,
      "Oryginały architekta są dostępne właścicielowi i projektantowi z profilem sprzedaży.",
    );
  if (
    !mayReadProject(person, projectId) ||
    !store.odczytaj().projekty.some((x) => x.id === projectId)
  )
    throw new AccessError(404, "Nie znaleziono udostępnionego projektu.");
}
const publicFile = ({
  objectKey: _key,
  ...file
}: StoredProjectFile): ProjectFile => file;
export function listProjectFiles(
  store: Magazyn,
  person: Principal,
  projectId: string,
) {
  requireProject(store, person, projectId);
  return (store.odczytaj().projectFiles ?? [])
    .filter((x) => x.projectId === projectId)
    .map(publicFile);
}
export function validateCadUpload(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new AccessError(
      400,
      "Wybierz plik DXF lub DWG do 3 MiB z poprawną nazwą.",
    );
  const { id, name, base64 } = parsed.data;
  const format = name.split(".").pop()?.toLowerCase();
  if (format !== "dxf" && format !== "dwg")
    throw new AccessError(400, "Obsługiwane pliki: DXF i DWG.");
  const bytes = Buffer.from(base64, "base64");
  if (
    !bytes.length ||
    bytes.length > CAD_FILE_LIMIT ||
    bytes.toString("base64") !== base64
  )
    throw new AccessError(
      400,
      "Plik jest pusty, za duży albo uszkodzony. Limit: 3 MiB.",
    );
  const binaryDxf =
    bytes.subarray(0, 22).toString("ascii") ===
    "AutoCAD Binary DXF\r\n\u001a\0";
  const text =
    format === "dxf" && !binaryDxf
      ? bytes.toString("utf8").replace(/^\uFEFF/, "")
      : "";
  const dwg =
    /^AC10\d{2}$/.test(bytes.subarray(0, 6).toString("ascii")) &&
    bytes.length > 16;
  if (
    format === "dwg"
      ? !dwg
      : !binaryDxf &&
        (!/(?:^|\r?\n)\s*0\s*\r?\nSECTION\s*\r?\n/.test(text) ||
          !/(?:^|\r?\n)\s*0\s*\r?\nEOF\s*$/.test(text))
  )
    throw new AccessError(
      400,
      "Zawartość nie odpowiada rozszerzeniu DXF/DWG. Wyeksportuj rysunek ponownie z programu CAD.",
    );
  return {
    id,
    name,
    format: format as "dxf" | "dwg",
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
export async function uploadProjectFile(
  store: Magazyn,
  objects: FileObjects,
  person: Principal,
  projectId: string,
  input: unknown,
) {
  requireProject(store, person, projectId);
  if (!["wlasciciel", "sprzedaz"].includes(profilOsoby(person)))
    throw new AccessError(
      403,
      "Pliki dodaje właściciel lub projektant z profilem sprzedaży.",
    );
  const data = validateCadUpload(input);
  const files = store.odczytaj().projectFiles ?? [];
  const sameId = files.find((x) => x.id === data.id);
  if (
    sameId &&
    (sameId.projectId !== projectId || sameId.sha256 !== data.sha256)
  )
    throw new AccessError(
      409,
      "Identyfikator importu jest już używany. Wybierz plik ponownie.",
    );
  const existing = files.find(
    (x) => x.projectId === projectId && x.sha256 === data.sha256,
  );
  if (existing) return publicFile(existing);
  if (files.filter((x) => x.projectId === projectId).length >= 50)
    throw new AccessError(409, "Projekt ma już 50 plików CAD.");
  const objectKey = `${createHash("sha256").update(projectId).digest("hex")}/${data.id}`;
  await objects.put(objectKey, data.bytes);
  const file: StoredProjectFile = {
    id: data.id,
    projectId,
    name: data.name,
    format: data.format,
    size: data.bytes.length,
    sha256: data.sha256,
    objectKey,
    createdAt: new Date().toISOString(),
  };
  store.zmien((db) => {
    (db.projectFiles ??= []).push(file);
  });
  await store.utrwal();
  return publicFile(file);
}
export async function readProjectFile(
  store: Magazyn,
  objects: FileObjects,
  person: Principal,
  projectId: string,
  id: string,
) {
  requireProject(store, person, projectId);
  const file = (store.odczytaj().projectFiles ?? []).find(
    (x) => x.projectId === projectId && x.id === id,
  );
  if (!file)
    throw new AccessError(404, "Nie znaleziono pliku w tym projekcie.");
  const bytes = await objects.get(file.objectKey);
  if (
    bytes.length !== file.size ||
    createHash("sha256").update(bytes).digest("hex") !== file.sha256
  )
    throw new AccessError(
      503,
      "Nie można potwierdzić integralności oryginału. Spróbuj ponownie później.",
    );
  return { ...publicFile(file), base64: bytes.toString("base64") };
}
