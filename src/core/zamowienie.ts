import type { Material, Okucie, PozycjaKosztowa, RaportRozkroju, ZapotrzebowanieObrzeza } from "./types.js";

// Lista zamówienia dla dostawcy (ST-APP-003). Niczego nie liczy od nowa: płyty z raportu rozkroju, obrzeża
// z zapotrzebowania okleinowania (z zapasem), okucia i akcesoria z pozycji kosztorysu wybranego wariantu.
// Statusy pozycji zapisuje się przy projekcie (Projekt.zamowienie) pod stabilnym kluczem pozycji.

export type RodzajPozycjiZamowienia = "plyta" | "blat" | "obrzeze" | "okucie";

export interface PozycjaZamowienia {
  /** Stabilny klucz pozycji (np. plyta|<materialId>|18) — pod nim zapisany jest status. */
  klucz: string;
  rodzaj: RodzajPozycjiZamowienia;
  /** Producent z katalogu materiałów/okuć; puste = nieznany. */
  producent: string;
  /** Kod/SKU producenta; undefined = BRAK KODU. */
  kod?: string;
  nazwa: string;
  dekor?: string;
  gruboscMM?: number;
  /** Format arkusza [mm], np. 2800 × 2070. */
  format?: string;
  ilosc: number;
  jednostka: string;
  /** Płyty: powierzchnia zamawianych arkuszy [m²]. */
  m2?: number;
  /** Obrzeża: metry netto bez naddatku i zapasu (informacyjnie). */
  nettoM?: number;
  uwagi: string[];
}

export const STANY_POZYCJI = ["doZamowienia", "zamowione", "czesciowo", "dostarczone", "brak"] as const;
export type StanPozycji = (typeof STANY_POZYCJI)[number];
export const NAZWY_STANOW: Record<StanPozycji, string> = {
  doZamowienia: "do zamówienia",
  zamowione: "zamówione",
  czesciowo: "dostarczone częściowo",
  dostarczone: "dostarczone",
  brak: "brak u dostawcy",
};

export interface StatusPozycjiZamowienia {
  stan: StanPozycji;
  /** RRRR-MM-DD */
  dataZamowienia?: string;
  /** RRRR-MM-DD — dostawa pełna lub ostatnia częściowa. */
  dataDostawy?: string;
  /** Ilość w chwili zamówienia — pozwala wykryć, że projekt urósł po zamówieniu. */
  iloscZamowiona?: number;
  /** Stan „częściowo”: ile już dotarło. */
  iloscDostarczona?: number;
  /** Hurtownia/dostawca wpisany ręcznie; zastępuje producenta przy grupowaniu. */
  dostawca?: string;
  uwagi?: string;
  zmieniono: string;
}

export interface StanZamowienia {
  pozycje: Record<string, StatusPozycjiZamowienia>;
}

export interface PozycjaZeStatusem extends PozycjaZamowienia {
  status: StatusPozycjiZamowienia | { stan: "doZamowienia" };
  /** Zamówiono mniej, niż wymaga bieżące zestawienie. */
  doDomowienia?: number;
}

