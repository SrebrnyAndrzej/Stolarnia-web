import dane from "./reguly-szuflad.json" with { type: "json" };

// Profile systemów szuflad z biblioteki okuć (docs/okucia/reguly-szuflad.json, przygotowane przez Codex).
// Wymiary dna i pleców sprawdzone wizualnie z katalogami; wiercenia NIE są znormalizowane.

export interface ProfilSzuflady {
  id: string;
  manufacturer: string;
  family: string;
  scope: string;
  board_thickness_mm: number;
  bottom: { width: { variable: "LW"; subtract_mm: number }; depth: { variable: "NL"; subtract_mm: number } };
  back: { width: { variable: "LW"; subtract_mm: number }; height_by_variant_mm: Record<string, number> };
  source_id: string;
  pdf_page_1based: number;
  source_sha256: string;
  verification: string;
  production_approved: boolean;
  drilling_status: string;
  allowed_nominal_lengths_status: string;
  notes: string[];
  example: { LW: number; NL: number; bottom_width: number; bottom_depth: number; back_width: number };
  /** Strona PDF i status weryfikacji dla każdej wysokości pleców. */
  variant_sources?: Record<string, { pdf_page_1based: number; verification: string }>;
  /** Dno przy stalowej ściance tylnej (TANDEMBOX). */
  bottom_depth_steel_back?: { variable: "NL"; subtract_mm: number };
  /** Obróbka dna wymagana przez system (LEGRABOX — frezowanie C). */
  bottom_machining?: { id: string; opis: string; verification: string };
  /** Montaż prowadnicy w boku korpusu: oś wkręta nad płytą pod szufladą i otwory od przedniej krawędzi (wg NL). */
  runner_mounting?: {
    axis_above_panel_min_mm: number;
    /** Dodatek, gdy prowadnicę montuje się przed skręceniem korpusu (Blum: +1 mm). */
    premount_extra_mm?: number;
    /** Miejsce nad osią prowadnicy do płyty powyżej (dotyczy wysokości M). */
    space_above_axis_min_mm?: number;
    holes_from_front_mm?: Record<string, number[]>;
    source_id: string;
    pdf_page_1based: number;
    verification: string;
    notes: string[];
  };
  /** Szuflada wewnętrzna za drzwiami (Amix Elite: LT = NL+16, otwory przesunięte, panel frontu stalowy). */
  inner_drawer?: {
    depth_min: { variable: "NL"; add_mm: number };
    runner_holes_offset_mm: number;
    first_hole_from_front_min_mm?: number;
    /** Minimalna wysokość komory (od płyty do płyty) dla wariantu wysokości boku. */
    min_opening_by_variant_mm: Record<string, number>;
    front_panel?: { part: string; material: string; length: { variable: "LW"; subtract_mm: number }; height_by_variant_mm: Record<string, number> };
    /** Zestaw zabieraka: szuflada wewnętrzna wysuwana razem z frontem (Blum ZI7.0M07). */
    coupler?: {
      part: string;
      min_opening_by_variant_mm: Record<string, number>;
      front_drilling?: { diameter_mm: number; horizontal: string; note: string };
      exclusions: string[];
    };
    hinge_requirement: string;
    source_id: string;
    pdf_page_1based: number;
    verification: string;
    notes: string[];
  };
}

export const PROFILE_SZUFLAD = (dane as unknown as { profiles: ProfilSzuflady[] }).profiles;

export function profilSzuflady(id: string): ProfilSzuflady | undefined {
  return PROFILE_SZUFLAD.find((p) => p.id === id);
}

/** Typoszereg długości nominalnych prowadnic (NL) — robocze, do potwierdzenia SKU. */
export const DLUGOSCI_NOMINALNE = [270, 300, 350, 400, 450, 500, 550, 600, 650];

/** Największa NL mieszcząca się w głębokości użytkowej korpusu (z zapasem 3 mm). */
export function dobierzNL(glebokoscUzytkowaMM: number): number | undefined {
  return [...DLUGOSCI_NOMINALNE].reverse().find((nl) => nl + 3 <= glebokoscUzytkowaMM);
}

/**
 * Wymiary dna i pleców wg profilu dla światła korpusu LW i długości NL. Wariant wysokości: wskazany jawnie,
 * a bez niego — najwyższe plecy mieszczące się za frontem z zapasem 40 mm (w innym razie najniższe).
 */
export function wymiarySzuflady(p: ProfilSzuflady, LW: number, NL: number, wysokoscFrontuMM: number, wariantJawny?: string) {
  const warianty = Object.entries(p.back.height_by_variant_mm).sort((a, b) => a[1] - b[1]);
  const wybrany = wariantJawny ? warianty.find(([k]) => k === wariantJawny) : undefined;
  const wariant = wybrany ?? [...warianty].reverse().find(([, h]) => h + 40 <= wysokoscFrontuMM) ?? warianty[0];
  return {
    dnoSzer: LW - p.bottom.width.subtract_mm,
    dnoGl: NL - p.bottom.depth.subtract_mm,
    plecySzer: LW - p.back.width.subtract_mm,
    plecyWys: wariant[1],
    wariant: wariant[0],
    grubosc: p.board_thickness_mm,
  };
}

