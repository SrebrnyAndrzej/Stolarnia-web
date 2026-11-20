import { calculateKitchenEstimate } from "../core/kitchen-estimate.js";
import { fairQuoteSchema } from "../core/fair-quote.js";
import { AccessError, type Principal } from "./access.js";
import { ZodError } from "zod";

/** The client cannot obtain procurement prices through the anonymous estimate endpoint. */
export function fairKitchenSource(person: Principal, raw: unknown) {
  if (person.role !== "owner" || !person.active)
    throw new AccessError(
      403,
      "Kalkulator kosztów i zarobku jest dostępny wyłącznie dla właściciela.",
    );
  let calculated: ReturnType<typeof calculateKitchenEstimate>;
  try {
    calculated = calculateKitchenEstimate(raw);
  } catch (e) {
    if (e instanceof ZodError)
      throw new AccessError(
        400,
        "Niepoprawny szkic kuchni. Popraw wymiary lub wyposażenie.",
      );
    throw e;
  }
  const { estimate, costing, input } = calculated;
  if (estimate.status !== "estimated")
    throw new AccessError(422, estimate.issues.join(" "));
  const sum = (category: string) =>
    costing.legacy.pozycje
      .filter((p) => p.kategoria === category)
      .reduce((n, p) => n + p.kosztNetto, 0);
  const exclusions = new Set([
    "robocizna",
    "montaz",
    "transport",
    "uslugi",
    "blaty",
  ]);
  const materials = costing.legacy.pozycje
    .filter((p) => !exclusions.has(p.kategoria))
    .reduce((n, p) => n + p.kosztNetto, 0);
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    source:
      "Stawki modelowe obecnego silnika — do zastąpienia fakturami i rzeczywistym czasem",
    legacyGross: estimate.gross,
    inputs: fairQuoteSchema.parse({
      materialsNet: round(materials),
      preparationNet: round(sum("uslugi")),
      productionHours: costing.quantities.liczbaGodzinProdukcji,
      productionHourCostNet: costing.settings.finanse.stawkaRoboczogodziny,
      installationNet: round(sum("montaz")),
      transportNet: round(sum("transport")),
      boughtWorktopNet: round(sum("blaty")),
      vatPercent: costing.settings.finanse.vatProcent,
    }),
    lines: costing.legacy.pozycje.map((p) => ({
      name: p.nazwa,
      net: p.kosztNetto,
      quantity: p.ilosc,
      unit: p.jednostka,
    })),
    cabinets: input.items.length + (input.island?.items.length ?? 0),
    notes: [
      "Nie potwierdzono aktualnych cen Mussi. Wczytanie nie zmienia cennika publicznego.",
      "Godziny produkcji są normą starego silnika. Przy gotowych formatkach sprawdź pozostały czas: wiercenie, składanie, regulacja, pakowanie, pomiar i projekt.",
      "Jeśli koszt osobogodziny zawiera koszty stałe, nie wpisuj ich ponownie w osobnej pozycji. Montaż jest kosztem całego zlecenia, a czas pracy podajesz w osobogodzinach.",
    ],
  };
}
