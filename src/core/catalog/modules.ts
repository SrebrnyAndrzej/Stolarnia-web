import type { KonfiguracjaModulu, ModulKatalogowy } from "../types.js";
import katalog from "./kitchen-modules.json" with { type: "json" };

// Katalog 56 standardowych modułów kuchennych — KitchenModuleCatalog_v0.14.3.json ze StolarniaApp.
export const KATALOG_MODULOW = katalog as ModulKatalogowy[];

export function modulKatalogowy(id: string): ModulKatalogowy | undefined {
  return KATALOG_MODULOW.find((m) => m.id === id);
}

/** Domyślna konfiguracja funkcjonalna dla typu konstrukcji (odpowiednik KonfiguracjaFunkcjonalnaModuluV068). */
export function domyslnaKonfiguracja(m: Pick<ModulKatalogowy, "construction" | "category" | "widthMM" | "heightMM">): KonfiguracjaModulu {
  const drzwi = m.widthMM > 600 ? 2 : 1;
  const podloga = m.category === "base" || m.category === "tall" || m.category === "corner" || isFloorAppliance(m.construction);
  const base: KonfiguracjaModulu = {
    liczbaPolek: 0,
    typFrontu: "drzwi",
    liczbaDrzwi: drzwi,
    liczbaSzuflad: 0,
    liczbaCargo: 0,
    plecy: true,
    blat: false,
    nogi: podloga,
    szufladySystemowe: false,
  };
  const dolny = m.category === "base" || m.category === "corner" && m.construction !== "wallCorner" || ["sink", "oven", "dishwasherFront"].includes(m.construction);

  switch (m.construction) {
    case "shelves":
      return { ...base, liczbaPolek: m.category === "tall" ? 4 : 1, blat: dolny };
    case "drawers":
      return { ...base, typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: 3, blat: true };
    case "cargo":
      return { ...base, typFrontu: "drzwi", liczbaDrzwi: 1, liczbaCargo: 1, blat: true };
    case "sink":
      return { ...base, plecy: false, blat: true };
    case "oven":
      return { ...base, typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: 1, plecy: false, blat: true };
    case "dishwasherFront":
      return { ...base, typFrontu: "panelAGD", liczbaDrzwi: 1, plecy: false, nogi: false, blat: true };
    case "blindCorner":
      return { ...base, liczbaDrzwi: 1, liczbaPolek: 1, blat: true };
    case "lCorner":
      return { ...base, liczbaDrzwi: 2, liczbaPolek: 1, blat: true };
    case "liftUp":
    case "topBox":
      return { ...base, typFrontu: "uchylny", liczbaDrzwi: 1, liczbaPolek: m.heightMM > 450 ? 1 : 0 };
    case "hood":
      return { ...base, liczbaPolek: 0, plecy: false };
    case "wallCorner":
      return { ...base, liczbaDrzwi: 1, liczbaPolek: 2 };
    case "refrigerator":
      return { ...base, liczbaDrzwi: 2, plecy: false };
    case "ovenTower":
      return { ...base, typFrontu: "drzwi", liczbaDrzwi: 2, liczbaSzuflad: 1, liczbaPolek: 1 };
    case "ovenMicrowaveTower":
      return { ...base, typFrontu: "drzwi", liczbaDrzwi: 2, liczbaPolek: 1 };
    case "utility":
      return { ...base, liczbaDrzwi: 2, liczbaPolek: 2 };
    case "filler":
      return { ...base, typFrontu: "brak", liczbaDrzwi: 0, plecy: false, nogi: false, blat: m.category === "base" };
    case "openShelf":
      return { ...base, typFrontu: "brak", liczbaDrzwi: 0, liczbaPolek: 2, plecy: true };
    default:
      return base;
  }
}

function isFloorAppliance(c: string): boolean {
  return ["sink", "oven", "dishwasherFront", "refrigerator", "ovenTower", "ovenMicrowaveTower"].includes(c);
}