export interface WynikPrzelicznika {
  profilId: string;
  producent: string;
  system: string;
  LW: number;
  NL: number;
  wariant: string;
  grubosc: number;
  dno: { szer: number; gl: number; wzor: string };
  plecy: { szer: number; wys: number; wzor: string };
  zrodlo: { dokument: string; strona: number; weryfikacja: string };
  zatwierdzoneProdukcyjnie: boolean;
  uwagi: string[];
}

/**
 * Przelicznik dna i pleców szuflady dla wybranego systemu. LW — rzeczywiste światło korpusu w miejscu prowadnic,
 * NL — długość nominalna prowadnicy. Wymiary to wymiary przycięcia płyty z karty producenta (bez obrzeża).
 */
export function przeliczSzuflade(
  p: ProfilSzuflady,
  dane: { LW: number; NL: number; wariant?: string; wysokoscFrontuMM?: number; sciankaTylna?: "drewniana" | "stalowa" },
): WynikPrzelicznika {
  const w = wymiarySzuflady(p, dane.LW, dane.NL, dane.wysokoscFrontuMM ?? 10000, dane.wariant);
  const stalowa = dane.sciankaTylna === "stalowa" && p.bottom_depth_steel_back;
  const dnoGl = stalowa ? dane.NL - p.bottom_depth_steel_back!.subtract_mm : w.dnoGl;
  const zrodloWariantu = p.variant_sources?.[w.wariant];
  const uwagi: string[] = [];
  if (dane.wariant && w.wariant !== dane.wariant) uwagi.push(`System nie ma wariantu „${dane.wariant}” — użyto „${w.wariant}”.`);
  if (dane.sciankaTylna === "stalowa" && !p.bottom_depth_steel_back) uwagi.push("Profil nie ma danych dla stalowej ścianki tylnej — podano dno dla drewnianej.");
  if (p.bottom_machining) uwagi.push(p.bottom_machining.opis);
  if (!p.production_approved) uwagi.push("Profil niezatwierdzony produkcyjnie — wiercenia i długości NL do potwierdzenia u producenta.");
  if (dane.LW < 150) uwagi.push("Światło korpusu poniżej 150 mm — sprawdź minimalną szerokość systemu.");
  return {
    profilId: p.id,
    producent: p.manufacturer,
    system: p.family,
    LW: dane.LW,
    NL: dane.NL,
    wariant: w.wariant,
    grubosc: w.grubosc,
    dno: { szer: w.dnoSzer, gl: dnoGl, wzor: `(LW − ${p.bottom.width.subtract_mm}) × (NL − ${stalowa ? p.bottom_depth_steel_back!.subtract_mm : p.bottom.depth.subtract_mm})` },
    plecy: { szer: w.plecySzer, wys: w.plecyWys, wzor: `(LW − ${p.back.width.subtract_mm}) × ${w.plecyWys}` },
    zrodlo: { dokument: p.source_id, strona: zrodloWariantu?.pdf_page_1based ?? p.pdf_page_1based, weryfikacja: zrodloWariantu?.verification ?? p.verification },
    zatwierdzoneProdukcyjnie: p.production_approved,
    uwagi,
  };
}

/**
 * Otwory prowadnicy od przedniej krawędzi boku dla długości NL — tylko gdy producent podaje je w karcie.
 * Brak wpisu = brak danych (Blum: pozycje wzdłuż głębokości nie są na stronach planowania).
 */
export function otworyProwadnicy(p: ProfilSzuflady, NL: number): number[] | undefined {
  return p.runner_mounting?.holes_from_front_mm?.[String(NL)];
}

/** Największa NL dla szuflady wewnętrznej: NL + dodatek z karty (Amix: +16) ≤ głębokość użytkowa. */
export function dobierzNLWewnetrznej(p: ProfilSzuflady, glebokoscUzytkowaMM: number): number | undefined {
  const dodatek = p.inner_drawer?.depth_min.add_mm ?? 3;
  return [...DLUGOSCI_NOMINALNE].reverse().find((nl) => nl + dodatek <= glebokoscUzytkowaMM && (!p.runner_mounting?.holes_from_front_mm || otworyProwadnicy(p, nl)));
}

/** Wariant wysokości boku szuflady wewnętrznej: najwyższy, którego minimalna komora mieści się w strefie. */
export function wariantWewnetrznej(p: ProfilSzuflady, wysokoscStrefyMM: number, wariantJawny?: string): string | undefined {
  const min = p.inner_drawer?.min_opening_by_variant_mm;
  if (wariantJawny && p.back.height_by_variant_mm[wariantJawny] !== undefined) return wariantJawny;
  if (!min) return undefined;
  return Object.entries(min).sort((a, b) => b[1] - a[1]).find(([, h]) => h <= wysokoscStrefyMM)?.[0];
}
