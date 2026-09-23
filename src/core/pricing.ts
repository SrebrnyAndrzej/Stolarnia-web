import { cenaOkuciaNetto } from "./catalog/hardware.js";
import { cenaPoRabacieNetto, cenaZaM2Netto, opisMaterialu } from "./catalog/materials.js";
import type { MaterialyModulu } from "./production.js";
import type {
  Material,
  Okucie,
  PodsumowanieWariantu,
  PozycjaKosztowa,
  PoziomWyceny,
  ProjektWyceny,
  TypMaterialu,
  TypOkucia,
  UstawieniaStolarni,
  WariantWyceny,
  ZapotrzebowanieObrzeza,
  ZbudowanyModul,
} from "./types.js";

// Wycena wariantowa — port ProjektWycenyBuilder.swift, SilnikWycenyWariantowej.swift,
// DoborMaterialowWyceny.swift i AutomatycznyDoborOkuc.swift.

export const WARIANTY: Record<WariantWyceny, { nazwa: string; opis: string; mnoznikRobocizny: number }> = {
  eco: { nazwa: "Eco", opis: "Najtańsze sprawdzone rozwiązania bez systemów premium.", mnoznikRobocizny: 0.9 },
  standard: { nazwa: "Standard", opis: "Zbalansowany wariant do większości realizacji.", mnoznikRobocizny: 1.0 },
  premium: { nazwa: "Premium", opis: "Lepsze okucia, fronty i blaty o podwyższonym standardzie.", mnoznikRobocizny: 1.18 },
  vip: { nazwa: "VIP", opis: "Najwyższa półka materiałowa i systemowa.", mnoznikRobocizny: 1.35 },
};

export const KOLEJNOSC_WARIANTOW: WariantWyceny[] = ["eco", "standard", "premium", "vip"];

// ---------- Agregacja projektu (ProjektWycenyBuilder.zbuduj) ----------

