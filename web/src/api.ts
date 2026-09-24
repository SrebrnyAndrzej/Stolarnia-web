import type {
  Arkusz,
  Formatka,
  Material,
  ModulKatalogowy,
  Modul,
  NotatkaProjektu,
  Okucie,
  PodsumowanieWariantu,
  Projekt,
  StatusProjektu,
  UrzadzenieAGD,
  ProjektWyceny,
  RaportRozkroju,
  UstawieniaStolarni,
  ZapotrzebowanieObrzeza,
  ZbudowanyModul,
} from "../../src/core/types";

export type { Arkusz, Formatka, Material, Modul, ModulKatalogowy, NotatkaProjektu, Okucie, PodsumowanieWariantu, Projekt, StatusProjektu, UrzadzenieAGD, UstawieniaStolarni };

export interface Uwaga {
  poziom: "blad" | "ostrzezenie" | "info";
  modulId?: string;
  komunikat: string;
}

export interface Analiza {
  projekt: Projekt;
  zbudowane: ZbudowanyModul[];
  formatki: Formatka[];
  obrzeza: ZapotrzebowanieObrzeza[];
  rozkroj: RaportRozkroju;
  projektWyceny: ProjektWyceny;
  warianty: PodsumowanieWariantu[];
  walidacja: Uwaga[];
}

export interface ProjektSkrot {
  id: string;
  nazwa: string;
  klient: string;
  telefon?: string;
  status: StatusProjektu;
  liczbaModulow: number;
  zmieniono: string;
  terminMontazu?: string;
  otwarteNotatki: number;
  ostatniaNotatka?: string;
}

async function zadanie<T>(metoda: string, url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: metoda,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const dane = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((dane as { blad?: string }).blad ?? `Błąd ${r.status}`);
  return dane as T;
}

export const api = {
  umowy: (id: string) => zadanie<import("../../src/core/contracts").Umowa[]>("GET", `/api/projekty/${id}/umowy`),
  dodajUmowe: (id: string, dane: import("../../src/core/contracts").DaneUmowy) => zadanie<import("../../src/core/contracts").Umowa>("POST", `/api/projekty/${id}/umowy`, dane),
  katalog: () => zadanie<ModulKatalogowy[]>("GET", "/api/katalog"),
  materialy: (filtr?: { typ?: string; szukaj?: string }) => {
    const q = new URLSearchParams();
    if (filtr?.typ) q.set("typ", filtr.typ);
    if (filtr?.szukaj) q.set("szukaj", filtr.szukaj);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return zadanie<Material[]>("GET", `/api/materialy${suffix}`);
  },
  zapiszMaterial: (m: Partial<Material>) => (m.id ? zadanie<Material>("PUT", `/api/materialy/${m.id}`, m) : zadanie<Material>("POST", "/api/materialy", m)),
  okucia: () => zadanie<Okucie[]>("GET", "/api/okucia"),
  zapiszOkucie: (o: Partial<Okucie> & { id: string }) => zadanie<Okucie>("PUT", `/api/okucia/${o.id}`, o),
  ustawienia: () => zadanie<UstawieniaStolarni>("GET", "/api/ustawienia"),
  zmienUstawienia: (u: unknown) => zadanie<{ ustawienia: UstawieniaStolarni; ostrzezenia: string[] }>("PATCH", "/api/ustawienia", u),

  projekty: () => zadanie<ProjektSkrot[]>("GET", "/api/projekty"),
  utworzProjekt: (d: unknown) => zadanie<Projekt>("POST", "/api/projekty", d),
  zmienProjekt: (id: string, d: unknown) => zadanie<Projekt>("PATCH", `/api/projekty/${id}`, d),
  usunProjekt: (id: string) => zadanie("DELETE", `/api/projekty/${id}`),
  duplikujProjekt: (id: string) => zadanie<Projekt>("POST", `/api/projekty/${id}/duplikuj`, {}),
  analiza: (id: string) => zadanie<Analiza>("GET", `/api/projekty/${id}/analiza`),
  scianySzkicow: (id: string) => zadanie<{ dolne: string[]; wysokie: string[] }>("GET", `/api/projekty/${id}/szkice`),
  dodajNotatke: (id: string, tekst: string) => zadanie<NotatkaProjektu>("POST", `/api/projekty/${id}/notatki`, { tekst }),
  zmienNotatke: (id: string, nid: string, d: { tekst?: string; zalatwiona?: boolean }) => zadanie<NotatkaProjektu>("PATCH", `/api/projekty/${id}/notatki/${nid}`, d),
  usunNotatke: (id: string, nid: string) => zadanie("DELETE", `/api/projekty/${id}/notatki/${nid}`),

  zmienPomieszczenie: (id: string, pid: string, d: unknown) => zadanie("PATCH", `/api/projekty/${id}/pomieszczenia/${pid}`, d),
  dodajSciane: (id: string, pid: string, d: unknown) => zadanie("POST", `/api/projekty/${id}/pomieszczenia/${pid}/sciany`, d),
  zmienSciane: (id: string, sid: string, d: unknown) => zadanie("PATCH", `/api/projekty/${id}/sciany/${sid}`, d),
  usunSciane: (id: string, sid: string) => zadanie("DELETE", `/api/projekty/${id}/sciany/${sid}`),

  konwerterCad: () => zadanie<{ dwg: { typ: string; sciezka: string } | null }>("GET", "/api/cad/konwerter"),
  analizaCad: (base64: string, opcje: { warstwa?: string; jednostka?: string }) =>
    zadanie<{ jednostka: string; warstwy: { nazwa: string; odcinki: number; dlugoscM: number }[]; sciany: { nazwa: string; dlugoscMM: number; x1: number; y1: number; x2: number; y2: number }[]; liczbaLancuchow: number }>(
      "POST",
      "/api/cad/analiza",
      { base64, ...opcje },
    ),
  importujCad: (id: string, base64: string, opcje: { warstwa?: string; jednostka?: string; nazwa?: string }) => zadanie("POST", `/api/projekty/${id}/import-cad`, { base64, ...opcje }),
  przywrocStan:(id: string, stan: Pick<Projekt, "pomieszczenia" | "moduly">) => zadanie<Projekt>("PUT", `/api/projekty/${id}/stan`, stan),
  wypelnijLuke: (id: string, d: { scianaId: string; xMM: number; szerokoscMM: number; wiszacy: boolean }) => zadanie<Modul>("POST", `/api/projekty/${id}/luka`, d),
  dodajModul: (id: string, d: unknown) => zadanie<Modul>("POST", `/api/projekty/${id}/moduly`, d),
  zmienModul: (id: string, mid: string, d: unknown) => zadanie<Modul>("PATCH", `/api/projekty/${id}/moduly/${mid}`, d),
  usunModul: (id: string, mid: string) => zadanie("DELETE", `/api/projekty/${id}/moduly/${mid}`),
  duplikujModul: (id: string, mid: string) => zadanie<Modul>("POST", `/api/projekty/${id}/moduly/${mid}/duplikuj`, {}),
};

export const idz = (hash: string) => {
  location.hash = hash;
};

export const zl =(v: number) => v.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
export const mm = (v: number) => `${Math.round(v * 10) / 10}`.replace(".", ",");
