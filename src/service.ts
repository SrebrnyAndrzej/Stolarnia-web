import { schematUmowy, type Umowa } from "./core/contracts.js";
import { PRODUKTY_OKUC } from "./core/catalog/hardware-products.js";
import type { ProduktOkucia } from "./core/hardware-products.js";
import { createHash, randomUUID } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { zbudujModul } from "./core/builder.js";
import { dobierzNL, PROFILE_SZUFLAD, przeliczSzuflade, mocowanieFrontu } from "./core/catalog/drawers.js";
import { wejsciePrzelicznika, rozstawProwadnic, frontZaZwyklymiZawiasami, type WejsciePrzelicznika } from "./core/kalkulator-szuflad.js";
import { mebelZModulu } from "./core/silnik/adapter.js";
import { zbudujMebel } from "./core/silnik/budowa.js";
import { BladPolecenia, dodajSzufladyZaDrzwiami, dodajUkrytaSzuflade, podzielFront, podzielWnetrze, ustawRozmiarFrontu, zamienDrzwiNaSzuflady } from "./core/silnik/polecenia.js";
import { DOMYSLNE_PLECY, DOMYSLNY_BLAT, DOMYSLNY_FRONT, DOMYSLNY_KORPUS } from "./core/catalog/materials.js";
import { domyslnaKonfiguracja, KATALOG_MODULOW, modulKatalogowy } from "./core/catalog/modules.js";
import { formatkiCSV, listaFormatek, rozkroj, zapotrzebowanieObrzeza, type MaterialyModulu } from "./core/production.js";
import { wycenWszystkie, zbudujProjektWyceny } from "./core/pricing.js";
import { scalUstawienia, walidujUstawienia, type DeepPartial } from "./core/settings.js";
import type {
  KategoriaModulu,
  Klient,
  KonfiguracjaModulu,
  KonstrukcjaModulu,
  Material,
  CennikMaterialow,
  Modul,
  NotatkaProjektu,
  Okucie,
  OkuciaProjektu,
  Pomieszczenie,
  Projekt,
  Sciana,
  StatusProjektu,
  UrzadzenieAGD,
  UstawieniaStolarni,
  WariantWyceny,
  WydanieProdukcyjne,
  WykonczeniePowierzchni,
  ZbudowanyModul,
  DokumentacjaProjektu,
} from "./core/types.js";
import { walidujProjekt } from "./core/validation.js";
import { scianyNaRzucie } from "./core/geometry.js";
import { OPIS_ZALOZEN_UKLADU, opisSciany, planSzybkiegoUkladu, planWypelnieniaSciany, zajeteNaScianie, type OpcjeSzybkiegoUkladu, type OpcjeWypelnienia } from "./core/uklad.js";
import { opisBleduZod, schematOkucProjektu, schematStylu, schematSzybkiegoUkladu, schematWypelnienia } from "./schematy-szybki.js";
import { schematStanuProjektu } from "./schematy-stanu.js";
import { DEKORY, kluczDekoru } from "./core/catalog/decors.js";
import type { z } from "zod";
import { blatZDekoru, plytaZDekoru, type RolaStylu, type RozstrzygniecieStylu, type WyborMaterialu } from "./core/styl.js";
import { czyStatus, STATUSY_PROJEKTU } from "./core/statusy.js";
import { dokumentacjaProjektu } from "./core/technologia.js";
import { ofertaPdf } from "./export/oferta.js";
import { dokumentacjaPdf } from "./export/pdf.js";
import { scianySzkicow, szkicePdf, type OpcjeSzkicow } from "./export/szkice.js";
import dxfParserModul from "dxf-parser";
import { czyDwg, dwgNaDxf } from "./core/dwg.js";
import { jednostkaZNaglowka, odcinkiDxf, scianyZDxf, warstwyDxf, type DxfDane, type JednostkaDxf } from "./core/dxf.js";
import { Magazyn, type BazaDanych } from "./store/store.js";

/**
 * JSON odpowiedzi bez migawek wydań (gzip, dziesiątki kB na wydanie) — przeglądarka i MCP dostają tylko metadane.
 * Pełne dane wydania czyta wyłącznie serwer (PDF, dokumentacja wydania).
 */
export function jsonBezMigawek(v: unknown): string {
  const tekst = JSON.stringify(v);
  if (!tekst || !tekst.includes('"wydania"')) return tekst;
  return JSON.stringify(JSON.parse(tekst, (k, x) => (k === "wydania" && Array.isArray(x) ? x.map((w: { dane?: string }) => ({ ...w, dane: undefined })) : x)));
}

export class BladUslugi extends Error {}

/** Walidacja wejścia schematem zod (REST i MCP) — błąd jako BladUslugi (HTTP 400). */
function parsuj<T extends z.ZodTypeAny>(schemat: T, dane: unknown): z.infer<T> {
  const r = schemat.safeParse(dane);
  if (!r.success) throw new BladUslugi(`Nieprawidłowe dane: ${opisBleduZod(r.error)}`);
  return r.data;
}

// dxf-parser to pakiet CommonJS/UMD — w zależności od loadera klasa jest pod default albo bezpośrednio.
const DxfParser = ((dxfParserModul as unknown as { default?: unknown }).default ?? dxfParserModul) as new () => { parseSync(t: string): unknown };

const id = () => randomUUID().slice(0, 8);
const teraz = () => new Date().toISOString();
const PROG_WISZACYCH_MM = 1000;
/** Widełki propozycji wstępnej względem bieżącej kalkulacji (decyzja domyślna, odwracalna: OCENA-kreatora §7). */
export const WIDELKI_WSTEPNE = { dol: 0.95, gora: 1.15 };

export interface NowaSciana {
  nazwa?: string;
  dlugoscMM: number;
  wysokoscMM?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  wirtualna?: boolean;
  /** Wykończenie lica (wizualizacja); null usuwa. */
  wykonczenie?: WykonczeniePowierzchni | null;
}

export interface NowyModul {
  katalogId?: string;
  nazwa?: string;
  kategoria?: KategoriaModulu;
  konstrukcja?: KonstrukcjaModulu;
  scianaId?: string;
  pozycjaXMM?: number;
  pozycjaYMM?: number;
  szerokoscMM?: number;
  wysokoscMM?: number;
  glebokoscMM?: number;
  konfiguracja?: Partial<KonfiguracjaModulu>;
  materialKorpusuId?: string;
  materialFrontuId?: string;
  uwagi?: string;
}

export class Stolarnia {
  constructor(readonly magazyn = new Magazyn()) {}

  // ---------- Katalogi ----------

  katalogModulow(filtr?: { kategoria?: string; szukaj?: string }) {
    const s = filtr?.szukaj?.toLowerCase();
    return KATALOG_MODULOW.filter(
      (m) =>
        (!filtr?.kategoria || m.category === filtr.kategoria) &&
        (!s || m.name.toLowerCase().includes(s) || m.id.includes(s) || m.tags.some((t) => t.includes(s))),
    );
  }

  materialy(filtr?: { typ?: string; szukaj?: string; tylkoAktywne?: boolean }): Material[] {
    const s = filtr?.szukaj?.toLowerCase();
    return this.magazyn
      .odczytaj()
      .materialy.filter(
        (m) =>
          (!filtr?.typ || m.typ === filtr.typ) &&
          (!filtr?.tylkoAktywne || m.aktywny) &&
          (!s || `${m.kod} ${m.nazwa} ${m.producent} ${m.dekor}`.toLowerCase().includes(s)),
      );
  }

  cennikMaterialow(): CennikMaterialow {
    return structuredClone(this.magazyn.odczytaj().cennikMaterialow ?? {});
  }

  zapiszCeneMaterialu(materialId: string, cenaNetto: number): CennikMaterialow[string] {
    if (!Number.isFinite(cenaNetto) || cenaNetto <= 0 || cenaNetto > 1_000_000 || Math.abs(cenaNetto * 100 - Math.round(cenaNetto * 100)) > 0.00001) {
      throw new BladUslugi("Cena własna musi być dodatnia, nie większa niż 1 000 000 zł i mieć maksymalnie dwa miejsca po przecinku.");
    }
    return this.magazyn.zmien((b) => {
      const material = b.materialy.find((m) => m.id === materialId);
      if (!material) throw new BladUslugi(`Nie ma materiału o id "${materialId}".`);
      const wpis = { materialId, cenaNetto: Math.round(cenaNetto * 100) / 100, zmieniono: teraz() };
      b.cennikMaterialow ??= {};
      b.cennikMaterialow[materialId] = wpis;
      return wpis;
    });
  }

  usunCeneMaterialu(materialId: string): void {
    this.magazyn.zmien((b) => {
      if (b.cennikMaterialow) delete b.cennikMaterialow[materialId];
    });
  }

  zapiszMaterial(dane: Partial<Material> & { id?: string }): Material {
    return this.magazyn.zmien((b) => {
      const istn = dane.id ? b.materialy.find((m) => m.id === dane.id) : undefined;
      if (istn) {
        Object.assign(istn, dane, { id: istn.id });
        return istn;
      }
      if (!dane.nazwa || !dane.typ) throw new BladUslugi("Nowy materiał wymaga pól: nazwa, typ.");
      const nowy: Material = {
        id: dane.id ?? `m-${id()}`,
        kod: dane.kod ?? dane.nazwa,
        nazwa: dane.nazwa,
        producent: dane.producent ?? "",
        typ: dane.typ,
        dekor: dane.dekor ?? dane.nazwa,
        gruboscMM: dane.gruboscMM ?? 18,
        szerokoscArkuszaMM: dane.szerokoscArkuszaMM ?? 0,
        wysokoscArkuszaMM: dane.wysokoscArkuszaMM ?? 0,
        jednostka: dane.jednostka ?? "metrKwadratowy",
        cenaNetto: dane.cenaNetto ?? 0,
        vatProcent: dane.vatProcent ?? 23,
        rabatProcent: dane.rabatProcent ?? 0,
        aktywny: dane.aktywny ?? true,
        kierunekDekoru: dane.kierunekDekoru ?? false,
        kolorHEX: dane.kolorHEX ?? "#cccccc",
        notatki: dane.notatki ?? "",
        grupaDekoru: dane.grupaDekoru,
        kolekcja: dane.kolekcja,
        struktura: dane.struktura,
        zdjecieURL: dane.zdjecieURL,
        zrodloKatalogu: dane.zrodloKatalogu,
        artykulProducenta: dane.artykulProducenta,
      };
      b.materialy.push(nowy);
      return nowy;
    });
  }

  okucia(filtr?: { typ?: string; szukaj?: string }): Okucie[] {
    const s = filtr?.szukaj?.toLowerCase();
    return this.magazyn
      .odczytaj()
      .okucia.filter((o) => (!filtr?.typ || o.typ === filtr.typ) && (!s || `${o.nazwa} ${o.producent} ${o.profilID}`.toLowerCase().includes(s)));
  }