export function zbudujProjektWyceny(
  nazwaProjektu: string,
  moduly: { zm: ZbudowanyModul; materialy: MaterialyModulu }[],
  obrzeza: ZapotrzebowanieObrzeza[],
  liczbaArkuszy = 0,
): ProjektWyceny {
  let pPlyt = 0;
  let pFrontow = 0;
  let mbBlatu = 0;
  let mbZabudowy = 0;
  let szuflady = 0;
  let zawiasy = 0;
  let cargo = 0;
  let podnosniki = 0;
  let narozne = 0;
  let liczbaNog = 0;
  let dolne = 0;
  let wiszace = 0;
  let polki = 0;
  let cokol = 0;
  let fronty = 0;
  const uzycia = new Map<string, { rola: "korpus" | "front" | "plecy"; materialId: string; iloscM2: number }>();
  const ostrzezenia = new Set<string>();
  let blatMaterialId: string | undefined;

  const dodaj = (rola: "korpus" | "front" | "plecy", materialId: string, m2: number) => {
    if (m2 <= 0) return;
    const k = `${rola}|${materialId}`;
    const u = uzycia.get(k) ?? { rola, materialId, iloscM2: 0 };
    u.iloscM2 += m2;
    uzycia.set(k, u);
  };

  for (const { zm, materialy } of moduly) {
    const m = zm.modul;
    zm.ostrzezenia.forEach((o) => ostrzezenia.add(`${m.nazwa}: ${o}`));
    mbZabudowy += m.szerokoscMM / 1000;
    if (materialy.blat) blatMaterialId ??= materialy.blat;

    for (const e of zm.elementy) {
      const [a, b] = [e.szer, e.wys, e.gl].sort((x, y) => y - x);
      const m2 = (a * b) / 1e6;
      if (e.rola === "worktop") {
        mbBlatu += e.szer / 1000;
      } else if (e.rola === "front" || e.rola === "filler") {
        pFrontow += m2;
        dodaj("front", materialy.front, m2);
        if (e.rola === "front") fronty += 1;
      } else {
        pPlyt += m2;
        dodaj(e.materialRola === "plecy" ? "plecy" : "korpus", e.materialRola === "plecy" ? materialy.plecy : materialy.korpus, m2);
        if (e.rola === "shelf") polki += 1;
      }
    }

    for (const o of zm.okucia) {
      if (o.typ === "zawias") zawiasy += o.ilosc;
      if (o.typ === "prowadnica" || o.typ === "systemSzuflad") szuflady += o.ilosc;
      if (o.typ === "cargo") cargo += o.ilosc;
      if (o.typ === "podnosnik") podnosniki += o.ilosc;
      if (o.typ === "noga") liczbaNog += o.ilosc;
      if (o.profilID === "kessebohmer.lemans2") narozne += o.ilosc;
    }

    if (m.konfiguracja.nogi) {
      dolne += 1;
      cokol += m.szerokoscMM / 1000;
    }
    if (m.kategoria === "wall" || m.kategoria === "open" || m.konstrukcja === "hood" || m.konstrukcja === "wallCorner") wiszace += 1;
  }

  const liczba = moduly.length;
  // Normy czasowe z ProjektWycenyBuilder.swift
  const godzinyProdukcji = liczba === 0 ? 0 : Math.max(4, liczba * 2.8 + pPlyt * 0.45 + szuflady * 0.7 + cargo * 1.8 + narozne * 1.5);
  const godzinyMontazu = liczba === 0 ? 0 : Math.max(3, liczba * 0.85 + mbZabudowy * 0.6);

  return {
    nazwaProjektu,
    liczbaModulow: liczba,
    metryBiezaceZabudowy: r3(mbZabudowy),
    powierzchniaFrontowM2: r3(pFrontow),
    powierzchniaPlytM2: r3(pPlyt),
    metryBiezaceBlatu: r3(mbBlatu),
    liczbaSzuflad: szuflady,
    liczbaZawiasow: zawiasy,
    liczbaCargo: cargo,
    liczbaPodnosnikow: podnosniki,
    liczbaSystemowNaroznych: narozne,
    liczbaGodzinProdukcji: r2(godzinyProdukcji),
    liczbaGodzinMontazu: r2(godzinyMontazu),
    liczbaTransportow: liczba === 0 ? 0 : liczba > 14 ? 2 : 1,
    liczbaModulowDolnych: dolne,
    liczbaNog,
    liczbaModulowWiszacych: wiszace,
    liczbaPolekWewnetrznych: polki,
    dlugoscCokoluM: r3(cokol),
    // Zamiast szacunku 3,5 mb/m² liczymy dokładne zapotrzebowanie z listy formatek (OkleinowanieEngineV072).
    metryKrawedziBanding: r2(obrzeza.reduce((s, o) => s + o.dlugoscZakupuM, 0)),
    liczbaArkuszy,
    metryOklejaniaM: r2(obrzeza.reduce((s, o) => s + o.dlugoscNettoM, 0)),
    liczbaFrontow: fronty,
    uzyciaMaterialow: [...uzycia.values()].map((u) => ({ ...u, iloscM2: r3(u.iloscM2) })),
    blatMaterialId,
    ostrzezenia: [...ostrzezenia].sort(),
  };
}

// ---------- Silnik wyceny wariantowej ----------

export function wycenWszystkie(
  projekt: ProjektWyceny,
  ustawienia: UstawieniaStolarni,
  materialy: Material[],
  okucia: Okucie[],
): PodsumowanieWariantu[] {
  return KOLEJNOSC_WARIANTOW.map((w) => wycenWariant(w, projekt, ustawienia, materialy, okucia));
}

