import { kitchenModules, type KitchenInput } from "./kitchen-configuration.js";
import type { Modul } from "./types.js";

export function kitchenFunction(m: Pick<Modul, "konstrukcja" | "kategoria">) {
  if (m.konstrukcja === "sink") return "Hydraulika · zlew";
  if (m.konstrukcja === "dishwasherFront") return "Hydraulika i AGD · zmywarka";
  if (m.konstrukcja === "oven") return "AGD · piekarnik i płyta";
  if (m.konstrukcja === "hood") return "AGD · okap i wentylacja";
  if (m.konstrukcja === "refrigerator") return "AGD · lodówka";
  if (m.konstrukcja === "filler") return "Wykończenie · blenda";
  if (m.konstrukcja === "drawers") return "Przygotowanie · szuflady i blat";
  return m.kategoria === "wall"
    ? "Przechowywanie · wiszące"
    : "Przechowywanie · szafka";
}

/** Advisory review derived from actual modules, never from a remembered successful proposal. */
export function kitchenFunctionalReview(d: Omit<KitchenInput, "quote">) {
  const modules = kitchenModules(d),
    warnings: string[] = [];
  const sinks = modules.filter((m) => m.konstrukcja === "sink"),
    dishwashers = modules.filter((m) => m.konstrukcja === "dishwasherFront"),
    ovens = modules.filter((m) => m.konstrukcja === "oven"),
    hoods = modules.filter((m) => m.konstrukcja === "hood"),
    fridges = modules.filter((m) => m.konstrukcja === "refrigerator"),
    preparation = modules.filter(
      (m) =>
        m.kategoria === "base" &&
        m.konstrukcja !== "filler" &&
        m.konfiguracja.blat,
    );
  for (const [label, rows] of [
    ["zlewu", sinks],
    ["piekarnika z płytą", ovens],
    ["lodówki", fridges],
    ["okapu", hoods],
  ] as const) {
    if (!rows.length) warnings.push(`Brak ${label} w projekcie.`);
    if (rows.length > 1)
      warnings.push(
        `Więcej niż jedna strefa ${label}; sprawdź, czy jest to zamierzone.`,
      );
  }
  if (d.planning?.dishwasher !== "none" && !dishwashers.length)
    warnings.push(
      "Brak zmywarki; możesz wybrać układ bez zmywarki w założeniach.",
    );
  for (const dw of dishwashers)
    if (
      !sinks.some(
        (s) =>
          s.scianaId === dw.scianaId &&
          (s.pozycjaXMM + s.szerokoscMM === dw.pozycjaXMM ||
            dw.pozycjaXMM + dw.szerokoscMM === s.pozycjaXMM),
      )
    )
      warnings.push(
        "Zmywarka nie sąsiaduje ze zlewem. Sprawdź prowadzenie wody i odpływu.",
      );
  for (const oven of ovens)
    if (
      !hoods.some(
        (h) =>
          h.scianaId === oven.scianaId &&
          h.pozycjaXMM + h.szerokoscMM / 2 ===
            oven.pozycjaXMM + oven.szerokoscMM / 2,
      )
    )
      warnings.push("Okap nie jest wyśrodkowany nad strefą płyty.");
  if (!preparation.some((m) => m.szerokoscMM >= 600))
    warnings.push(
      "Brak odcinka przygotowania o szerokości 600 mm, przyjętego w proponowanym układzie.",
    );
  for (const oven of ovens) {
    const adjacent = (m: Modul) =>
      m.scianaId === oven.scianaId &&
      (m.pozycjaXMM + m.szerokoscMM === oven.pozycjaXMM ||
        oven.pozycjaXMM + oven.szerokoscMM === m.pozycjaXMM);
    if (preparation.filter(adjacent).length < 2)
      warnings.push(
        "Sprawdź odkładanie przy płycie: proponowany układ zostawia blat po obu jej stronach.",
      );
    for (const sink of sinks.filter((s) => s.scianaId === oven.scianaId)) {
      if (
        !preparation.some(
          (m) =>
            m.scianaId === sink.scianaId &&
            m.szerokoscMM >= 600 &&
            m.pozycjaXMM >=
              Math.min(
                sink.pozycjaXMM + sink.szerokoscMM,
                oven.pozycjaXMM + oven.szerokoscMM,
              ) &&
            m.pozycjaXMM + m.szerokoscMM <=
              Math.max(sink.pozycjaXMM, oven.pozycjaXMM),
        )
      )
        warnings.push(
          "Między zlewem a płytą brakuje odcinka przygotowania 600 mm przyjętego w proponowanym układzie.",
        );
    }
  }
  const waterPoint = d.features?.find((f) => f.kind === "water");
  const p = waterPoint
    ? { ...d.planning, waterWall: waterPoint.wall, sinkCenter: waterPoint.x }
    : d.planning;
  if (
    p?.waterWall &&
    p.waterWall !== "auto" &&
    !sinks.some((s) => s.scianaId === p.waterWall)
  )
    warnings.push(
      "Zlew znajduje się na innej ścianie niż wskazana w założeniach hydrauliki.",
    );
  if (
    p?.sinkCenter !== undefined &&
    !sinks.some(
      (s) =>
        s.scianaId === (p.waterWall === "auto" ? "a" : p.waterWall) &&
        s.pozycjaXMM + s.szerokoscMM / 2 === p.sinkCenter,
    )
  )
    warnings.push(
      "Położenie zlewu nie odpowiada zadanemu środkowi. Zaktualizuj układ albo założenia.",
    );
  return {
    sinks,
    dishwashers,
    ovens,
    hoods,
    fridges,
    preparation,
    warnings: [...new Set(warnings)],
  };
}
