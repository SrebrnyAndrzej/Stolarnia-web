import { useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  idz,
  mm,
  zl,
  type Analiza,
  type Material,
  type ModulUkladu,
  type OkuciaProjektu,
  type OpcjeOkucProjektu,
  type OpcjaOkucia,
  type RolaStylu,
  type WyborMaterialu,
  type WynikSzybkiegoUkladu,
  type WynikStylu,
  type ZadanieSzybkiegoUkladu,
} from "../api";
import { Widok3D } from "./Widok3D";

/**
 * Szybki projekt kuchni przy kliencie (tablet, dotyk): układ → podgląd → styl → okucia → wycena.
 * Cała logika (układ, styl, okucia, ceny) jest w silniku; ten widok tylko zbiera wybory i pokazuje wyniki.
 * Kontrakt: docs/SZYBKI-PROJEKT.md.
 */

type Krok = "uklad" | "podglad" | "styl" | "okucia" | "wycena";
const KROKI: { id: Krok; nazwa: string }[] = [
  { id: "uklad", nazwa: "Układ" },
  { id: "podglad", nazwa: "Podgląd" },
  { id: "styl", nazwa: "Styl" },
  { id: "okucia", nazwa: "Okucia" },
  { id: "wycena", nazwa: "Wycena" },
];

type Typ = "I" | "L" | "U";
type Lodowka = "slupek" | "wolnostojaca" | "brak";

interface Dekor {
  key: string;
  id: string;
  name: string;
  manufacturer: string;
  obraz: string;
  surface_label?: string;
  textures?: string[];
}

const ROLE_STYLU: { rola: RolaStylu; nazwa: string; opis: string }[] = [
  { rola: "korpus", nazwa: "Korpus", opis: "płyta szafek" },
  { rola: "front", nazwa: "Fronty", opis: "drzwi i szuflady" },
  { rola: "blat", nazwa: "Blat", opis: "blat roboczy" },
];

const KOLOR_ROLI: Record<string, string> = {
  szafka: "#d9c4a3",
  dopasowana: "#cdb68f",
  naroznik: "#c6a77a",
  zlew: "#9fc1d6",
  zmywarka: "#a9bfcf",
  plyta: "#d6a09a",
  lodowka: "#c9d3d9",
  slupek: "#b9a384",
  okap: "#c7c0b4",
  blenda: "#9c8f7c",
  blendaNarozna: "#9c8f7c",
};
const NAZWA_ROLI: Record<string, string> = {
  szafka: "szafka",
  dopasowana: "dopasowana",
  naroznik: "narożnik",
  zlew: "zlew",
  zmywarka: "zmywarka",
  plyta: "płyta",
  lodowka: "lodówka",
  slupek: "słupek",
  okap: "okap",
  blenda: "blenda",
  blendaNarozna: "blenda narożna",
};

