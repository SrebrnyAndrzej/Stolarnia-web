import type { Okucie, PoziomWyceny, TypOkucia } from "../types.js";

// Średnie ceny rynkowe brutto z CennikRynkowyAkcesoriow.swift (research 20.06.2026).
// Poziom wyceny wg BazaOkucAkcesoriaSeeder.pricingTier: Blum/Hettich/Häfele/Salice → premium,
// profile "eco" GTV → eco, pozostałe → standard.
type Wiersz = [profilID: string, producent: string, system: string, model: string, typ: TypOkucia, jednostka: string, bruttoPLN: number, opis: string];

const CENNIK: Wiersz[] = [
  ["gtv.gx2a.h45.eco", "GTV", "GX2-A", "H45 L=500 pełny wysuw 25 kg", "prowadnica", "kpl.", 15.18, "Komplet lewa + prawa, pełny wysuw, 25 kg."],
  ["gtv.prestige.h45.eco", "GTV", "Prestige", "H45 L=500 pełny wysuw 35 kg", "prowadnica", "kpl.", 25.37, "Komplet lewa + prawa, pełny wysuw, 35 kg."],
  ["gtv.prestige.h45.selfclose", "GTV", "Prestige", "H45 L=500 samodociąg", "prowadnica", "kpl.", 35.75, "Pełny wysuw z samodociągiem."],
  ["gtv.pro.h45.50kg", "GTV", "PRO", "H45 L=500 50 kg", "prowadnica", "kpl.", 24.76, "Pełny wysuw, 50 kg."],
  ["gtv.modernslide.3d.softclose", "GTV", "Modern Slide", "3D soft-close L=450", "prowadnica", "para", 43.14, "Prowadnice dolnego montażu z cichym domykiem."],
  ["gtv.0shx.softclose", "GTV", "0SHX", "soft-close L=450", "prowadnica", "para", 43.69, "Prowadnice dolnego montażu."],
  ["gtv.0fpo18.p2o", "GTV", "0FPO18", "Push to Open L=450", "prowadnica", "para", 53.47, "Prowadnice Push to Open."],
  ["gtv.g10hx.softclose", "GTV", "G10HX", "soft-close L=450", "prowadnica", "para", 39.28, "Prowadnice dolnego montażu."],
  ["gtv.axispro.softclose", "GTV", "Axis Pro", "soft-close L=450", "systemSzuflad", "kpl.", 78.88, "System szuflady metabox/boki stalowe."],
  ["gtv.axispro.p2o", "GTV", "Axis Pro", "Push to Open L=450", "systemSzuflad", "kpl.", 93.32, "System szuflady Push to Open."],
  ["gtv.modernbox.softclose", "GTV", "Modern Box", "soft-close L=450", "systemSzuflad", "kpl.", 68.89, "System szuflady, niski."],
  ["gtv.modernbox.square", "GTV", "Modern Box Square", "L=450", "systemSzuflad", "kpl.", 69.31, "System szuflady Square, niski."],
  ["amix.fgv.drawbox", "AMIX / FGV", "Drawbox", "H86 L=450", "systemSzuflad", "kpl.", 72.0, "System ekonomiczny soft-close."],
  ["blum.tandembox.antaro", "Blum", "Tandembox", "Antaro H86 L=500", "systemSzuflad", "kpl.", 155.0, "Blumotion, boki białe/stalowe."],
  ["blum.legrabox.pure", "Blum", "Legrabox", "Pure H86 L=500", "systemSzuflad", "kpl.", 228.0, "Boki stalowe 13 mm."],
  ["gtv.zawias.110.standard", "GTV", "Zawias puszkowy", "110° bez tłumienia", "zawias", "szt.", 2.6, "Segment Eco."],
  ["amix.fgv.175", "AMIX / FGV", "Zawias szerokokątny", "165–175°", "zawias", "szt.", 10.84, "Zawias do narożników i cargo."],
  ["italiana.kimana", "Italiana Ferramenta", "Kimana", "zawias barkowy", "zawias", "szt.", 22.27, "Zawias barkowy."],
  ["blum.cliptop.110", "Blum", "Clip Top Blumotion", "110° 71B3550", "zawias", "kpl.", 13.37, "Zawias z prowadnikiem, cichy domyk."],
  ["salice.silentia", "Salice", "Silentia+", "110°", "zawias", "szt.", 15.1, "Zawias z tłumieniem."],
  ["blum.cliptop.155.zero", "Blum", "Clip Top", "155° zero protrusion", "zawias", "kpl.", 25.37, "Zawias do szuflad wewnętrznych."],
  ["blum.aventos.hf", "Blum", "Aventos", "HF TOP", "podnosnik", "kpl.", 415.28, "Podnośnik frontu łamanego."],
  ["kessebohmer.lemans2", "Kesseböhmer", "LeMans II", "system narożny", "inne", "kpl.", 1641.97, "System narożny do szafki ślepej."],
  ["hafele.minifix15", "Häfele", "Minifix 15", "mimośród + trzpień", "lacznik", "kpl.", 0.9, "Złącze mimośrodowe."],
  ["hafele.rafix20", "Häfele", "Rafix 20", "złącze + trzpień", "lacznik", "kpl.", 1.49, "Złącze półki."],
  ["hettich.vb", "Hettich", "VB", "złączka", "lacznik", "szt.", 2.09, "Złączka VB."],
  ["volpato.leg.standard", "Volpato", "Nóżka", "H100 regulowana", "noga", "szt.", 1.5, "Nóżka meblowa H100."],
  ["hafele.axilo", "Häfele", "Axilo", "stopka regulowana", "noga", "szt.", 6.34, "Stopka regulowana z płytką."],
  ["camar.306", "Camar", "306", "zawieszka regulowana", "zawieszka", "szt.", 19.65, "Regulator szafki wiszącej."],
  ["cabinet.hanger.generic", "Generic", "Zawieszka", "lewa + prawa", "zawieszka", "para", 9.36, "Zawieszka szafki."],
  ["listwa.montazowa.szafek", "Generic", "Listwa montażowa", "stalowa", "zawieszka", "mb", 12.0, "Listwa do zawieszania szafek górnych."],
  ["agd.ventilation.200", "Generic", "Kratka wentylacyjna", "200 cm²", "inne", "szt.", 51.79, "Wentylacja zabudowy AGD."],
  ["push.tipon.generic", "Generic", "TIP-ON", "odbojnik", "uchwyt", "kpl.", 19.42, "Mechanizm bezuchwytowy do drzwi."],
  ["uchwyt.bar.standard", "Generic", "Uchwyt relingowy", "96–128 mm", "uchwyt", "szt.", 8.0, "Uchwyt stalowy."],
  ["uchwyt.bar.premium", "Generic", "Uchwyt premium", "160–256 mm aluminium", "uchwyt", "szt.", 35.0, "Uchwyt premium."],
  ["led.profile.generic", "Generic", "Profil LED", "wpuszczany 2 m", "oswietlenieLED", "kpl. 2 m", 27.95, "Profil z kloszem."],
  ["tasma.led.neutral", "Generic", "Taśma LED", "5050 4000 K", "oswietlenieLED", "mb", 11.0, "Taśma LED neutral white."],
  ["zasilacz.led.30w", "Generic", "Zasilacz LED", "12 V 30 W", "oswietlenieLED", "szt.", 40.0, "Zasila ok. 2,5 m taśmy."],
  ["drazek.garderobowy.komplet", "Generic", "Drążek", "Ø25 + rozety", "inne", "mb", 30.0, "Drążek garderobowy."],
  ["podpora.polki.5mm", "Generic", "Kołek półkowy", "Ø5 mm", "inne", "szt.", 0.35, "Podpora półki."],
  ["cokol.pvc.100mm", "Generic", "Cokół PVC", "H100", "cokol", "mb", 8.5, "Cokół PVC."],
  ["klips.cokolu", "Generic", "Klips cokołu", "do nóżki", "cokol", "szt.", 0.55, "Klips cokołu."],
  ["wkret.zawias.3x16", "Generic", "Wkręt", "3,5×16", "wkret", "szt.", 0.09, "Wkręt do zawiasów."],
  ["wkret.matrix.pro", "Generic", "Wkręt Matrix Pro", "4,2×16", "wkret", "szt.", 0.19, "Wkręt samonawiercający."],
  ["wkret.lacznik.3x30", "Generic", "Wkręt łącznikowy", "3,5×30", "wkret", "szt.", 0.06, "Wkręt łącznikowy."],
  ["prowadnica.szafy.przesuwan", "Generic", "System przesuwny", "górna + dolna", "inne", "kpl.", 125.0, "Na 1 skrzydło drzwi przesuwnych."],
  ["obrzeze.abs.standard", "Generic", "Obrzeże ABS", "1×22 mm", "obrzeze", "mb", 3.5, "Obrzeże ABS standard."],
  ["obrzeze.abs.premium", "Generic", "Obrzeże ABS", "2×23 mm synchro", "obrzeze", "mb", 18.0, "Obrzeże ABS premium."],
];

const ECO = new Set(["gtv.gx2a.h45.eco", "gtv.prestige.h45.eco"]);

function poziom(profilID: string, producent: string): PoziomWyceny {
  if (ECO.has(profilID)) return "eco";
  const p = producent.toLowerCase();
  if (p.includes("blum") || p.includes("hettich") || p.includes("häfele") || p.includes("salice")) return "premium";
  return "standard";
}

export const OKUCIA_STARTOWE: Okucie[] = CENNIK.map(([profilID, producent, system, model, typ, jednostka, brutto, opis]) => ({
  id: profilID,
  profilID,
  nazwa: `${producent} ${system} — ${model}`,
  producent,
  system,
  typ,
  jednostka,
  cenaNetto: Math.round((brutto / 1.23) * 1000) / 1000,
  rabatProcent: 0,
  vatProcent: 23,
  poziomWyceny: poziom(profilID, producent),
  aktywne: true,
  opis: `${opis} Średnia rynkowa brutto ${brutto.toFixed(2)} zł (research 20.06.2026).`,
}));

export function cenaOkuciaNetto(o: Okucie): number {
  return o.cenaNetto * (1 - o.rabatProcent / 100);
}
