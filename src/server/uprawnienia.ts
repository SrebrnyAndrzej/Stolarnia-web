import type { StatusProjektu } from "../core/statusy.js";

// Uprawnienia profili dostępu v2 (decyzje Mateusza 2026-11-01). Czyste funkcje — bez Express i bez sieci — żeby
// macierz dało się czytać i testować: profil × metoda × trasa. Zasada: odmowa domyślna — trasa bez reguły = 403.
// Logowanie zostaje w access.ts (ciasteczko httpOnly, pan_stolarz_members); tu tylko decyzja „wolno / nie wolno”
// i filtr pól odpowiedzi.
//
// Profile (właściciel = role owner, pozostałe = role employee + kolumna access_profile):
// - wlasciciel — wszystko;
// - sprzedaz   — projektuje i wycenia przy kliencie: ceny ofertowe tak; koszty zakupu, marża, narzut, ceny
//                jednostkowe zakupu, cenaNetto/rabat materiałów i okuć oraz kwoty w opisach — nie; umowy tylko odczyt;
//                cena uzgodniona i status tylko na etapie Szkic/Wycena;
// - produkcja  — wydania i pakiet P, uwagi, status Produkcja → Gotowe do montażu; bez cen, umów, kontaktu klienta i CRM;
// - montaz     — wydania i pakiet M (z adresem i kontaktem), uwagi, status Gotowe do montażu → Zakończony; bez cen i umów.

export const PROFILE_DOSTEPU = ["sprzedaz", "produkcja", "montaz"] as const;
export type ProfilDostepu = (typeof PROFILE_DOSTEPU)[number];
export type Profil = "wlasciciel" | ProfilDostepu;
export const NAZWY_PROFILI: Record<Profil, string> = { wlasciciel: "Właściciel", sprzedaz: "Sprzedaż i projekt", produkcja: "Produkcja", montaz: "Montaż" };
/** Brak profilu (np. migracja 0003 jeszcze nie uruchomiona) → najwęższy profil: bez cen i bez kontaktu klienta. */
export const PROFIL_ZAPASOWY: ProfilDostepu = "produkcja";

export function profilOsoby(osoba: { role: string; access_profile?: string | null }): Profil {
  if (osoba.role === "owner") return "wlasciciel";
  return (PROFILE_DOSTEPU as readonly string[]).includes(osoba.access_profile ?? "") ? (osoba.access_profile as ProfilDostepu) : PROFIL_ZAPASOWY;
}

const S: ProfilDostepu = "sprzedaz";
const PR: ProfilDostepu = "produkcja";
const M: ProfilDostepu = "montaz";
const WSZYSCY: ProfilDostepu[] = [S, PR, M];
const TYLKO_WLASCICIEL: ProfilDostepu[] = [];

const ID = "[^/]+";
const proj = (reszta = "") => new RegExp(`^/api/projekty/${ID}${reszta}$`);
const v2p = (reszta = "") => new RegExp(`^/api/v2/projects/${ID}${reszta}$`);

export interface Regula {
  metody: string;
  sciezka: RegExp;
  /** Profile pracowników z dostępem. Właściciel ma dostęp zawsze; pusta lista = tylko właściciel (reguła jawna). */
  profile: ProfilDostepu[];
  opis: string;
}

