export interface FormularzSzuflad {
  system: string;
  wariant: string;
  szerokoscTryb: "lw" | "korpus";
  lw: string;
  korpus: string;
  bok: string;
  nl: string;
  typFrontu: "zewnetrzny" | "wewnetrzny";
  montazWewnetrzny: "zaDrzwiami" | "zlicowany";
  frontZewSzer: string;
  frontWewSzer: string;
  otworZew: string;
  otworWew: string;
  frontZewWys: string;
  frontWewWys: string;
  frontGrubosc: string;
  stronaZawiasow: "lewa" | "prawa";
  wystawanie: string;
  luzZawiasu: string;
  przesuniecie: string;
  rozstaw: boolean;
  liczba: string;
  szczelina: string;
  dolna: string;
  swiatloWys: string;
  scianka: "drewniana" | "stalowa";
}

export const DOMYSLNY_FORMULARZ: FormularzSzuflad = {
  system: "amix-elite-standard", wariant: "199", szerokoscTryb: "lw", lw: "564", korpus: "600", bok: "18", nl: "550",
  typFrontu: "zewnetrzny", montazWewnetrzny: "zaDrzwiami", frontZewSzer: "", frontWewSzer: "", otworZew: "", otworWew: "",
  frontZewWys: "357", frontWewWys: "357", frontGrubosc: "18", stronaZawiasow: "lewa", wystawanie: "", luzZawiasu: "1", przesuniecie: "0",
  rozstaw: false, liczba: "2", szczelina: "3", dolna: "3", swiatloWys: "698", scianka: "drewniana",
};

export const n = (value: string) => Number(value.trim().replace(",", "."));
export const mm = (value: number) => value.toLocaleString("pl-PL", { maximumFractionDigits: 3 });
export const wewnetrzny = (f: FormularzSzuflad) => f.typFrontu === "wewnetrzny";
export const zaDrzwiami = (f: FormularzSzuflad) => wewnetrzny(f) && f.montazWewnetrzny === "zaDrzwiami";
export const frontSzer = (f: FormularzSzuflad) => wewnetrzny(f) ? f.frontWewSzer : f.frontZewSzer;
export const frontWys = (f: FormularzSzuflad) => wewnetrzny(f) ? f.frontWewWys : f.frontZewWys;
export const otwor = (f: FormularzSzuflad) => wewnetrzny(f) ? f.otworWew : f.otworZew;

export function bledyFormularza(f: FormularzSzuflad, minimumPierwszegoOtworu?: number): Partial<Record<keyof FormularzSzuflad, string>> {
  const errors: Partial<Record<keyof FormularzSzuflad, string>> = {};
  const liczba = (key: keyof FormularzSzuflad, min: number, optional = false) => {
    const raw = String(f[key]);
    if (optional && !raw.trim()) return;
    if (!raw.trim() || !Number.isFinite(n(raw)) || n(raw) < min) errors[key] = min === 0 ? "Wpisz liczbę 0 lub większą." : "Wpisz dodatni wymiar w mm.";
  };
  if (f.szerokoscTryb === "lw") liczba("lw", 0.001);
  else { liczba("korpus", 0.001); liczba("bok", 0.001); }
  liczba("nl", 0.001); liczba(wewnetrzny(f) ? "frontWewWys" : "frontZewWys", 0.001);
  const szerKey = wewnetrzny(f) ? "frontWewSzer" : "frontZewSzer";
  const otworKey = wewnetrzny(f) ? "otworWew" : "otworZew";
  liczba(szerKey, 0.001, true); liczba(otworKey, 0, true);
  if (minimumPierwszegoOtworu !== undefined && otwor(f).trim() && Number.isFinite(n(otwor(f))) && n(otwor(f)) < minimumPierwszegoOtworu) errors[otworKey] = `Minimum ${mm(minimumPierwszegoOtworu)} mm od dołu frontu.`;
  if (zaDrzwiami(f)) {
    liczba("wystawanie", 0, true); liczba("luzZawiasu", 0);
    if (!f.przesuniecie.trim() || !Number.isFinite(n(f.przesuniecie))) errors.przesuniecie = "Wpisz przesunięcie, np. 0 lub −2.";
  }
  if (wewnetrzny(f) && !zaDrzwiami(f)) liczba("frontGrubosc", 0.001);
  if (f.rozstaw) {
    liczba("liczba", 1); liczba("szczelina", 0); liczba("dolna", 0); liczba("swiatloWys", 0.001, true);
    if (!Number.isInteger(n(f.liczba)) || n(f.liczba) > 20) errors.liczba = "Wpisz od 1 do 20 szuflad.";
  }
  return errors;
}

export function parametryKalkulatora(f: FormularzSzuflad, minimumPierwszegoOtworu?: number): string | null {
  if (Object.keys(bledyFormularza(f, minimumPierwszegoOtworu)).length) return null;
  const q = new URLSearchParams();
  const liczba = (key: string, value: string) => { if (value.trim()) q.set(key, String(n(value))); };
  q.set("profilId", f.system);
  if (f.wariant) q.set("wariant", f.wariant);
  if (f.szerokoscTryb === "lw") liczba("LW", f.lw);
  else { liczba("szerokoscKorpusu", f.korpus); liczba("gruboscBoku", f.bok); }
  liczba("NL", f.nl); liczba("wysokoscFrontu", frontWys(f));
  liczba("szerokoscFrontu", frontSzer(f)); liczba("pierwszyOtworOdDolu", otwor(f));
  q.set("sciankaTylna", f.scianka);
  if (zaDrzwiami(f)) {
    q.set("frontZaDrzwiami", "true"); q.set("stronaZawiasow", f.stronaZawiasow);
    liczba("wystawanieZawiasuLewe", f.stronaZawiasow === "lewa" ? f.wystawanie : "0");
    liczba("wystawanieZawiasuPrawe", f.stronaZawiasow === "prawa" ? f.wystawanie : "0");
    liczba("luzOdZawiasu", f.luzZawiasu); liczba("przesuniecieFrontu", f.przesuniecie);
  } else if (wewnetrzny(f)) {
    q.set("frontWewnetrzny", "true"); liczba("gruboscFrontu", f.frontGrubosc);
    // Ten sam serwis zwraca cofnięcie również dla pojedynczej szuflady.
    if (!f.rozstaw) { q.set("liczbaSzuflad", "1"); q.set("dolnaProwadnica", "3"); }
  }
  if (f.rozstaw) {
    liczba("liczbaSzuflad", f.liczba); liczba("szczelinaFrontow", f.szczelina);
    liczba("dolnaProwadnica", f.dolna); liczba("wysokoscWewnetrzna", f.swiatloWys);
  }
  return q.toString();
}

const ENUMY: Partial<Record<keyof FormularzSzuflad, string[]>> = {
  szerokoscTryb: ["lw", "korpus"], typFrontu: ["zewnetrzny", "wewnetrzny"], montazWewnetrzny: ["zaDrzwiami", "zlicowany"],
  stronaZawiasow: ["lewa", "prawa"], scianka: ["drewniana", "stalowa"],
};

export function przywrocFormularz(value: unknown): FormularzSzuflad {
  const wynik = { ...DOMYSLNY_FORMULARZ };
  if (!value || typeof value !== "object") return wynik;
  for (const key of Object.keys(wynik) as (keyof FormularzSzuflad)[]) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v !== typeof wynik[key]) continue;
    if (typeof v === "string" && (v.length > 100 || (ENUMY[key] && !ENUMY[key]!.includes(v)))) continue;
    Object.assign(wynik, { [key]: v });
  }
  return wynik;
}