export function wycenWariant(
  wariant: WariantWyceny,
  projekt: ProjektWyceny,
  ustawienia: UstawieniaStolarni,
  materialy: Material[],
  okucia: Okucie[],
): PodsumowanieWariantu {
  const aktywne = materialy.filter((m) => m.aktywny);
  const f = ustawienia.finanse;
  const mnoznik = WARIANTY[wariant].mnoznikRobocizny;

  const pozycje: PozycjaKosztowa[] = [
    ...pozycjeMaterialowe(projekt, aktywne, wariant),
    ...(projekt.metryBiezaceBlatu > 0 ? [pozycjaBlatu(projekt, aktywne, wariant)] : []),
    poz("Produkcja", "robocizna", projekt.liczbaGodzinProdukcji, "h", f.stawkaRoboczogodziny * mnoznik, ""),
    poz("Montaż", "montaz", projekt.liczbaGodzinMontazu, "h", f.kosztMontazuZaGodzine * mnoznik, ""),
    poz("Transport", "transport", Math.max(projekt.liczbaTransportow, 1), "kurs", f.kosztTransportuBazowy, ""),
    ...(projekt.liczbaArkuszy > 0
      ? [poz("Cięcie płyt", "uslugi", projekt.liczbaArkuszy, "ark.", f.cenaCieciaArkuszaNetto, "Cięcie każdego arkusza z rozkroju (płyty korpusu, frontów, HDF).")]
      : []),
    ...(projekt.metryOklejaniaM > 0
      ? [poz("Oklejanie obrzeżem", "uslugi", projekt.metryOklejaniaM, "mb", f.cenaOklejaniaMbNetto, "Usługa oklejania — metry bieżące oklejonych krawędzi netto (materiał obrzeża liczony osobno w okuciach/akcesoriach).")]
      : []),
    ...dobierzOkucia(projekt, wariant, okucia),
  ];

  const kosztBazowy = suma(pozycje);
  const zapas = (kosztBazowy * f.zapasKosztowyProcent) / 100;
  const narzut = ((kosztBazowy + zapas) * f.narzutProcent) / 100;
  const baza = kosztBazowy + zapas + narzut;
  const marza = (baza * f.marzaProcent) / 100;
  const cenaNetto = Math.max(baza + marza, f.minimalnaWartoscZlecenia);
  const vat = (cenaNetto * f.vatProcent) / 100;

  return {
    wariant,
    nazwa: WARIANTY[wariant].nazwa,
    opis: WARIANTY[wariant].opis,
    pozycje,
    kosztBazowyNetto: r2(kosztBazowy),
    zapasKosztowyKwota: r2(zapas),
    narzutKwota: r2(narzut),
    marzaKwota: r2(marza),
    cenaNetto: r2(cenaNetto),
    vatKwota: r2(vat),
    cenaBrutto: r2(cenaNetto + vat),
    kosztMaterialowNetto: r2(suma(pozycje.filter((p) => !["robocizna", "montaz", "transport", "uslugi"].includes(p.kategoria)))),
  };
}

function pozycjeMaterialowe(projekt: ProjektWyceny, materialy: Material[], wariant: WariantWyceny): PozycjaKosztowa[] {
  const wynik: PozycjaKosztowa[] = [];
  for (const u of projekt.uzyciaMaterialow) {
    const m = materialy.find((x) => x.id === u.materialId);
    const rolaNazwa = u.rola === "korpus" ? "Płyta korpusowa" : u.rola === "front" ? "Front" : "Plecy / dna HDF";
    const kategoria = u.rola === "front" ? "fronty" : "plyty";
    const cena = m ? cenaZaM2Netto(m) : null;
    if (m && cena && cena > 0) {
      wynik.push(poz(`${rolaNazwa} • ${opisMaterialu(m)}`, kategoria, u.iloscM2, "m²", cena, `Dokładny materiał z projektu: ${m.kod}.`));
    } else if (m) {
      // DoborMaterialowWyceny fallback — materiał bez ceny: cena wariantowa, pozycja oznaczona jako błąd.
      const fb = u.rola === "front" ? FALLBACK_FRONT[wariant] : u.rola === "plecy" ? 7 : 95;
      wynik.push(poz(`${rolaNazwa} • ${opisMaterialu(m)}`, kategoria, u.iloscM2, "m²", fb, "Materiał bez ceny — przyjęto cenę domyślną, uzupełnij cennik.", true));
    } else {
      const fb = u.rola === "front" ? FALLBACK_FRONT[wariant] : u.rola === "plecy" ? 7 : 95;
      wynik.push(poz(`${rolaNazwa} • brak rekordu`, kategoria, u.iloscM2, "m²", fb, `Nie znaleziono materiału (ID: ${u.materialId}) — cena domyślna.`, true));
    }
  }
  if (projekt.ostrzezenia.length && wynik.length) wynik[0].uwagi += " " + projekt.ostrzezenia.join(" ");
  return wynik;
}