/** Macierz tras chronionych (za bramką /api i /mcp). Metody oddzielone „|”; HEAD = GET. Ścieżki małymi literami. */
export const REGULY_TRAS: Regula[] = [
  { metody:"GET|PUT",sciezka:/^\/api\/v2\/purchase-orders$/,profile:TYLKO_WLASCICIEL,opis:"zakup materiałów — wyłącznie właściciel" },
  { metody:"GET",sciezka:/^\/api\/v2\/purchase-orders\/(connection|projects|[^/]+\/export)$/,profile:TYLKO_WLASCICIEL,opis:"stan integracji i eksport koszyka Mussi" },
  { metody: "GET|PUT", sciezka: /^\/api\/v2\/furniture$/, profile: WSZYSCY, opis: "wspólna biblioteka mebli — zespół edytuje wszystkie modele" },
  { metody: "GET", sciezka: /^\/api\/v2\/furniture\/[^/]+\/construction$/, profile: WSZYSCY, opis: "karta konstrukcji zapisanej wersji — zespół" },
  // ---- v2: panel pracownika, zespół, zadania
  { metody: "GET", sciezka: /^\/api\/v2\/projects$/, profile: WSZYSCY, opis: "lista projektów (technicznie, wg przydziału)" },
  { metody: "GET", sciezka: v2p(), profile: WSZYSCY, opis: "widok techniczny projektu" },
  { metody: "GET", sciezka: v2p("/documents(\\.pdf)?"), profile: WSZYSCY, opis: "dokumentacja techniczna z wydania" },
  { metody: "GET", sciezka: /^\/api\/v2\/requests$/, profile: TYLKO_WLASCICIEL, opis: "zapytania klientów" },
  { metody: "GET|POST", sciezka: /^\/api\/v2\/members$/, profile: TYLKO_WLASCICIEL, opis: "konta zespołu" },
  { metody: "PATCH", sciezka: new RegExp(`^/api/v2/members/${ID}$`), profile: TYLKO_WLASCICIEL, opis: "zmiana dostępu pracownika" },
  { metody: "POST", sciezka: new RegExp(`^/api/v2/members/${ID}/activation$`), profile: TYLKO_WLASCICIEL, opis: "link aktywacyjny" },
  { metody: "GET", sciezka: /^\/api\/v2\/tasks$/, profile: WSZYSCY, opis: "moje zadania" },
  { metody: "POST", sciezka: /^\/api\/v2\/tasks$/, profile: TYLKO_WLASCICIEL, opis: "przydział zadania" },
  { metody: "PATCH", sciezka: new RegExp(`^/api/v2/tasks/${ID}$`), profile: WSZYSCY, opis: "zmiana stanu własnego zadania" },

  // ---- katalogi, materiały, ustawienia
  { metody: "GET", sciezka: /^\/api\/okucia-katalog$/, profile: [S], opis: "katalog okuć producentów (bez cen referencyjnych)" },
  { metody: "POST", sciezka: new RegExp(`^/api/okucia-katalog/${ID}/dodaj$`), profile: TYLKO_WLASCICIEL, opis: "dodanie okucia z ceną zakupu" },
  { metody: "GET", sciezka: /^\/api\/(okucia-katalog|dekory)\/obrazy\/.+$/, profile: WSZYSCY, opis: "zdjęcia katalogów" },
  { metody: "GET", sciezka: /^\/api\/dekory$/, profile: [S], opis: "galeria dekorów" },
  { metody: "GET", sciezka: new RegExp(`^/api/dekory/${ID}$`), profile: [S], opis: "dekor" },
  { metody: "POST", sciezka: new RegExp(`^/api/dekory/${ID}/material$`), profile: TYLKO_WLASCICIEL, opis: "aktywacja dekoru jako materiału (cena zakupu)" },
  { metody: "GET", sciezka: /^\/api\/katalog$/, profile: [S], opis: "katalog modułów" },
  { metody: "GET", sciezka: /^\/api\/materialy$/, profile: [S], opis: "materiały (bez cen zakupu)" },
  { metody: "POST", sciezka: /^\/api\/materialy$/, profile: TYLKO_WLASCICIEL, opis: "nowy materiał" },
  { metody: "PUT", sciezka: new RegExp(`^/api/materialy/${ID}$`), profile: TYLKO_WLASCICIEL, opis: "zmiana materiału i ceny" },
  { metody: "GET", sciezka: /^\/api\/cennik\/materialow$/, profile: TYLKO_WLASCICIEL, opis: "cennik zakupu" },
  { metody: "PUT|DELETE", sciezka: new RegExp(`^/api/cennik/materialow/${ID}$`), profile: TYLKO_WLASCICIEL, opis: "cennik zakupu" },
  { metody: "GET", sciezka: /^\/api\/okucia$/, profile: [S], opis: "okucia (bez cen zakupu)" },
  { metody: "PUT", sciezka: new RegExp(`^/api/okucia/${ID}$`), profile: TYLKO_WLASCICIEL, opis: "zmiana okucia i ceny" },
  { metody: "GET", sciezka: /^\/api\/ustawienia$/, profile: [S], opis: "ustawienia (z finansów tylko VAT)" },
  { metody: "PATCH", sciezka: /^\/api\/ustawienia$/, profile: TYLKO_WLASCICIEL, opis: "ustawienia firmy" },
  { metody: "GET", sciezka: /^\/api\/(systemy-szuflad|przelicznik-szuflad)$/, profile: WSZYSCY, opis: "kalkulator szuflad" },
  { metody: "GET", sciezka: /^\/api\/cad\/konwerter$/, profile: [S], opis: "import CAD" },
  { metody: "POST", sciezka: /^\/api\/cad\/analiza$/, profile: [S], opis: "import CAD" },
  { metody: "GET", sciezka: /^\/api\/okucia-projektu\/opcje$/, profile: [S], opis: "opcje okuć projektu (bez cen zakupu)" },

  // ---- umowy
  { metody: "GET", sciezka: proj("/umowy"), profile: [S], opis: "umowy — odczyt" },
  { metody: "POST", sciezka: proj("/umowy"), profile: TYLKO_WLASCICIEL, opis: "nowa umowa" },
  { metody: "GET", sciezka: proj(`/umowy/${ID}/pdf`), profile: [S], opis: "PDF umowy — odczyt" },

  // ---- projekty
  { metody: "GET", sciezka: /^\/api\/projekty$/, profile: WSZYSCY, opis: "lista projektów (produkcja/montaż: przydzielone, bez cen)" },
  { metody: "POST", sciezka: /^\/api\/projekty$/, profile: [S], opis: "nowy projekt przy kliencie" },
  { metody: "GET", sciezka: proj(), profile: [S], opis: "projekt" },
  { metody: "PATCH", sciezka: proj(), profile: WSZYSCY, opis: "zmiana projektu (treść sprawdza sprawdzZmianeProjektu)" },
  { metody: "DELETE", sciezka: proj(), profile: TYLKO_WLASCICIEL, opis: "usunięcie projektu" },
  { metody: "POST", sciezka: proj("/notatki"), profile: WSZYSCY, opis: "uwaga do projektu (podpisana profilem)" },
  { metody: "PATCH|DELETE", sciezka: proj(`/notatki/${ID}`), profile: [S], opis: "obsługa uwag" },
  { metody: "POST", sciezka: proj("/duplikuj"), profile: [S], opis: "kopia projektu" },
  { metody: "POST", sciezka: proj("/pomieszczenia"), profile: [S], opis: "konstrukcja" },
  { metody: "PATCH", sciezka: proj(`/pomieszczenia/${ID}`), profile: [S], opis: "konstrukcja" },
  { metody: "POST", sciezka: proj(`/pomieszczenia/${ID}/sciany`), profile: [S], opis: "konstrukcja" },
  { metody: "PATCH|DELETE", sciezka: proj(`/sciany/${ID}`), profile: [S], opis: "konstrukcja" },
  { metody: "POST", sciezka: proj(`/sciany/${ID}/wypelnij`), profile: [S], opis: "szybki projekt: wypełnij ścianę" },
  { metody: "POST", sciezka: proj("/szybki-uklad"), profile: [S], opis: "szybki projekt: układ I/L/U" },
  { metody: "GET|POST", sciezka: proj("/styl"), profile: [S], opis: "szybki projekt: pakiet stylu" },
  { metody: "PUT", sciezka: proj("/okucia"), profile: [S], opis: "szybki projekt: okucia projektu" },
  { metody: "POST", sciezka: proj("/import-cad"), profile: [S], opis: "import CAD" },
  { metody: "PUT", sciezka: proj("/stan"), profile: [S], opis: "cofnij / przywróć" },
  { metody: "POST", sciezka: proj("/luka"), profile: [S], opis: "konstrukcja" },
  { metody: "POST", sciezka: proj("/moduly"), profile: [S], opis: "konstrukcja" },
  { metody: "PATCH|DELETE", sciezka: proj(`/moduly/${ID}`), profile: [S], opis: "konstrukcja" },
  { metody: "POST", sciezka: proj(`/moduly/${ID}/(polecenie|duplikuj)`), profile: [S], opis: "konstrukcja" },
  { metody: "DELETE", sciezka: proj(`/moduly/${ID}/drzewo`), profile: [S], opis: "konstrukcja" },
  { metody: "GET", sciezka: proj("/analiza"), profile: [S], opis: "analiza i wycena (bez kosztów zakupu i marży)" },
  { metody: "GET", sciezka: proj("/dokumentacja(\\.pdf)?"), profile: [S], opis: "dokumentacja bieżącej rewizji (podgląd)" },
  { metody: "GET", sciezka: proj("/montaz\\.pdf"), profile: [S], opis: "pakiet M bieżącej rewizji (podgląd)" },
  { metody: "GET", sciezka: proj("/wydania"), profile: WSZYSCY, opis: "lista wydań" },
  { metody: "POST", sciezka: proj("/wydania"), profile: TYLKO_WLASCICIEL, opis: "wydanie do produkcji" },
  { metody: "GET", sciezka: proj(`/wydania/${ID}/dokumentacja(\\.pdf)?`), profile: [S, PR], opis: "pakiet produkcyjny P z wydania" },
  { metody: "GET", sciezka: proj(`/wydania/${ID}/montaz\\.pdf`), profile: [S, M], opis: "pakiet montażowy M z wydania" },
  { metody: "GET", sciezka: proj("/(szkice|szkic\\.pdf)"), profile: [S], opis: "szkice dla klienta" },
  { metody: "POST", sciezka: proj("/oferta\\.pdf"), profile: [S], opis: "oferta dla klienta (ceny ofertowe)" },
  { metody: "GET", sciezka: proj("/formatki\\.csv"), profile: [S], opis: "formatki CSV" },

  // ---- MCP po HTTP: pełny dostęp do danych → tylko właściciel
  { metody: "GET|POST|DELETE", sciezka: /^\/mcp$/, profile: TYLKO_WLASCICIEL, opis: "MCP po HTTP" },
];

