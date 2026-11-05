import { PROFILE_SZUFLAD, przeliczSzuflade } from "./catalog/drawers.js";
import { backDepth, type FurnitureModel } from "./furniture.js";

/** Shared with the existing calculator; no inferred SKU, permitted NL or machine operations. */
export const furnitureDrawerProfiles = PROFILE_SZUFLAD.map((p) => ({
  id: p.id,
  manufacturer: p.manufacturer,
  family: p.family,
  scope: p.scope,
  variants: Object.keys(p.back.height_by_variant_mm),
}));
export const drawerBoundaryCandidates = (m: FurnitureModel) =>
  m.plates.filter(
    (p) =>
      p.kind === "board" &&
      (p.anchor === "left" ||
        p.anchor === "right" ||
        p.specification?.face === "yz"),
  );
export function furnitureDrawerCalculations(m: FurnitureModel) {
  return m.plates
    .filter((p) => p.kind === "drawer")
    .map((front) => {
      const plan = m.drawerAssemblies?.find((p) => p.frontId === front.id);
      const profile = PROFILE_SZUFLAD.find((p) => p.id === plan?.profileId);
      const candidates = drawerBoundaryCandidates(m);
      const inferredLeft = front.layoutSlot
        ? candidates.find((p) => Math.abs(p.x + p.width - (front.x - 2)) < 0.01)
        : undefined;
      const inferredRight = front.layoutSlot
        ? candidates.find(
            (p) => Math.abs(p.x - (front.x + front.width + 2)) < 0.01,
          )
        : undefined;
      const left = plan?.leftBoundaryId
          ? candidates.find((p) => p.id === plan.leftBoundaryId)
          : (inferredLeft ?? candidates.find((p) => p.anchor === "left")),
        right = plan?.rightBoundaryId
          ? candidates.find((p) => p.id === plan.rightBoundaryId)
          : (inferredRight ?? candidates.find((p) => p.anchor === "right"));
      const width = left && right ? right.x - left.x - left.width : null;
      const rearPanels = m.plates.filter(
        (p) =>
          left &&
          right &&
          p.kind === "board" &&
          p.specification?.face === "xy" &&
          p.z + p.depth <=
            Math.min(left.z + left.depth, right.z + right.depth) / 2 &&
          p.x <= left.x + left.width + 0.01 &&
          p.x + p.width >= right.x - 0.01 &&
          p.y < front.y + front.height &&
          p.y + p.height > front.y,
      );
      const depth =
        left && right
          ? Math.min(m.depth, left.z + left.depth, right.z + right.depth) -
            Math.max(
              backDepth(m),
              left.z,
              right.z,
              ...rearPanels.map((p) => p.z + p.depth),
            )
          : null;
      const blockers: string[] = [];
      if (
        front.layoutSlot &&
        ((!plan?.leftBoundaryId && !inferredLeft) ||
          (!plan?.rightBoundaryId && !inferredRight))
      )
        blockers.push(
          "Brakuje granicy sugerowanej komory. Wybierz istniejące granice albo popraw położenie frontu.",
        );
      if (!plan || !profile) blockers.push("Wybierz system szuflady.");
      if (width === null || width <= 0)
        blockers.push(
          "Brak jednoznacznych boków wyznaczających światło korpusu.",
        );
      if (
        plan &&
        (plan.nominalLength === null ||
          !Number.isFinite(plan.nominalLength) ||
          plan.nominalLength <= 0 ||
          depth === null ||
          plan.nominalLength > depth)
      )
        blockers.push(
          "Długość NL musi być dodatnia i mieścić się w głębokości użytkowej.",
        );
      if (
        left &&
        right &&
        width !== null &&
        !plan?.leftBoundaryId &&
        !plan?.rightBoundaryId &&
        (Math.abs(front.x - (left.x + left.width + 2)) > 0.01 ||
          Math.abs(front.width - (width - 4)) > 0.01)
      )
        blockers.push(
          "Domyślna komora wymaga frontu na całe światło z luzem 2 mm na stronę. Dla własnego podziału wybierz granice osobnej komory.",
        );
      if (
        left &&
        right &&
        (left.y > front.y ||
          right.y > front.y ||
          left.y + left.height < front.y + front.height ||
          right.y + right.height < front.y + front.height)
      )
        blockers.push("Wybrane granice nie obejmują wysokości frontu.");
      if (
        left &&
        right &&
        (front.x < left.x + left.width - 0.01 ||
          front.x + front.width > right.x + 0.01)
      )
        blockers.push("Front wychodzi poza światło wybranej komory.");
      if (
        plan &&
        profile &&
        !Object.hasOwn(profile.back.height_by_variant_mm, plan.variant)
      )
        blockers.push("Wybierz wariant wysokości boku z tego systemu.");
      const obstacles = m.plates.filter(
        (p) =>
          !p.anchor &&
          !rearPanels.some((rear) => rear.id === p.id) &&
          p.kind === "board" &&
          p.y < front.y + front.height &&
          p.y + p.height > front.y &&
          left &&
          right &&
          p.x < right.x &&
          p.x + p.width > left.x + left.width &&
          p.z < m.depth,
      );
      if (obstacles.length)
        blockers.push(
          `Płyty w obszarze szuflady: ${obstacles.map((p) => p.name).join(", ")}. Ustal osobną komorę i sprawdź prześwity.`,
        );
      let result = null as ReturnType<typeof przeliczSzuflade> | null;
      if (
        !blockers.length &&
        plan &&
        plan.nominalLength !== null &&
        profile &&
        width !== null
      ) {
        result = przeliczSzuflade(profile, {
          LW: width,
          NL: plan.nominalLength,
          wariant: plan.variant,
          wysokoscFrontuMM: front.height,
          sciankaTylna: "drewniana",
        });
        if (
          result.dno.szer <= 0 ||
          result.dno.gl <= 0 ||
          result.plecy.szer <= 0
        ) {
          blockers.push(
            "Niedodatni wymiar dna lub pleców — system nie mieści się w świetle.",
          );
          result = null;
        } else if (result.plecy.wys >= front.height) {
          blockers.push(
            "Plecy szuflady są co najmniej tak wysokie jak front — sprawdź podział i wariant.",
          );
          result = null;
        }
      }
      return {
        frontId: front.id,
        frontName: front.name,
        frontHeight: front.height,
        openingWidth: width,
        usableDepth: depth,
        selection: plan ? structuredClone(plan) : null,
        source: profile
          ? {
              document: profile.source_id,
              page: result?.zrodlo.strona ?? profile.pdf_page_1based,
              sha256: profile.source_sha256,
              verification: profile.verification,
            }
          : null,
        result,
        blockers,
        unresolved: [
          "Materiał, dekor i usłojenie dna oraz drewnianych pleców.",
          "Dopuszczalna długość NL i minimalna głębokość montażu konkretnego artykułu.",
          "Położenie skrzynki, prześwity, nośność i pełny ruch szuflady.",
          "Komplet okuć, kody artykułów i zawartość opakowań.",
          "Bazy, średnice, głębokości i pozycje operacji produkcyjnych.",
        ],
        hardwareFunctions: [
          "Boki systemowe lewy/prawy",
          "Prowadnice lewa/prawa",
          "Mocowanie frontu",
          "Mocowanie drewnianej ścianki tylnej",
          "Dodatki właściwe dla wariantu wysokości i otwierania",
        ],
        readyForProduction: false as const,
      };
    });
}
export type FurnitureDrawerCalculation = ReturnType<
  typeof furnitureDrawerCalculations
>[number];
