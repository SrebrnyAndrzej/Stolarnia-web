import { createHash } from "node:crypto";
import { z } from "zod";
import type { Magazyn } from "../store/store.js";
import { AccessError, isWorkshopMember, type Principal } from "./access.js";
import { prepareFurniture } from "./furniture-preparation.js";
import { rozkroj, zapotrzebowanieObrzeza } from "../core/production.js";
const item = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    quantity: z.number().int().min(1).max(20),
    materials: z
      .record(z.string().uuid(), z.string().min(1).max(120))
      .refine((m) => Object.keys(m).length <= 150),
  })
  .strict();
const schema = z
  .object({
    items: z
      .array(item)
      .min(1)
      .max(12)
      .refine((items) => new Set(items.map((i) => i.id)).size === items.length),
  })
  .strict();
/** Read-only, version-pinned aggregation using the existing single-model adapter. */
export function prepareFurnitureBatch(
  store: Magazyn,
  person: Principal,
  input: unknown,
) {
  if (!isWorkshopMember(person))
    throw new AccessError(
      403,
      "Przygotowanie jest dostępne aktywnemu zespołowi.",
    );
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new AccessError(
      400,
      "Wybierz 1–12 różnych modeli, ich wersje i 1–20 sztuk każdego.",
    );
  const db = store.odczytaj();
  const items = [...parsed.data.items].sort((a, b) =>
    a.id.localeCompare(b.id, "en"),
  );
  let count = 0;
  for (const item of items) {
    const entry = db.furnitureLibrary?.find((e) => e.id === item.id);
    if (!entry)
      throw new AccessError(404, "Nie znaleziono jednego z wybranych modeli.");
    if (entry.version !== item.version)
      throw new AccessError(
        409,
        `Model „${entry.model.name}” zmienił się. Odśwież bibliotekę i wybierz bieżącą wersję.`,
      );
    count += entry.model.plates.length * item.quantity;
  }
  if (count > 1500)
    throw new AccessError(
      400,
      "Jeden zestaw może zawierać maksymalnie 1500 płyt. Podziel go na mniejsze partie.",
    );
  const snapshot = { odczytaj: () => db } as Magazyn;
  const packets = items.map((item) => ({
    item,
    packet: prepareFurniture(snapshot, person, item.id, {
      version: item.version,
      materials: item.materials,
    }),
  }));
  const diagnostics = packets.flatMap(({ item, packet }) =>
    packet.diagnostics.map((d) => ({
      ...d,
      libraryId: item.id,
      modelName: packet.source.geometry.name,
      libraryVersion: item.version,
    })),
  );
  const source = {
    items: packets.map(({ item, packet }) => ({
      quantity: item.quantity,
      checksum: packet.checksum,
      ...packet.source,
    })),
    settings: {
      rozkroj: db.ustawienia.rozkroj,
      okleinowanie: db.ustawienia.okleinowanie,
    },
  };
  const checksum = createHash("sha256")
    .update(
      JSON.stringify({
        items: source.items.map((s) => ({
          id: s.libraryId,
          version: s.libraryVersion,
          quantity: s.quantity,
          checksum: s.checksum,
        })),
      }),
    )
    .digest("hex");
  const formatki = packets.flatMap(({ item, packet }, modelIndex) =>
    Array.from(
      { length: item.quantity },
      (_, copy) =>
        packet.planning?.formatki.map((f) => ({
          ...f,
          id: `${item.id}/${copy + 1}/${f.id}`,
          modulId: `${item.id}/${copy + 1}`,
          indeksModulu: modelIndex + 1,
          nazwaModulu: `${packet.source.geometry.name} · szt. ${copy + 1}`,
          etykieta: `M${modelIndex + 1}.${copy + 1} · ${f.etykieta}`,
        })) ?? [],
    ).flat(),
  );
  const partSources = packets.flatMap(({ item, packet }) =>
    Array.from(
      { length: item.quantity },
      (_, copy) =>
        packet.planning?.formatki.map((f) => ({
          formatkaId: `${item.id}/${copy + 1}/${f.id}`,
          libraryId: item.id,
          libraryVersion: item.version,
          instance: copy + 1,
          partId: f.id,
        })) ?? [],
    ).flat(),
  );
  const planning = diagnostics.length
    ? null
    : {
        formatki,
        rozkroj: rozkroj(
          formatki,
          db.ustawienia.rozkroj,
          new Map(db.materialy.map((m) => [m.id, m])),
        ),
        obrzeza: zapotrzebowanieObrzeza(formatki, db.ustawienia.okleinowanie),
      };
  const comparison = planning
    ? {
        separateSheets: packets.reduce(
          (n, { item, packet }) =>
            n + (packet.planning?.rozkroj.arkusze.length ?? 0) * item.quantity,
          0,
        ),
        combinedSheets: planning.rozkroj.arkusze.length,
      }
    : null;
  return {
    format: "pan-stolarz-batch-preparation-draft",
    schemaVersion: 1,
    status: "draft",
    readyForProduction: false,
    unit: "mm",
    checksum,
    source,
    partSources,
    diagnostics,
    planning,
    comparison,
    scope:
      "Tylko płyty zapisanych wersji biblioteki. Porównanie: każda sztuka osobno wobec wspólnego planu. Heurystyka nie gwarantuje optymalnego wyniku. To nie jest zamówienie ani wydanie produkcyjne; skrzynki szuflad, okucia i technologia wymagają dalszej weryfikacji.",
  };
}