const FALLBACK_FRONT: Record<WariantWyceny, number> = { eco: 150, standard: 240, premium: 420, vip: 650 };
const FALLBACK_BLAT: Record<WariantWyceny, number> = { eco: 180, standard: 320, premium: 760, vip: 1350 };
const TYPY_BLATU: Record<WariantWyceny, TypMaterialu[]> = {
  eco: ["blatLaminowany"],
  standard: ["blatLaminowany"],
  premium: ["blatKompaktowy", "blatLaminowany"],
  vip: ["blatKamienny", "blatKompaktowy"],
};
const OPIS_BLATU: Record<WariantWyceny, string> = {
  eco: "Podstawowy blat laminowany.",
  standard: "Blat laminowany wyższej klasy.",
  premium: "Blat kompaktowy lub HPL.",
  vip: "Kamień, spiek lub blat premium.",
};

function pozycjaBlatu(projekt: ProjektWyceny, materialy: Material[], wariant: WariantWyceny): PozycjaKosztowa {
  const wybrany = projekt.blatMaterialId ? materialy.find((m) => m.id === projekt.blatMaterialId && m.jednostka === "metrBiezacy") : undefined;
  if (wybrany && cenaPoRabacieNetto(wybrany) > 0) {
    return poz(`Blat • ${opisMaterialu(wybrany)}`, "blaty", projekt.metryBiezaceBlatu, "mb", cenaPoRabacieNetto(wybrany), "Blat wybrany w projekcie.");
  }
  // DoborMaterialowWyceny.wybierz — kandydaci posortowani po cenie, pozycja wg frakcji wariantu.
  const kandydaci = materialy
    .filter((m) => TYPY_BLATU[wariant].includes(m.typ) && cenaPoRabacieNetto(m) > 0)
    .sort((a, b) => cenaPoRabacieNetto(a) - cenaPoRabacieNetto(b) || a.kod.localeCompare(b.kod));
  if (!kandydaci.length) {
    return poz("Blat", "blaty", projekt.metryBiezaceBlatu, "mb", FALLBACK_BLAT[wariant], `${OPIS_BLATU[wariant]} Wartość domyślna — brak pasującego rekordu w bazie.`);
  }
  const frakcja = { eco: 0.1, standard: 0.4, premium: 0.72, vip: 0.95 }[wariant];
  const idx = Math.min(Math.max(Math.round((kandydaci.length - 1) * frakcja), 0), kandydaci.length - 1);
  const m = kandydaci[idx];
  return poz(`Blat • ${opisMaterialu(m)}`, "blaty", projekt.metryBiezaceBlatu, "mb", cenaPoRabacieNetto(m), OPIS_BLATU[wariant]);
}

// ---------- Automatyczny dobór okuć ----------

// Łańcuch poziomów, gdy brak pozycji w dokładnym poziomie. W oryginale brak pozycji VIP
// cofał dobór do najtańszej pozycji w ogóle — tu VIP korzysta z premium (najdroższej pozycji).
const LANCUCH: Record<WariantWyceny, PoziomWyceny[]> = {
  eco: ["eco", "standard"],
  standard: ["standard"],
  premium: ["premium"],
  vip: ["vip", "premium"],
};