  /** Katalog okuć z filtrami i stronicowaniem (kilka tysięcy pozycji — nie wysyłamy całości do przeglądarki). */
  katalogOkuc(f: { kategoria?: string; producent?: string; szukaj?: string; rodzaj?: string; od?: number; ile?: number } = {}) {
    const s = f.szukaj?.trim().toLocaleLowerCase("pl");
    const kat = (p: ProduktOkucia) => p.kategoria ?? "szuflady";
    const wKategorii = PRODUKTY_OKUC.filter((p) => (!f.kategoria || kat(p) === f.kategoria) && (!f.rodzaj || p.rodzaj === f.rodzaj) &&
      (!s || `${p.nazwa} ${p.sku} ${p.ean ?? ""} ${p.symbolDystrybutora ?? ""} ${p.producent} ${p.system}`.toLocaleLowerCase("pl").includes(s)));
    const pasujace = wKategorii.filter((p) => !f.producent || p.producent === f.producent);
    // Najpierw pozycje jednoznaczne do zamówienia (indeks producenta), potem dystrybutora, na końcu karty rodzin.
    const waga = (p: ProduktOkucia) => ({ wariant: 0, dystrybutor: 1, bazowy: 2, rodzina: 3 })[p.rodzajSKU] ?? 4;
    pasujace.sort((a, b) => waga(a) - waga(b) || a.producent.localeCompare(b.producent) || a.sku.localeCompare(b.sku, "pl", { numeric: true }) || a.nazwa.localeCompare(b.nazwa, "pl"));
    const licz = (lista: ProduktOkucia[], k: (p: ProduktOkucia) => string) => lista.reduce<Record<string, number>>((m, p) => ((m[k(p)] = (m[k(p)] ?? 0) + 1), m), {});
    const od = Math.max(0, Number(f.od) || 0);
    const ile = Math.min(200, Math.max(1, Number(f.ile) || 48));
    return {
      razem: pasujace.length,
      produkty: pasujace.slice(od, od + ile),
      kategorie: licz(PRODUKTY_OKUC, kat),
      producenci: licz(wKategorii, (p) => p.producent),
    };
  }

  dodajProduktOkucia(produktId: string, cenaNetto: number): Okucie {
    const produkt = PRODUKTY_OKUC.find(p => p.id === produktId);
    if (!produkt) throw new BladUslugi("Nie znaleziono produktu.");
    // Do cennika trafia tylko pozycja jednoznaczna do zamówienia: indeks producenta albo symbol dystrybutora z EAN.
    const jednoznaczny = produkt.rodzajSKU === "wariant" || (produkt.rodzajSKU === "dystrybutor" && !!produkt.symbolDystrybutora);
    if (!jednoznaczny) throw new BladUslugi("Wybierz dokładny wariant u producenta; indeks rodziny nie określa kompletacji.");
    if (typeof cenaNetto !== "number" || !Number.isFinite(cenaNetto) || cenaNetto <= 0 || cenaNetto > 1000000 || Math.abs(cenaNetto * 100 - Math.round(cenaNetto * 100)) > 0.00001) throw new BladUslugi("Podaj poprawną cenę zakupu netto (do dwóch miejsc po przecinku).");
    return this.magazyn.zmien(b => {
      const id = `katalog.${produkt.id}`;
      const istnieje = b.okucia.find(o => o.id === id);
      if (istnieje) return istnieje;
      const typ = TYP_Z_KATEGORII[produkt.kategoria ?? "szuflady"] ?? "inne";
      const jednostka = produkt.kategoria === "wkrety" || produkt.kategoria === "kleje" || produkt.kategoria === "chemia" ? "op." : produkt.rodzaj === "zestaw" ? "kpl." : "szt.";
      const o: Okucie = { id, profilID: id, nazwa: produkt.nazwa, producent: produkt.producent, system: produkt.system,
        typ, jednostka, cenaNetto, rabatProcent: 0, vatProcent: 23,
        poziomWyceny: ["Blum", "Hettich", "Häfele"].includes(produkt.producent) ? "premium" : "standard", aktywne: true,
        opis: `Produkt katalogowy${produkt.zrodloTyp === "dystrybutor" ? " (dane dystrybutora)" : ""}. Nieprzypisany do reguł produkcyjnych; nie zmienia automatycznie okuć istniejących projektów.`,
        skuProducenta: produkt.sku || produkt.symbolDystrybutora || undefined, zdjecieURL: produkt.zdjecieURL, zrodloURL: produkt.zrodloURL };
      b.okucia.push(o); return o;
    });
  }

  zapiszOkucie(dane: Partial<Okucie> & { id: string }): Okucie {
    return this.magazyn.zmien((b) => {
      const o = b.okucia.find((x) => x.id === dane.id);
      if (!o) throw new BladUslugi(`Nie ma okucia o id "${dane.id}".`);
      Object.assign(o, dane, { id: o.id, profilID: o.profilID });
      return o;
    });
  }

  // ---------- Ustawienia ----------

  ustawienia(): UstawieniaStolarni {
    return this.magazyn.odczytaj().ustawienia;
  }

  zmienUstawienia(zmiany: DeepPartial<UstawieniaStolarni>): { ustawienia: UstawieniaStolarni; ostrzezenia: string[] } {
    return this.magazyn.zmien((b) => {
      b.ustawienia = scalUstawienia(b.ustawienia, zmiany);
      return { ustawienia: b.ustawienia, ostrzezenia: walidujUstawienia(b.ustawienia) };
    });
  }

  // ---------- Projekty ----------

  projekty() {
    return this.magazyn.odczytaj().projekty.map((p) => ({
      id: p.id,
      nazwa: p.nazwa,
      klient: p.klient.nazwa,
      status: p.status,
      telefon: p.klient.telefon,
      liczbaModulow: p.moduly.length,
      zmieniono: p.zmieniono,
      terminMontazu: p.terminMontazu,
      skladanieKorpusow: p.skladanieKorpusow,
      otwarteNotatki: (p.notatkiRobocze ?? []).filter((n) => !n.zalatwiona).length,
      ostatniaNotatka: (p.notatkiRobocze ?? []).find((n) => !n.zalatwiona)?.tekst,
    }));
  }

  umowy(projektId: string): Umowa[] { return this.projekt(projektId).umovy ?? []; }

  dodajUmowe(projektId: string, dane: unknown): Umowa {
    const parsed = schematUmowy.safeParse(dane);
    if (!parsed.success) throw new BladUslugi(parsed.error.issues.map(x => `${x.path.join(".")}: ${x.message}`).join("; "));
    const umowa: Umowa = { ...parsed.data, id: randomUUID(), utworzono: teraz() };
    this.edytuj(projektId, p => {
      p.umovy ??= [];
      if (p.umovy.some(u => u.numer === umowa.numer)) throw new BladUslugi("Umowa o tym numerze już istnieje w projekcie.");
      p.umovy.push(umowa);
    });
    return umowa;
  }

  umowa(projektId: string, umowaId: string): Umowa {
    const u = this.umowy(projektId).find(x => x.id === umowaId);
    if (!u) throw new BladUslugi("Nie znaleziono umowy w tym projekcie.");
    return u;
  }

  projekt(projektId: string): Projekt {
    const p = this.magazyn.odczytaj().projekty.find((x) => x.id === projektId);
    if (!p) throw new BladUslugi(`Nie ma projektu o id "${projektId}".`);
    return p;
  }

  utworzProjekt(dane: {
    nazwa: string;
    klient?: Partial<Klient>;
    pomieszczenie?: string;
    sciany?: NowaSciana[];
    materialKorpusuId?: string;
    materialFrontuId?: string;
    materialBlatuId?: string;
    notatki?: string;
  }): Projekt {
    return this.magazyn.zmien((b) => {
      const sciany = (dane.sciany?.length ? dane.sciany : [{ nazwa: "Ściana A", dlugoscMM: 3600 }]).map((s, i) => nowaSciana(s, i));
      const pom: Pomieszczenie = {
        id: id(),
        nazwa: dane.pomieszczenie ?? "Kuchnia",
        sciany,
        materialKorpusuId: sprawdzMaterial(b, dane.materialKorpusuId ?? DOMYSLNY_KORPUS),
        materialFrontuId: sprawdzMaterial(b, dane.materialFrontuId ?? DOMYSLNY_FRONT),
        materialBlatuId: sprawdzMaterial(b, dane.materialBlatuId ?? DOMYSLNY_BLAT),
      };
      const p: Projekt = {
        id: id(),
        nazwa: dane.nazwa,
        klient: { nazwa: "", telefon: "", email: "", adres: "", ...dane.klient },
        status: "szkic",
        pomieszczenia: [pom],
        moduly: [],
        utworzono: teraz(),
        zmieniono: teraz(),
        rewizja: 1,
        notatki: dane.notatki ?? "",
      };
      b.projekty.push(p);
      return p;
    });
  }

  zmienProjekt(projektId: string, dane: { cenaUzgodnionaBrutto?: number | null; nazwa?: string; klient?: Partial<Klient>; status?: StatusProjektu; notatki?: string; terminMontazu?: string | null; skladanieKorpusow?: "warsztat" | "naMiejscu" | null; agd?: UrzadzenieAGD[] }): Projekt {
    const cena = dane.cenaUzgodnionaBrutto;
    if (cena !== undefined && cena !== null && (typeof cena !== "number" || !Number.isFinite(cena) || cena <= 0 || cena > 100000000 || Math.abs(cena * 100 - Math.round(cena * 100)) > 0.00001)) throw new BladUslugi("Cena uzgodniona musi być dodatnią kwotą do 100 000 000 zł, z maksymalnie dwoma miejscami po przecinku.");
    if (dane.agd !== undefined) dane = { ...dane, agd: sprawdzAGD(dane.agd) };
    if (dane.status !== undefined && !czyStatus(dane.status)) throw new BladUslugi(`Nieznany status "${dane.status}". Dozwolone: ${STATUSY_PROJEKTU.join(", ")}.`);
    if (dane.terminMontazu && !/^\d{4}-\d{2}-\d{2}$/.test(dane.terminMontazu)) throw new BladUslugi("Termin montażu w formacie RRRR-MM-DD.");
    if (dane.skladanieKorpusow && dane.skladanieKorpusow !== "warsztat" && dane.skladanieKorpusow !== "naMiejscu") throw new BladUslugi("Składanie korpusów: „warsztat” albo „naMiejscu”.");
    // Dane tematu (CRM) nie zmieniają konstrukcji — bez podbijania rewizji projektu.
    const tylkoCRM = dane.nazwa === undefined && dane.notatki === undefined;
    return (tylkoCRM ? this.edytujTemat.bind(this) : this.edytuj.bind(this))(projektId, (p) => {
      if (dane.nazwa) p.nazwa = dane.nazwa;
      if (dane.klient) p.klient = { ...p.klient, ...dane.klient };
      if (dane.status && dane.status !== p.status) {
        p.status = dane.status;
        (p.historiaStatusow ??= []).push({ status: dane.status, data: teraz() });
      }
      if (dane.notatki !== undefined) p.notatki = dane.notatki;
      if (cena !== undefined) { if (cena === null) delete p.cenaUzgodnionaBrutto; else p.cenaUzgodnionaBrutto = Math.round(cena * 100) / 100; }
      if (dane.terminMontazu !== undefined) p.terminMontazu = dane.terminMontazu || undefined;
      if (dane.skladanieKorpusow !== undefined) p.skladanieKorpusow = dane.skladanieKorpusow || undefined;
      if (dane.agd !== undefined) p.agd = dane.agd.length ? dane.agd : undefined;
    });
  }

  // ---------- Szkice wstępne dla klienta ----------

  scianySzkicow(projektId: string) {
    return scianySzkicow(this.projekt(projektId));
  }

  async szkicePdf(projektId: string, opcje: OpcjeSzkicow = {}): Promise<Buffer> {
    try {
      return await szkicePdf(this.projekt(projektId), opcje);
    } catch (e) {
      if (e instanceof BladUslugi) throw e;
      throw new BladUslugi((e as Error).message);
    }
  }

  // ---------- Notatki robocze (mikro CRM) ----------

  dodajNotatke(projektId: string, tekst: string): NotatkaProjektu {
    const t = String(tekst ?? "").trim();
    if (!t) throw new BladUslugi("Notatka nie może być pusta.");
    const n: NotatkaProjektu = { id: id(), tekst: t, utworzono: teraz(), zalatwiona: false };
    this.edytujTemat(projektId, (p) => {
      (p.notatkiRobocze ??= []).unshift(n);
    });
    return n;
  }

