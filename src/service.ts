import { schematUmowy, type Umowa } from "./core/contracts.js";
import { PRODUKTY_OKUC } from "./core/catalog/hardware-products.js";
import type { ProduktOkucia } from "./core/hardware-products.js";
import { randomUUID } from "node:crypto";
import { zbudujModul } from "./core/builder.js";
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
  Pomieszczenie,
  Projekt,
  Sciana,
  StatusProjektu,
  UrzadzenieAGD,
  UstawieniaStolarni,
  WariantWyceny,
} from "./core/types.js";
import { walidujProjekt } from "./core/validation.js";
import { czyStatus, STATUSY_PROJEKTU } from "./core/statusy.js";
import { dokumentacjaProjektu } from "./core/technologia.js";
import { ofertaPdf } from "./export/oferta.js";
import { dokumentacjaPdf } from "./export/pdf.js";
import { scianySzkicow, szkicePdf, type OpcjeSzkicow } from "./export/szkice.js";
import dxfParserModul from "dxf-parser";
import { czyDwg, dwgNaDxf } from "./core/dwg.js";
import { jednostkaZNaglowka, odcinkiDxf, scianyZDxf, warstwyDxf, type DxfDane, type JednostkaDxf } from "./core/dxf.js";
import { Magazyn, type BazaDanych } from "./store/store.js";

export class BladUslugi extends Error {}

// dxf-parser to pakiet CommonJS/UMD — w zależności od loadera klasa jest pod default albo bezpośrednio.
const DxfParser = ((dxfParserModul as unknown as { default?: unknown }).default ?? dxfParserModul) as new () => { parseSync(t: string): unknown };

const id = () => randomUUID().slice(0, 8);
const teraz = () => new Date().toISOString();
const PROG_WISZACYCH_MM = 1000;

export interface NowaSciana {
  nazwa?: string;
  dlugoscMM: number;
  wysokoscMM?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
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

