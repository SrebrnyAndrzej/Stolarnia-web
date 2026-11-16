import { useEffect, useState } from "react";
import type { ArchitectFile } from "../../../../src/core/architect-files";
import {
  readArchitectFile,
  parseArchitectDxf,
  referencePaths,
} from "./architect-storage";
export function useArchitectReferences(files: ArchitectFile[] = []) {
  const key = JSON.stringify(files.filter((f) => f.reference));
  const [result, setResult] = useState<{
    key: string;
    paths: { layer: string; points: [number, number][] }[];
    errors: string[];
  }>({ key: "", paths: [], errors: [] });
  useEffect(() => {
    const c = new AbortController();
    const selected: ArchitectFile[] = JSON.parse(key);
    Promise.all(
      selected.map(async (f) => {
        try {
          const b = await readArchitectFile(f);
          if (c.signal.aborted) return null;
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
          errors: rows.flatMap((r) => (r?.error ? [r.error] : [])),
        });
    });
    return () => c.abort();
  }, [key]);
  return result.key === key ? result : { key, paths: [], errors: [] };
}
