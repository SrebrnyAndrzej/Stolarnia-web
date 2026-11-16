import { useEffect, useState } from "react";
import type {
  ArchitectFile,
  ArchitectImage,
} from "../../../../src/core/architect-files";
import {
  readArchitectFile,
  parseArchitectDxf,
  referencePaths,
  imageDimensions,
} from "./architect-storage";
export function useArchitectReferences(files: ArchitectFile[] = []) {
  const key = JSON.stringify(
    files.filter((f) => f.reference || f.imageReference),
  );
  const [result, setResult] = useState<{
    key: string;
    paths: { layer: string; points: [number, number][] }[];
    images: ArchitectImage[];
    errors: string[];
  }>({ key: "", paths: [], images: [], errors: [] });
  useEffect(() => {
    const c = new AbortController();
    const urls: string[] = [];
    const selected: ArchitectFile[] = JSON.parse(key);
    Promise.all(
      selected.map(async (f) => {
        try {
          const b = await readArchitectFile(f);
          if (c.signal.aborted) return null;
          if (f.imageReference) {
            const size = await imageDimensions(b);
            if (c.signal.aborted) return null;
            if (
              size.width !== f.imageReference.pixelWidth ||
              size.height !== f.imageReference.pixelHeight
            )
              throw new Error(
                `${f.name}: rozmiar obrazu nie zgadza się z zapisanym kadrem. Otwórz plik i ustaw kadr ponownie.`,
              );
            const url = URL.createObjectURL(b);
            urls.push(url);
            return { image: { url, reference: f.imageReference } };
          }
          const d = await parseArchitectDxf(b, c.signal);
          return { paths: referencePaths(d, f.reference!).paths };
        } catch (e) {
          return { error: (e as Error).message };
        }
      }),
    ).then((rows) => {
      if (!c.signal.aborted)
        setResult({
          key,
          paths: rows.flatMap((r) => r?.paths ?? []),
          images: rows.flatMap((r) => (r?.image ? [r.image] : [])),
          errors: rows.flatMap((r) => (r?.error ? [r.error] : [])),
        });
    });
    return () => {
      c.abort();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [key]);
  return result.key === key
    ? result
    : { key, paths: [], images: [], errors: [] };
}