  zmienProjekt(projektId: string, dane: { cenaUzgodnionaBrutto?: number | null; nazwa?: string; klient?: Partial<Klient>; status?: StatusProjektu; notatki?: string; terminMontazu?: string | null; agd?: UrzadzenieAGD[] }): Projekt {
    const cena = dane.cenaUzgodnionaBrutto;
    if (cena !== undefined && cena !== null && (typeof cena !== "number" || !Number.isFinite(cena) || cena <= 0 || cena > 100000000 || Math.abs(cena * 100 - Math.round(cena * 100)) > 0.00001)) throw new BladUslugi("Cena uzgodniona musi być dodatnią kwotą do 100 000 000 zł, z maksymalnie dwoma miejscami po przecinku.");
    if (dane.agd !== undefined) dane = { ...dane, agd: sprawdzAGD(dane.agd) };
    if (dane.status !== undefined && !czyStatus(dane.status)) throw new BladUslugi(`Nieznany status "${dane.status}". Dozwolone: ${STATUSY_PROJEKTU.join(", ")}.`);
    if (dane.terminMontazu && !/^\d{4}-\d{2}-\d{2}$/.test(dane.terminMontazu)) throw new BladUslugi("Termin montażu w formacie RRRR-MM-DD.");
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
      const kopia: Projekt = { ...structuredClone(zrodlo), umovy: [], id: id(), nazwa: nazwa ?? `${zrodlo.nazwa} (kopia)`, status: "szkic", rewizja: 1, utworzono: teraz(), zmieniono: teraz() };
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

  zmienPomieszczenie(projektId: string, pomieszczenieId: string, dane: { nazwa?: string; materialKorpusuId?: string; materialFrontuId?: string; materialBlatuId?: string }): Pomieszczenie {
    let wynik!: Pomieszczenie;
    this.edytuj(projektId, (p, b) => {
      const r = p.pomieszczenia.find((x) => x.id === pomieszczenieId);
      if (!r) throw new BladUslugi(`Nie ma pomieszczenia o id "${pomieszczenieId}".`);
      if (dane.nazwa) r.nazwa = dane.nazwa;
      if (dane.materialKorpusuId) r.materialKorpusuId = sprawdzMaterial(b, dane.materialKorpusuId);
      if (dane.materialFrontuId) r.materialFrontuId = sprawdzMaterial(b, dane.materialFrontuId);
      if (dane.materialBlatuId) r.materialBlatuId = sprawdzMaterial(b, dane.materialBlatuId);
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

  /** Przywraca pomieszczenia i moduły z wcześniejszego stanu (cofnij/ponów w aplikacji). */
  przywrocStan(projektId: string, stan: Pick<Projekt, "pomieszczenia" | "moduly">): Projekt {
    if (!Array.isArray(stan?.pomieszczenia) || !Array.isArray(stan?.moduly)) throw new BladUslugi("Nieprawidłowy stan projektu.");
    return this.edytuj(projektId, (p) => {
      p.pomieszczenia = stan.pomieszczenia;
      p.moduly = stan.moduly;
    });
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
      return { zm: zbudujModul(m, konstrukcja, b.ustawienia.technologia), materialy };
    });

    const formatki = listaFormatek(zbudowane, mapa, { odejmujGruboscObrzeza: b.ustawienia.okleinowanie.odejmujGruboscObrzeza });
    const obrzeza = zapotrzebowanieObrzeza(formatki, b.ustawienia.okleinowanie);
    const raportRozkroju = rozkroj(formatki, b.ustawienia.rozkroj, mapa);
    const projektWyceny = zbudujProjektWyceny(p.nazwa, zbudowane, obrzeza, raportRozkroju.arkusze.length);
    const warianty = wycenWszystkie(projektWyceny, b.ustawienia, b.materialy, b.okucia, b.cennikMaterialow ?? {});
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

    return { projekt: p, zbudowane: zbudowane.map((z) => z.zm), formatki, obrzeza, rozkroj: raportRozkroju, projektWyceny, warianty, walidacja, ustawienia: b.ustawienia };
  }

  /** Dokumentacja produkcyjna: części z układem lokalnym, operacje, diagnostyka i status gotowości — z jednej rewizji. */
  dokumentacja(projektId: string) {
    const a = this.analiza(projektId);
    return dokumentacjaProjektu({ projekt: a.projekt, zbudowane: a.zbudowane, formatki: a.formatki, ustawienia: a.ustawienia, walidacja: a.walidacja });
  }

  /** Pakiet PDF całej kuchni — ta sama rewizja co dokumentacja(). */
  async dokumentacjaPdf(projektId: string, wybor: { czesci?: string[]; moduly?: string[]; skrocony?: boolean } = {}): Promise<Buffer> {
    const a = this.analiza(projektId);
    const d = dokumentacjaProjektu({ projekt: a.projekt, zbudowane: a.zbudowane, formatki: a.formatki, ustawienia: a.ustawienia, walidacja: a.walidacja });
    return dokumentacjaPdf({ projekt: a.projekt, zbudowane: a.zbudowane, dokumentacja: d, firma: a.ustawienia.daneFirmy.nazwaFirmy || undefined, tylkoCzesci: wybor.czesci, tylkoModuly: wybor.moduly, skrocony: wybor.skrocony });
  }

  /** Oferta dla klienta z wizualizacjami (JPEG renderowane w przeglądarce). */
  async ofertaPdf(
    projektId: string,
    o: { wariant?: WariantWyceny; numer?: string; waznoscDni?: number; terminRealizacji?: string; uwagi?: string[]; wizualizacje?: { tytul: string; jpegBase64: string }[] },
  ): Promise<Buffer> {
    const a = this.analiza(projektId);
    const b = this.magazyn.odczytaj();
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
      wariant: o.wariant ?? "standard",
      firma: a.ustawienia.daneFirmy,
      materialy: new Map(b.materialy.map((m) => [m.id, m])),
      wizualizacje,
      numer: o.numer || `OF/${teraz.getFullYear()}/${String(teraz.getMonth() + 1).padStart(2, "0")}/${projektId.slice(0, 4).toUpperCase()}`,
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

function nowaSciana(s: NowaSciana, i: number): Sciana {
  const maWsp = [s.x1, s.y1, s.x2, s.y2].every((v) => typeof v === "number" && Number.isFinite(v));
  const dlugosc = maWsp ? Math.round(Math.hypot(s.x2! - s.x1!, s.y2! - s.y1!)) : s.dlugoscMM;
  if (!(dlugosc > 0)) throw new BladUslugi("Długość ściany musi być dodatnia.");
  const sc: Sciana = { id: id(), nazwa: s.nazwa ?? `Ściana ${String.fromCharCode(65 + (i % 26))}`, dlugoscMM: dlugosc, wysokoscMM: s.wysokoscMM ?? 2600 };
  if (maWsp) Object.assign(sc, { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 });
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
