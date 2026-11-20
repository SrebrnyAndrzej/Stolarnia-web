import {
  kitchenModules,
  type KitchenGeometryInput,
} from "./kitchen-configuration.js";
import { zbudujModul } from "./builder.js";
import { USTAWIENIA_DOMYSLNE } from "./settings.js";

/** Shelf cavities from actual boards, without borrowing drawer-front heights as usable capacity. */
export function kitchenShelfSpaces(d: KitchenGeometryInput) {
  return kitchenModules(d)
    .filter((m) => m.konstrukcja === "shelves")
    .flatMap((m) => {
      const built = zbudujModul(m, USTAWIENIA_DOMYSLNE.konstrukcja);
      const boards = built.elementy
        .filter((e) =>
          ["top", "bottom", "shelf", "fixedShelf"].includes(e.rola),
        )
        .sort((a, b) => a.y - b.y);
      const sides = built.elementy.filter((e) => e.rola === "side");
      const left = Math.max(
        0,
        ...sides
          .filter((e) => e.x < m.szerokoscMM / 2)
          .map((e) => e.x + e.szer),
      );
      const right = Math.min(
        m.szerokoscMM,
        ...sides.filter((e) => e.x >= m.szerokoscMM / 2).map((e) => e.x),
      );
      return boards
        .slice(0, -1)
        .map((b, i) => ({
          id: m.id,
          name: m.nazwa,
          wall: m.scianaId,
          width: right - left,
          height: boards[i + 1].y - b.y - b.wys,
          depth: Math.min(b.gl, boards[i + 1].gl),
        }))
        .filter((s) => s.width > 0 && s.height > 0);
    });
}
export function reviewKitchenObjects(d: KitchenGeometryInput) {
  const spaces = kitchenShelfSpaces(d);
  return (d.projectDetails?.objects ?? []).map((o) => {
    const candidates = spaces.filter(
      (s) => !o.cabinetId || s.id === o.cabinetId,
    );
    const fit = candidates.find(
      (s) => s.width >= o.width && s.height >= o.height && s.depth >= o.depth,
    );
    return {
      ...o,
      fit,
      message: fit
        ? `Gabaryt pasuje do światła półki ${fit.width} × ${fit.height} × ${fit.depth} mm. Sprawdź jeszcze przejście przez drzwi, zawiasy i dostęp ręką.`
        : "Brak potwierdzonej wnęki półkowej dla tego gabarytu. Wybierz inną szafkę lub zmień półki. Szuflady, kosze i wnęki AGD wymagają doboru konkretnego okucia.",
    };
  });
}