  zmienNotatke(projektId: string, notatkaId: string, dane: { tekst?: string; zalatwiona?: boolean }): NotatkaProjektu {
    let wynik!: NotatkaProjektu;
    this.edytujTemat(projektId, (p) => {
      const n = p.notatkiRobocze?.find((x) => x.id === notatkaId);
      if (!n) throw new BladUslugi(`Nie ma notatki o id "${notatkaId}".`);
      if (dane.tekst !== undefined) {
        if (!dane.tekst.trim()) throw new BladUslugi("Notatka nie może być pusta.");
        n.tekst = dane.tekst.trim();
      }
      if (dane.zalatwiona !== undefined && dane.zalatwiona !== n.zalatwiona) {
        n.zalatwiona = dane.zalatwiona;
        n.zalatwiono = dane.zalatwiona ? teraz() : undefined;
      }
      wynik = n;
    });
    return wynik;
  }

  usunNotatke(projektId: string, notatkaId: string): void {
    this.edytujTemat(projektId, (p) => {
      const i = p.notatkiRobocze?.findIndex((x) => x.id === notatkaId) ?? -1;
      if (i < 0) throw new BladUslugi(`Nie ma notatki o id "${notatkaId}".`);
      p.notatkiRobocze!.splice(i, 1);
    });
  }

  usunProjekt(projektId: string): void {
    this.magazyn.zmien((b) => {
      const i = b.projekty.findIndex((p) => p.id === projektId);
      if (i < 0) throw new BladUslugi(`Nie ma projektu o id "${projektId}".`);
      b.projekty.splice(i, 1);
    });
  }

  duplikujProjekt(projektId: string, nazwa?: string): Projekt {
    return this.magazyn.zmien((b) => {
      const zrodlo = b.projekty.find((p) => p.id === projektId);
      if (!zrodlo) throw new BladUslugi(`Nie ma projektu o id "${projektId}".`);
      const kopia: Projekt = { ...structuredClone(zrodlo), umovy: [], wydania: [], id: id(), nazwa: nazwa ?? `${zrodlo.nazwa} (kopia)`, status: "szkic", rewizja: 1, utworzono: teraz(), zmieniono: teraz() };
      delete kopia.cenaUzgodnionaBrutto;
      b.projekty.push(kopia);
      return kopia;
    });
  }

  // ---------- Pomieszczenia i ściany ----------

  dodajPomieszczenie(projektId: string, dane: { nazwa: string; sciany?: NowaSciana[]; materialKorpusuId?: string; materialFrontuId?: string; materialBlatuId?: string }): Pomieszczenie {
    let wynik!: Pomieszczenie;
    this.edytuj(projektId, (p, b) => {
      wynik = {
        id: id(),
        nazwa: dane.nazwa,
        sciany: (dane.sciany?.length ? dane.sciany : [{ dlugoscMM: 3000 }]).map((s, i) => nowaSciana(s, i)),
        materialKorpusuId: sprawdzMaterial(b, dane.materialKorpusuId ?? DOMYSLNY_KORPUS),
        materialFrontuId: sprawdzMaterial(b, dane.materialFrontuId ?? DOMYSLNY_FRONT),
        materialBlatuId: sprawdzMaterial(b, dane.materialBlatuId ?? DOMYSLNY_BLAT),
      };
      p.pomieszczenia.push(wynik);
    });
    return wynik;
  }

  zmienPomieszczenie(
    projektId: string,
    pomieszczenieId: string,
    dane: { nazwa?: string; materialKorpusuId?: string; materialFrontuId?: string; materialBlatuId?: string; podloga?: WykonczeniePowierzchni | null; bezUchwytow?: boolean },
  ): Pomieszczenie {
    let wynik!: Pomieszczenie;
    this.edytuj(projektId, (p, b) => {
      const r = p.pomieszczenia.find((x) => x.id === pomieszczenieId);
      if (!r) throw new BladUslugi(`Nie ma pomieszczenia o id "${pomieszczenieId}".`);
      if (dane.nazwa) r.nazwa = dane.nazwa;
      if (dane.materialKorpusuId) r.materialKorpusuId = sprawdzMaterial(b, dane.materialKorpusuId);
      if (dane.materialFrontuId) r.materialFrontuId = sprawdzMaterial(b, dane.materialFrontuId);
      if (dane.materialBlatuId) r.materialBlatuId = sprawdzMaterial(b, dane.materialBlatuId);
      if (dane.podloga === null) delete r.podloga;
      else if (dane.podloga) r.podloga = sprawdzWykonczenie(dane.podloga);
      if (dane.bezUchwytow !== undefined) r.bezUchwytow = !!dane.bezUchwytow || undefined;
      wynik = r;
    });
    return wynik;
  }

  dodajSciane(projektId: string, pomieszczenieId: string, dane: NowaSciana): Sciana {
    let wynik!: Sciana;
    this.edytuj(projektId, (p) => {
      const r = p.pomieszczenia.find((x) => x.id === pomieszczenieId);
      if (!r) throw new BladUslugi(`Nie ma pomieszczenia o id "${pomieszczenieId}".`);
      wynik = nowaSciana(dane, r.sciany.length);
      r.sciany.push(wynik);
    });
    return wynik;
  }

  zmienSciane(projektId: string, scianaId: string, dane: Partial<NowaSciana>): Sciana {
    let wynik!: Sciana;
    this.edytuj(projektId, (p) => {
      const s = p.pomieszczenia.flatMap((r) => r.sciany).find((x) => x.id === scianaId);
      if (!s) throw new BladUslugi(`Nie ma ściany o id "${scianaId}".`);
      if (dane.nazwa) s.nazwa = dane.nazwa;
      if (dane.dlugoscMM) {
        // Ściana z CAD: wydłuż/skróć od punktu początkowego w tym samym kierunku.
        if (s.x1 !== undefined && s.y1 !== undefined && s.x2 !== undefined && s.y2 !== undefined) {
          const k = dane.dlugoscMM / (Math.hypot(s.x2 - s.x1, s.y2 - s.y1) || 1);
          s.x2 = s.x1 + (s.x2 - s.x1) * k;
          s.y2 = s.y1 + (s.y2 - s.y1) * k;
        }
        s.dlugoscMM = dane.dlugoscMM;
      }
      if (dane.wysokoscMM) s.wysokoscMM = dane.wysokoscMM;
      if (dane.wykonczenie === null) delete s.wykonczenie;
      else if (dane.wykonczenie) s.wykonczenie = sprawdzWykonczenie(dane.wykonczenie);
      wynik = s;
    });
    return wynik;
  }

  usunSciane(projektId: string, scianaId: string): void {
    this.edytuj(projektId, (p) => {
      for (const r of p.pomieszczenia) r.sciany = r.sciany.filter((s) => s.id !== scianaId);
      p.moduly = p.moduly.filter((m) => m.scianaId !== scianaId);
    });
  }

  // ---------- Import CAD ----------

  /** Zamienia wgrany plik CAD (DXF tekstowy lub DWG binarny) na treść DXF. */
  async trescCad(plik: Buffer): Promise<string> {
    if (czyDwg(plik)) {
      try {
        return await dwgNaDxf(plik);
      } catch (e) {
        throw new BladUslugi((e as Error).message);
      }
    }
    if (plik.subarray(0, 22).toString("ascii") === "AutoCAD Binary DXF\r\n\u001a\u0000")
      throw new BladUslugi("Binarny DXF nie jest obsługiwany — zapisz rysunek jako DXF ASCII.");
    return plik.toString("utf8");
  }

  /** Analiza pliku DXF: warstwy, jednostka i proponowane ściany (bez zapisu). */
  analizaDxf(tresc: string, opcje: { warstwa?: string; jednostka?: JednostkaDxf; minMM?: number } = {}) {
    let dane: DxfDane;
    try {
      dane = new DxfParser().parseSync(tresc) as unknown as DxfDane;
    } catch (e) {
      throw new BladUslugi(`Nie udało się odczytać DXF: ${(e as Error).message}. Zapisz plik jako DXF ASCII (np. AutoCAD 2013).`);
    }
    if (!dane?.entities) throw new BladUslugi("Plik DXF nie zawiera encji.");
    const jednostka = opcje.jednostka ?? jednostkaZNaglowka(dane);
    const odcinki = odcinkiDxf(dane, jednostka);
    const warstwy = warstwyDxf(odcinki);
    const wynik = scianyZDxf(odcinki, { warstwa: opcje.warstwa, minMM: opcje.minMM });
    return { jednostka, warstwy, ...wynik };
  }

  importujDxf(projektId: string, tresc: string, opcje: { nazwa?: string; warstwa?: string; jednostka?: JednostkaDxf; minMM?: number; wysokoscMM?: number } = {}) {
    const a = this.analizaDxf(tresc, opcje);
    if (!a.sciany.length) throw new BladUslugi("Nie znaleziono ścian (linii ≥ 300 mm) na wybranej warstwie.");
    const pom = this.dodajPomieszczenie(projektId, {
      nazwa: opcje.nazwa ?? "Pomieszczenie z CAD",
      sciany: a.sciany.map((s) => ({ ...s, wysokoscMM: opcje.wysokoscMM })),
    });
    return { pomieszczenie: pom, jednostka: a.jednostka, liczbaLancuchow: a.liczbaLancuchow, pominieteOdcinki: a.pominieteOdcinki };
  }

  // ---------- Moduły ----------

  dodajModul(projektId: string, dane: NowyModul): Modul {
    let wynik!: Modul;
    this.edytuj(projektId, (p, b) => {
      wynik = this.nowyModul(p, b, dane);
      p.moduly.push(wynik);
    });
    return wynik;
  }

  /** Wstawia szereg modułów katalogowych jeden za drugim (odpowiednik FurnitureRun). */
  wypelnijSciane(projektId: string, scianaId: string, katalogIds: string[], odXMM?: number): Modul[] {
    const wynik: Modul[] = [];
    this.edytuj(projektId, (p, b) => {
      let x = odXMM;
      for (const katalogId of katalogIds) {
        const m = this.nowyModul(p, b, { katalogId, scianaId, pozycjaXMM: x });
        p.moduly.push(m);
        wynik.push(m);
        x = m.pozycjaXMM + m.szerokoscMM;
      }
    });
    return wynik;
  }

  /**
   * Wypełnia lukę w rzędzie: poniżej 150 mm blendą, powyżej szafką z półkami tej szerokości
   * (odpowiednik blend/dopasowania z FurnitureRunDistributor).
   */
  wypelnijLuke(projektId: string, scianaId: string, xMM: number, szerokoscMM: number, wiszacy: boolean): Modul {
    if (!(szerokoscMM > 0)) throw new BladUslugi("Szerokość luki musi być dodatnia.");
    const blenda = szerokoscMM < 150;
    return this.dodajModul(projektId, {
      scianaId,
      pozycjaXMM: xMM,
      szerokoscMM,
      nazwa: blenda ? `Blenda ${Math.round(szerokoscMM)}` : `Szafka ${wiszacy ? "wisząca" : "dolna"} dopasowana ${Math.round(szerokoscMM)}`,
      kategoria: wiszacy ? "wall" : "base",
      konstrukcja: blenda ? "filler" : "shelves",
      wysokoscMM: 720,
      glebokoscMM: wiszacy ? 320 : 560,
      pozycjaYMM: wiszacy ? 1400 : undefined,
    });
  }

  // ---------- Szybki projekt: wypełnienie ściany, układ I/L/U, pakiet stylu, okucia projektu ----------