function wybierzOkucie(typ: TypOkucia, wariant: WariantWyceny, okucia: Okucie[]): Okucie | undefined {
  const kandydaci = okucia.filter((o) => o.aktywne && o.typ === typ && cenaOkuciaNetto(o) > 0);
  for (const poziom of LANCUCH[wariant]) {
    const wPoziomie = kandydaci.filter((o) => o.poziomWyceny === poziom).sort((a, b) => cenaOkuciaNetto(a) - cenaOkuciaNetto(b));
    if (wPoziomie.length) return wariant === "vip" && poziom === "premium" ? wPoziomie[wPoziomie.length - 1] : wPoziomie[0];
  }
  return kandydaci.sort((a, b) => cenaOkuciaNetto(a) - cenaOkuciaNetto(b))[0];
}

function poProfilu(id: string, okucia: Okucie[]): Okucie | undefined {
  return okucia.find((o) => o.aktywne && o.profilID === id);
}

function dobierzOkucia(p: ProjektWyceny, wariant: WariantWyceny, okucia: Okucie[]): PozycjaKosztowa[] {
  const wynik: PozycjaKosztowa[] = [];
  const high = wariant === "premium" || wariant === "vip";

  const zTypu = (typ: TypOkucia, ilosc: number, fallback: number, fallbackNazwa: string, jedn: string, opis: string) => {
    if (ilosc <= 0) return;
    const o = wybierzOkucie(typ, wariant, okucia);
    wynik.push(pozOkucia(o, typ, ilosc, fallback, fallbackNazwa, jedn, opis));
  };
  const zProfilu = (id: string, typ: TypOkucia, ilosc: number, fallback: number, fallbackNazwa: string, jedn: string, opis: string) => {
    if (ilosc <= 0) return;
    wynik.push(pozOkucia(poProfilu(id, okucia), typ, ilosc, fallback, fallbackNazwa, jedn, opis));
  };

  zTypu("zawias", p.liczbaZawiasow, 24, "Zawiasy meblowe", "szt.", "Liczba wynika z frontów rozwieranych.");

  if (p.liczbaSzuflad > 0) {
    const poziomy = LANCUCH[wariant];
    const maSystem = okucia.some((o) => o.aktywne && o.typ === "systemSzuflad" && poziomy.includes(o.poziomWyceny));
    const fb = { eco: 145, standard: 220, premium: 360, vip: 520 }[wariant];
    zTypu(maSystem ? "systemSzuflad" : "prowadnica", p.liczbaSzuflad, fb, "Systemy szuflad", "kpl.", "Jeden komplet na każdą szufladę.");
  }
  zTypu("cargo", p.liczbaCargo, { eco: 650, standard: 950, premium: 1450, vip: 2100 }[wariant], "Systemy cargo", "kpl.", "Jeden komplet na moduł cargo.");
  zProfilu("blum.aventos.hf", "podnosnik", p.liczbaPodnosnikow, 337.63, "Podnośniki frontów", "kpl.", "Jeden podnośnik na front uchylny.");
  zProfilu("kessebohmer.lemans2", "inne", p.liczbaSystemowNaroznych ?? 0, 1334.93, "System narożny LeMans II", "kpl.", "Komplet: 2 półki obrotowo-wysuwne (nerki) do szafki narożnej ślepej.");
  zTypu("noga", p.liczbaModulowDolnych > 0 ? nogi(p) : 0, 1.5, "Nogi meblowe", "szt.", "Nogi regulowane pod moduły stojące.");
  zProfilu("listwa.montazowa.szafek", "zawieszka", p.liczbaModulowWiszacych > 0 ? Math.max(Math.ceil(p.liczbaModulowWiszacych * 0.65), 1) : 0, 9.76, "Listwa montażowa", "mb", "Listwa montażowa szafek wiszących — ~0,65 mb na moduł.");
  zProfilu("cabinet.hanger.generic", "zawieszka", p.liczbaModulowWiszacych, 7.61, "Zawieszki szafek", "para", "Para zawieszek na szafkę wiszącą.");
  zProfilu("podpora.polki.5mm", "inne", p.liczbaPolekWewnetrznych * 4, 0.285, "Kołki półkowe", "szt.", "Kołki półkowe Ø5 mm — 4 szt. na półkę.");
  if (p.dlugoscCokoluM > 0) {
    zProfilu("cokol.pvc.100mm", "cokol", Math.ceil(p.dlugoscCokoluM), 6.91, "Cokół PVC", "mb", "Cokół PVC H100 mm — mb zabudowy dolnej.");
    zProfilu("klips.cokolu", "cokol", Math.ceil(p.dlugoscCokoluM * 4), 0.447, "Klipsy cokołu", "szt.", "Klipsy cokołu — 4 szt. na mb.");
  }
  zProfilu("wkret.zawias.3x16", "wkret", p.liczbaZawiasow * 2, 0.073, "Wkręty do zawiasów", "szt.", "Wkręty 3,5×16 mm — 2 szt. na zawias.");
  zProfilu("wkret.matrix.pro", "wkret", p.liczbaModulow * 4, 0.154, "Wkręty Matrix Pro", "szt.", "Wkręty 4,2×16 mm — 4 szt. na moduł.");
  zProfilu("wkret.lacznik.3x30", "wkret", p.liczbaModulow * 10, 0.049, "Wkręty łącznikowe", "szt.", "Wkręty 3,5×30 mm — 10 szt. na moduł.");
  zTypu("klej", p.liczbaModulow > 0 ? Math.max(1, Math.ceil(p.liczbaModulow / 5)) : 0, 32, "Kleje i chemia", "kpl.", "Chemia montażowa i kleje.");

  const ledMB = p.metryBiezaceZabudowy * 0.6;
  if (ledMB >= 0.5) {
    zProfilu("tasma.led.neutral", "oswietlenieLED", Math.ceil(ledMB), 8.94, "Taśma LED", "mb", "Taśma LED — szacunek 60% metrażu zabudowy.");
    zProfilu("zasilacz.led.30w", "oswietlenieLED", Math.max(1, Math.ceil(ledMB / 2.5)), 32.52, "Zasilacz LED", "szt.", "Zasilacz 12 V/30 W — 1 szt. na ok. 2,5 mb taśmy.");
  }
  zProfilu(high ? "obrzeze.abs.premium" : "obrzeze.abs.standard", "obrzeze", Math.ceil(p.metryKrawedziBanding), high ? 14.63 : 2.85, "Obrzeże ABS", "mb", "Obrzeże ABS — zapotrzebowanie z listy formatek z naddatkiem i zapasem.");
  zProfilu(high ? "uchwyt.bar.premium" : "uchwyt.bar.standard", "uchwyt", p.liczbaFrontow, high ? 28.46 : 6.5, "Uchwyty", "szt.", "1 uchwyt na każdy front drzwi i szuflad.");

  return wynik;
}

