import {
  customerKitchenCatalog,
  kitchenModules,
  type KitchenInput,
  type KitchenItem,
} from "./kitchen-configuration.js";
import {
  type KitchenNeeds,
  type KitchenStorage,
  kitchenStorageLabels,
} from "./kitchen-needs-schema.js";

/** Change only newly generated storage interiors. Fixed appliances, positions and old items are untouched. */
export function adaptKitchenStorage(
  items: KitchenItem[],
  needs?: KitchenNeeds,
  preserved = new Set<string>(),
) {
  if (!needs) return items;
  const wants = (s: KitchenStorage) => needs.storage.includes(s);
  const extra =
    needs.priority === "economy"
      ? 0
      : needs.priority === "storage" ||
          needs.cooking === "enthusiast" ||
          needs.household === "5+"
        ? 2
        : wants("cookware") || wants("pantry") || needs.household === "3-4"
          ? 1
          : 0;
  let converted = 0;
  return items.map((item) => {
    if (preserved.has(item.id)) return item;
    const entry = customerKitchenCatalog.find((m) => m.id === item.catalogId)!;
    const width = item.width ?? entry.widthMM;
    if (entry.construction === "drawers" && entry.category === "base")
      return {
        ...item,
        drawers: wants("cookware") && !wants("cutlery") ? 2 : 3,
        drawerFronts: { mode: "graduated" as const },
      };
    if (
      entry.id !== "base-shelves-600" ||
      converted >= extra ||
      width < 400 ||
      width > 1200
    )
      return item;
    converted++;
    const { shelves: _shelves, ...rest } = item;
    return {
      ...rest,
      catalogId: "base-drawers-600",
      drawers: wants("cookware") ? 2 : 3,
      drawerFronts: { mode: "graduated" as const },
    };
  });
}

/** Advisory assignments from the current model. Never claims a storage capacity or a verified fitting. */
export function reviewKitchenNeeds(d: Omit<KitchenInput, "quote">) {
  if (!d.needs) return null;
  const mods = kitchenModules(d);
  const drawers = mods.filter((m) => m.konstrukcja === "drawers");
  const shelves = mods.filter((m) => m.konstrukcja === "shelves");
  const used = new Set<string>();
  const assignments = d.needs.storage.map((need) => {
    const choices =
      need === "cutlery"
        ? drawers.filter((m) => m.konfiguracja.liczbaSzuflad >= 3)
        : need === "cookware"
          ? [...drawers].sort(
              (a, b) =>
                a.konfiguracja.liczbaSzuflad - b.konfiguracja.liczbaSzuflad,
            )
          : need === "dishes" || need === "pantry"
            ? shelves
            : [];
    const selected = choices.find((m) => !used.has(m.id));
    if (selected) used.add(selected.id);
    return {
      need,
      label: kitchenStorageLabels[need],
      id: selected?.id,
      description: selected
        ? `${selected.konstrukcja === "drawers" ? `${selected.konfiguracja.liczbaSzuflad} szuflady` : "Szafka z półkami"} · ${selected.szerokoscMM / 10} cm · ${selected.scianaId === "island" ? "wyspa" : `ściana ${selected.scianaId.toUpperCase()}`}`
        : need === "appliances"
          ? "Podaj wymiary urządzeń podczas konsultacji; sprawdzimy miejsce i dostęp do gniazd."
          : need === "recycling"
            ? "Dobierzemy kosz do szafki pod zlewem, syfonu i instalacji. Kosza nie dodano do wyceny."
            : "Brak osobnej propozycji w obecnym układzie. Zmień wyposażenie szafki lub omów wspólne przechowywanie.",
    };
  });
  const work = mods.filter(
    (m) =>
      m.kategoria === "base" &&
      ["shelves", "drawers"].includes(m.konstrukcja) &&
      m.konfiguracja.blat,
  );
  const widest = work.reduce((n, m) => Math.max(n, m.szerokoscMM), 0);
  return {
    assignments,
    widest,
    reasons: [
      d.needs.priority === "economy"
        ? "Propozycja ogranicza dodatkowe zestawy szuflad. Rzeczywistą cenę sprawdzisz w wycenie."
        : d.needs.priority === "storage"
          ? "Propozycja preferuje dodatkowe szuflady w dostępnych szafkach dolnych."
          : d.needs.priority === "worktop"
            ? "Przy układaniu szukamy miejsca na szerszą, 90-centymetrową szafkę roboczą; jeśli nie pasuje, zostaje wariant 60 cm."
            : "Propozycja łączy szuflady przy strefie gotowania z szafkami półkowymi.",
      widest
        ? `Najszersza szafka z blatem bez zlewu i płyty: ${widest / 10} cm. Sprawdź też miejsce zajmowane przez urządzenia stojące.`
        : "W obecnym projekcie brakuje szafki z wolnym blatem do pracy.",
    ],
  };
}