  /**
   * Wypełnia wolne miejsce w rzędzie (dolny / wiszący) całej ściany modułami katalogowymi: preferowane szerokości,
   * blenda przy reszcie < 150 mm, stojące moduły (także szafki narożne ze ściany prostopadłej) zostają. podglad = bez zapisu.
   */
  wypelnijCalaSciane(projektId: string, scianaId: string, wejscie: OpcjeWypelnienia & { podglad?: boolean }) {
    const opcje = parsuj(schematWypelnienia, wejscie);
    const wykonaj = (p: Projekt, b: BazaDanych) => {
      const pom = p.pomieszczenia.find((r) => r.sciany.some((x) => x.id === scianaId));
      if (!pom) throw new BladUslugi(`Nie ma ściany o id "${scianaId}" w projekcie.`);
      let w: ReturnType<typeof planWypelnieniaSciany>;
      try {
        w = planWypelnieniaSciany(pom, p.moduly, scianaId, opcje, b.ustawienia.konstrukcja.gruboscFrontuMM);
      } catch (e) {
        throw new BladUslugi((e as Error).message);
      }
      const moduly = w.plan.map(({ rola, ...d }) => {
        const m = this.nowyModul(p, b, d);
        p.moduly.push(m);
        return { ...m, rola };
      });
      return { moduly, wolne: w.wolne, zajete: w.zajete, luzy: w.luzy, ostrzezenia: w.ostrzezenia, zalozenia: OPIS_ZALOZEN_UKLADU.slice(3, 5) };
    };
    return this.wykonajLubPodglad(projektId, !!opcje.podglad, wykonaj);
  }

  /**
   * Szybki układ kuchni I / L / U: narożniki, zlew + zmywarka, płyta (z piekarnikiem), lodówka (słupek lub wnęka),
   * wypełnienie dolnych i wiszących. Ściany: scianyIds albo pierwsze ściany pomieszczenia (brakujące tworzone z dlugosciScianMM).
   * Istniejące moduły na tych ścianach blokują układ, chyba że zastap = true. podglad = bez zapisu.
   */
  szybkiUklad(projektId: string, wejscie: OpcjeSzybkiegoUkladu & { pomieszczenieId?: string; scianyIds?: string[]; dlugosciScianMM?: number[]; wysokoscMM?: number; zastap?: boolean; podglad?: boolean }) {
    const opcje = parsuj(schematSzybkiegoUkladu, wejscie);
    const n = { I: 1, L: 2, U: 3 }[opcje.typ];
    const wykonaj = (p: Projekt, b: BazaDanych) => {
      const pom = opcje.pomieszczenieId ? p.pomieszczenia.find((r) => r.id === opcje.pomieszczenieId) : p.pomieszczenia[0];
      if (!pom) throw new BladUslugi(opcje.pomieszczenieId ? `Nie ma pomieszczenia o id "${opcje.pomieszczenieId}".` : "Projekt nie ma pomieszczenia.");
      const dl = opcje.dlugosciScianMM;
      if (dl && (dl.length !== n || !dl.every((v) => Number.isFinite(v) && v >= 300 && v <= 20000))) throw new BladUslugi(`dlugosciScianMM: ${n} wartości 300–20000 mm.`);
      if (opcje.wysokoscMM !== undefined && !(opcje.wysokoscMM >= 1500 && opcje.wysokoscMM <= 5000)) throw new BladUslugi("wysokoscMM: 1500–5000 mm.");
      let sciany: Sciana[];
      if (opcje.scianyIds) {
        if (opcje.scianyIds.length !== n) throw new BladUslugi(`Układ ${opcje.typ} wymaga ${n} ścian(y) w scianyIds.`);
        sciany = opcje.scianyIds.map((sid) => {
          const sc = pom.sciany.find((x) => x.id === sid);
          if (!sc) throw new BladUslugi(`Ściana "${sid}" nie należy do pomieszczenia ${pom.nazwa}.`);
          return sc;
        });
      } else {
        sciany = pom.sciany.filter((x) => !x.wirtualna).slice(0, n);
        while (sciany.length < n) {
          if (!dl) throw new BladUslugi(`Pomieszczenie ma ${sciany.length} ścian(y), układ ${opcje.typ} wymaga ${n} — podaj dlugosciScianMM.`);
          const nowa = nowaSciana({ dlugoscMM: dl[sciany.length], wysokoscMM: opcje.wysokoscMM }, pom.sciany.length);
          pom.sciany.push(nowa);
          sciany.push(nowa);
        }
      }
      const ostrzezeniaScian: string[] = [];
      const domkniety = (() => {
        const r = scianyNaRzucie(pom);
        return r.length >= 3 && Math.hypot(r[r.length - 1].x2 - r[0].x1, r[r.length - 1].y2 - r[0].y1) <= 20;
      })();
      let zmieniono = false;
      sciany.forEach((sc, i) => {
        if (dl && Math.abs(sc.dlugoscMM - dl[i]) > 0.5) {
          if (sc.x1 !== undefined) throw new BladUslugi(`${opisSciany(sc.nazwa)} pochodzi z CAD — zmień jej długość w rysunku albo pomiń dlugosciScianMM.`);
          sc.dlugoscMM = dl[i];
          zmieniono = true;
        }
        if (opcje.wysokoscMM) sc.wysokoscMM = opcje.wysokoscMM;
      });
      if (zmieniono && domkniety) {
        const r = scianyNaRzucie(pom);
        if (Math.hypot(r[r.length - 1].x2 - r[0].x1, r[r.length - 1].y2 - r[0].y1) > 20)
          ostrzezeniaScian.push(`Zmiana długości ścian rozszczelnia zamknięty obrys pomieszczenia ${pom.nazwa} — rzut się nie domyka; popraw pozostałe ściany.`);
      }
      // Narożniki: kolejna ściana zaczyna się w końcu poprzedniej i idzie w głąb pomieszczenia (kąt ~90°).
      const rzut = scianyNaRzucie(pom);
      for (let i = 0; i < n - 1; i++) {
        const a = rzut.find((w) => w.sciana.id === sciany[i].id)!;
        const c = rzut.find((w) => w.sciana.id === sciany[i + 1].id)!;
        if (Math.hypot(a.x2 - c.x1, a.y2 - c.y1) > 20 || c.dx * a.nx + c.dy * a.ny < 0.95)
          throw new BladUslugi(`${opisSciany(sciany[i].nazwa)} i ${opisSciany(sciany[i + 1].nazwa)} nie tworzą narożnika wewnętrznego 90° (koniec jednej = początek drugiej).`);
      }
      const ids = new Set(sciany.map((x) => x.id));
      const stojace = p.moduly.filter((m) => ids.has(m.scianaId));
      if (stojace.length && !opcje.zastap) throw new BladUslugi(`Na wybranych ścianach stoi ${stojace.length} modułów — użyj zastap: true, aby zastąpić ułożenie.`);
      p.moduly = p.moduly.filter((m) => !ids.has(m.scianaId));
      // Moduły spoza układu (np. szafka narożna ze ściany sąsiedniej) zajmujące pas przy ścianach układu.
      const front = b.ustawienia.konstrukcja.gruboscFrontuMM;
      const zajete = sciany.map((x) => ({ dolny: zajeteNaScianie(pom, p.moduly, x.id, "dolny", front), wiszacy: zajeteNaScianie(pom, p.moduly, x.id, "wiszacy", front) }));
      let plan: ReturnType<typeof planSzybkiegoUkladu>;
      try {
        plan = planSzybkiegoUkladu(sciany.map((x) => ({ id: x.id, nazwa: x.nazwa, dlugoscMM: x.dlugoscMM, wysokoscMM: x.wysokoscMM })), opcje, { gruboscFrontuMM: front, zajete });
      } catch (e) {
        throw new BladUslugi((e as Error).message);
      }
      const moduly = plan.plan.map(({ rola, ...d }) => {
        const m = this.nowyModul(p, b, d);
        p.moduly.push(m);
        return { ...m, rola };
      });
      return {
        pomieszczenieId: pom.id,
        sciany: sciany.map((x) => ({ id: x.id, nazwa: x.nazwa, dlugoscMM: x.dlugoscMM, wysokoscMM: x.wysokoscMM })),
        moduly,
        rezerwacje: plan.rezerwacje,
        usunieto: stojace.length,
        ostrzezenia: [...ostrzezeniaScian, ...plan.ostrzezenia],
        zalozenia: plan.zalozenia,
      };
    };
    return this.wykonajLubPodglad(projektId, !!opcje.podglad, wykonaj);
  }

  /**
   * Pakiet stylu pomieszczenia: korpus, fronty i blat z materiałów albo wprost z galerii dekorów. Dekor bez materiału
   * jest aktywowany tylko, gdy grubość i format znane są z artykułu producenta (lub wpisane jawnie) — inaczej jawny brak.
   */
  ustawStyl(projektId: string, wejscie: { pomieszczenieId?: string; korpus?: WyborMaterialu; front?: WyborMaterialu; blat?: WyborMaterialu; wyczyscWyjatkiModulow?: boolean; podglad?: boolean }) {
    const dane = parsuj(schematStylu, wejscie ?? {});
    if (!dane.korpus && !dane?.front && !dane?.blat) throw new BladUslugi("Podaj co najmniej jeden z: korpus, front, blat.");
    const wykonaj = (p: Projekt, b: BazaDanych) => {
      const pom = dane.pomieszczenieId ? p.pomieszczenia.find((r) => r.id === dane.pomieszczenieId) : p.pomieszczenia[0];
      if (!pom) throw new BladUslugi("Nie znaleziono pomieszczenia.");
      const k = b.ustawienia.konstrukcja;
      const ustawiono: Partial<Record<RolaStylu, string>> = {};
      const aktywowane: Material[] = [];
      const braki: { rola: RolaStylu; komunikat: string }[] = [];
      const zrodla: { rola: RolaStylu; materialId: string; zrodlo: string; alternatywy?: number }[] = [];
      const ostrzezenia: string[] = [];
      for (const rola of ["korpus", "front", "blat"] as const) {
        const w = dane[rola];
        if (!w) continue;
        let r: RozstrzygniecieStylu;
        if ("materialId" in w) {
          const m = b.materialy.find((x) => x.id === w.materialId);
          r = m ? { rola, material: m, zrodlo: "materiał z bazy" } : { rola, brak: `Nie ma materiału o id "${w.materialId}".` };
        } else if (typeof w.dekor === "string") {
          r = rola === "blat" ? blatZDekoru(w, k) : plytaZDekoru(rola, w, rola === "korpus" ? k.gruboscPlytyKorpusuMM : k.gruboscFrontuMM);
        } else r = { rola, brak: "Podaj materialId albo dekor." };
        if (!r.material) {
          braki.push({ rola, komunikat: r.brak ?? "Brak danych." });
          continue;
        }
        // Typ materiału musi pasować do roli — inaczej brak, bez zapisu.
        const dozwolone: Record<RolaStylu, Material["typ"][]> = {
          korpus: ["plytaLaminowana", "mdf", "sklejka"],
          front: ["plytaLaminowana", "mdf", "sklejka", "front"],
          blat: ["blatLaminowany", "blatKompaktowy", "blatKamienny"],
        };
        if (!dozwolone[rola].includes(r.material.typ) || (rola === "blat" && r.material.jednostka !== "metrBiezacy")) {
          braki.push({ rola, komunikat: `"${r.material.nazwa}" (${r.material.typ}) nie nadaje się na ${rola === "korpus" ? "korpus" : rola === "front" ? "fronty" : "blat liczony w mb"}.` });
          continue;
        }
        let m = b.materialy.find((x) => x.id === r.material!.id);
        if (!m) {
          m = r.material;
          if (!dane.podglad) b.materialy.push(m);
          aktywowane.push(m);
        } else if (!m.aktywny) {
          if (!dane.podglad) m.aktywny = true;
          aktywowane.push(m);
        }
        ustawiono[rola] = m.id;
        zrodla.push({ rola, materialId: m.id, zrodlo: r.zrodlo ?? "", alternatywy: r.alternatywy || undefined });
        if (!(m.cenaNetto > 0) && !b.cennikMaterialow?.[m.id]) ostrzezenia.push(`${m.nazwa}: brak ceny zakupu — wycena przyjmie cenę domyślną i oznaczy pozycję błędem; uzupełnij cennik.`);
      }
      if (ustawiono.korpus) pom.materialKorpusuId = ustawiono.korpus;
      if (ustawiono.front) pom.materialFrontuId = ustawiono.front;
      if (ustawiono.blat) pom.materialBlatuId = ustawiono.blat;
      const naScianach = new Set(pom.sciany.map((x) => x.id));
      const zWyjatkiem = p.moduly.filter((m) => naScianach.has(m.scianaId) && ((ustawiono.korpus && m.materialKorpusuId) || (ustawiono.front && m.materialFrontuId)));
      if (dane.wyczyscWyjatkiModulow)
        for (const m of zWyjatkiem) {
          if (ustawiono.korpus) delete m.materialKorpusuId;
          if (ustawiono.front) delete m.materialFrontuId;
        }
      else if (zWyjatkiem.length) ostrzezenia.push(`${zWyjatkiem.length} modułów ma własny materiał i go zachowuje (wyczyscWyjatkiModulow: true, aby ujednolicić).`);
      return { pomieszczenieId: pom.id, ustawiono, zrodla, aktywowane, braki, ostrzezenia, wyczyszczono: dane.wyczyscWyjatkiModulow ? zWyjatkiem.length : 0 };
    };
    return this.wykonajLubPodglad(projektId, !!dane.podglad, wykonaj);
  }