const liczba = (s: string) => {
  const n = Number(s.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function SzybkiProjekt({ projektId }: { projektId?: string }) {
  const [id, setId] = useState<string | undefined>(projektId);
  const [krok, setKrok] = useState<Krok>("uklad");
  const [zajety, setZajety] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);

  // --- krok 1: układ ---
  const [nazwa, setNazwa] = useState("Kuchnia");
  const [klient, setKlient] = useState("");
  const [typ, setTyp] = useState<Typ>("L");
  const [dl, setDl] = useState<string[]>(["3000", "2400", "2400"]);
  const [wys, setWys] = useState("2600");
  const [zlew, setZlew] = useState(true);
  const [plyta, setPlyta] = useState(true);
  const [lodowka, setLodowka] = useState<Lodowka>("slupek");
  const [zmywarka, setZmywarka] = useState<"brak" | "450" | "600">("600");
  const [slupekPiekarnika, setSlupekPiekarnika] = useState(false);
  const [wiszace, setWiszace] = useState(true);
  const [naroznik, setNaroznik] = useState<"slepa" | "L">("slepa");

  // --- krok 2: podgląd ---
  const [podglad, setPodglad] = useState<WynikSzybkiegoUkladu | null>(null);
  const [potwierdzZastap, setPotwierdzZastap] = useState(false);
  const [zastosowano, setZastosowano] = useState(false);

  // --- krok 3: styl ---
  const [dekory, setDekory] = useState<Dekor[] | null>(null);
  const [wybor, setWybor] = useState<Partial<Record<RolaStylu, Dekor>>>({});
  const [otwartyWybor, setOtwartyWybor] = useState<RolaStylu | null>(null);
  const [wynikStylu, setWynikStylu] = useState<WynikStylu | null>(null);
  const [wpisy, setWpisy] = useState<Record<string, string>>({});

  // --- krok 4: okucia ---
  const [opcje, setOpcje] = useState<OpcjeOkucProjektu | null>(null);
  const [okucia, setOkucia] = useState<OkuciaProjektu>({});
  const [ostrzOkucia, setOstrzOkucia] = useState<string[]>([]);

  // --- krok 5: wycena ---
  const [analiza, setAnaliza] = useState<Analiza | null>(null);
  const [wariant, setWariant] = useState("standard");
  const [materialy, setMaterialy] = useState<Material[]>([]);
  const [pokaz3D, setPokaz3D] = useState(false);
  const [pokazWszystko, setPokazWszystko] = useState(false);

  const gora = useRef<HTMLDivElement>(null);
  const przewin = () => gora.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const idzDo = (k: Krok) => {
    setKrok(k);
    setBlad(null);
    setTimeout(przewin, 0);
  };

  const nScian = typ === "I" ? 1 : typ === "L" ? 2 : 3;

  // Istniejący projekt: wczytaj wymiary ścian.
  useEffect(() => {
    if (!projektId) return;
    api
      .analiza(projektId)
      .then((a) => {
        setAnaliza(a);
        setNazwa(a.projekt.nazwa);
        setKlient(a.projekt.klient.nazwa);
        const sc = a.projekt.pomieszczenia[0]?.sciany.filter((s) => !s.wirtualna) ?? [];
        if (sc.length) {
          setTyp(sc.length >= 3 ? "U" : sc.length === 2 ? "L" : "I");
          setDl(sc.slice(0, 3).map((s) => String(Math.round(s.dlugoscMM))).concat(["2400", "2400"]).slice(0, 3));
          setWys(String(Math.round(sc[0].wysokoscMM)));
        }
        if (a.projekt.okucia) setOkucia(a.projekt.okucia);
      })
      .catch((e) => setBlad((e as Error).message));
  }, [projektId]);

  useEffect(() => {
    if (krok === "styl" && !dekory) {
      fetch("/api/dekory")
        .then((r) => r.json())
        .then((d: Dekor[]) => setDekory(d))
        .catch((e) => setBlad(`Nie udało się wczytać galerii dekorów: ${(e as Error).message}`));
    }
    if (krok === "okucia" && !opcje) api.opcjeOkucProjektu().then(setOpcje).catch((e) => setBlad((e as Error).message));
    if (krok === "wycena") {
      if (id) api.analiza(id).then(setAnaliza).catch((e) => setBlad((e as Error).message));
      api.materialy().then(setMaterialy).catch(() => undefined);
    }
  }, [krok, id, dekory, opcje]);

  const zadanie = (): ZadanieSzybkiegoUkladu => ({
    typ,
    dlugosciScianMM: dl.slice(0, nScian).map(liczba),
    wysokoscMM: liczba(wys),
    zlew: zlew ? {} : null,
    zmywarka: zlew && zmywarka !== "brak" ? { szerokoscMM: zmywarka === "450" ? 450 : 600 } : null,
    plyta: plyta ? {} : null,
    lodowka: lodowka === "brak" ? null : { rodzaj: lodowka },
    slupki: slupekPiekarnika ? ["tall-oven-600"] : [],
    wiszace,
    okap: wiszace ? "szafka" : "brak",
    naroznik: typ === "I" ? undefined : naroznik,
    dolne: "drawers",
  });

  const sprawdzUklad = (): string | null => {
    for (let i = 0; i < nScian; i++) if (liczba(dl[i]) < 1000) return `Ściana ${i + 1}: podaj długość w mm (min. 1000).`;
    if (liczba(wys) < 2000) return "Podaj wysokość pomieszczenia w mm (min. 2000).";
    return null;
  };

  const zapewnijProjekt = async (): Promise<string> => {
    if (id) return id;
    const p = await api.utworzProjekt({
      nazwa: nazwa.trim() || "Kuchnia",
      klient: { nazwa: klient.trim() },
      sciany: dl.slice(0, nScian).map((d) => ({ dlugoscMM: liczba(d) })),
    });
    setId(p.id);
    history.replaceState(null, "", `#/szybki/${p.id}`); // bez hashchange: kreator zostaje na ekranie
    return p.id;
  };

  const liczPodglad = async () => {
    const b = sprawdzUklad();
    if (b) return setBlad(b);
    setZajety("Układam szafki…");
    setBlad(null);
    try {
      const pid = await zapewnijProjekt();
      // Podgląd niczego nie zapisuje, więc zawsze z zastap — liczba usuniętych modułów mówi, czy trzeba potwierdzenia.
      const w = await api.szybkiUklad(pid, { ...zadanie(), zastap: true, podglad: true });
      setPodglad(w);
      setPotwierdzZastap(false);
      setZastosowano(false);
      idzDo("podglad");
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setZajety(null);
    }
  };

  const zastosuj = async () => {
    if (!id || !podglad) return;
    if (podglad.usunieto > 0 && !potwierdzZastap) return setPotwierdzZastap(true);
    setZajety("Zapisuję układ…");
    setBlad(null);
    try {
      const w = await api.szybkiUklad(id, { ...zadanie(), zastap: podglad.usunieto > 0 });
      setPodglad(w);
      setZastosowano(true);
      setPotwierdzZastap(false);
      idzDo("styl");
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setZajety(null);
    }
  };

  const wyborDla = (rola: RolaStylu, d: Dekor): WyborMaterialu => {
    const w: Record<string, unknown> = { dekor: d.key };
    const pola = rola === "blat" ? ["gruboscMM", "glebokoscMM", "dlugoscMM"] : ["gruboscMM", "szerokoscArkuszaMM", "wysokoscArkuszaMM"];
    for (const p of pola) {
      const v = liczba(wpisy[`${rola}.${p}`] ?? "");
      if (v > 0) w[p] = v;
    }
    const st = wpisy[`${rola}.struktura`];
    if (st) w.struktura = st;
    return w as unknown as WyborMaterialu;
  };

  const zastosujStyl = async (tylkoBraki: boolean) => {
    if (!id) return;
    const role = ROLE_STYLU.map((r) => r.rola).filter((r) => wybor[r] && (!tylkoBraki || wynikStylu?.braki.some((b) => b.rola === r)));
    if (!role.length) return setBlad("Wybierz co najmniej jeden dekor.");
    setZajety("Ustawiam materiały…");
    setBlad(null);
    try {
      const d: Parameters<typeof api.ustawStyl>[1] = {};
      for (const r of role) d[r] = wyborDla(r, wybor[r]!);
      const w = await api.ustawStyl(id, d);
      setWynikStylu((stary) => {
        if (!tylkoBraki || !stary) return w;
        // Ponowienie dotyczyło tylko braków: zachowaj wcześniej ustawione role.
        return { ...w, ustawiono: { ...stary.ustawiono, ...w.ustawiono }, braki: w.braki, zrodla: [...stary.zrodla.filter((z) => !(z.rola in w.ustawiono)), ...w.zrodla], ostrzezenia: [...new Set([...stary.ostrzezenia, ...w.ostrzezenia])] };
      });
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setZajety(null);
    }
  };

  const zapiszOkucia = async () => {
    if (!id) return;
    setZajety("Zapisuję okucia…");
    setBlad(null);
    try {
      const czyste = Object.fromEntries(Object.entries(okucia).filter(([, v]) => v)) as OkuciaProjektu;
      const w = await api.ustawOkuciaProjektu(id, Object.keys(czyste).length ? czyste : null);
      setOstrzOkucia(w.ostrzezenia);
      idzDo("wycena");
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setZajety(null);
    }
  };

  const [pdf, setPdf] = useState(false);
  const pobierzPdf = async () => {
    if (!id) return;
    setPdf(true);
    setBlad(null);
    try {
      const odp = await fetch(`/api/projekty/${id}/oferta.pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wariant }),
      });
      if (!odp.ok) throw new Error(((await odp.json().catch(() => ({}))) as { blad?: string }).blad ?? `Błąd ${odp.status}`);
      const url = URL.createObjectURL(await odp.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `Oferta — ${nazwa}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setPdf(false);
    }
  };

  const indeks = KROKI.findIndex((k) => k.id === krok);
  const maxKrok = zastosowano || id ? (zastosowano ? 4 : 1) : 0;

  return (
    <div className="szybki" ref={gora}>
      <div className="szybki-naglowek">
        <h1>Szybki projekt kuchni</h1>
        <button className="szybki-btn" onClick={() => idz(id ? `#/p/${id}` : "#/")}>
          {id ? "Otwórz w projektancie" : "Anuluj"}
        </button>
      </div>

      <ol className="szybki-kroki" aria-label="Kroki">
        {KROKI.map((k, i) => {
          const dostepny = i <= Math.max(maxKrok, indeks);
          return (
            <li key={k.id}>
              <button className={`szybki-krok ${k.id === krok ? "on" : ""} ${i < indeks ? "zrobiony" : ""}`} disabled={!dostepny} aria-current={k.id === krok ? "step" : undefined} onClick={() => idzDo(k.id)}>
                <span className="szybki-krok-nr">{i < indeks ? "✓" : i + 1}</span>
                <span className="szybki-krok-nazwa">{k.nazwa}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {blad && <div className="szybki-alert blad" role="alert">{blad}</div>}
      {zajety && <div className="szybki-alert info" role="status">{zajety}</div>}

      {krok === "uklad" && (
        <section className="szybki-sekcja">
          <div className="szybki-siatka-2">
            <Pole label="Nazwa projektu">
              <input className="szybki-input" value={nazwa} onChange={(e) => setNazwa(e.target.value)} disabled={!!id} />
            </Pole>
            <Pole label="Klient">
              <input className="szybki-input" value={klient} onChange={(e) => setKlient(e.target.value)} placeholder="Imię i nazwisko" disabled={!!id} />
            </Pole>
          </div>

          <h2>Kształt kuchni</h2>
          <div className="szybki-kafle">
            {(["I", "L", "U"] as Typ[]).map((t) => (
              <button key={t} className={`szybki-kafel ${typ === t ? "on" : ""}`} aria-pressed={typ === t} onClick={() => setTyp(t)}>
                <RysunekTypu typ={t} />
                <b>{t === "I" ? "Jedna ściana" : t === "L" ? "Kształt L" : "Kształt U"}</b>
              </button>
            ))}
          </div>

          <h2>Wymiary [mm]</h2>
          <div className="szybki-siatka-4">
            {Array.from({ length: nScian }, (_, i) => (
              <Liczba key={i} label={`Ściana ${i + 1}${typ !== "I" && i === 0 ? " (od lodówki)" : ""}`} value={dl[i]} onChange={(v) => setDl((d) => d.map((x, j) => (j === i ? v : x)))} krok={100} />
            ))}
            <Liczba label="Wysokość pomieszczenia" value={wys} onChange={setWys} krok={50} />
          </div>

          <h2>Punkty stałe</h2>
          <div className="szybki-siatka-3">
            <Wybor label="Zlew" wartosc={zlew ? "tak" : "nie"} opcje={[["tak", "Jest"], ["nie", "Brak"]]} onChange={(v) => setZlew(v === "tak")} />
            <Wybor label="Płyta grzewcza" wartosc={plyta ? "tak" : "nie"} opcje={[["tak", "Jest"], ["nie", "Brak"]]} onChange={(v) => setPlyta(v === "tak")} />
            <Wybor label="Lodówka" wartosc={lodowka} opcje={[["slupek", "Zabudowana"], ["wolnostojaca", "Wolnostojąca"], ["brak", "Brak"]]} onChange={(v) => setLodowka(v as Lodowka)} />
            <Wybor label="Zmywarka" wartosc={zlew ? zmywarka : "brak"} opcje={[["brak", "Brak"], ["450", "45 cm"], ["600", "60 cm"]]} onChange={(v) => setZmywarka(v as "brak" | "450" | "600")} wylaczone={!zlew} podpowiedz={!zlew ? "Zmywarka stoi obok zlewu" : undefined} />
            <Wybor label="Słupek z piekarnikiem" wartosc={slupekPiekarnika ? "tak" : "nie"} opcje={[["nie", "Nie"], ["tak", "Tak"]]} onChange={(v) => setSlupekPiekarnika(v === "tak")} />
            <Wybor label="Szafki wiszące" wartosc={wiszace ? "tak" : "nie"} opcje={[["tak", "Tak"], ["nie", "Nie"]]} onChange={(v) => setWiszace(v === "tak")} />
            {typ !== "I" && <Wybor label="Narożnik" wartosc={naroznik} opcje={[["slepa", "Ślepy"], ["L", "L"]]} onChange={(v) => setNaroznik(v as "slepa" | "L")} />}
          </div>
          <p className="szybki-muted">Układ proponuje silnik wg założeń ergonomii (blat między zlewem a płytą ≥ 600 mm, płyta ≥ 300 mm od narożnika). Szczegóły zobaczysz w podglądzie.</p>

          <div className="szybki-pasek">
            <span className="szybki-rozpychacz" />
            <button className="szybki-btn glowny" onClick={liczPodglad} disabled={!!zajety}>Dalej: podgląd →</button>
          </div>
        </section>
      )}

      {krok === "podglad" && podglad && (
        <section className="szybki-sekcja">
          <h2>Podgląd układu</h2>
          <p className="szybki-muted">Tak silnik ułożył szafki. Nic nie jest jeszcze zapisane — sprawdź i zatwierdź.</p>
          {podglad.sciany.map((s) => (
            <ElewacjaPodgladu key={s.id} sciana={s} moduly={podglad.moduly.filter((m) => m.scianaId === s.id)} rezerwacje={podglad.rezerwacje.filter((r) => r.scianaId === s.id)} />
          ))}
          <Legenda moduly={podglad.moduly} />
          <Ostrzezenia tytul="Uwaga" lista={podglad.ostrzezenia} />
          <Ostrzezenia tytul="Założenia ergonomii (nie normy — potwierdź)" lista={podglad.zalozenia} info />
          {podglad.usunieto > 0 && (
            <div className="szybki-alert ostrzezenie">
              Na tych ścianach stoi już {podglad.usunieto} {podglad.usunieto === 1 ? "moduł" : "modułów"}. Zastosowanie układu je usunie.
              {potwierdzZastap && (
                <div className="szybki-pasek">
                  <b>Zastąpić istniejące?</b>
                  <button className="szybki-btn" onClick={() => setPotwierdzZastap(false)}>Nie</button>
                  <button className="szybki-btn niebezpieczny" onClick={zastosuj} disabled={!!zajety}>Tak, zastąp</button>
                </div>
              )}
            </div>
          )}
          <div className="szybki-pasek">
            <button className="szybki-btn" onClick={() => idzDo("uklad")}>← Zmień układ</button>
            <span className="szybki-rozpychacz" />
            {zastosowano ? (
              <button className="szybki-btn glowny" onClick={() => idzDo("styl")}>Dalej: styl →</button>
            ) : (
              !potwierdzZastap && <button className="szybki-btn glowny" onClick={zastosuj} disabled={!!zajety}>Zastosuj układ</button>
            )}
          </div>
        </section>
      )}

      {krok === "styl" && (
        <section className="szybki-sekcja">
          <h2>Dekory</h2>
          <p className="szybki-muted">Wybierz z galerii 644 dekorów (Egger, Kronospan). Grubości i formaty Egger pochodzą z artykułów producenta; dla pozostałych wpiszesz je sam.</p>
          <div className="szybki-kafle">
            {ROLE_STYLU.map(({ rola, nazwa: n, opis }) => {
              const d = wybor[rola];
              return (
                <button key={rola} className={`szybki-kafel dekor ${d ? "on" : ""}`} onClick={() => setOtwartyWybor(rola)}>
                  {d ? <img src={d.obraz} alt="" /> : <span className="szybki-pusty-dekor">＋</span>}
                  <b>{n}</b>
                  <span className="szybki-muted">{d ? `${d.manufacturer} ${d.id} · ${d.name}` : opis}</span>
                </button>
              );
            })}
          </div>

          {wynikStylu && (
            <>
              {Object.keys(wynikStylu.ustawiono).length > 0 && (
                <div className="szybki-alert ok">
                  Ustawiono: {ROLE_STYLU.filter((r) => wynikStylu.ustawiono[r.rola]).map((r) => r.nazwa.toLowerCase()).join(", ")}.
                  {wynikStylu.zrodla.map((z) => (
                    <div key={z.rola} className="szybki-muted">{ROLE_STYLU.find((r) => r.rola === z.rola)?.nazwa}: {z.zrodlo}{z.alternatywy ? ` (+${z.alternatywy} inne pasujące artykuły)` : ""}</div>
                  ))}
                </div>
              )}
              <Ostrzezenia tytul="Uwaga" lista={wynikStylu.ostrzezenia} />
              {wynikStylu.braki.map((b) => (
                <BrakDanych key={b.rola} rola={b.rola} komunikat={b.komunikat} dekor={wybor[b.rola]} wpisy={wpisy} onWpis={(k, v) => setWpisy((w) => ({ ...w, [k]: v }))} />
              ))}
              {wynikStylu.braki.length > 0 && (
                <div className="szybki-pasek">
                  <button className="szybki-btn glowny" onClick={() => zastosujStyl(true)} disabled={!!zajety}>Ponów z wpisanymi danymi</button>
                </div>
              )}
              {wynikStylu.aktywowane.length > 0 && <p className="szybki-muted">Nowe materiały mają cenę zakupu 0 („brak ceny”) — pozycje w wycenie będą oznaczone do uzupełnienia w cenniku.</p>}
            </>
          )}

          <div className="szybki-pasek">
            <button className="szybki-btn" onClick={() => idzDo("podglad")}>← Wróć</button>
            <span className="szybki-rozpychacz" />
            <button className="szybki-btn" onClick={() => idzDo("okucia")}>Pomiń styl</button>
            <button className="szybki-btn glowny" onClick={() => zastosujStyl(false)} disabled={!!zajety || !Object.keys(wybor).length}>Zastosuj dekory</button>
            <button className="szybki-btn glowny" onClick={() => idzDo("okucia")} disabled={!wynikStylu || wynikStylu.braki.length > 0 || !Object.keys(wynikStylu.ustawiono).length}>Dalej: okucia →</button>
          </div>

          {otwartyWybor && dekory && (
            <WyborDekoru
              dekory={dekory}
              tytul={ROLE_STYLU.find((r) => r.rola === otwartyWybor)!.nazwa}
              aktualny={wybor[otwartyWybor]?.key}
              onZamknij={() => setOtwartyWybor(null)}
              onWybierz={(d) => {
                setWybor((w) => ({ ...w, [otwartyWybor]: d }));
                setOtwartyWybor(null);
              }}
            />
          )}
          {otwartyWybor && !dekory && <div className="szybki-alert info">Wczytuję galerię dekorów…</div>}
        </section>
      )}

      {krok === "okucia" && (
        <section className="szybki-sekcja">
          <h2>Okucia projektu</h2>
          <p className="szybki-muted">Zostaw „Automatycznie”, jeśli wycena ma dobrać okucia według wariantu. Pozycja bez ceny w cenniku trafi do wyceny jako błąd.</p>
          {!opcje && <div className="szybki-alert info">Wczytuję opcje okuć…</div>}
          {opcje && (
            <>
              <GrupaOkuc nazwa="System szuflad" lista={opcje.systemySzuflad} wartosc={okucia.systemSzuflad} onChange={(v) => setOkucia((o) => ({ ...o, systemSzuflad: v }))} />
              <GrupaOkuc nazwa="Zawiasy" lista={opcje.zawiasy} wartosc={okucia.zawiasy} onChange={(v) => setOkucia((o) => ({ ...o, zawiasy: v }))} />
              <GrupaOkuc nazwa="Podnośniki (szafki wiszące)" lista={opcje.podnosniki} wartosc={okucia.podnosniki} onChange={(v) => setOkucia((o) => ({ ...o, podnosniki: v }))} />
              {opcje.profileSzuflad.length > 0 && (
                <div className="szybki-grupa">
                  <h3>Profil konstrukcji szuflad</h3>
                  <p className="szybki-muted">Wybór systemu szuflad nie ustawia profilu automatycznie. Bez profilu silnik użyje domyślnego ({opcje.profilDomyslny}) i wypisze ostrzeżenie.</p>
                  <div className="szybki-opcje">
                    <button className={`szybki-opcja ${!okucia.profilSzuflad ? "on" : ""}`} onClick={() => setOkucia((o) => ({ ...o, profilSzuflad: undefined }))}><b>Domyślny</b></button>
                    {opcje.profileSzuflad.map((p) => (
                      <button key={p.id} className={`szybki-opcja ${okucia.profilSzuflad === p.id ? "on" : ""}`} onClick={() => setOkucia((o) => ({ ...o, profilSzuflad: p.id }))}>
                        <b>{p.producent} {p.system}</b>
                        <span className="szybki-muted">płyta {mm(p.gruboscPlytyMM)} mm</span>
                        {!p.zatwierdzonyProdukcyjnie && <span className="szybki-znacznik ostrzezenie">niezatwierdzony produkcyjnie</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="szybki-pasek">
            <button className="szybki-btn" onClick={() => idzDo("styl")}>← Wróć</button>
            <span className="szybki-rozpychacz" />
            <button className="szybki-btn glowny" onClick={zapiszOkucia} disabled={!!zajety || !opcje}>Dalej: wycena →</button>
          </div>
        </section>
      )}

      {krok === "wycena" && (
        <section className="szybki-sekcja">
          <h2>Wycena</h2>
          <Ostrzezenia tytul="Okucia" lista={ostrzOkucia} />
          {!analiza && <div className="szybki-alert info">Liczę wycenę…</div>}
          {analiza && (() => {
            const w = analiza.warianty.find((x) => x.wariant === wariant) ?? analiza.warianty[0];
            const bledy = w.pozycje.filter((p) => p.jestBledemWyceny);
            const wszystkie = pokazWszystko ? w.pozycje : bledy;
            return (
              <>
                <div className="szybki-warianty">
                  {analiza.warianty.map((v) => {
                    const b = v.pozycje.filter((p) => p.jestBledemWyceny).length;
                    return (
                      <button key={v.wariant} className={`szybki-wariant ${v.wariant === w.wariant ? "on" : ""}`} aria-pressed={v.wariant === w.wariant} onClick={() => setWariant(v.wariant)}>
                        <span className="szybki-wariant-nazwa">{v.nazwa}</span>
                        <span className="szybki-cena">{zl(v.cenaBrutto)}</span>
                        <span className="szybki-muted">brutto · netto {zl(v.cenaNetto)}</span>
                        {b > 0 && <span className="szybki-znacznik blad">{b} do uzupełnienia</span>}
                      </button>
                    );
                  })}
                </div>
                {w.cenaKalkulowanaBrutto !== undefined && <div className="szybki-alert info">Cena uzgodniona z klientem: <b>{zl(w.cenaBrutto)}</b> (bieżąca kalkulacja: {zl(w.cenaKalkulowanaBrutto)}).</div>}
                {bledy.length > 0 ? (
                  <div className="szybki-alert blad">
                    <b>{bledy.length} {bledy.length === 1 ? "pozycja" : "pozycji"} z błędem wyceny</b> — cena może być zaniżona lub przybliżona. Uzupełnij ceny w cenniku (Materiały i okucia) przed wysłaniem oferty.
                  </div>
                ) : (
                  <div className="szybki-alert ok">Wszystkie pozycje mają ceny.</div>
                )}
                <div className="szybki-tabela-wrap">
                  <table className="szybki-tabela">
                    <thead><tr><th>Pozycja</th><th className="num">Ilość</th><th className="num">Koszt netto</th></tr></thead>
                    <tbody>
                      {wszystkie.map((p, i) => (
                        <tr key={p.nazwa + i} className={p.jestBledemWyceny ? "blad" : ""}>
                          <td>{p.jestBledemWyceny && <span className="szybki-znacznik blad">brak ceny</span>} {p.nazwa}{p.uwagi ? <div className="szybki-muted">{p.uwagi}</div> : null}</td>
                          <td className="num">{mm(p.ilosc)} {p.jednostka}</td>
                          <td className="num">{zl(p.kosztNetto)}</td>
                        </tr>
                      ))}
                      {wszystkie.length === 0 && <tr><td colSpan={3} className="szybki-muted">Brak pozycji z błędem.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <button className="szybki-btn" onClick={() => setPokazWszystko((x) => !x)}>{pokazWszystko ? "Pokaż tylko błędy" : `Pokaż wszystkie pozycje (${w.pozycje.length})`}</button>

                {pokaz3D && analiza.projekt.pomieszczenia[0] && (
                  <div className="szybki-3d">
                    <Widok3D
                      analiza={analiza}
                      pomieszczenieId={analiza.projekt.pomieszczenia[0].id}
                      scianaId={analiza.projekt.pomieszczenia[0].sciany[0]?.id ?? ""}
                      wybrany={null}
                      matMap={new Map(materialy.map((m) => [m.id, m]))}
                      onWybierz={() => undefined}
                    />
                  </div>
                )}
                <div className="szybki-pasek">
                  <button className="szybki-btn" onClick={() => idzDo("okucia")}>← Wróć</button>
                  <button className="szybki-btn" onClick={() => setPokaz3D((x) => !x)}>{pokaz3D ? "Ukryj 3D" : "Podgląd 3D"}</button>
                  <span className="szybki-rozpychacz" />
                  <button className="szybki-btn" onClick={() => id && idz(`#/p/${id}`)}>Otwórz w projektancie</button>
                  <button className="szybki-btn glowny" onClick={pobierzPdf} disabled={pdf}>{pdf ? "Składam PDF…" : "Oferta PDF"}</button>
                </div>
                <p className="szybki-muted">Oferta PDF bez wizualizacji; zdjęcia do oferty wygenerujesz w zakładce Oferta projektu.</p>
              </>
            );
          })()}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- elementy

function Pole({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="szybki-pole">
      <span>{label}</span>
      {children}
    </label>
  );
}

/** Duże pole liczbowe z przyciskami +/- (dotyk) i klawiaturą numeryczną. */
function Liczba({ label, value, onChange, krok }: { label: string; value: string; onChange: (v: string) => void; krok: number }) {
  const zmien = (d: number) => onChange(String(Math.max(0, Math.round(liczba(value) + d))));
  return (
    <div className="szybki-pole">
      <span>{label}</span>
      <div className="szybki-liczba">
        <button type="button" className="szybki-btn" aria-label={`${label}: mniej`} onClick={() => zmien(-krok)}>−</button>
        <input className="szybki-input" inputMode="numeric" pattern="[0-9]*" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))} aria-label={label} />
        <button type="button" className="szybki-btn" aria-label={`${label}: więcej`} onClick={() => zmien(krok)}>+</button>
      </div>
    </div>
  );
}

function Wybor({ label, wartosc, opcje, onChange, wylaczone, podpowiedz }: { label: string; wartosc: string; opcje: [string, string][]; onChange: (v: string) => void; wylaczone?: boolean; podpowiedz?: string }) {
  return (
    <div className={`szybki-pole ${wylaczone ? "wylaczone" : ""}`}>
      <span>{label}</span>
      <div className="szybki-przelacznik" role="group" aria-label={label}>
        {opcje.map(([v, t]) => (
          <button key={v} type="button" className={wartosc === v ? "on" : ""} aria-pressed={wartosc === v} disabled={wylaczone} onClick={() => onChange(v)}>{t}</button>
        ))}
      </div>
      {podpowiedz && <small className="szybki-muted">{podpowiedz}</small>}
    </div>
  );
}

function RysunekTypu({ typ }: { typ: Typ }) {
  const d = typ === "I" ? "M10 14 H110" : typ === "L" ? "M10 14 H110 M10 14 V74" : "M10 74 V14 H110 V74";
  return (
    <svg viewBox="0 0 120 84" className="szybki-rysunek" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="square" opacity="0.85" />
      <rect x="2" y="2" width="116" height="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
    </svg>
  );
}

function ElewacjaPodgladu({ sciana, moduly, rezerwacje }: { sciana: { id: string; nazwa: string; dlugoscMM: number; wysokoscMM: number }; moduly: ModulUkladu[]; rezerwacje: { rzad: string; odMM: number; doMM: number; opis: string }[] }) {
  const L = sciana.dlugoscMM;
  const H = sciana.wysokoscMM;
  const M = 120; // margines na wymiary
  const Y = (y: number) => H - y;
  return (
    <figure className="szybki-rysunek-wrap">
      <figcaption><b>{sciana.nazwa}</b> · {mm(L)} × {mm(H)} mm</figcaption>
      <svg viewBox={`${-M} ${-M / 2} ${L + 2 * M} ${H + 2.2 * M}`} role="img" aria-label={`Elewacja: ${sciana.nazwa}`}>
        <rect x={0} y={0} width={L} height={H} fill="var(--wall)" stroke="var(--line-strong)" strokeWidth={8} />
        <line x1={0} y1={Y(0)} x2={L} y2={Y(0)} stroke="var(--floor)" strokeWidth={16} />
        {rezerwacje.map((r, i) => {
          const wisz = r.rzad === "wiszacy";
          return (
            <g key={i}>
              <rect x={r.odMM} y={wisz ? Y(2120) : Y(900)} width={r.doMM - r.odMM} height={wisz ? 720 : 900} fill="none" stroke="var(--muted)" strokeWidth={8} strokeDasharray="40 30" />
              <text x={(r.odMM + r.doMM) / 2} y={wisz ? Y(1760) : Y(450)} textAnchor="middle" fontSize={70} fill="var(--muted)">{r.opis}</text>
            </g>
          );
        })}
        {moduly.map((m) => {
          const szer = m.szerokoscMM;
          return (
            <g key={m.id}>
              <rect x={m.pozycjaXMM} y={Y(m.pozycjaYMM + m.wysokoscMM)} width={szer} height={m.wysokoscMM} fill={KOLOR_ROLI[m.rola] ?? "#d9c4a3"} stroke="#3b3128" strokeWidth={8} fillOpacity={m.pozycjaYMM >= 1000 ? 0.75 : 1} />
              {szer >= 280 && (
                <text x={m.pozycjaXMM + szer / 2} y={Y(m.pozycjaYMM + m.wysokoscMM / 2)} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(95, szer / 4.5)} fill="#1d1812">
                  {mm(szer)}
                </text>
              )}
            </g>
          );
        })}
        <Wymiar x1={0} x2={L} y={H + 70} tekst={`${mm(L)} mm`} />
      </svg>
    </figure>
  );
}

function Wymiar({ x1, x2, y, tekst }: { x1: number; x2: number; y: number; tekst: string }) {
  return (
    <g stroke="var(--muted)" strokeWidth={6} fill="var(--muted)">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 25} x2={x1} y2={y + 25} />
      <line x1={x2} y1={y - 25} x2={x2} y2={y + 25} />
      <text x={(x1 + x2) / 2} y={y + 90} textAnchor="middle" fontSize={85} stroke="none">{tekst}</text>
    </g>
  );
}

function Legenda({ moduly }: { moduly: ModulUkladu[] }) {
  const role = [...new Set(moduly.map((m) => m.rola))];
  return (
    <ul className="szybki-legenda">
      {role.map((r) => (
        <li key={r}><span style={{ background: KOLOR_ROLI[r] ?? "#d9c4a3" }} /> {NAZWA_ROLI[r] ?? r} ({moduly.filter((m) => m.rola === r).length})</li>
      ))}
    </ul>
  );
}

function Ostrzezenia({ tytul, lista, info }: { tytul: string; lista: string[]; info?: boolean }) {
  if (!lista.length) return null;
  return (
    <div className={`szybki-alert ${info ? "info" : "ostrzezenie"}`}>
      <b>{tytul}</b>
      <ul>{lista.map((o, i) => <li key={i}>{o}</li>)}</ul>
    </div>
  );
}

function BrakDanych({ rola, komunikat, dekor, wpisy, onWpis }: { rola: RolaStylu; komunikat: string; dekor?: Dekor; wpisy: Record<string, string>; onWpis: (k: string, v: string) => void }) {
  const pola: [string, string][] =
    rola === "blat"
      ? [["gruboscMM", "Grubość [mm]"], ["glebokoscMM", "Głębokość [mm]"], ["dlugoscMM", "Długość [mm]"]]
      : [["gruboscMM", "Grubość [mm]"], ["szerokoscArkuszaMM", "Szerokość arkusza [mm]"], ["wysokoscArkuszaMM", "Wysokość arkusza [mm]"]];
  const nazwa = ROLE_STYLU.find((r) => r.rola === rola)!.nazwa;
  return (
    <div className="szybki-alert blad">
      <b>{nazwa}: brak danych producenta</b>
      <p>{komunikat}</p>
      <p className="szybki-muted">Wpisz dane potwierdzone u dostawcy. Niczego nie zgadujemy.</p>
      <div className="szybki-siatka-3">
        {pola.map(([k, l]) => (
          <Pole key={k} label={l}>
            <input className="szybki-input" inputMode="decimal" value={wpisy[`${rola}.${k}`] ?? ""} onChange={(e) => onWpis(`${rola}.${k}`, e.target.value.replace(/[^\d.,]/g, ""))} />
          </Pole>
        ))}
        {(dekor?.textures?.length ?? 0) > 1 && !dekor?.surface_label && (
          <Pole label="Struktura">
            <select className="szybki-input" value={wpisy[`${rola}.struktura`] ?? ""} onChange={(e) => onWpis(`${rola}.struktura`, e.target.value)}>
              <option value="">Wybierz…</option>
              {dekor!.textures!.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Pole>
        )}
      </div>
    </div>
  );
}

function GrupaOkuc({ nazwa, lista, wartosc, onChange }: { nazwa: string; lista: OpcjaOkucia[]; wartosc?: string; onChange: (v: string | undefined) => void }) {
  return (
    <div className="szybki-grupa">
      <h3>{nazwa}</h3>
      <div className="szybki-opcje">
        <button className={`szybki-opcja ${!wartosc ? "on" : ""}`} aria-pressed={!wartosc} onClick={() => onChange(undefined)}>
          <b>Automatycznie</b>
          <span className="szybki-muted">dobór wg wariantu wyceny</span>
        </button>
        {lista.map((o) => (
          <button key={o.id} className={`szybki-opcja ${wartosc === o.id ? "on" : ""}`} aria-pressed={wartosc === o.id} onClick={() => onChange(o.id)}>
            <b>{o.nazwa}</b>
            <span className="szybki-muted">{o.producent} · {o.system}</span>
            {o.maCene ? <span className="szybki-muted num">{zl(o.cenaNetto)} netto</span> : <span className="szybki-znacznik blad">brak ceny</span>}
            {!o.aktywne && <span className="szybki-znacznik ostrzezenie">nieaktywne</span>}
          </button>
        ))}
        {lista.length === 0 && <span className="szybki-muted">Brak pozycji w bazie okuć.</span>}
      </div>
    </div>
  );
}

const NA_STRONE = 48;

function WyborDekoru({ dekory, tytul, aktualny, onZamknij, onWybierz }: { dekory: Dekor[]; tytul: string; aktualny?: string; onZamknij: () => void; onWybierz: (d: Dekor) => void }) {
  const [szukaj, setSzukaj] = useState("");
  const [producent, setProducent] = useState("");
  const [ile, setIle] = useState(NA_STRONE);
  const wynik = useMemo(() => {
    const s = szukaj.trim().toLocaleLowerCase("pl");
    return dekory.filter((d) => (!producent || d.manufacturer === producent) && (!s || `${d.id} ${d.name} ${d.surface_label ?? ""} ${(d.textures ?? []).join(" ")}`.toLocaleLowerCase("pl").includes(s)));
  }, [dekory, szukaj, producent]);
  useEffect(() => setIle(NA_STRONE), [szukaj, producent]);
  return (
    <div className="szybki-nakladka" role="dialog" aria-modal="true" aria-label={`Wybierz dekor: ${tytul}`}>
      <div className="szybki-okno">
        <div className="szybki-okno-g">
          <h2>Dekor: {tytul}</h2>
          <span className="szybki-rozpychacz" />
          <button className="szybki-btn" onClick={onZamknij}>Zamknij</button>
        </div>
        <div className="szybki-pasek">
          <input className="szybki-input" type="search" placeholder="Szukaj: kod, nazwa, struktura…" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} aria-label="Szukaj dekoru" />
          <div className="szybki-przelacznik" role="group" aria-label="Producent">
            {[["", "Wszyscy"], ["Egger", "Egger"], ["Kronospan", "Kronospan"]].map(([v, t]) => (
              <button key={v} className={producent === v ? "on" : ""} aria-pressed={producent === v} onClick={() => setProducent(v)}>{t}</button>
            ))}
          </div>
        </div>
        <p className="szybki-muted">{wynik.length} dekorów</p>
        <div className="szybki-galeria">
          {wynik.slice(0, ile).map((d) => (
            <button key={d.key} className={`szybki-dekor ${aktualny === d.key ? "on" : ""}`} onClick={() => onWybierz(d)}>
              <img src={d.obraz} alt="" loading="lazy" />
              <b>{d.manufacturer} {d.id}</b>
              <span>{d.name}</span>
            </button>
          ))}
        </div>
        {ile < wynik.length && <button className="szybki-btn" onClick={() => setIle((x) => x + NA_STRONE)}>Pokaż więcej ({wynik.length - ile})</button>}
      </div>
    </div>
  );
}
