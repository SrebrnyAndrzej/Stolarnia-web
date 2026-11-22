import type { ModulKatalogowy } from "../../../../src/core/types";

export const studioGroups = [
  {
    id: "base",
    name: "Dolne z drzwiami",
    section: "Meble",
    hint: "Naczynia i zapasy",
  },
  {
    id: "drawers",
    name: "Z szufladami",
    section: "Meble",
    hint: "Sztućce, garnki i akcesoria",
  },
  {
    id: "wall",
    name: "Wiszące",
    section: "Meble",
    hint: "Przechowywanie nad blatem",
  },
  {
    id: "tall",
    name: "Słupki",
    section: "Meble",
    hint: "Wysoka zabudowa do przechowywania",
  },
  {
    id: "corner",
    name: "Narożne",
    section: "Meble",
    hint: "Zabudowa narożnika",
  },
  {
    id: "water",
    name: "Zlew i zmywarka",
    section: "AGD i hydraulika",
    hint: "Strefa zmywania",
  },
  {
    id: "cooking",
    name: "Piekarnik i okap",
    section: "AGD i hydraulika",
    hint: "Strefa gotowania",
  },
  {
    id: "cooling",
    name: "Lodówka",
    section: "AGD i hydraulika",
    hint: "Zabudowa chłodzenia",
  },
  {
    id: "fillers",
    name: "Blendy",
    section: "Wykończenia",
    hint: "Wypełnienie wąskiej luki",
  },
] as const;

/** One category per variant: appliance housings do not also appear as pantries. */
export function studioGroup(m: ModulKatalogowy): string {
  if (m.construction === "filler") return "fillers";
  if (["sink", "dishwasherFront"].includes(m.construction)) return "water";
  if (["oven", "hood"].includes(m.construction)) return "cooking";
  if (m.construction === "refrigerator") return "cooling";
  if (m.category === "corner") return "corner";
  if (m.category === "wall") return "wall";
  if (m.category === "tall") return "tall";
  return m.construction === "drawers" ? "drawers" : "base";
}

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");

export function studioMatches(m: ModulKatalogowy, query: string): boolean {
  const group = studioGroups.find((g) => g.id === studioGroup(m))!;
  const text = normalize(
    `${m.name} ${m.tags.join(" ")} ${group.name} ${group.hint} ${group.section} ${m.widthMM / 10} cm`,
  );
  return normalize(query)
    .trim()
    .split(/\s+/)
    .every((word) => text.includes(word));
}
