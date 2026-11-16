import {
  ARCHITECT_FILE_LIMIT,
  type ArchitectFile,
} from "../../../../src/core/architect-files";
import type { CadPreview } from "../../../../src/core/cad-preview";
import {
  CAD_PREVIEW_LIMIT,
  CAD_SCALES,
} from "../../../../src/core/project-files";
const DB = "pan-stolarz-architect-files-v1";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(
        new Error(
          "Pamięć plików jest niedostępna. Włącz pamięć tej strony i spróbuj ponownie.",
        ),
      );
    req.onblocked = () =>
      reject(new Error("Zamknij inne karty kreatora i spróbuj ponownie."));
  });
}
export async function storeArchitectFiles(files: { id: string; blob: Blob }[]) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      for (const file of files) tx.objectStore("files").put(file.blob, file.id);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () =>
        reject(
          new Error(
            "Brak miejsca na pliki. Zachowaj oryginały i zwolnij pamięć urządzenia.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function readArchitectFile(file: ArchitectFile): Promise<Blob> {
  const db = await database();
  try {
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const req = db.transaction("files").objectStore("files").get(file.id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    });
    if (!blob || blob.size !== file.size)
      throw new Error(
        `${file.name}: brak oryginału na tym urządzeniu. Dołącz go ponownie lub wczytaj paczkę projektu.`,
      );
    return blob;
  } finally {
    db.close();
  }
}
export async function validateArchitectFile(file: Blob, name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  const format = ext === "jpeg" ? "jpg" : ext;
  if (
    !["dxf", "dwg", "pdf", "jpg", "png"].includes(format ?? "") ||
    name.length > 180 ||
    !file.size ||
    file.size > ARCHITECT_FILE_LIMIT
  )
    throw new Error(`${name}: wybierz DXF, DWG, PDF, JPG lub PNG do 10 MiB.`);
  if (format === "jpg" || format === "png") {
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const signature =
      format === "jpg" ? [255, 216, 255] : [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((b, i) => bytes[i] === b))
      throw new Error(`${name}: nieprawidłowy nagłówek obrazu.`);
    await imageDimensions(file);
  }
  const head = new TextDecoder().decode(
    await file.slice(0, 1024).arrayBuffer(),
  );
  if (format === "pdf" && !head.includes("%PDF-"))
    throw new Error(`${name}: nieprawidłowy nagłówek PDF.`);
  if (format === "dwg" && !/^AC10\d{2}/.test(head))
    throw new Error(`${name}: nieprawidłowy nagłówek DWG.`);
  if (format === "dxf" && !/SECTION|AutoCAD Binary DXF/.test(head))
    throw new Error(`${name}: nieprawidłowy nagłówek DXF.`);
  return format as ArchitectFile["format"];
}
export async function imageDimensions(blob: Blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const width = img.naturalWidth,
      height = img.naturalHeight;
    if (
      !width ||
      !height ||
      Math.max(width, height) > 20000 ||
      width * height > 24000000
    )
      throw new Error(
        "Obraz może mieć do 24 mln pikseli i 20 000 px na bok. Zmniejsz go przed dodaniem.",
      );
    return { width, height };
  } catch (e) {
    if (e instanceof Error && e.message.includes("pikseli")) throw e;
    throw new Error("Nie można odczytać obrazu. Wybierz poprawny JPG lub PNG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function parseArchitectDxf(
  blob: Blob,
  signal: AbortSignal,
): Promise<CadPreview> {
  if (blob.size > CAD_PREVIEW_LIMIT)
    throw new Error(
      "Podgląd i podkład DXF: do 1 MiB. Zachowano cały oryginał; poproś o uproszczony ASCII DXF.",
    );
  const text = await blob.text();
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Anulowano odczyt."));
      return;
    }
    const w = new Worker(new URL("../cad-preview.worker.ts", import.meta.url), {
      type: "module",
    });
    const finish = () => {
      clearTimeout(timer);
      w.terminate();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      finish();
      reject(new Error("Anulowano odczyt."));
    };
    const timer = setTimeout(() => {
      finish();
      reject(
        new Error(
          "Rysunek jest zbyt złożony. Poproś architekta o uproszczony DXF.",
        ),
      );
    }, 5000);
    signal.addEventListener("abort", abort, { once: true });
    w.onmessage = (e) => {
      finish();
      e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.result);
    };
    w.onerror = () => {
      finish();
      reject(new Error("Nie udało się odczytać DXF."));
    };
    w.postMessage(text);
  });
}
export function referencePaths(
  data: CadPreview,
  ref: NonNullable<ArchitectFile["reference"]>,
) {
  const paths = data.paths.filter((p) => !ref.layer || p.layer === ref.layer),
    k = CAD_SCALES[ref.unit];
  const a = (ref.rotation * Math.PI) / 180,
    c = Math.round(Math.cos(a)),
    s = Math.round(Math.sin(a));
  const rotated = paths.map((p) => ({
    ...p,
    points: p.points.map(
      ([x, y]) =>
        [(x * c - y * s) * k, (x * s + y * c) * k] as [number, number],
    ),
  }));
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of rotated)
    for (const [x, y] of p.points) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  if (!Number.isFinite(minX))
    throw new Error("Brak obsługiwanych linii na wybranej warstwie.");
  if (maxX - minX > 20000 || maxY - minY > 20000)
    throw new Error(
      "Podkład przekracza 20 m. Sprawdź jednostkę i wybierz warstwę jednego pomieszczenia.",
    );
  return {
    width: Math.round(maxX - minX),
    depth: Math.round(maxY - minY),
    paths: rotated.map((p) => ({
      ...p,
      points: p.points.map(
        ([x, y]) => [x - minX + ref.x, y - minY + ref.y] as [number, number],
      ),
    })),
  };
}