/** Ścieżka do porównań: małe litery (Express nie rozróżnia wielkości liter), bez powtórzonych i końcowych „/”. */
export function normalizujSciezke(sciezka: string): string {
  const n = sciezka.toLowerCase().replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return n || "/";
}
const metodaReguly = (m: string) => (m.toUpperCase() === "HEAD" ? "GET" : m.toUpperCase());

/** Reguły pasujące do trasy (bez względu na profil) — test pilnuje, żeby każda trasa aplikacji miała regułę. */
export function regulyTrasy(metoda: string, sciezka: string): Regula[] {
  const m = metodaReguly(metoda);
  const n = normalizujSciezke(sciezka);
  return REGULY_TRAS.filter((r) => r.metody.split("|").includes(m) && r.sciezka.test(n));
}

/** Właściciel: wszystko. Pracownik: tylko trasa z regułą zawierającą jego profil (odmowa domyślna). */
export function dostepDoTrasy(profil: Profil, metoda: string, sciezka: string): boolean {
  if (profil === "wlasciciel") return true;
  return regulyTrasy(metoda, sciezka).some((r) => r.profile.includes(profil));
}

/** Id projektu z trasy starego panelu (/api/projekty/:id/...), z oryginalną wielkością liter. */
export function projektZTrasy(sciezka: string): string | undefined {
  const m = /^\/api\/projekty\/([^/]+)/i.exec(sciezka);
  if (!m) return undefined;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

// ---------- Zmiana projektu i przejścia statusów ----------

/** Etap sprzedaży — tu sprzedaż zmienia cenę uzgodnioną i status. Akceptację i dalsze etapy ustawia właściciel. */
export const STATUSY_SPRZEDAZY: readonly StatusProjektu[] = ["szkic", "wycena"];
export const PRZEJSCIA_WARSZTATU: Record<"produkcja" | "montaz", { z: StatusProjektu; na: StatusProjektu; nazwa: string; nazwaZ: string }> = {
  produkcja: { z: "produkcja", na: "gotoweDoMontazu", nazwa: "„Gotowe do montażu”", nazwaZ: "„Produkcja”" },
  montaz: { z: "gotoweDoMontazu", na: "zakonczony", nazwa: "„Zakończony”", nazwaZ: "„Gotowe do montażu”" },
};

/** PATCH /api/projekty/:id — komunikat odmowy albo null. */
export function sprawdzZmianeProjektu(profil: Profil, obecny: StatusProjektu, zmiana: unknown): string | null {
  if (profil === "wlasciciel") return null;
  const z = (zmiana && typeof zmiana === "object" && !Array.isArray(zmiana) ? zmiana : {}) as Record<string, unknown>;
  if (profil === "sprzedaz") {
    const sprzedaz = STATUSY_SPRZEDAZY.includes(obecny);
    if ("cenaUzgodnionaBrutto" in z && !sprzedaz) return "Cenę uzgodnioną po akceptacji zmienia tylko właściciel.";
    if ("status" in z && z.status !== obecny && (!sprzedaz || !STATUSY_SPRZEDAZY.includes(z.status as StatusProjektu)))
      return "Status zmieniasz tylko między „Szkic” a „Wycena”. Akceptację i dalsze etapy ustawia właściciel.";
    return null;
  }
  const d = PRZEJSCIA_WARSZTATU[profil];
  const klucze = Object.keys(z);
  if (klucze.length !== 1 || klucze[0] !== "status" || z.status !== d.na) return `Profil ${NAZWY_PROFILI[profil]} może tylko oznaczyć zlecenie jako ${d.nazwa}.`;
  if (obecny !== d.z) return `Status ${d.nazwa} ustawisz dopiero na etapie ${d.nazwaZ}.`;
  return null;
}

// ---------- Filtr pól odpowiedzi ----------

// Dopasowanie po granicach camelCase (wielkość liter ma znaczenie), żeby nie wycinać np. „producent” ani „wstawka”.
/** Ceny, koszty, marże i umowy — niewidoczne dla produkcji i montażu. */
const KLUCZ_CENOWY = /^(cen[ay]|koszt|marz|narzut|rabat|vat|stawk|minimalnaWartosc|umow|umov|zaliczk|maCene)|(Cen[ay]|Koszt|Marz|Narzut|Rabat|Vat|Zaliczk|Wyceny$)|^(finanse|warianty|cennikMaterialow)$/;
/** Dane klienta (nazwa i kontakt) — niewidoczne dla produkcji, jak w pakiecie P (ukryjDaneKlienta). */
const KLUCZ_KONTAKTOWY = /^(klient|telefon|email|e-mail|adres|kodPocztowy|miasto|nip)$/i;
/** Koszty zakupu, marża, narzut i ceny jednostkowe — niewidoczne dla sprzedaży (ceny ofertowe zostają). */
const KLUCZ_KOSZTU_ZAKUPU = /^(koszt|marza|narzut|zapasKoszt|korektaHandlowa|cenaJednostkowa|cenaReferencyjna|cenaKalkulowana|rabat|stawka|minimalnaWartosc|cenaCiecia|cenaOklejania|zrodloCeny|cennikMaterialow)/i;
/** Notatki CRM projektu — niewidoczne dla produkcji i montażu (uwagi robocze filtruje tylkoUwagiWarsztatu). */
const KLUCZ_CRM = /^(notatki|ostatniaNotatka)$/;
/** Kwoty wpisane w opisy (np. „Średnia rynkowa brutto 12.34 zł”) — wycinane dla pracowników. */
const ZDANIE_CENY_RYNKOWEJ = /\s*Średnia rynkowa brutto[^)]*\)\.?/g;
const KWOTA_W_OPISIE = /\d[\d\s.,]*\s*(zł|PLN)/gi;
const POLA_OPISOWE = new Set(["opis", "uwagi"]);
/** Notatki pozycji materiału lub okucia (obiekt z rabatem zakupu) — także z maskowaniem kwot; notatki projektu nie. */
const bezKwot = (k: string, v: unknown, o?: Obiekt) => ((POLA_OPISOWE.has(k) || (k === "notatki" && !!o && "rabatProcent" in o)) && typeof v === "string" ? v.replace(ZDANIE_CENY_RYNKOWEJ, "").replace(KWOTA_W_OPISIE, "[kwota ukryta]").trim() : v);
/** Uwaga z warsztatu: podpisana profilem produkcji lub montażu (podpisUwagi; starsze wpisy „[Produkcja]”, „[Montaż]”). */
export const czyUwagaWarsztatu = (n: unknown) =>
  !!n && typeof n === "object" && typeof (n as { tekst?: unknown }).tekst === "string" && /^\[(Produkcja|Montaż)[\]\s·]/.test((n as { tekst: string }).tekst);