  /** Bieżący styl pomieszczenia: materiały korpusu, frontów i blatu z kluczem dekoru galerii (gdy materiał z niego pochodzi). */
  stylPomieszczenia(projektId: string, pomieszczenieId?: string) {
    const b = this.magazyn.odczytaj();
    const p = b.projekty.find((x) => x.id === projektId);
    if (!p) throw new BladUslugi(`Nie ma projektu o id "${projektId}".`);
    const pom = pomieszczenieId ? p.pomieszczenia.find((r) => r.id === pomieszczenieId) : p.pomieszczenia[0];
    if (!pom) throw new BladUslugi("Nie znaleziono pomieszczenia.");
    const opis = (materialId?: string) => {
      if (!materialId) return null;
      const m = b.materialy.find((x) => x.id === materialId);
      if (!m) return { materialId, brakMaterialu: true };
      const d = m.zrodloKatalogu ? DEKORY.find((x) => x.source_url === m.zrodloKatalogu && x.manufacturer === m.producent) : undefined;
      return { materialId, nazwa: m.nazwa, producent: m.producent, typ: m.typ, gruboscMM: m.gruboscMM, dekor: d ? kluczDekoru(d) : undefined, artykul: m.artykulProducenta, zdjecieURL: m.zdjecieURL, kolorHEX: m.kolorHEX, maCene: m.cenaNetto > 0 || !!b.cennikMaterialow?.[m.id] };
    };
    const naScianach = new Set(pom.sciany.map((x) => x.id));
    return {
      pomieszczenieId: pom.id,
      korpus: opis(pom.materialKorpusuId),
      front: opis(pom.materialFrontuId),
      blat: opis(pom.materialBlatuId),
      modulyZWlasnymMaterialem: p.moduly.filter((m) => naScianach.has(m.scianaId) && (m.materialKorpusuId || m.materialFrontuId)).length,
      okucia: p.okucia ?? null,
    };
  }

