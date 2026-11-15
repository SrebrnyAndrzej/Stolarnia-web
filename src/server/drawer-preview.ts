import type { Request } from "express";
import { PROFILE_SZUFLAD } from "../core/catalog/drawers.js";
import { USTAWIENIA_DOMYSLNE } from "../core/settings.js";
import { BladUslugi, Stolarnia } from "../service.js";
export const drawerSystems = () =>
  PROFILE_SZUFLAD.map((p) => ({
    id: p.id,
    producent: p.manufacturer,
    system: p.family,
    grubosc: p.board_thickness_mm,
    mocowanieFrontuMinMM:
      p.front_mounting?.bottom_hole_min_from_front_bottom_mm,
    warianty: Object.entries(p.back.height_by_variant_mm).map(
      ([wariant, plecyWys]) => ({ wariant, plecyWys }),
    ),
  }));
export function calculateDrawer(
  r: Request,
  service: Pick<Stolarnia, "przelicznikSzuflad">,
) {
  const n = (k: string) =>
    r.query[k] !== undefined && r.query[k] !== ""
      ? Number(r.query[k])
      : undefined;
  const t = (k: string) =>
    typeof r.query[k] === "string" && r.query[k]
      ? String(r.query[k])
      : undefined;
  const b = (k: string) => {
    if (r.query[k] === undefined) return undefined;
    if (r.query[k] === "true") return true;
    if (r.query[k] === "false") return false;
    throw new BladUslugi(`Parametr ${k} musi mieć wartość true albo false.`);
  };
  return service.przelicznikSzuflad({
    LW: n("LW"),
    szerokoscKorpusu: n("szerokoscKorpusu"),
    gruboscBoku: n("gruboscBoku"),
    NL: n("NL"),
    glebokoscKorpusu: n("glebokoscKorpusu"),
    wysokoscFrontu: n("wysokoscFrontu"),
    wariant: t("wariant"),
    sciankaTylna: t("sciankaTylna") as "drewniana" | "stalowa" | undefined,
    profilId: t("profilId"),
    liczbaSzuflad: n("liczbaSzuflad"),
    szczelinaFrontow: n("szczelinaFrontow"),
    dolnaProwadnica: n("dolnaProwadnica"),
    wysokoscWewnetrzna: n("wysokoscWewnetrzna"),
    gruboscDolnegoWienca: n("gruboscDolnegoWienca"),
    gruboscFrontu: n("gruboscFrontu"),
    frontWewnetrzny: b("frontWewnetrzny"),
    szerokoscFrontu: n("szerokoscFrontu"),
    pierwszyOtworOdDolu: n("pierwszyOtworOdDolu"),
    frontZaDrzwiami: b("frontZaDrzwiami"),
    stronaZawiasow: t("stronaZawiasow") as "lewa" | "prawa" | undefined,
    dystansLewy: n("dystansLewy"),
    dystansPrawy: n("dystansPrawy"),
    przesuniecieFrontu: n("przesuniecieFrontu"),
    wystawanieZawiasuLewe: n("wystawanieZawiasuLewe"),
    wystawanieZawiasuPrawe: n("wystawanieZawiasuPrawe"),
    luzOdZawiasu: n("luzOdZawiasu"),
  });
}
// Isolated adapter: calculator uses public construction defaults, never workshop settings.
export function previewCalculator(service: Stolarnia) {
  class Preview extends Stolarnia {
    override ustawienia() {
      return structuredClone(USTAWIENIA_DOMYSLNE);
    }
  }
  return new Preview(service.magazyn);
}
