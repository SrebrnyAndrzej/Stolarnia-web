import { zawiasyDlaWysokosci } from "../builder.js";
import { dobierzNL, dobierzNLWewnetrznej, profilSzuflady, wariantWewnetrznej, wymiarySzuflady } from "../catalog/drawers.js";
import { USTAWIENIA_DOMYSLNE } from "../settings.js";
import type { Element, Modul, OkucieModulu, UstawieniaKonstrukcyjne, UstawieniaTechnologii, ZbudowanyModul } from "../types.js";
import type { Mebel, PoleFrontu, Rozmiar, StrefaWnetrza } from "./model.js";

// Silnik konstrukcji: jeden model mebla (korpus + drzewo przestrzeni + siatka frontów + wysuwy) → elementy, okucia, ostrzeżenia.
// Wynik ma ten sam format co dotychczasowy builder, więc dokumentacja, rozkrój, wycena i 3D działają bez zmian.

const COFNIECIE_POLKI_MM = 20;
const LUZ_PROWADNIC_MM = 13; // na stronę — skrzynka z płyty = światło − 26 mm (reguła robocza)

interface Prostokat {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Rozkład rozmiarów części. Najpierw stałe [mm]; z pozostałego miejsca części „udzial” dostają swój ułamek,
 * a części „reszta” (lub bez rozmiaru) dzielą równo to, co zostanie. Bez „reszty” udziały dzielą całość proporcjonalnie.
 */
export function rozmiaryCzesci(rozmiary: (Rozmiar | undefined)[], dostepne: number): number[] {
  const stale = rozmiary.reduce((s, r) => s + (r && "mm" in r ? r.mm : 0), 0);
  const pozostale = dostepne - stale;
  const sumaUdzialow = rozmiary.reduce((s, r) => s + (r && "udzial" in r ? r.udzial : 0), 0);
  const reszty = rozmiary.filter((r) => !r || "reszta" in r).length;
  return rozmiary.map((r) => {
    if (r && "mm" in r) return r.mm;
    if (r && "udzial" in r) return reszty > 0 ? pozostale * r.udzial : (pozostale * r.udzial) / sumaUdzialow;
    return (pozostale - pozostale * (reszty > 0 ? sumaUdzialow : 0)) / reszty;
  });
}

export function zbudujMebel(
  m: Mebel,
  modul: Modul,
  k: UstawieniaKonstrukcyjne,
  tech: UstawieniaTechnologii = USTAWIENIA_DOMYSLNE.technologia,
): ZbudowanyModul {
  const el: Element[] = [];
  const okucia: OkucieModulu[] = [];
  const ostrzezenia: string[] = [];
  const t = k.gruboscPlytyKorpusuMM;
  const gap = k.szczelinaFrontowMM;
  const tf = k.gruboscFrontuMM;
  const { szerokoscMM: W, wysokoscMM: H, glebokoscMM: D } = m;

  if (W <= 2 * t) ostrzezenia.push("Szerokość mebla musi być większa niż suma grubości boków.");
  if (H <= 2 * t) ostrzezenia.push("Wysokość mebla musi być większa niż suma grubości wieńców.");
  if (ostrzezenia.length) return { modul, elementy: [], okucia: [], ostrzezenia };

  if (m.korpus.rodzaj === "blenda") {
    el.push(p("BLENDA", "filler", 0, 0, -tf, W, H, tf, "front"));
    if (m.korpus.blat) el.push(p("BLAT", "worktop", 0, H, -tf - gap, W, k.gruboscBlatuMM, k.glebokoscBlatuMM, "blat"));
    return { modul, elementy: el, okucia, ostrzezenia };
  }

  const zKorpusem = m.korpus.rodzaj === "korpus";
  const rezerwaPlecow = m.korpus.plecy ? k.odsunieciePlecMM + k.gruboscPlecHDFMM : 0;
  const strefy = new Map<string, Prostokat & { s: StrefaWnetrza }>();
  let licznikPolek = 0;
  let licznikPrzegrod = 0;

  // --- Korpus i wnętrze ---
  if (zKorpusem) {
    el.push(p("BOK-L", "side", 0, 0, 0, t, H, D, "korpus"));
    el.push(p("BOK-P", "side", W - t, 0, 0, t, H, D, "korpus"));
    el.push(p("WIENIEC-D", "bottom", t, 0, 0, W - 2 * t, t, D, "korpus"));
    // Zasada zakładu: każdy moduł z korpusem = dwa boki i dwa pełne wieńce.
    el.push(p("WIENIEC-G", "top", t, H - t, 0, W - 2 * t, t, D, "korpus"));

    const rozmiesc = (s: StrefaWnetrza, r: Prostokat) => {
      strefy.set(s.id, { ...r, s });
      const pd = s.podzial;
      if (pd) {
        const n = pd.czesci.length;
        const tPrzegrody = pd.przegroda === "plyta" ? t : 0;
        const wzdluz = pd.kierunek === "poziom" ? r.h : r.w;
        const rozmiary = rozmiaryCzesci(pd.czesci.map((c) => c.rozmiar), wzdluz - tPrzegrody * (n - 1));
        let pozycja = pd.kierunek === "poziom" ? r.y : r.x;
        pd.czesci.forEach((c, i) => {
          const rc = pd.kierunek === "poziom" ? { x: r.x, y: pozycja, w: r.w, h: rozmiary[i] } : { x: pozycja, y: r.y, w: rozmiary[i], h: r.h };
          if (rozmiary[i] <= 0) ostrzezenia.push(`Strefa „${c.id}” nie mieści się (${Math.round(rozmiary[i])} mm).`);
          rozmiesc(c, rc);
          pozycja += rozmiary[i];
          if (i < n - 1 && pd.przegroda === "plyta") {
            if (pd.kierunek === "poziom") {
              const kod = pd.kodyPrzegrod?.[i] ?? `POLKA-STALA-${pad(++licznikPrzegrod)}`;
              el.push(p(kod, "fixedShelf", r.x, pozycja, 0, r.w, t, D - rezerwaPlecow, "korpus"));
            } else {
              const kod = pd.kodyPrzegrod?.[i] ?? `PRZEGRODA-${pad(++licznikPrzegrod)}`;
              el.push(p(kod, "divider", pozycja, r.y, 0, t, r.h, D - rezerwaPlecow, "korpus"));
            }
            pozycja += t;
          }
        });
      } else if (s.wyposazenie?.typ === "polki" && s.wyposazenie.liczba > 0) {
        // Półki nastawne — równe światła w strefie (CabinetComponentFactory.shelfComponents)
        const n = s.wyposazenie.liczba;
        const glPolki = D - rezerwaPlecow - COFNIECIE_POLKI_MM;
        const swiatlo = r.h - t * n;
        if (swiatlo <= 0 || glPolki <= 0) {
          ostrzezenia.push("Wysokość/głębokość korpusu jest zbyt mała dla zadanej liczby półek.");
        } else {
          const odstep = swiatlo / (n + 1);
          for (let i = 1; i <= n; i++) {
            el.push(p(`POLKA-${pad(++licznikPolek)}`, "shelf", r.x, r.y + odstep * i + t * (i - 1), COFNIECIE_POLKI_MM, r.w, t, glPolki, "korpus"));
          }
        }
      }
    };
    rozmiesc(m.wnetrze, { x: t, y: t, w: W - 2 * t, h: H - 2 * t });

    // Plecy HDF w rowku; strefy „bez pleców” (nisze AGD) dzielą plecy na odcinki wpuszczone w półki stałe.
    if (m.korpus.plecy) {
      const wpust = tech.rowekGlebokoscMM - tech.rowekLuzMM;
      const zPlecow = D - k.odsunieciePlecMM - k.gruboscPlecHDFMM;
      const czesci = m.wnetrze.podzial?.kierunek === "poziom" ? m.wnetrze.podzial.czesci : [m.wnetrze];
      const odcinki: { od: number; do: number }[] = [];
      let start: number | null = null;
      czesci.forEach((c, i) => {
        const r = strefy.get(c.id)!;
        const bez = czyBezPlecow(c);
        if (!bez && start === null) start = i === 0 ? t - wpust : r.y - wpust; // od górnej krawędzi półki stałej poniżej
        if (bez && start !== null) {
          odcinki.push({ od: start, do: r.y - wpust }); // do górnej krawędzi półki stałej pod strefą bez pleców
          start = null;
        }
      });
      if (start !== null) odcinki.push({ od: start, do: H - t + wpust });
      // Bez nisz: jedne „PLECY”. Z niszą: odcinek pod nią „PLECY-D”, nad nią „PLECY-G” (także gdy jest tylko jeden z nich).
      const bezPlecowY = czesci.filter(czyBezPlecow).map((c) => strefy.get(c.id)!.y);
      const kody = !bezPlecowY.length
        ? ["PLECY"]
        : odcinki.map((o, i) => {
            const pod = o.do <= Math.min(...bezPlecowY);
            const nad = o.od >= Math.max(...bezPlecowY);
            return pod ? "PLECY-D" : nad ? "PLECY-G" : `PLECY-S${i}`;
          });
      odcinki.forEach((o, i) => el.push(p(kody[i], "back", t - wpust, o.od, zPlecow, W - 2 * t + 2 * wpust, o.do - o.od, k.gruboscPlecHDFMM, "plecy")));
    }
  }

  // --- Fronty ---
  const fronty = new Map<string, Element>();
  for (const [id, u] of ukladFrontow(m.fronty, W, H, gap)) {
    const f = u.pole.front;
    if (!f || f.typ === "otwarte" || u.pole.podzial) continue;
    const { x, y, w, h } = u.front;
    if (w <= 0 || h <= 0) {
      ostrzezenia.push(`Front ${f.kod} nie mieści się w polu.`);
      continue;
    }
    const e = p(f.kod, f.typ === "blenda" ? "filler" : "front", x, y, -tf, w, h, tf, "front");
    if (f.typ === "drzwi" && f.zawiasy) e.stronaZawiasow = f.zawiasy;
    fronty.set(id, e);
    el.push(e);
    if (f.typ === "drzwi" && w > 600) ostrzezenia.push(`Skrzydło drzwi ${Math.round(w)} mm szersze niż 600 mm — rozważ 2 skrzydła.`);
  }

  // --- Wysuwy (skrzynki szuflad) ---
  const zFrontem = m.wysuwy.filter((w) => w.powiazanie === "zFrontem");
  const zaDrzwiami = m.wysuwy.filter((w) => w.powiazanie === "zaDrzwiami");
  const szufladyWewnetrzne: NonNullable<ZbudowanyModul["szufladyWewnetrzne"]> = [];
  const ukryte = m.wysuwy.filter((w) => w.powiazanie === "ukrytaZaFrontem" || w.powiazanie === "zZabierakiem");
  // Szuflada ukryta za wysokim frontem: górna część strefy za frontem; skrzynka główna dostaje miejsce pod nią.
  const miejsceGlownej = new Map<string, number>(); // pole frontu → wysokość dostępna dla skrzynki głównej
  if (ukryte.length && zKorpusem) {
    const idProfilu = m.profilSzuflad ?? tech.profilSzuflad;
    const profil = m.szufladySystemowe ? profilSzuflady(idProfilu) : undefined;
    const wew = profil?.inner_drawer;
    const rm = profil?.runner_mounting;
    const frontySz = zFrontem.map((w) => ({ w, f: fronty.get(w.poleFrontuId) })).filter((q): q is { w: typeof q.w; f: Element } => !!q.f).sort((a, b) => a.f.y - b.f.y);
    const uzytkowa = D - rezerwaPlecow;
    for (const w of ukryte) {
      const sprzezona = w.powiazanie === "zZabierakiem";
      const i = frontySz.findIndex((q) => q.w.poleFrontuId === w.poleFrontuId);
      const s = strefy.get(w.strefaId);
      if (i < 0 || !s) {
        ostrzezenia.push(`Szuflada ukryta ${w.kod}: brak szuflady z frontem, za którą ma być.`);
        continue;
      }
      if (!profil || !wew || !rm) {
        ostrzezenia.push(`Szuflada ukryta ${w.kod}: ${profil ? `${profil.manufacturer} ${profil.family} nie ma danych szuflady wewnętrznej` : "wybierz system szuflad"} — nie zbudowano.`);
        continue;
      }
      const dane = sprzezona ? wew.coupler?.min_opening_by_variant_mm : wew.min_opening_by_variant_mm;
      if (!dane) {
        ostrzezenia.push(`Szuflada ukryta ${w.kod}: ${profil.family} nie ma w danych zestawu zabieraka — wybierz szufladę niezależną.`);
        continue;
      }
      const [wariant, komora] = Object.entries(dane).sort((a, b) => a[1] - b[1])[0];
      // Podłogi szuflad z frontem liczone jak w dokumentacji: płyta pod najniższym frontem + przesunięcie frontów.
      const f0 = frontySz[0].f;
      const podloga0 = s.y;
      const podlogaFrontu = (f: Element) => podloga0 + (f.y - f0.y);
      const f = frontySz[i].f;
      const sufit = i + 1 < frontySz.length ? podlogaFrontu(frontySz[i + 1].f) : s.y + s.h;
      const a = rm.axis_above_panel_min_mm;
      const kotwica = podloga0 + a;
      const osMax = sufit - komora + a;
      const os = kotwica + Math.floor((osMax - kotwica) / tech.rastrMM + 1e-6) * tech.rastrMM; // w dół do rastra 32
      const podloga = os - a;
      const miejsce = podloga - podlogaFrontu(f);
      const najnizsze = Math.min(...Object.values(profil.back.height_by_variant_mm));
      if (miejsce < najnizsze + 40) {
        ostrzezenia.push(`Szuflada ukryta ${w.kod}: za frontem ${f.kod} zostaje ${Math.round(miejsce)} mm na skrzynkę główną — za mało (front za niski).`);
        continue;
      }
      miejsceGlownej.set(w.poleFrontuId, miejsce);
      const NL = dobierzNLWewnetrznej(profil, uzytkowa);
      if (!NL) {
        ostrzezenia.push(`Szuflada ukryta ${w.kod}: głębokość użytkowa ${uzytkowa} mm za mała.`);
        continue;
      }
      const LW = s.w;
      const wy = wymiarySzuflady(profil, LW, NL, komora, wariant);
      el.push(p(`${w.kod}-DNO`, "drawerBottom", s.x + (LW - wy.dnoSzer) / 2, podloga + 20, 0, wy.dnoSzer, wy.grubosc, wy.dnoGl, "szuflada"));
      el.push(p(`${w.kod}-TYL`, "drawerFrontBack", s.x + (LW - wy.plecySzer) / 2, podloga + 20 + wy.grubosc, wy.dnoGl - wy.grubosc, wy.plecySzer, wy.plecyWys, wy.grubosc, "szuflada"));
      szufladyWewnetrzne.push({ kod: w.kod, podlogaY: podloga, sufitY: sufit, NL, profilId: profil.id, wariant: wy.wariant, rodzaj: w.powiazanie as "ukrytaZaFrontem" | "zZabierakiem", frontKod: f.kod });
      const producent = profil.manufacturer === "BLUM" ? "Blum" : profil.manufacturer === "AMIX" ? "Amix" : profil.manufacturer;
      okucia.push({ typ: "systemSzuflad", ilosc: 1, opis: `Szuflada ukryta ${w.kod} za frontem ${f.kod} (${producent} ${profil.family}, wariant ${wy.wariant}) — komplet.` });
      if (wew.front_panel) okucia.push({ typ: "inne", ilosc: 1, opis: `${producent} ${wew.front_panel.part} — panel frontu szuflady ukrytej, L = ${r1(LW - wew.front_panel.length.subtract_mm)} mm` });
      if (sprzezona && wew.coupler) {
        okucia.push({ typ: "inne", ilosc: 1, opis: `${producent} ${wew.coupler.part} — zestaw zabieraka (szuflada ukryta ${w.kod} wysuwana z frontem ${f.kod}).` });
        if (wew.coupler.exclusions.length) ostrzezenia.push(`Zabierak ${wew.coupler.part}: nie łączyć z ${wew.coupler.exclusions.join(", ")}.`);
      }
    }
  }
  for (const w of m.wysuwy.filter((x) => x.powiazanie !== "zFrontem" && x.powiazanie !== "zaDrzwiami" && x.powiazanie !== "ukrytaZaFrontem" && x.powiazanie !== "zZabierakiem")) {
    ostrzezenia.push(`Wysuw ${w.kod} (${w.powiazanie}) — ten rodzaj szuflady nie jest jeszcze obsługiwany przez silnik.`);
  }
  if (zFrontem.length && zKorpusem) {
    const uzytkowa = D - rezerwaPlecow;
    const idProfilu = m.profilSzuflad ?? tech.profilSzuflad;
    const profil = profilSzuflady(idProfilu);
    const NL = m.szufladySystemowe && profil ? dobierzNL(uzytkowa) : undefined;
    if (m.szufladySystemowe && !profil) ostrzezenia.push(`Nieznany profil systemu szuflad "${idProfilu}" — brak wymiarów dna i pleców.`);
    if (m.szufladySystemowe && profil && !NL) ostrzezenia.push(`Głębokość użytkowa ${uzytkowa} mm za mała dla prowadnic ${profil.family} (min. NL 270 + 3 mm).`);
    const L = Math.max(250, Math.min(550, Math.floor((uzytkowa - 10) / 50) * 50));
    const ts = k.gruboscPlytySzufladMM;
    for (const w of zFrontem) {
      const f = fronty.get(w.poleFrontuId);
      const s = strefy.get(w.strefaId);
      if (!f || !s) {
        ostrzezenia.push(`Wysuw ${w.kod}: brak frontu lub strefy.`);
        continue;
      }
      const LW = s.w; // rzeczywiste światło w miejscu montażu prowadnic
      if (m.szufladySystemowe) {
        if (!profil || !NL) continue;
        const wy = wymiarySzuflady(profil, LW, NL, miejsceGlownej.get(w.poleFrontuId) ?? f.wys, miejsceGlownej.has(w.poleFrontuId) ? undefined : m.wariantBokuSzuflady);
        el.push(p(`${w.kod}-DNO`, "drawerBottom", s.x + (LW - wy.dnoSzer) / 2, f.y + 20, 0, wy.dnoSzer, wy.grubosc, wy.dnoGl, "szuflada"));
        el.push(p(`${w.kod}-TYL`, "drawerFrontBack", s.x + (LW - wy.plecySzer) / 2, f.y + 20 + wy.grubosc, wy.dnoGl - wy.grubosc, wy.plecySzer, wy.plecyWys, wy.grubosc, "szuflada"));
      } else {
        // Skrzynka z płyty na prowadnicach bocznych — reguła robocza (luz 13 mm/stronę), bez profilu producenta.
        const szerSkrzynki = LW - 2 * LUZ_PROWADNIC_MM;
        const h = Math.max(80, Math.min(250, f.wys - 40));
        const y = f.y + 20;
        el.push(p(`${w.kod}-BOK-L`, "drawerSide", s.x + LUZ_PROWADNIC_MM, y, 0, ts, h, L, "szuflada"));
        el.push(p(`${w.kod}-BOK-P`, "drawerSide", s.x + LW - LUZ_PROWADNIC_MM - ts, y, 0, ts, h, L, "szuflada"));
        el.push(p(`${w.kod}-CZOLO`, "drawerFrontBack", s.x + LUZ_PROWADNIC_MM + ts, y, 0, szerSkrzynki - 2 * ts, h - 12, ts, "szuflada"));
        el.push(p(`${w.kod}-TYL`, "drawerFrontBack", s.x + LUZ_PROWADNIC_MM + ts, y, L - ts, szerSkrzynki - 2 * ts, h - 12, ts, "szuflada"));
        el.push(p(`${w.kod}-DNO`, "drawerBottom", s.x + LUZ_PROWADNIC_MM, y - k.gruboscPlecHDFMM, 0, szerSkrzynki, k.gruboscPlecHDFMM, L, "plecy"));
      }
      if (LW < 150) ostrzezenia.push("Światło korpusu poniżej 150 mm — szuflada może się nie zmieścić.");
    }
  }

  // --- Szuflady wewnętrzne za drzwiami: skrzynka w swojej strefie, cofnięta za front, front wewnętrzny z karty ---
  if (zaDrzwiami.length && zKorpusem) {
    const uzytkowa = D - rezerwaPlecow;
    const idProfilu = m.profilSzuflad ?? tech.profilSzuflad;
    const profil = m.szufladySystemowe ? profilSzuflady(idProfilu) : undefined;
    const wew = profil?.inner_drawer;
    if (m.szufladySystemowe && !profil) ostrzezenia.push(`Nieznany profil systemu szuflad "${idProfilu}" — brak wymiarów szuflad wewnętrznych.`);
    if (profil && !wew) ostrzezenia.push(`${profil.manufacturer} ${profil.family}: profil nie ma danych szuflady wewnętrznej — wymiary jak dla szuflady z frontem, do potwierdzenia.`);
    const NL = profil ? (wew ? dobierzNLWewnetrznej(profil, uzytkowa) : dobierzNL(uzytkowa)) : undefined;
    if (profil && !NL) ostrzezenia.push(`Głębokość użytkowa ${uzytkowa} mm za mała dla szuflady wewnętrznej ${profil.family}${wew ? ` (NL + ${wew.depth_min.add_mm})` : ""}.`);
    const panele = new Map<string, number>();
    const ts = k.gruboscPlytySzufladMM;
    for (const w of zaDrzwiami) {
      const s = strefy.get(w.strefaId);
      if (!s) {
        ostrzezenia.push(`Wysuw ${w.kod}: brak strefy wnętrza.`);
        continue;
      }
      const LW = s.w;
      const cofniecie = wew?.runner_holes_offset_mm ?? 0;
      if (profil && NL) {
        const wariant = wew ? wariantWewnetrznej(profil, s.h, m.wariantBokuSzuflady) : undefined;
        if (wew && !wariant) {
          const najmniejsza = Math.min(...Object.values(wew.min_opening_by_variant_mm));
          ostrzezenia.push(`Szuflada wewnętrzna ${w.kod}: strefa ${Math.round(s.h)} mm niższa niż minimum ${najmniejsza} mm z karty ${profil.family}.`);
          continue;
        }
        const wy = wymiarySzuflady(profil, LW, NL, s.h, wariant ?? m.wariantBokuSzuflady);
        if (wew && s.h < (wew.min_opening_by_variant_mm[wy.wariant] ?? 0)) ostrzezenia.push(`Szuflada wewnętrzna ${w.kod}: wariant ${wy.wariant} wymaga komory min. ${wew.min_opening_by_variant_mm[wy.wariant]} mm (jest ${Math.round(s.h)} mm).`);
        el.push(p(`${w.kod}-DNO`, "drawerBottom", s.x + (LW - wy.dnoSzer) / 2, s.y + 20, cofniecie, wy.dnoSzer, wy.grubosc, wy.dnoGl, "szuflada"));
        el.push(p(`${w.kod}-TYL`, "drawerFrontBack", s.x + (LW - wy.plecySzer) / 2, s.y + 20 + wy.grubosc, cofniecie + wy.dnoGl - wy.grubosc, wy.plecySzer, wy.plecyWys, wy.grubosc, "szuflada"));
        const fp = wew?.front_panel;
        if (fp) {
          const opis = `${profil.manufacturer === "AMIX" ? "Amix" : profil.manufacturer} ${fp.part} — panel frontu szuflady wewnętrznej (${fp.material}), L = LW − ${fp.length.subtract_mm} = ${r1(LW - fp.length.subtract_mm)} mm, H ${fp.height_by_variant_mm[wy.wariant] ?? "?"} mm`;
          panele.set(opis, (panele.get(opis) ?? 0) + 1);
        }
        szufladyWewnetrzne.push({ kod: w.kod, podlogaY: s.y, sufitY: s.y + s.h, NL, profilId: profil.id, wariant: wy.wariant, rodzaj: "zaDrzwiami" });
      } else if (!m.szufladySystemowe) {
        // Skrzynka z płyty na prowadnicach bocznych — reguła robocza jak dla szuflad z frontem; czoło jest frontem wewnętrznym.
        const L = Math.max(250, Math.min(550, Math.floor((uzytkowa - 10) / 50) * 50));
        const szerSkrzynki = LW - 2 * LUZ_PROWADNIC_MM;
        const h = Math.max(80, Math.min(250, s.h - 40));
        const y = s.y + 20;
        el.push(p(`${w.kod}-BOK-L`, "drawerSide", s.x + LUZ_PROWADNIC_MM, y, 0, ts, h, L, "szuflada"));
        el.push(p(`${w.kod}-BOK-P`, "drawerSide", s.x + LW - LUZ_PROWADNIC_MM - ts, y, 0, ts, h, L, "szuflada"));
        el.push(p(`${w.kod}-CZOLO`, "drawerFrontBack", s.x + LUZ_PROWADNIC_MM + ts, y, 0, szerSkrzynki - 2 * ts, h - 12, ts, "szuflada"));
        el.push(p(`${w.kod}-TYL`, "drawerFrontBack", s.x + LUZ_PROWADNIC_MM + ts, y, L - ts, szerSkrzynki - 2 * ts, h - 12, ts, "szuflada"));
        el.push(p(`${w.kod}-DNO`, "drawerBottom", s.x + LUZ_PROWADNIC_MM, y - k.gruboscPlecHDFMM, 0, szerSkrzynki, k.gruboscPlecHDFMM, L, "plecy"));
        szufladyWewnetrzne.push({ kod: w.kod, podlogaY: s.y, sufitY: s.y + s.h, rodzaj: "zaDrzwiami" });
      }
    }
    for (const [opis, ilosc] of panele) okucia.push({ typ: "inne", ilosc, opis });
    okucia.push({ typ: m.szufladySystemowe ? "systemSzuflad" : "prowadnica", ilosc: zaDrzwiami.length, opis: "Szuflady wewnętrzne za drzwiami — komplet na każdą szufladę." });
    if (fronty.size && [...fronty.keys()].some((id) => typFrontu(m.fronty, id) === "drzwi"))
      ostrzezenia.push("Szuflady wewnętrzne za drzwiami: zawias musi dawać zerowe wystawanie skrzydła w światło korpusu albo potrzebna jest listwa dystansowa — sprawdź kartę zawiasu.");
  }

  // --- Nisze AGD ---
  for (const s of strefy.values()) {
    if (s.s.wyposazenie?.typ !== "nisza") continue;
    if (s.w < 560) ostrzezenia.push(`Światło niszy ${s.w} mm — urządzenia do zabudowy wymagają zwykle min. 560 mm.`);
    if (D < 550) ostrzezenia.push(`Głębokość ${D} mm — nisza piekarnika wymaga min. 550 mm.`);
  }

  // --- Blat ---
  if (m.korpus.blat) el.push(p("BLAT", "worktop", 0, H, -tf - gap, W, k.gruboscBlatuMM, k.glebokoscBlatuMM, "blat"));

  // --- Okucia ---
  const drzwi = [...fronty.entries()].filter(([id]) => typFrontu(m.fronty, id) === "drzwi").map(([, e]) => e);
  const zawiasy = drzwi.reduce((s, f) => s + zawiasyDlaWysokosci(f.wys), 0);
  if (zawiasy) okucia.push({ typ: "zawias", ilosc: zawiasy, opis: "Zawiasy frontów rozwieranych (reguła wysokości frontu)." });
  if (zFrontem.length) okucia.push({ typ: m.szufladySystemowe ? "systemSzuflad" : "prowadnica", ilosc: zFrontem.length, opis: "Komplet na każdą szufladę." });
  if (m.dodatki.cargo) okucia.push({ typ: "cargo", ilosc: m.dodatki.cargo, opis: "Komplet cargo." });
  if (m.dodatki.podnosnik) okucia.push({ typ: "podnosnik", ilosc: 1, opis: "Podnośnik frontu uchylnego." });
  if (m.dodatki.systemNarozny === "lemans") {
    // Instrukcja LeMans II (MA 402118): front 450 → szerokość korpusu min. 800, głębokość min. 500.
    if (W < 800) ostrzezenia.push(`LeMans 45 wymaga szafki min. 800 mm (jest ${W} mm).`);
    if (D < 500) ostrzezenia.push(`LeMans wymaga głębokości min. 500 mm (jest ${D} mm).`);
    if (el.some((e) => e.rola === "shelf")) ostrzezenia.push("Półki stałe kolidują z LeMans — ustaw 0 półek.");
    okucia.push({ typ: "inne", ilosc: 1, profilID: "kessebohmer.lemans2", opis: "Kesseböhmer LeMans II — komplet 2 półek (nerek), front 450." });
  }
  if (m.korpus.nogi && zKorpusem) okucia.push({ typ: "noga", ilosc: W > 1000 ? 6 : 4, opis: "Nogi regulowane." });

  return { modul, elementy: el, okucia, ostrzezenia, ...(szufladyWewnetrzne.length ? { szufladyWewnetrzne } : {}) };
}

export interface UkladPola {
  pole: PoleFrontu;
  /** Pole przydzielone w siatce frontów. */
  obszar: Prostokat;
  /** Szczeliny od krawędzi pola: lewa, prawa, dół, góra. */
  szczeliny: { l: number; p: number; d: number; g: number };
  /** Prostokąt frontu = pole pomniejszone o szczeliny. */
  front: Prostokat;
}

/**
 * Układ siatki frontów (kolejność: pole przed dziećmi). Zewnętrzne krawędzie czoła mają pełną szczelinę;
 * sąsiednie części z „szczelinaWspolna” dzielą jedną szczelinę (po połowie), pozostałe mają pełną szczelinę każda.
 */
export function ukladFrontow(korzen: PoleFrontu, W: number, H: number, gap: number): Map<string, UkladPola> {
  const wynik = new Map<string, UkladPola>();
  const rozmiesc = (pole: PoleFrontu, r: Prostokat, wc: UkladPola["szczeliny"]) => {
    wynik.set(pole.id, { pole, obszar: r, szczeliny: wc, front: { x: r.x + wc.l, y: r.y + wc.d, w: r.w - wc.l - wc.p, h: r.h - wc.d - wc.g } });
    const pd = pole.podzial;
    if (!pd) return;
    const n = pd.czesci.length;
    const rozmiary = rozmiaryCzesci(pd.czesci.map((c) => c.rozmiar), pd.kierunek === "poziom" ? r.h : r.w);
    const wew = pd.szczelinaWspolna ? gap / 2 : gap;
    let pozycja = pd.kierunek === "poziom" ? r.y : r.x;
    pd.czesci.forEach((c, i) => {
      const pierwszy = i === 0;
      const ostatni = i === n - 1;
      if (pd.kierunek === "poziom") rozmiesc(c, { x: r.x, y: pozycja, w: r.w, h: rozmiary[i] }, { l: wc.l, p: wc.p, d: pierwszy ? wc.d : wew, g: ostatni ? wc.g : wew });
      else rozmiesc(c, { x: pozycja, y: r.y, w: rozmiary[i], h: r.h }, { l: pierwszy ? wc.l : wew, p: ostatni ? wc.p : wew, d: wc.d, g: wc.g });
      pozycja += rozmiary[i];
    });
  };
  rozmiesc(korzen, { x: 0, y: 0, w: W, h: H }, { l: gap, p: gap, d: gap, g: gap });
  return wynik;
}

/** Układ stref wnętrza (prostokąty w układzie modułu) — do poleceń edycji. Korzeń = światło korpusu. */
export function ukladWnetrza(korzen: StrefaWnetrza, W: number, H: number, t: number): Map<string, Prostokat & { strefa: StrefaWnetrza }> {
  const wynik = new Map<string, Prostokat & { strefa: StrefaWnetrza }>();
  const rozmiesc = (s: StrefaWnetrza, r: Prostokat) => {
    wynik.set(s.id, { ...r, strefa: s });
    const pd = s.podzial;
    if (!pd) return;
    const tP = pd.przegroda === "plyta" ? t : 0;
    const rozmiary = rozmiaryCzesci(pd.czesci.map((c) => c.rozmiar), (pd.kierunek === "poziom" ? r.h : r.w) - tP * (pd.czesci.length - 1));
    let pozycja = pd.kierunek === "poziom" ? r.y : r.x;
    pd.czesci.forEach((c, i) => {
      rozmiesc(c, pd.kierunek === "poziom" ? { x: r.x, y: pozycja, w: r.w, h: rozmiary[i] } : { x: pozycja, y: r.y, w: rozmiary[i], h: r.h });
      pozycja += rozmiary[i] + tP;
    });
  };
  rozmiesc(korzen, { x: t, y: t, w: W - 2 * t, h: H - 2 * t });
  return wynik;
}

function czyBezPlecow(s: StrefaWnetrza): boolean {
  if (s.bezPlecow) return true;
  return !!s.podzial && s.podzial.czesci.every(czyBezPlecow);
}

function typFrontu(pole: PoleFrontu, id: string): string | undefined {
  if (pole.id === id) return pole.front?.typ;
  for (const c of pole.podzial?.czesci ?? []) {
    const t = typFrontu(c, id);
    if (t) return t;
  }
  return undefined;
}

function p(kod: string, rola: Element["rola"], x: number, y: number, z: number, szer: number, wys: number, gl: number, materialRola: Element["materialRola"]): Element {
  return { kod, rola, x: r1(x), y: r1(y), z: r1(z), szer: r1(szer), wys: r1(wys), gl: r1(gl), materialRola };
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
