import { useEffect, useState } from "react";
import { api, mm, zl, type Analiza, type Material } from "../api";

const ROLE: Record<string, string> = { korpus: "korpus", front: "fronty", plecy: "plecy / dna", blat: "blat" };

/** Cena netto za m² po rabacie — ta sama reguła co w silniku wyceny (cenaZaM2Netto). */
function zaM2(m: Material): number | null {
  const po = m.cenaNetto * (1 - Math.min(Math.max(m.rabatProcent, 0), 100) / 100);
  if (m.jednostka === "sztuka") {
    const pow = (m.szerokoscArkuszaMM * m.wysokoscArkuszaMM) / 1e6;
    return pow > 0 ? po / pow : null;
  }
  return m.jednostka === "metrKwadratowy" ? po : null;
}

/**
 * Ceny konkretnych płyt użytych w projekcie. Zmiana zapisuje cenę materiału (cena dostawcy obowiązuje
 * we wszystkich projektach) i od razu przelicza wycenę.
 */
function CenyPlyt({ analiza, odswiez }: { analiza: Analiza; odswiez: () => Promise<void> }) {
  const [materialy, setMaterialy] = useState<Material[]>([]);
  const [blad, setBlad] = useState<string | null>(null);
  useEffect(() => {
    api.materialy().then(setMaterialy).catch((e) => setBlad(e.message));
  }, [analiza.projekt.rewizja]);

  const pw = analiza.projektWyceny;
  const uzycia = new Map<string, { role: Set<string>; m2: number; mb: number }>();
  for (const u of pw.uzyciaMaterialow) {
    const x = uzycia.get(u.materialId) ?? { role: new Set<string>(), m2: 0, mb: 0 };
    x.role.add(u.rola);
    x.m2 += u.iloscM2;
    uzycia.set(u.materialId, x);
  }
  if (pw.blatMaterialId && pw.metryBiezaceBlatu > 0) {
    const x = uzycia.get(pw.blatMaterialId) ?? { role: new Set<string>(), m2: 0, mb: 0 };
    x.role.add("blat");
    x.mb += pw.metryBiezaceBlatu;
    uzycia.set(pw.blatMaterialId, x);
  }
  const arkusze = new Map<string, number>();
  for (const p of analiza.rozkroj.podsumowanie) arkusze.set(p.materialId, (arkusze.get(p.materialId) ?? 0) + p.liczbaArkuszy);

  const zapisz = async (m: Material, zmiana: Partial<Material>) => {
    try {
      setBlad(null);
      const nowy = await api.zapiszMaterial({ id: m.id, ...zmiana });
      setMaterialy((l) => l.map((x) => (x.id === m.id ? nowy : x)));
      await odswiez();
    } catch (e) {
      setBlad((e as Error).message);
    }
  };

  const wiersze = [...uzycia.entries()].map(([id, u]) => ({ m: materialy.find((x) => x.id === id), u, id }));
  const bezCeny = wiersze.filter((w) => w.m && !(w.m.cenaNetto > 0)).length;

  return (
    <div className="card">
      <div className="card-h" style={{ flexWrap: "wrap" }}>
        <h2 style={{ flex: 1 }}>Płyty w projekcie — ceny</h2>
        {bezCeny > 0 && <span className="badge danger">{bezCeny} bez ceny</span>}
      </div>
      <div className="card-b muted" style={{ fontSize: 12, paddingBottom: 0 }}>
        Wpisz cenę zakupu netto konkretnej płyty — za arkusz albo za m². Cena zapisuje się w bazie materiałów (obowiązuje we wszystkich projektach) i od razu przelicza wycenę.
      </div>
      {blad && <div className="alert blad" style={{ margin: 12 }}>{blad}</div>}
      <div className="t-wrap">
        <table className="t">
          <thead>
            <tr>
              <th>Płyta</th>
              <th>Zastosowanie</th>
              <th className="r">Zużycie</th>
              <th>Cena za</th>
              <th className="r">Cena netto</th>
              <th className="r">Rabat %</th>
              <th className="r">Netto / m²</th>
              <th className="r">Koszt netto</th>
            </tr>
          </thead>
          <tbody>
            {wiersze.map(({ m, u, id }) => {
              if (!m) return (
                <tr key={id}><td colSpan={8} className="muted">Materiał {id} nie istnieje w bazie — wybierz inny w projektancie.</td></tr>
              );
              const cm2 = zaM2(m);
              const koszt = u.mb > 0 && m.jednostka === "metrBiezacy" ? u.mb * m.cenaNetto * (1 - m.rabatProcent / 100) : cm2 ? u.m2 * cm2 : 0;
              const arkusz = m.szerokoscArkuszaMM > 0 && m.wysokoscArkuszaMM > 0;
              const brak = !(m.cenaNetto > 0);
              return (
                <tr key={id} style={brak ? { background: "var(--danger-soft)" } : undefined}>
                  <td>
                    <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                      {m.zdjecieURL ? <img src={m.zdjecieURL} alt="" width={34} height={34} style={{ objectFit: "cover", borderRadius: 4 }} /> : <span className="swatch" style={{ background: m.kolorHEX, width: 34, height: 34 }} />}
                      <div>
                        <b>{m.producent} {m.nazwa}</b>
                        <div className="muted" style={{ fontSize: 11 }}>{m.kod}{arkusz ? ` · ark. ${m.wysokoscArkuszaMM}×${m.szerokoscArkuszaMM}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td>{[...u.role].map((r) => ROLE[r] ?? r).join(", ")}</td>
                  <td className="r num">
                    {u.m2 > 0 && <div>{mm(u.m2)} m²</div>}
                    {u.mb > 0 && <div>{mm(u.mb)} mb</div>}
                    {arkusze.get(id) ? <div className="muted">{arkusze.get(id)} ark.</div> : null}
                  </td>
                  <td>
                    {m.jednostka === "metrBiezacy" ? (
                      "mb"
                    ) : (
                      <select className="input" style={{ width: 100 }} value={m.jednostka} onChange={(e) => zapisz(m, { jednostka: e.target.value as Material["jednostka"] })}>
                        <option value="sztuka" disabled={!arkusz}>arkusz</option>
                        <option value="metrKwadratowy">m²</option>
                      </select>
                    )}
                  </td>
                  <td className="r"><PoleCeny value={m.cenaNetto} onSave={(v) => zapisz(m, { cenaNetto: v })} /></td>
                  <td className="r"><PoleCeny value={m.rabatProcent} onSave={(v) => zapisz(m, { rabatProcent: Math.min(v, 100) })} /></td>
                  <td className="r num">{cm2 ? zl(cm2) : "—"}</td>
                  <td className="r num">{brak ? <b style={{ color: "var(--danger)" }}>brak ceny</b> : zl(koszt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PoleCeny({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <input
      className="input num"
      style={{ width: 90, textAlign: "right" }}
      inputMode="decimal"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = Number(v.replace(",", "."));
        if (Number.isFinite(n) && n >= 0 && n !== value) onSave(n);
        else setV(String(value));
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

const KATEGORIE: Record<string, string> = {
  plyty: "Płyty",
  fronty: "Fronty",
  blaty: "Blaty",
  okucia: "Okucia",
  akcesoria: "Akcesoria",
  robocizna: "Robocizna",
  montaz: "Montaż",
  transport: "Transport",
  pozostale: "Pozostałe",
};

export function Quote({ analiza, odswiez }: { analiza: Analiza; odswiez: () => Promise<void> }) {
  const [wariant, setWariant] = useState("standard");
  const w = analiza.warianty.find((x) => x.wariant === wariant) ?? analiza.warianty[0];
  const pw = analiza.projektWyceny;
  const bledy = w.pozycje.filter((p) => p.jestBledemWyceny);

  const grupy = Object.keys(KATEGORIE)
    .map((k) => ({ k, pozycje: w.pozycje.filter((p) => p.kategoria === k) }))
    .filter((g) => g.pozycje.length);

  return (
    <>
      <div className="variants">
        {analiza.warianty.map((v) => (
          <div key={v.wariant} className={`card variant ${v.wariant === wariant ? "on" : ""}`} onClick={() => setWariant(v.wariant)}>
            <h3>{v.nazwa}</h3>
            <div className="price">{zl(v.cenaBrutto)}</div>
            <div className="muted num">{zl(v.cenaNetto)} netto</div>
            <div className="muted" style={{ fontSize: 12 }}>{v.opis}</div>
          </div>
        ))}
      </div>

      <CenyPlyt analiza={analiza} odswiez={odswiez} />

      {bledy.length > 0 && (
        <div className="alert blad">
          {bledy.length} pozycji z błędem wyceny (brak ceny lub materiału) — nie trafiają do dokumentu klienta, uzupełnij cennik: {bledy.map((b) => b.nazwa).join(", ")}.
        </div>
      )}

      <div className="card">
        <div className="card-h">
          <h2 style={{ flex: 1 }}>Kosztorys — wariant {w.nazwa}</h2>
          <button className="btn small" onClick={() => print()}>Drukuj</button>
        </div>
        <div className="t-wrap" style={{ maxHeight: "none" }}>
          <table className="t">
            <thead>
              <tr>
                <th>Pozycja</th>
                <th className="r">Ilość</th>
                <th>Jedn.</th>
                <th className="r">Cena netto</th>
                <th className="r">Wartość netto</th>
                <th>Uwagi</th>
              </tr>
            </thead>
            <tbody>
              {grupy.map((g) => [
                <tr key={g.k}>
                  <td colSpan={4}><b>{KATEGORIE[g.k]}</b></td>
                  <td className="r num"><b>{zl(g.pozycje.reduce((s, p) => s + p.kosztNetto, 0))}</b></td>
                  <td />
                </tr>,
                ...g.pozycje.map((p, i) => (
                  <tr key={g.k + i} style={p.jestBledemWyceny ? { color: "var(--danger)" } : undefined}>
                    <td style={{ paddingLeft: 22 }}>{p.nazwa}</td>
                    <td className="r num">{mm(p.ilosc)}</td>
                    <td>{p.jednostka}</td>
                    <td className="r num">{zl(p.cenaJednostkowaNetto)}</td>
                    <td className="r num">{zl(p.kosztNetto)}</td>
                    <td className="muted" style={{ fontSize: 12, maxWidth: 380 }}>{p.uwagi}</td>
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
        <div className="card-b">
          <table className="t" style={{ maxWidth: 440, marginLeft: "auto" }}>
            <tbody>
              <Suma l="Koszt bazowy netto" v={w.kosztBazowyNetto} />
              <Suma l="Zapas kosztowy" v={w.zapasKosztowyKwota} />
              <Suma l="Narzut" v={w.narzutKwota} />
              <Suma l="Marża" v={w.marzaKwota} />
              <Suma l="Cena netto" v={w.cenaNetto} b />
              <Suma l="VAT" v={w.vatKwota} />
              <Suma l="Cena brutto" v={w.cenaBrutto} b />
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h2>Ilości przyjęte do wyceny</h2></div>
        <div className="card-b stats">
          <S l="modułów" v={pw.liczbaModulow} />
          <S l="płyty m²" v={mm(pw.powierzchniaPlytM2)} />
          <S l="fronty m²" v={mm(pw.powierzchniaFrontowM2)} />
          <S l="blat mb" v={mm(pw.metryBiezaceBlatu)} />
          <S l="szuflad" v={pw.liczbaSzuflad} />
          <S l="zawiasów" v={pw.liczbaZawiasow} />
          <S l="obrzeże mb" v={mm(pw.metryKrawedziBanding)} />
          <S l="h produkcji" v={mm(pw.liczbaGodzinProdukcji)} />
          <S l="h montażu" v={mm(pw.liczbaGodzinMontazu)} />
        </div>
      </div>
    </>
  );
}

function Suma({ l, v, b }: { l: string; v: number; b?: boolean }) {
  return (
    <tr>
      <td>{b ? <b>{l}</b> : l}</td>
      <td className="r num">{b ? <b>{zl(v)}</b> : zl(v)}</td>
    </tr>
  );
}

function S({ l, v }: { l: string; v: string | number }) {
  return (
    <div className="stat">
      <b>{v}</b>
      <span>{l}</span>
    </div>
  );
}