  /** Okucia do wyboru na projekcie: pozycje bazy okuć (z informacją o cenie) i profile konstrukcyjne szuflad. */
  /**
   * Dekory na start galerii szybkiego projektu (OCENA-kreatora §4, zmiana 6): lista właściciela,
   * a gdy pusta — najczęściej używane dekory z projektów (płyty korpusu/frontu i blaty z galerii).
   */
  dekoryStolarni(): { zrodlo: "stolarnia" | "projekty" | "brak"; klucze: string[] } {
    const b = this.magazyn.odczytaj();
    const znane = new Set(DEKORY.map(kluczDekoru));
    const wlasne = (b.dekoryStolarni ?? []).filter((k) => znane.has(k));
    if (wlasne.length) return { zrodlo: "stolarnia", klucze: wlasne };
    const mat = new Map(b.materialy.map((m) => [m.id, m]));
    const licz = new Map<string, number>();
    for (const p of b.projekty) {
      const ids = [
        ...p.pomieszczenia.flatMap((r) => [r.materialKorpusuId, r.materialFrontuId, r.materialBlatuId]),
        ...p.moduly.flatMap((m) => [m.materialKorpusuId, m.materialFrontuId]),
      ];
      for (const id of new Set(ids)) {
        const m = id ? mat.get(id) : undefined;
        const k = m?.kod && m.producent ? `${m.producent}:${m.kod}` : undefined;
        if (k && znane.has(k)) licz.set(k, (licz.get(k) ?? 0) + 1);
      }
    }
    const klucze = [...licz].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 15).map(([k]) => k);
    return { zrodlo: klucze.length ? "projekty" : "brak", klucze };
  }

  ustawDekoryStolarni(klucze: unknown): { zrodlo: "stolarnia" | "projekty" | "brak"; klucze: string[] } {
    if (!Array.isArray(klucze) || klucze.length > 60 || !klucze.every((k) => typeof k === "string"))
      throw new BladUslugi("klucze: lista do 60 kluczy dekorów „Producent:id”.");
    const znane = new Set(DEKORY.map(kluczDekoru));
    const nieznane = klucze.filter((k) => !znane.has(k));
    if (nieznane.length) throw new BladUslugi(`Nieznane dekory: ${nieznane.slice(0, 5).join(", ")}.`);
    this.magazyn.zmien((b) => {
      b.dekoryStolarni = [...new Set(klucze as string[])];
    });
    return this.dekoryStolarni();
  }

  opcjeOkuc() {
    const b = this.magazyn.odczytaj();
    const skrot = (o: Okucie) => ({ id: o.id, nazwa: o.nazwa, producent: o.producent, system: o.system, typ: o.typ, poziomWyceny: o.poziomWyceny, aktywne: o.aktywne, cenaNetto: o.cenaNetto, maCene: o.aktywne && o.cenaNetto * (1 - o.rabatProcent / 100) > 0 });
    const typu = (...t: Okucie["typ"][]) => b.okucia.filter((o) => t.includes(o.typ)).map(skrot);
    return {
      systemySzuflad: typu("systemSzuflad", "prowadnica"),
      zawiasy: typu("zawias"),
      podnosniki: typu("podnosnik"),
      profileSzuflad: PROFILE_SZUFLAD.map((x) => ({ id: x.id, producent: x.manufacturer, system: x.family, gruboscPlytyMM: x.board_thickness_mm, zatwierdzonyProdukcyjnie: x.production_approved, wiercenia: x.drilling_status })),
      profilDomyslny: b.ustawienia.technologia.profilSzuflad,
    };
  }

  /** Ustawia (null = usuwa) wybór okuć projektu. Pozycje bez ceny są dozwolone — wycena pokaże je jako błąd. */
  ustawOkucia(projektId: string, wejscie: OkuciaProjektu | null) {
    const okucia = parsuj(schematOkucProjektu, wejscie === undefined ? {} : wejscie);
    const ostrzezenia: string[] = [];
    const p = this.edytuj(projektId, (p, b) => {
      if (okucia === null) {
        delete p.okucia;
        return;
      }
      if (!okucia || typeof okucia !== "object") throw new BladUslugi("okucia: obiekt { systemSzuflad?, zawiasy?, podnosniki?, profilSzuflad? } albo null.");
      const wynik: OkuciaProjektu = {};
      const sprawdz = (pole: "systemSzuflad" | "zawiasy" | "podnosniki", typy: Okucie["typ"][]) => {
        const v = okucia[pole];
        if (v === undefined || v === null || v === "") return;
        const o = b.okucia.find((x) => x.id === v);
        if (!o) throw new BladUslugi(`${pole}: nie ma okucia o id "${v}" w bazie okuć (opcje: GET /api/okucia-projektu/opcje).`);
        if (!typy.includes(o.typ)) throw new BladUslugi(`${pole}: "${o.nazwa}" ma typ ${o.typ}, oczekiwano ${typy.join(" / ")}.`);
        if (!o.aktywne || !(o.cenaNetto * (1 - o.rabatProcent / 100) > 0)) ostrzezenia.push(`${o.nazwa}: brak ceny lub pozycja nieaktywna — wycena oznaczy ją błędem (bez ceny zastępczej).`);
        wynik[pole] = o.id;
      };
      sprawdz("systemSzuflad", ["systemSzuflad", "prowadnica"]);
      sprawdz("zawiasy", ["zawias"]);
      sprawdz("podnosniki", ["podnosnik"]);
      if (okucia.profilSzuflad) {
        const pr = PROFILE_SZUFLAD.find((x) => x.id === okucia.profilSzuflad);
        if (!pr) throw new BladUslugi(`profilSzuflad: nieznany profil "${okucia.profilSzuflad}" (GET /api/systemy-szuflad).`);
        if (!pr.production_approved) ostrzezenia.push(`Profil ${pr.id}: niezatwierdzony produkcyjnie (${pr.drilling_status}).`);
        wynik.profilSzuflad = pr.id;
      }
      if (wynik.systemSzuflad && !wynik.profilSzuflad) ostrzezenia.push(`Wymiary dna i pleców szuflad systemowych z profilu ustawień technologii (${b.ustawienia.technologia.profilSzuflad}) — wybierz profilSzuflad zgodny z systemem.`);
      if (Object.keys(wynik).length) p.okucia = wynik;
      else delete p.okucia;
    });
    return { okucia: p.okucia ?? null, ostrzezenia };
  }

  /** Wykonuje zmianę z zapisem albo (podglad) na kopii projektu i bazy, bez zapisu. */
  private wykonajLubPodglad<T extends object>(projektId: string, podglad: boolean, fn: (p: Projekt, b: BazaDanych) => T): T & { podglad: boolean } {
    if (podglad) {
      const b = this.magazyn.odczytaj();
      const p = b.projekty.find((x) => x.id === projektId);
      if (!p) throw new BladUslugi(`Nie ma projektu o id "${projektId}".`);
      return { ...fn(structuredClone(p), b), podglad: true };
    }
    // Magazyn.zmien zapisuje bazę po wywołaniu, bez wycofania częściowych zmian, gdy fn rzuci błąd w połowie —
    // dlatego liczymy na kopii projektu i materiałów, a do bazy przenosimy dopiero po sukcesie.
    let wynik!: T;
    this.edytuj(projektId, (p, b) => {
      const kopia = structuredClone(p);
      const bKopia = { ...b, materialy: structuredClone(b.materialy) };
      wynik = fn(kopia, bKopia);
      Object.assign(p, kopia);
      b.materialy = bKopia.materialy;
    });
    return { ...wynik, podglad: false };
  }

  /** Przywraca pomieszczenia i moduły z wcześniejszego stanu (cofnij/ponów w aplikacji). */
  przywrocStan(projektId: string, stan: Pick<Projekt, "pomieszczenia" | "moduly">): Projekt {
    const wynik = schematStanuProjektu.safeParse(stan);
    if (!wynik.success) throw new BladUslugi(`Nieprawidłowy stan projektu: ${wynik.error.issues.slice(0, 3).map((i) => `${i.path.join(".") || "stan"}: ${i.message}`).join("; ")}`);
    const poprawny = wynik.data as unknown as Pick<Projekt, "pomieszczenia" | "moduly">;
    return this.edytuj(projektId, (p, b) => {
      // Odwołania do materiałów sprawdzane przed zmianą projektu (wyjątek nie zostawia częściowego stanu).
      const materialy = new Set(b.materialy.map((m) => m.id));
      const uzyte = [...poprawny.pomieszczenia.flatMap((r) => [r.materialKorpusuId, r.materialFrontuId, r.materialBlatuId]), ...poprawny.moduly.flatMap((m) => [m.materialKorpusuId, m.materialFrontuId])];
      const brak = uzyte.find((x) => x && !materialy.has(x));
      if (brak) throw new BladUslugi(`Nieprawidłowy stan projektu: nie ma materiału „${brak}”.`);
      p.pomieszczenia = poprawny.pomieszczenia;
      p.moduly = poprawny.moduly;
    });
  }

  /**
   * Przelicznik dna i pleców szuflad dla wszystkich (albo wskazanego) systemów. LW podane wprost albo z szerokości
   * korpusu i grubości boków; NL podane wprost albo dobrane z głębokości użytkowej (głębokość − odsunięcie i HDF pleców).
   */
  przelicznikSzuflad(q: WejsciePrzelicznika) {
    const sprawdzone = wejsciePrzelicznika.safeParse(q);
    if (!sprawdzone.success) throw new BladUslugi(`Niepoprawne dane: ${sprawdzone.error.issues.map((i) => i.path.join(".")).join(", ")}. Podaj skończone liczby w mm; liczba szuflad: 1–20.`);
    q = sprawdzone.data;
    const k = this.ustawienia().konstrukcja;
    const LWNominalne = q.LW ?? (q.szerokoscKorpusu ? q.szerokoscKorpusu - 2 * (q.gruboscBoku ?? k.gruboscPlytyKorpusuMM) : undefined);
    if (!LWNominalne || !Number.isFinite(LWNominalne) || LWNominalne <= 0) throw new BladUslugi("Podaj LW albo szerokość korpusu.");
    if (q.frontZaDrzwiami && q.frontWewnetrzny) throw new BladUslugi("Wybierz front za drzwiami albo front zlicowany z korpusem — są to osobne warianty montażu.");
    let zaDrzwiami;
    try { zaDrzwiami = frontZaZwyklymiZawiasami(q, LWNominalne); } catch (e) { throw new BladUslugi((e as Error).message); }
    const LW = zaDrzwiami?.LWPoDystansach ?? LWNominalne;
    const glebokoscUzytkowa = q.glebokoscKorpusu ? q.glebokoscKorpusu - k.odsunieciePlecMM - k.gruboscPlecHDFMM : undefined;
    const NL = q.NL ?? (glebokoscUzytkowa ? dobierzNL(glebokoscUzytkowa) : undefined);
    if (!NL) throw new BladUslugi(glebokoscUzytkowa ? `Głębokość użytkowa ${glebokoscUzytkowa} mm za mała dla prowadnic (min. NL 270 + 3 mm).` : "Podaj NL albo głębokość korpusu.");
    const profile = PROFILE_SZUFLAD.filter((p) => !q.profilId || p.id === q.profilId);
    if (!profile.length) throw new BladUslugi(`Nieznany system szuflad „${q.profilId}”.`);
    if (q.wariant && profile.some((p) => p.back.height_by_variant_mm[q.wariant!] === undefined)) throw new BladUslugi("Wybrany wariant nie istnieje w systemie szuflad.");
    const wyniki = profile.map((p) => przeliczSzuflade(p, { LW, NL, wariant: q.wariant, wysokoscFrontuMM: q.wysokoscFrontu, sciankaTylna: q.sciankaTylna }));
    if (wyniki.some((w) => w.dno.szer <= 0 || w.dno.gl <= 0 || w.plecy.szer <= 0)) throw new BladUslugi("Światło LW lub długość NL są za małe — wymiary dna i pleców muszą być dodatnie.");
    let montaz;
    try {
      montaz = rozstawProwadnic(q);
      for (let i = 0; i < wyniki.length; i++) {
        if (zaDrzwiami?.kolizje.status === "kolizja") {
          wyniki[i].mocowanieFrontu = { status: "kolizja", opis: zaDrzwiami.kolizje.opis, srednicaMM: null, glebokoscMM: null, zatwierdzoneProdukcyjnie: false };
        } else {
          wyniki[i].mocowanieFrontu = mocowanieFrontu(profile[i], LW, wyniki[i].wariant, zaDrzwiami ? { ...q, szerokoscFrontu: zaDrzwiami.szerokoscFrontu, przesuniecieFrontu: zaDrzwiami.przesuniecieWzgledemSwiatla } : q);
          if (zaDrzwiami?.kolizje.status === "brakDanych" && wyniki[i].mocowanieFrontu!.status === "pozycje") wyniki[i].mocowanieFrontu!.status = "czesciowe";
        }
      }
    } catch (e) { throw new BladUslugi((e as Error).message); }
    return {
      LW,
      NL,
      glebokoscUzytkowa,
      wyniki,
      montaz,
      zaDrzwiami,
      warianty: Object.fromEntries(PROFILE_SZUFLAD.map((p) => [p.id, Object.entries(p.back.height_by_variant_mm).map(([w, h]) => ({ wariant: w, plecyWys: h }))])),
    };
  }

  /** Polecenie edycji konstrukcji modułu przez silnik. Pierwsze polecenie tworzy drzewo z obecnej konfiguracji (adapter). */
  polecenieKonstrukcji(
    projektId: string,
    modulId: string,
    polecenie: { typ: "zamienDrzwiNaSzuflady"; liczba: number; poleId?: string } | { typ: "dodajSzufladyZaDrzwiami"; liczba: number; wysokoscMM?: number; poleId?: string }
      | { typ: "dodajUkrytaSzuflade"; sprzezona: boolean; poleId?: string }
      | { typ: "podzielWnetrze"; kierunek: "pion" | "poziom"; liczba: number; strefaId?: string; rozmiaryMM?: number[] }
      | { typ: "podzielFront"; kierunek: "pion" | "poziom"; liczba: number; poleId?: string; przegroda?: boolean }
      | { typ: "ustawRozmiarFrontu"; poleId: string; mm: number; zablokowane?: string[] },
  ): { modul: Modul; uwagi: string[] } {
    let wynik!: { modul: Modul; uwagi: string[] };
    this.edytuj(projektId, (p, b) => {
      const m = p.moduly.find((x) => x.id === modulId);
      if (!m) throw new BladUslugi(`Nie ma modułu o id "${modulId}".`);
      const k = b.ustawienia.konstrukcja;
      const mebel = m.drzewo ?? mebelZModulu(m, k);
      try {
        const wymiary = { ...mebel, szerokoscMM: m.szerokoscMM, wysokoscMM: m.wysokoscMM, glebokoscMM: m.glebokoscMM };
        const r =
          polecenie.typ === "zamienDrzwiNaSzuflady"
            ? zamienDrzwiNaSzuflady(wymiary, k, polecenie)
            : polecenie.typ === "dodajSzufladyZaDrzwiami"
              ? dodajSzufladyZaDrzwiami(wymiary, k, polecenie)
              : polecenie.typ === "dodajUkrytaSzuflade"
                ? dodajUkrytaSzuflade(wymiary, k, polecenie)
                : polecenie.typ === "podzielWnetrze"
                  ? podzielWnetrze(wymiary, k, polecenie)
                  : polecenie.typ === "podzielFront"
                    ? podzielFront(wymiary, k, polecenie)
                    : polecenie.typ === "ustawRozmiarFrontu"
                      ? ustawRozmiarFrontu(wymiary, k, polecenie)
                      : (() => {
                  throw new BladPolecenia(`Nieznane polecenie „${(polecenie as { typ: string }).typ}”.`);
                })();
        m.drzewo = r.mebel;
        wynik = { modul: m, uwagi: r.uwagi };
      } catch (e) {
        if (e instanceof BladPolecenia) throw new BladUslugi(e.message);
        throw e;
      }
    });
    return wynik;
  }

  /** Usuwa konstrukcję z edytora — moduł wraca do budowy z konfiguracji (liczników). */
  przywrocKonstrukcjeStandardowa(projektId: string, modulId: string): Modul {
    let wynik!: Modul;
    this.edytuj(projektId, (p) => {
      const m = p.moduly.find((x) => x.id === modulId);
      if (!m) throw new BladUslugi(`Nie ma modułu o id "${modulId}".`);
      delete m.drzewo;
      wynik = m;
    });
    return wynik;
  }

  zmienModul(projektId: string, modulId: string, dane: Omit<NowyModul, "katalogId">): Modul {
    let wynik!: Modul;
    this.edytuj(projektId, (p, b) => {
      const m = p.moduly.find((x) => x.id === modulId);
      if (!m) throw new BladUslugi(`Nie ma modułu o id "${modulId}".`);
      const { konfiguracja, materialKorpusuId, materialFrontuId, ...reszta } = dane;
      for (const [k, v] of Object.entries(reszta)) if (v !== undefined) (m as unknown as Record<string, unknown>)[k] = v;
      if (konfiguracja) m.konfiguracja = { ...m.konfiguracja, ...konfiguracja };
      if (materialKorpusuId !== undefined) m.materialKorpusuId = materialKorpusuId ? sprawdzMaterial(b, materialKorpusuId) : undefined;
      if (materialFrontuId !== undefined) m.materialFrontuId = materialFrontuId ? sprawdzMaterial(b, materialFrontuId) : undefined;
      if (dane.scianaId) znajdzSciane(p, dane.scianaId);
      wynik = m;
    });
    return wynik;
  }

  usunModul(projektId: string, modulId: string): void {
    this.edytuj(projektId, (p) => {
      const n = p.moduly.length;
      p.moduly = p.moduly.filter((m) => m.id !== modulId);
      if (p.moduly.length === n) throw new BladUslugi(`Nie ma modułu o id "${modulId}".`);
    });
  }

  duplikujModul(projektId: string, modulId: string): Modul {
    let wynik!: Modul;
    this.edytuj(projektId, (p) => {
      const m = p.moduly.find((x) => x.id === modulId);
      if (!m) throw new BladUslugi(`Nie ma modułu o id "${modulId}".`);
      wynik = { ...structuredClone(m), id: id(), pozycjaXMM: nastepneX(p, m.scianaId, m.pozycjaYMM >= PROG_WISZACYCH_MM) };
      p.moduly.push(wynik);
    });
    return wynik;
  }

  private nowyModul(p: Projekt, b: BazaDanych, dane: NowyModul): Modul {
    const kat = dane.katalogId ? modulKatalogowy(dane.katalogId) : undefined;
    if (dane.katalogId && !kat) throw new BladUslugi(`Nie ma modułu katalogowego "${dane.katalogId}". Użyj katalog_modulow.`);
    const scianaId = dane.scianaId ?? p.pomieszczenia[0]?.sciany[0]?.id;
    if (!scianaId) throw new BladUslugi("Projekt nie ma żadnej ściany.");
    znajdzSciane(p, scianaId);

    const kategoria = dane.kategoria ?? kat?.category ?? "base";
    const konstrukcja = dane.konstrukcja ?? kat?.construction ?? "shelves";
    const szer = dane.szerokoscMM ?? kat?.widthMM ?? 600;
    const wys = dane.wysokoscMM ?? kat?.heightMM ?? 720;
    const gl = dane.glebokoscMM ?? kat?.depthMM ?? 560;
    const wiszacy = kat ? kat.anchoring === "wallMounted" : kategoria === "wall" || kategoria === "open";
    const y = dane.pozycjaYMM ?? (wiszacy ? kat?.bottomOffsetMM || 1400 : b.ustawienia.konstrukcja.wysokoscNogiMM);
    const konf = { ...domyslnaKonfiguracja({ construction: konstrukcja, category: kategoria, widthMM: szer, heightMM: wys }), ...dane.konfiguracja };

    return {
      id: id(),
      katalogId: kat?.id,
      nazwa: dane.nazwa ?? kat?.name ?? "Moduł niestandardowy",
      kategoria,
      konstrukcja,
      scianaId,
      pozycjaXMM: dane.pozycjaXMM ?? nastepneX(p, scianaId, y >= PROG_WISZACYCH_MM),
      pozycjaYMM: y,
      szerokoscMM: szer,
      wysokoscMM: wys,
      glebokoscMM: gl,
      konfiguracja: konf,
      materialKorpusuId: dane.materialKorpusuId ? sprawdzMaterial(b, dane.materialKorpusuId) : undefined,
      materialFrontuId: dane.materialFrontuId ? sprawdzMaterial(b, dane.materialFrontuId) : undefined,
      uwagi: dane.uwagi,
    };
  }

  /** Zmiana danych tematu (status, notatki robocze, termin) — bez podbijania rewizji konstrukcji. */
  private edytujTemat(projektId: string, fn: (p: Projekt) => void): Projekt {
    return this.magazyn.zmien((b) => {
      const p = b.projekty.find((x) => x.id === projektId);
      if (!p) throw new BladUslugi(`Nie ma projektu o id "${projektId}".`);
      fn(p);
      p.zmieniono = teraz();
      return p;
    });
  }

  private edytuj(projektId: string, fn: (p: Projekt, b: BazaDanych) => void): Projekt {
    return this.magazyn.zmien((b) => {
      const p = b.projekty.find((x) => x.id === projektId);
      if (!p) throw new BladUslugi(`Nie ma projektu o id "${projektId}".`);
      fn(p, b);
      p.zmieniono = teraz();
      p.rewizja += 1;
      return p;
    });
  }

  // ---------- Analiza: produkcja + wycena ----------

  analiza(projektId: string) {
    const b = this.magazyn.odczytaj();
    const p = b.projekty.find((x) => x.id === projektId);
    if (!p) throw new BladUslugi(`Nie ma projektu o id "${projektId}".`);
    const mapa = new Map(b.materialy.map((m) => [m.id, m]));
    const pomScian = new Map(p.pomieszczenia.flatMap((r) => r.sciany.map((s) => [s.id, r] as const)));

    // Kolejność produkcyjna: ściana → pozycja wzdłuż ściany → wysokość (ListaFormatekProjektuBuilderV070.porzadekModulow)
    const kolejnoscScian = p.pomieszczenia.flatMap((r) => r.sciany.map((s) => s.id));
    const moduly = [...p.moduly].sort(
      (a, c) => kolejnoscScian.indexOf(a.scianaId) - kolejnoscScian.indexOf(c.scianaId) || a.pozycjaYMM - c.pozycjaYMM || a.pozycjaXMM - c.pozycjaXMM,
    );

    // Profil szuflad wybrany na projekcie zastępuje profil z ustawień (moduły z własnym profilem zachowują go).
    const technologia = p.okucia?.profilSzuflad ? { ...b.ustawienia.technologia, profilSzuflad: p.okucia.profilSzuflad } : b.ustawienia.technologia;
    const ustawienia = technologia === b.ustawienia.technologia ? b.ustawienia : { ...b.ustawienia, technologia };
    const zbudowane = moduly.map((m) => {
      const r = pomScian.get(m.scianaId) ?? p.pomieszczenia[0];
      const materialy: MaterialyModulu = {
        korpus: m.materialKorpusuId ?? r?.materialKorpusuId ?? DOMYSLNY_KORPUS,
        front: m.materialFrontuId ?? r?.materialFrontuId ?? DOMYSLNY_FRONT,
        plecy: DOMYSLNE_PLECY,
        blat: r?.materialBlatuId,
      };
      const konstrukcja = { ...b.ustawienia.konstrukcja };
      const korpus = mapa.get(materialy.korpus), front = mapa.get(materialy.front);
      if (korpus?.zrodloKatalogu) konstrukcja.gruboscPlytyKorpusuMM = korpus.gruboscMM;
      if (front?.zrodloKatalogu) konstrukcja.gruboscFrontuMM = front.gruboscMM;
      if (m.drzewo) {
        // Konstrukcja z edytora silnika; gabaryty zawsze z modułu (zmiana wymiaru przelicza drzewo).
        // System szuflad zawsze z konfiguracji modułu (inspektor), także gdy konstrukcję zmieniono poleceniem.
        const c = m.konfiguracja;
        const zm = zbudujMebel(
          { ...m.drzewo, szerokoscMM: m.szerokoscMM, wysokoscMM: m.wysokoscMM, glebokoscMM: m.glebokoscMM, szufladySystemowe: c.szufladySystemowe, profilSzuflad: c.profilSzuflad ?? undefined, wariantBokuSzuflady: c.wariantBokuSzuflady ?? undefined },
          m,
          konstrukcja,
          technologia,
        );
        zm.ostrzezenia.unshift("Konstrukcja z edytora — liczniki półek, drzwi i szuflad z konfiguracji nie są używane (przywróć konstrukcję standardową, aby do nich wrócić).");
        return { zm, materialy };
      }
      return { zm: zbudujModul(m, konstrukcja, technologia), materialy };
    });

    const formatki = listaFormatek(zbudowane, mapa, { odejmujGruboscObrzeza: b.ustawienia.okleinowanie.odejmujGruboscObrzeza });
    const obrzeza = zapotrzebowanieObrzeza(formatki, b.ustawienia.okleinowanie);
    const raportRozkroju = rozkroj(formatki, b.ustawienia.rozkroj, mapa);
    const projektWyceny = zbudujProjektWyceny(p.nazwa, zbudowane, obrzeza, raportRozkroju.arkusze.length);
    const warianty = wycenWszystkie(projektWyceny, b.ustawienia, b.materialy, b.okucia, b.cennikMaterialow ?? {}, p.okucia);
    const standard = warianty.find(w => w.wariant === "standard");
    if (standard && p.cenaUzgodnionaBrutto !== undefined) {
      const netto = Math.round(p.cenaUzgodnionaBrutto / (1 + b.ustawienia.finanse.vatProcent / 100) * 100) / 100;
      standard.cenaKalkulowanaBrutto = standard.cenaBrutto;
      standard.korektaHandlowaNetto = Math.round((netto - standard.cenaNetto) * 100) / 100;
      standard.cenaNetto = netto;
      standard.cenaBrutto = p.cenaUzgodnionaBrutto;
      standard.vatKwota = Math.round((standard.cenaBrutto - netto) * 100) / 100;
    }
    const walidacja = walidujProjekt(p);

    return { projekt: p, zbudowane: zbudowane.map((z) => z.zm), formatki, obrzeza, rozkroj: raportRozkroju, projektWyceny, warianty, walidacja, ustawienia };
  }

  /** Dokumentacja produkcyjna: części z układem lokalnym, operacje, diagnostyka i status gotowości — z jednej rewizji. */
  dokumentacja(projektId: string) {
    const a = this.analiza(projektId);
    return dokumentacjaProjektu({ projekt: a.projekt, zbudowane: a.zbudowane, formatki: a.formatki, ustawienia: a.ustawienia, walidacja: a.walidacja });
  }

  /** Pakiet PDF całej kuchni — ta sama rewizja co dokumentacja(). */
  async dokumentacjaPdf(projektId: string, wybor: { czesci?: string[]; moduly?: string[]; skrocony?: boolean; ukryjDaneKlienta?: boolean } = {}): Promise<Buffer> {
    const a = this.analiza(projektId);
    const d = dokumentacjaProjektu({ projekt: a.projekt, zbudowane: a.zbudowane, formatki: a.formatki, ustawienia: a.ustawienia, walidacja: a.walidacja });
    return dokumentacjaPdf({ projekt: a.projekt, zbudowane: a.zbudowane, dokumentacja: d, firma: a.ustawienia.daneFirmy.nazwaFirmy || undefined, tylkoCzesci: wybor.czesci, tylkoModuly: wybor.moduly, skrocony: wybor.skrocony, ukryjDaneKlienta: wybor.ukryjDaneKlienta });
  }

  // ---------- Wydania produkcyjne (P03) ----------

  /**
   * Zamraża bieżącą rewizję: migawka projektu, elementów i dokumentacji. Wydanie z niekompletnymi danymi jest zapisywane
   * jako robocze (gotowaDoProdukcji=false) — PDF nosi wtedy oznaczenie dokumentu roboczego.
   */
  utworzWydanie(projektId: string, dane: { notatka?: string; tylkoKompletne?: boolean } = {}): Omit<WydanieProdukcyjne, "dane"> {
    const a = this.analiza(projektId);
    const dokumentacja = dokumentacjaProjektu({ projekt: a.projekt, zbudowane: a.zbudowane, formatki: a.formatki, ustawienia: a.ustawienia, walidacja: a.walidacja });
    if (dane.tylkoKompletne && !dokumentacja.gotowaDoProdukcji) throw new BladUslugi("Dokumentacja ma braki danych lub reguły robocze — wydanie produkcyjne wstrzymane (tylkoKompletne).");
    const { wydania: _w, umovy: _u, ...projekt } = a.projekt;
    const json = JSON.stringify({ projekt, zbudowane: a.zbudowane, dokumentacja, firma: a.ustawienia.daneFirmy.nazwaFirmy || undefined });
    let wynik!: WydanieProdukcyjne;
    this.edytujTemat(projektId, (p) => {
      if (p.rewizja !== a.projekt.rewizja) throw new BladUslugi("Projekt zmienił się w trakcie tworzenia wydania — spróbuj ponownie.");
      const numer = (p.wydania ?? []).reduce((mx, w) => Math.max(mx, w.numer), 0) + 1;
      wynik = {
        id: randomUUID().slice(0, 8),
        numer,
        rewizja: p.rewizja,
        utworzono: teraz(),
        ...(dane.notatka?.trim() ? { notatka: dane.notatka.trim().slice(0, 500) } : {}),
        wersjaGeneratora: dokumentacja.wersjaGeneratora,
        gotowaDoProdukcji: dokumentacja.gotowaDoProdukcji,
        liczbaCzesci: dokumentacja.czesci.length,
        podsumowanie: dokumentacja.podsumowanie,
        skrot: createHash("sha256").update(json).digest("hex"),
        dane: gzipSync(Buffer.from(json, "utf8")).toString("base64"),
      };
      p.wydania = [...(p.wydania ?? []), wynik];
    });
    const { dane: _d, ...meta } = wynik;
    return meta;
  }

  wydania(projektId: string): Omit<WydanieProdukcyjne, "dane">[] {
    return (this.projekt(projektId).wydania ?? []).map(({ dane: _d, ...w }) => w);
  }

  /** Migawka wydania z kontrolą sumy SHA-256. */
  private migawkaWydania(projektId: string, wydanieId: string) {
    const w = (this.projekt(projektId).wydania ?? []).find((x) => x.id === wydanieId || String(x.numer) === wydanieId);
    if (!w) throw new BladUslugi(`Nie ma wydania „${wydanieId}”.`);
    const json = gunzipSync(Buffer.from(w.dane, "base64")).toString("utf8");
    if (createHash("sha256").update(json).digest("hex") !== w.skrot) throw new BladUslugi(`Wydanie ${w.numer}: suma kontrolna się nie zgadza — dane uszkodzone.`);
    return { wydanie: w, ...(JSON.parse(json) as { projekt: Projekt; zbudowane: ZbudowanyModul[]; dokumentacja: DokumentacjaProjektu; firma?: string }) };
  }

  wydanieDokumentacja(projektId: string, wydanieId: string): DokumentacjaProjektu {
    return this.migawkaWydania(projektId, wydanieId).dokumentacja;
  }

  async wydaniePdf(projektId: string, wydanieId: string, wybor: { czesci?: string[]; moduly?: string[]; skrocony?: boolean; ukryjDaneKlienta?: boolean } = {}): Promise<{ pdf: Buffer; numer: number; rewizja: number }> {
    const m = this.migawkaWydania(projektId, wydanieId);
    const pdf = await dokumentacjaPdf({ projekt: m.projekt, zbudowane: m.zbudowane, dokumentacja: m.dokumentacja, firma: m.firma, tylkoCzesci: wybor.czesci, tylkoModuly: wybor.moduly, skrocony: wybor.skrocony, ukryjDaneKlienta: wybor.ukryjDaneKlienta, wydanie: { numer: m.wydanie.numer, utworzono: m.wydanie.utworzono } });
    return { pdf, numer: m.wydanie.numer, rewizja: m.wydanie.rewizja };
  }

  /**
   * Pakiet montażowy w tym samym schemacie co produkcyjny (sekcje T, R, E, M, K). Geometria z wydania (lub bieżącej rewizji),
   * dane operacyjne montażu (adres, kontakt, termin) zawsze z bieżącego projektu.
   */
  async montazPdf(projektId: string, wydanieId?: string): Promise<{ pdf: Buffer; rewizja: number; numer?: number }> {
    const biezacy = this.projekt(projektId);
    const montaz = {
      adres: biezacy.klient.adres || undefined,
      kontakt: [biezacy.klient.nazwa, biezacy.klient.telefon].filter(Boolean).join(", ") || undefined,
      termin: biezacy.terminMontazu,
      skladanie: biezacy.skladanieKorpusow,
    };
    if (wydanieId) {
      const m = this.migawkaWydania(projektId, wydanieId);
      const pdf = await dokumentacjaPdf({ rodzaj: "montaz", montaz, projekt: m.projekt, zbudowane: m.zbudowane, dokumentacja: m.dokumentacja, firma: m.firma, wydanie: { numer: m.wydanie.numer, utworzono: m.wydanie.utworzono } });
      return { pdf, rewizja: m.wydanie.rewizja, numer: m.wydanie.numer };
    }
    const a = this.analiza(projektId);
    const d = dokumentacjaProjektu({ projekt: a.projekt, zbudowane: a.zbudowane, formatki: a.formatki, ustawienia: a.ustawienia, walidacja: a.walidacja });
    const pdf = await dokumentacjaPdf({ rodzaj: "montaz", montaz, projekt: a.projekt, zbudowane: a.zbudowane, dokumentacja: d, firma: a.ustawienia.daneFirmy.nazwaFirmy || undefined });
    return { pdf, rewizja: a.projekt.rewizja };
  }

  /** Oferta dla klienta z wizualizacjami (JPEG renderowane w przeglądarce). */
  async ofertaPdf(
    projektId: string,
    o: { wariant?: WariantWyceny; numer?: string; waznoscDni?: number; terminRealizacji?: string; uwagi?: string[]; wizualizacje?: { tytul: string; jpegBase64: string }[]; wstepna?: boolean },
  ): Promise<Buffer> {
    const a = this.analiza(projektId);
    const b = this.magazyn.odczytaj();
    // Oferta dla klienta nie może zawierać cen zastępczych: brak ceny / pozycji w bazie blokuje PDF z listą braków.
    const wariantOferty = o.wariant ?? "standard";
    const braki = (a.warianty.find((w) => w.wariant === wariantOferty)?.pozycje ?? []).filter((x) => x.jestBledemWyceny);
    // Propozycja wstępna (zmiana 4 z OCENA-kreatora): przy brakach dokument z widełkami i znakiem „cena do potwierdzenia”.
    // Bez braków nie ma powodu do propozycji — wtedy powstaje zwykła oferta.
    const wstepna = o.wstepna === true && braki.length > 0;
    if (braki.length && !wstepna)
      throw new BladUslugi(
        `Oferty nie można wygenerować — w wariancie ${wariantOferty} są pozycje bez ceny lub bez rekordu w bazie: ` +
          braki.map((x) => x.nazwa.replace(/\s*"[^"]*"/g, "").replace(/\s*\(ID:[^)]*\)/g, "").trim()).join("; ") +
          ". Uzupełnij ceny w cenniku materiałów / bazie okuć albo zmień wybór.",
      );
    const teraz = new Date();
    const wizualizacje = (o.wizualizacje ?? []).slice(0, 8).map((v) => {
      const jpeg = Buffer.from(String(v.jpegBase64).replace(/^data:image\/\w+;base64,/, ""), "base64");
      if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new BladUslugi("Wizualizacja musi być obrazem JPEG.");
      return { tytul: String(v.tytul ?? "").slice(0, 120), jpeg };
    });
    return ofertaPdf({
      projekt: a.projekt,
      zbudowane: a.zbudowane,
      ilosci: a.projektWyceny,
      warianty: a.warianty,
      wariant: wariantOferty,
      firma: a.ustawienia.daneFirmy,
      materialy: new Map(b.materialy.map((m) => [m.id, m])),
      wizualizacje,
      wstepna: wstepna ? { braki: braki.map((x) => x.nazwa), dol: WIDELKI_WSTEPNE.dol, gora: WIDELKI_WSTEPNE.gora } : undefined,
      numer: o.numer || `${wstepna ? "PW" : "OF"}/${teraz.getFullYear()}/${String(teraz.getMonth() + 1).padStart(2, "0")}/${projektId.slice(0, 4).toUpperCase()}`,
      data: teraz,
      waznoscDni: o.waznoscDni && o.waznoscDni > 0 ? o.waznoscDni : 14,
      terminRealizacji: o.terminRealizacji || "do uzgodnienia po akceptacji projektu",
      uwagi: (o.uwagi ?? []).map(String).filter(Boolean).slice(0, 8),
    });
  }

  wycena(projektId: string, wariant?: WariantWyceny) {
    const a = this.analiza(projektId);
    const warianty = wariant ? a.warianty.filter((w) => w.wariant === wariant) : a.warianty;
    return { projekt: a.projekt.nazwa, ilosci: a.projektWyceny, warianty, uwagi: a.walidacja };
  }

  formatkiCSV(projektId: string): string {
    return "﻿" + formatkiCSV(this.analiza(projektId).formatki);
  }
}

