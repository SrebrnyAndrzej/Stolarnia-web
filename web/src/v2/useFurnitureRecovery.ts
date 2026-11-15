import { useEffect, useState } from "react";
import { z } from "zod";
import { furnitureSave } from "../../../src/core/furniture-schema";
import type { FurnitureModel } from "../../../src/core/furniture";
const draftSchema = furnitureSave.extend({
  model: furnitureSave.shape.model.extend({
    name: z.string().max(100),
    plates: furnitureSave.shape.model.shape.plates.min(0),
  }),
  savedAt: z.string().datetime(),
});
export type FurnitureDraft = z.infer<typeof draftSchema>;
export function useFurnitureRecovery(
  accountId: string | undefined,
  demo: boolean,
  model: FurnitureModel,
  id: string,
  version: number,
  dirty: boolean,
) {
  const key =
    !demo && accountId ? `pan-stolarz:furniture-draft:v1:${accountId}` : null;
  const [pending, setPending] = useState<FurnitureDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    setReady(false);
    setPending(null);
    setStatus("");
    if (key)
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const result = draftSchema.safeParse(JSON.parse(raw));
          if (result.success) setPending(result.data);
          else
            setStatus(
              "Nie można odczytać poprzedniego szkicu. Możesz kontynuować nowy projekt.",
            );
        }
      } catch {
        setStatus(
          "Odzyskiwanie lokalnego szkicu jest niedostępne w tej przeglądarce.",
        );
      }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready || !key || pending) return;
    if (!dirty) {
      try {
        localStorage.removeItem(key);
      } catch {}
      setStatus("");
      return;
    }
    const timer = setTimeout(() => {
      const result = draftSchema.safeParse({
        model,
        id,
        version,
        savedAt: new Date().toISOString(),
      });
      if (!result.success) {
        setStatus(
          "Szkic zawiera niepełne wymiary — lokalna kopia czeka na poprawne wartości.",
        );
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify(result.data));
        setStatus("Szkic zabezpieczony na tym urządzeniu");
      } catch {
        setStatus("Brak miejsca na lokalną kopię. Zapisz mebel w bibliotece.");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [ready, key, pending, model, id, version, dirty]);
  const discard = () => {
    if (key)
      try {
        localStorage.removeItem(key);
      } catch {}
    setPending(null);
  };
  return { pending, status, discard, accept: () => setPending(null) };
}