function nogi(p: ProjektWyceny): number {
  return p.liczbaNog || p.liczbaModulowDolnych * 4;
}

function pozOkucia(o: Okucie | undefined, typ: TypOkucia, ilosc: number, fallback: number, fallbackNazwa: string, jedn: string, opis: string): PozycjaKosztowa {
  const kategoria = typ === "wkret" || typ === "klej" ? "akcesoria" : "okucia";
  if (o) {
    return poz(o.nazwa, kategoria, ilosc, o.jednostka, cenaOkuciaNetto(o), `${o.producent} • ${o.system}. Cena z bazy okuć. ${opis}`);
  }
  return poz(fallbackNazwa, kategoria, ilosc, jedn, fallback, `Cena domyślna — brak aktywnej pozycji w bazie okuć. ${opis}`);
}

function poz(nazwa: string, kategoria: PozycjaKosztowa["kategoria"], ilosc: number, jednostka: string, cena: number, uwagi: string, blad = false): PozycjaKosztowa {
  const i = Math.max(ilosc, 0);
  const c = Math.max(cena, 0);
  return { nazwa, kategoria, ilosc: r3(i), jednostka, cenaJednostkowaNetto: r2(c), kosztNetto: r2(i * c), uwagi, jestBledemWyceny: blad };
}

function suma(p: PozycjaKosztowa[]): number {
  return p.reduce((s, x) => s + x.kosztNetto, 0);
}

function r2(v: number): number {
  return Math.round(v * 100) / 100;
}
function r3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
