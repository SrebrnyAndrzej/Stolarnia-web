import { useState } from "react";
import { mm, zl, type Analiza } from "../api";

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

export function Quote({ analiza }: { analiza: Analiza }) {
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
