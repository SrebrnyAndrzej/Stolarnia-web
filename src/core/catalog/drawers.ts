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

/** Wymiary dna i pleców wg profilu dla światła korpusu LW i długości NL. */
export function wymiarySzuflady(p: ProfilSzuflady, LW: number, NL: number, wysokoscFrontuMM: number) {
  const warianty = Object.entries(p.back.height_by_variant_mm).sort((a, b) => a[1] - b[1]);
  // Najwyższe plecy mieszczące się za frontem z zapasem 40 mm; w innym razie najniższe.
  const wariant = [...warianty].reverse().find(([, h]) => h + 40 <= wysokoscFrontuMM) ?? warianty[0];
  return {
    dnoSzer: LW - p.bottom.width.subtract_mm,
    dnoGl: NL - p.bottom.depth.subtract_mm,
    plecySzer: LW - p.back.width.subtract_mm,
    plecyWys: wariant[1],
    wariant: wariant[0],
    grubosc: p.board_thickness_mm,
  };
}
