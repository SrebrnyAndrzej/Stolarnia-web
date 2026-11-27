import { zbudujModul } from "./builder.js";
import { zbudujMebel } from "./silnik/budowa.js";
import type {
  Modul,
  UstawieniaKonstrukcyjne,
  ZbudowanyModul,
} from "./types.js";

/** Public preview and estimate use exactly the same drawer construction, retaining run/island covers. */
export function buildKitchenModule(
  m: Modul,
  construction: UstawieniaKonstrukcyjne,
): ZbudowanyModul {
  const standard = zbudujModul(m, construction);
  if (!m.drzewo) return standard;
  const custom = zbudujMebel(m.drzewo, m, construction);
  const drawer = (code: string) => /^(?:FRONT-SZ|SZ\d|SU\d)/.test(code);
  return {
    ...standard,
    elementy: [
      ...standard.elementy.filter((e) => !drawer(e.kod)),
      ...custom.elementy.filter((e) => drawer(e.kod)),
    ],
    okucia: [
      ...standard.okucia.filter(
        (o) => o.typ !== "systemSzuflad" && o.typ !== "prowadnica",
      ),
      ...custom.okucia.filter(
        (o) =>
          o.typ === "systemSzuflad" ||
          o.typ === "prowadnica" ||
          o.opis.includes("panel frontu szuflady ukrytej"),
      ),
    ],
    ostrzezenia: [...standard.ostrzezenia, ...custom.ostrzezenia],
    szufladyWewnetrzne: custom.szufladyWewnetrzne,
  };
}