export interface WejscieZestawienia {
  rozkroj: RaportRozkroju;
  obrzeza: ZapotrzebowanieObrzeza[];
  /** Pozycje kosztorysu jednego wariantu (okucia, akcesoria, blat). */
  pozycjeWyceny: PozycjaKosztowa[];
  materialy: Map<string, Material>;
  okucia: Okucie[];
  blat?: { materialId?: string; metryBiezace: number };
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const kodLubBrak = (k?: string) => (k && k.trim() ? k.trim() : undefined);

/** Zestawienie zamówienia z istniejących wyników produkcji i wyceny. Kolejność: płyty, blaty, obrzeża, okucia. */
export function zestawienieZamowienia(w: WejscieZestawienia): PozycjaZamowienia[] {
  const wynik: PozycjaZamowienia[] = [];

  for (const p of w.rozkroj.podsumowanie) {
    if (!p.liczbaArkuszy) continue;
    const m = w.materialy.get(p.materialId);
    const ark = w.rozkroj.arkusze.find((a) => a.materialId === p.materialId && a.gruboscMM === p.gruboscMM);
    const uwagi: string[] = [];
    if (!m) uwagi.push(`Materiał ${p.materialId} nie istnieje w bazie — sprawdź projekt.`);
    wynik.push({
      klucz: `plyta|${p.materialId}|${p.gruboscMM}`,
      rodzaj: "plyta",
      producent: m?.producent ?? "",
      kod: kodLubBrak(m?.artykulProducenta) ?? kodLubBrak(m?.kod),
      nazwa: p.materialOpis,
      dekor: m?.dekor || undefined,
      gruboscMM: p.gruboscMM,
      format: ark ? `${ark.dlugoscMM} × ${ark.szerokoscMM}` : undefined,
      ilosc: p.liczbaArkuszy,
      jednostka: "ark.",
      m2: r2(p.powierzchniaArkuszyM2),
      uwagi,
    });
  }

  if (w.blat && w.blat.metryBiezace > 0) {
    const m = w.blat.materialId ? w.materialy.get(w.blat.materialId) : undefined;
    wynik.push({
      klucz: `blat|${w.blat.materialId ?? "dobor"}`,
      rodzaj: "blat",
      producent: m?.producent ?? "",
      kod: kodLubBrak(m?.artykulProducenta) ?? kodLubBrak(m?.kod),
      nazwa: m ? (/^blat/i.test(m.nazwa) ? m.nazwa : `Blat ${m.nazwa}`) : "Blat (nie wybrano materiału w projekcie)",
      dekor: m?.dekor || undefined,
      gruboscMM: m?.gruboscMM,
      ilosc: r2(w.blat.metryBiezace),
      jednostka: "mb",
      uwagi: m ? ["Metry bieżące blatu z projektu — sprawdź długość handlową i łączenia."] : ["Wybierz blat w projekcie, zanim zamówisz."],
    });
  }

  for (const o of w.obrzeza) {
    const m = w.materialy.get(o.materialId);
    wynik.push({
      klucz: `obrzeze|${o.rodzaj}|${o.materialId}`,
      rodzaj: "obrzeze",
      producent: m?.producent ?? "",
      kod: undefined,
      nazwa: o.opis,
      dekor: m?.dekor || undefined,
      gruboscMM: o.rodzaj === "abs08" ? 0.8 : 2,
      ilosc: r2(o.dlugoscZakupuM),
      jednostka: "mb",
      nettoM: r2(o.dlugoscNettoM),
      uwagi: ["Kod obrzeża dobierz do dekoru u dostawcy (katalog nie przechowuje kodów obrzeży)."],
    });
  }

  const poId = new Map(w.okucia.map((o) => [o.id, o]));
  const okucia = new Map<string, PozycjaZamowienia>();
  for (const p of w.pozycjeWyceny) {
    if (p.kategoria !== "okucia" && p.kategoria !== "akcesoria") continue;
    // Obrzeże z kosztorysu to ta sama potrzeba co zapotrzebowanie okleinowania wyżej — nie zamawiamy podwójnie.
    if (p.typOkucia === "obrzeze") continue;
    if (p.ilosc <= 0) continue;
    const o = p.okucieId ? poId.get(p.okucieId) : undefined;
    const klucz = o ? `okucie|${o.id}` : `okucie|dobor|${p.nazwa}`;
    const uwagi: string[] = [];
    if (!o) uwagi.push("Dobór domyślny bez konkretnej pozycji w bazie okuć — wybierz produkt przed zamówieniem.");
    if (p.jestBledemWyceny) uwagi.push("Pozycja ma błąd wyceny (brak ceny lub rekordu) — sprawdź w kosztorysie.");
    const istn = okucia.get(klucz);
    if (istn) {
      istn.ilosc = r2(istn.ilosc + p.ilosc);
      continue;
    }
    okucia.set(klucz, {
      klucz,
      rodzaj: "okucie",
      producent: o?.producent ?? "",
      kod: kodLubBrak(o?.skuProducenta),
      nazwa: o?.nazwa ?? p.nazwa,
      ilosc: p.ilosc,
      jednostka: o?.jednostka || p.jednostka,
      uwagi,
    });
  }
  wynik.push(...okucia.values());
  return wynik;
}

/** Status pozycji albo domyślne „do zamówienia”; wylicza ilość do domówienia, gdy projekt urósł po zamówieniu. */
export function zeStatusami(pozycje: PozycjaZamowienia[], stan?: StanZamowienia): { pozycje: PozycjaZeStatusem[]; nieaktualne: { klucz: string; status: StatusPozycjiZamowienia }[] } {
  const zapisane = stan?.pozycje ?? {};
  const lista = pozycje.map((p): PozycjaZeStatusem => {
    const s = zapisane[p.klucz];
    if (!s) return { ...p, status: { stan: "doZamowienia" } };
    const zamowiono = s.iloscZamowiona;
    const doDomowienia = s.stan !== "doZamowienia" && zamowiono !== undefined && p.ilosc > zamowiono + 1e-9 ? r2(p.ilosc - zamowiono) : undefined;
    return { ...p, status: s, ...(doDomowienia ? { doDomowienia } : {}) };
  });
  const klucze = new Set(pozycje.map((p) => p.klucz));
  // Pozycje już zamówione, których bieżące zestawienie nie potrzebuje (zmiana projektu) — do wyjaśnienia z dostawcą.
  const nieaktualne = Object.entries(zapisane)
    .filter(([k, s]) => !klucze.has(k) && s.stan !== "doZamowienia")
    .map(([klucz, status]) => ({ klucz, status }));
  return { pozycje: lista, nieaktualne };
}

export interface ZmianaStatusu {
  stan: StanPozycji;
  data?: string;
  iloscDostarczona?: number;
  dostawca?: string | null;
  uwagi?: string | null;
}

const DOZWOLONE: Record<StanPozycji, StanPozycji[]> = {
  doZamowienia: ["zamowione"],
  zamowione: ["czesciowo", "dostarczone", "brak", "doZamowienia"],
  czesciowo: ["czesciowo", "dostarczone", "brak", "zamowione"],
  dostarczone: ["zamowione", "czesciowo"],
  brak: ["zamowione", "doZamowienia"],
};

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export class BladStatusuZamowienia extends Error {}

/**
 * Nowy status pozycji. Przejścia: do zamówienia → zamówione → dostarczone / częściowo / brak; „brak” można zamówić
 * ponownie, a pomyłkę cofnąć o krok. Data domyślnie dzisiejsza. Zmiana tylko dostawcy/uwag: ten sam stan.
 */
export function nowyStatus(pozycja: PozycjaZamowienia, obecny: StatusPozycjiZamowienia | undefined, z: ZmianaStatusu, teraz: Date): StatusPozycjiZamowienia {
  if (!(STANY_POZYCJI as readonly string[]).includes(z.stan)) throw new BladStatusuZamowienia(`Nieznany stan „${String(z.stan)}”.`);
  const stary: StanPozycji = obecny?.stan ?? "doZamowienia";
  if (z.stan !== stary && !DOZWOLONE[stary].includes(z.stan))
    throw new BladStatusuZamowienia(`Nie można zmienić stanu z „${NAZWY_STANOW[stary]}” na „${NAZWY_STANOW[z.stan]}”.`);
  if (z.data !== undefined && !DATA.test(z.data)) throw new BladStatusuZamowienia("Data musi mieć postać RRRR-MM-DD.");
  const dzis = teraz.toISOString().slice(0, 10);
  const data = z.data ?? dzis;
  const s: StatusPozycjiZamowienia = { ...(obecny ?? { stan: "doZamowienia", zmieniono: "" }), stan: z.stan, zmieniono: teraz.toISOString() };

  if (z.stan === "doZamowienia") {
    delete s.dataZamowienia;
    delete s.dataDostawy;
    delete s.iloscZamowiona;
    delete s.iloscDostarczona;
  } else if (z.stan === "zamowione") {
    if (stary === "doZamowienia" || stary === "brak") {
      s.dataZamowienia = data;
      s.iloscZamowiona = pozycja.ilosc;
    }
    delete s.dataDostawy;
    delete s.iloscDostarczona;
  } else if (z.stan === "czesciowo") {
    const ile = z.iloscDostarczona;
    const cel = s.iloscZamowiona ?? pozycja.ilosc;
    if (ile === undefined || !Number.isFinite(ile) || ile <= 0 || ile >= cel)
      throw new BladStatusuZamowienia(`Podaj dostarczoną ilość większą od 0 i mniejszą od zamówionej (${cel} ${pozycja.jednostka}).`);
    s.iloscDostarczona = r2(ile);
    s.dataDostawy = data;
  } else if (z.stan === "dostarczone") {
    s.dataDostawy = data;
    delete s.iloscDostarczona;
  } else if (z.stan === "brak") {
    delete s.dataDostawy;
    delete s.iloscDostarczona;
  }
  if (z.dostawca !== undefined) {
    const d = (z.dostawca ?? "").trim().slice(0, 80);
    if (d) s.dostawca = d;
    else delete s.dostawca;
  }
  if (z.uwagi !== undefined) {
    const u = (z.uwagi ?? "").trim().slice(0, 300);
    if (u) s.uwagi = u;
    else delete s.uwagi;
  }
  return s;
}

/** Nazwa grupy dostawcy: ręcznie wpisany dostawca, potem producent, na końcu „Bez dostawcy”. */
export function grupaDostawcy(p: PozycjaZeStatusem): string {
  const d = "dostawca" in p.status ? p.status.dostawca : undefined;
  return d || p.producent || "Bez dostawcy";
}

export function grupujPoDostawcy(pozycje: PozycjaZeStatusem[]): { dostawca: string; pozycje: PozycjaZeStatusem[] }[] {
  const mapa = new Map<string, PozycjaZeStatusem[]>();
  for (const p of pozycje) {
    const g = grupaDostawcy(p);
    mapa.set(g, [...(mapa.get(g) ?? []), p]);
  }
  return [...mapa.entries()]
    .sort((a, b) => (a[0] === "Bez dostawcy" ? 1 : b[0] === "Bez dostawcy" ? -1 : a[0].localeCompare(b[0], "pl")))
    .map(([dostawca, pozycje]) => ({ dostawca, pozycje }));
}

export const BRAK_KODU = "BRAK KODU";
const RODZAJ: Record<RodzajPozycjiZamowienia, string> = { plyta: "Płyta", blat: "Blat", obrzeze: "Obrzeże", okucie: "Okucie" };
export const nazwaRodzaju = (r: RodzajPozycjiZamowienia) => RODZAJ[r];

function csv(v: string): string {
  return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
const liczba = (v: number | undefined) => (v === undefined ? "" : String(r2(v)).replace(".", ","));

/** CSV (średnik, przecinek dziesiętny — jak lista formatek), pogrupowany po dostawcy. */
export function zamowienieCSV(pozycje: PozycjaZeStatusem[]): string {
  const naglowek = ["Dostawca", "Rodzaj", "Producent", "Kod / SKU", "Nazwa", "Dekor", "Grubość [mm]", "Format [mm]", "Ilość", "Jednostka", "m² arkuszy", "Status", "Data zamówienia", "Data dostawy", "Dostarczono", "Do domówienia", "Uwagi"];
  const wiersze = grupujPoDostawcy(pozycje).flatMap((g) =>
    g.pozycje.map((p) => {
      const s = p.status as Partial<StatusPozycjiZamowienia> & { stan: StanPozycji };
      return [
        g.dostawca,
        nazwaRodzaju(p.rodzaj),
        p.producent,
        p.kod ?? BRAK_KODU,
        p.nazwa,
        p.dekor ?? "",
        liczba(p.gruboscMM),
        p.format ?? "",
        liczba(p.ilosc),
        p.jednostka,
        liczba(p.m2),
        NAZWY_STANOW[s.stan],
        s.dataZamowienia ?? "",
        s.dataDostawy ?? "",
        liczba(s.iloscDostarczona),
        liczba(p.doDomowienia),
        [...p.uwagi, s.uwagi ?? ""].filter(Boolean).join(" "),
      ];
    }),
  );
  return [naglowek, ...wiersze].map((w) => w.map(csv).join(";")).join("\r\n");
}