/** Produkcja i montaż: z uwag roboczych tylko wpisy warsztatu (reszta to rozmowy z klientem / CRM). */
const tylkoUwagiWarsztatu = (k: string, v: unknown, o?: Obiekt) => (k === "notatkiRobocze" && Array.isArray(v) ? v.filter(czyUwagaWarsztatu) : bezKwot(k, v, o));

type Obiekt = Record<string, unknown>;
function przefiltruj(x: unknown, usun: (klucz: string, obiekt: Obiekt) => boolean, przeksztalc: (klucz: string, wartosc: unknown, obiekt: Obiekt) => unknown): unknown {
  if (Array.isArray(x)) return x.map((y) => przefiltruj(y, usun, przeksztalc));
  if (!x || typeof x !== "object") return x;
  const o = x as Obiekt;
  const wynik: Obiekt = {};
  for (const [k, v] of Object.entries(o)) {
    if (usun(k, o)) continue;
    wynik[k] = przefiltruj(przeksztalc(k, v, o), usun, przeksztalc);
  }
  return wynik;
}

/** Odcina pola niewidoczne dla profilu. Zwraca nową strukturę; właściciel dostaje dane bez zmian. */
export function filtrujOdpowiedz(profil: Profil, dane: unknown): unknown {
  if (profil === "wlasciciel" || dane === undefined || dane === null) return dane;
  const czyste = JSON.parse(JSON.stringify(dane)) as unknown;
  if (profil === "sprzedaz") {
    return przefiltruj(
      czyste,
      // cenaNetto zostaje wyłącznie w podsumowaniu wariantu oferty (obiekt z polem „wariant”); wszędzie indziej to cena zakupu.
      (k, o) => KLUCZ_KOSZTU_ZAKUPU.test(k) || (k === "cenaNetto" && !("wariant" in o)),
      (k, v, o) => (k === "finanse" && v && typeof v === "object" ? { vatProcent: (v as { vatProcent?: unknown }).vatProcent } : bezKwot(k, v, o)),
    );
  }
  return przefiltruj(czyste, (k) => KLUCZ_CENOWY.test(k) || KLUCZ_CRM.test(k) || (profil === "produkcja" && KLUCZ_KONTAKTOWY.test(k)), tylkoUwagiWarsztatu);
}