function sprawdzWykonczenie(w: WykonczeniePowierzchni): WykonczeniePowierzchni {
  if (!/^#[0-9a-f]{6}$/i.test(w.kolorHEX ?? "")) throw new BladUslugi("Wykończenie: kolorHEX w formacie #rrggbb.");
  if (w.plytkaMM && !(w.plytkaMM.length === 2 && w.plytkaMM.every((x) => x >= 50 && x <= 4000))) throw new BladUslugi("Wykończenie: format płytki 50–4000 mm.");
  return {
    nazwa: String(w.nazwa ?? "").slice(0, 120),
    kolorHEX: w.kolorHEX,
    ...(w.plytkaMM ? { plytkaMM: [w.plytkaMM[0], w.plytkaMM[1]] as [number, number] } : {}),
    ...(w.fugaMM !== undefined ? { fugaMM: Math.max(0, Math.min(10, w.fugaMM)) } : {}),
    ...(w.kolorFugiHEX && /^#[0-9a-f]{6}$/i.test(w.kolorFugiHEX) ? { kolorFugiHEX: w.kolorFugiHEX } : {}),
    ...(w.wzor ? { wzor: w.wzor } : {}),
    ...(w.polysk !== undefined ? { polysk: Math.max(0, Math.min(1, w.polysk)) } : {}),
  };
}

function nowaSciana(s: NowaSciana, i: number): Sciana {
  const maWsp = [s.x1, s.y1, s.x2, s.y2].every((v) => typeof v === "number" && Number.isFinite(v));
  const dlugosc = maWsp ? Math.round(Math.hypot(s.x2! - s.x1!, s.y2! - s.y1!)) : s.dlugoscMM;
  if (!(dlugosc > 0)) throw new BladUslugi("Długość ściany musi być dodatnia.");
  const sc: Sciana = { id: id(), nazwa: s.nazwa ?? `Ściana ${String.fromCharCode(65 + (i % 26))}`, dlugoscMM: dlugosc, wysokoscMM: s.wysokoscMM ?? 2600 };
  if (maWsp) Object.assign(sc, { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 });
  if (s.wirtualna) sc.wirtualna = true;
  if (s.wykonczenie) sc.wykonczenie = sprawdzWykonczenie(s.wykonczenie);
  return sc;
}

function znajdzSciane(p: Projekt, scianaId: string): Sciana {
  const s = p.pomieszczenia.flatMap((r) => r.sciany).find((x) => x.id === scianaId);
  if (!s) throw new BladUslugi(`Nie ma ściany o id "${scianaId}" w projekcie.`);
  return s;
}

function sprawdzMaterial(b: BazaDanych, materialId: string): string {
  if (!b.materialy.some((m) => m.id === materialId)) throw new BladUslugi(`Nie ma materiału o id "${materialId}". Użyj lista_materialow.`);
  return materialId;
}

function nastepneX(p: Projekt, scianaId: string, wiszacy: boolean): number {
  return p.moduly
    .filter((m) => m.scianaId === scianaId && m.pozycjaYMM >= PROG_WISZACYCH_MM === wiszacy)
    .reduce((max, m) => Math.max(max, m.pozycjaXMM + m.szerokoscMM), 0);
}

const TYP_Z_KATEGORII: Partial<Record<NonNullable<ProduktOkucia["kategoria"]>, Okucie["typ"]>> = {
  szuflady: "systemSzuflad", zawiasy: "zawias", prowadnice: "prowadnica", podnosniki: "podnosnik", wyposazenie: "cargo",
  nogi: "noga", mocowania: "zawieszka", laczniki: "lacznik", wkrety: "wkret", kleje: "klej", uchwyty: "uchwyt",
};

const RODZAJE_AGD = ["piekarnik", "mikrofala", "plyta", "lodowka", "zmywarka", "okap", "inne"];

/** Walidacja listy AGD z panelu / MCP: rodzaj z listy, model niepusty, wymiary dodatnie. */
function sprawdzAGD(lista: unknown): UrzadzenieAGD[] {
  if (!Array.isArray(lista)) throw new BladUslugi("agd musi być listą urządzeń.");
  return lista.map((a, i) => {
    const u = a as Record<string, unknown>;
    if (!RODZAJE_AGD.includes(String(u.rodzaj))) throw new BladUslugi(`AGD ${i + 1}: nieznany rodzaj "${u.rodzaj}".`);
    const model = String(u.model ?? "").trim();
    if (!model) throw new BladUslugi(`AGD ${i + 1}: podaj model.`);
    const liczba = (k: string) => {
      const v = u[k];
      if (v === undefined || v === null || v === "") return undefined;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 5000) throw new BladUslugi(`AGD ${i + 1}: ${k} poza zakresem 0–5000 mm.`);
      return Math.round(n);
    };
    const wynik: UrzadzenieAGD = { rodzaj: u.rodzaj as UrzadzenieAGD["rodzaj"], model };
    for (const k of ["szerMM", "wysMM", "glMM", "odstepTylMM", "odstepBokMM", "odstepGoraMM", "glKorpusuMM", "glOtwarteMM"] as const) {
      const n = liczba(k);
      if (n !== undefined) wynik[k] = n;
    }
    if (typeof u.nisza === "string" && u.nisza.trim()) wynik.nisza = u.nisza.trim();
    if (Array.isArray(u.uwagi)) {
      const uw = u.uwagi.map((x) => String(x).trim()).filter(Boolean);
      if (uw.length) wynik.uwagi = uw;
    }
    return wynik;
  });
}