/** Podpis uwagi z warsztatu: profil i imię z konta, niezależnie od tego, co wpisze przeglądarka. */
export function podpisUwagi(profil: Profil, imie: string, tekst: string): string {
  const podpis = `[${NAZWY_PROFILI[profil]}${imie ? ` · ${imie}` : ""}]`;
  // Każdy podpis wpisany przez przeglądarkę jest usuwany — zostaje tylko podpis z konta.
  const t = tekst.replace(/^(\s*\[(Właściciel|Produkcja|Montaż|Sprzedaż)[^\]]*\]\s*)+/, "");
  return `${podpis} ${t}`;
}

/**
 * Sprzedaż: zapis konstrukcji i wyceny projektu (/api/projekty/:id/...) tylko na etapie sprzedaży (Szkic, Wycena).
 * Po akceptacji konstrukcję zmienia właściciel. Wyjątki (nie zmieniają konstrukcji): PATCH projektu (sprawdzany przez
 * sprawdzZmianeProjektu), uwagi, oferta PDF i kopia projektu. `reszta` = ścieżka po /api/projekty/:id.
 */
const WYJATKI_ZAPISU_SPRZEDAZY = /^(\/notatki(\/[^/]+)?|\/oferta\.pdf|\/duplikuj)$/i;
export function sprawdzZapisSprzedazy(status: StatusProjektu, metoda: string, reszta: string): string | null {
  const m = metoda.toUpperCase();
  if (m === "GET" || m === "HEAD" || reszta === "" || WYJATKI_ZAPISU_SPRZEDAZY.test(reszta)) return null;
  if (STATUSY_SPRZEDAZY.includes(status)) return null;
  return "Po akceptacji konstrukcję projektu zmienia tylko właściciel.";
}
