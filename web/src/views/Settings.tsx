import { useEffect, useState } from "react";
import { api, type UstawieniaStolarni } from "../api";

type Sekcja = keyof UstawieniaStolarni;

const POLA: { sekcja: Sekcja; tytul: string; pola: [string, string][] }[] = [
  {
    sekcja: "finanse",
    tytul: "Finanse",
    pola: [
      ["stawkaRoboczogodziny", "Stawka roboczogodziny [zł/h]"],
      ["kosztMontazuZaGodzine", "Montaż [zł/h]"],
      ["kosztTransportuBazowy", "Transport [zł/kurs]"],
      ["marzaProcent", "Marża [%]"],
      ["narzutProcent", "Narzut [%]"],
      ["zapasKosztowyProcent", "Zapas kosztowy [%]"],
      ["vatProcent", "VAT [%]"],
      ["minimalnaWartoscZlecenia", "Minimalne zlecenie netto [zł]"],
    ],
  },
  {
    sekcja: "konstrukcja",
    tytul: "Konstrukcja",
    pola: [
      ["gruboscPlytyKorpusuMM", "Płyta korpusu [mm]"],
      ["gruboscPlytySzufladMM", "Płyta szuflad [mm]"],
      ["gruboscPlecHDFMM", "Plecy HDF [mm]"],
      ["odsunieciePlecMM", "Odsunięcie pleców [mm]"],
      ["szczelinaFrontowMM", "Szczelina frontów [mm]"],
      ["gruboscFrontuMM", "Grubość frontu [mm]"],
      ["wysokoscNogiMM", "Wysokość nóg / cokołu [mm]"],
      ["gruboscBlatuMM", "Grubość blatu [mm]"],
      ["glebokoscBlatuMM", "Głębokość blatu [mm]"],
    ],
  },
  {
    sekcja: "rozkroj",
    tytul: "Rozkrój",
    pola: [
      ["dlugoscArkuszaMM", "Długość arkusza [mm]"],
      ["szerokoscArkuszaMM", "Szerokość arkusza [mm]"],
      ["rzazPilyMM", "Rzaz piły [mm]"],
      ["marginesArkuszaMM", "Margines (obrzynanie) [mm]"],
    ],
  },
  {
    sekcja: "okleinowanie",
    tytul: "Okleinowanie",
    pola: [
      ["naddatekNaKrawedzMM", "Naddatek na krawędź [mm]"],
      ["zapasProcent", "Zapas obrzeża [%]"],
    ],
  },
];

export function Settings() {
  const [u, setU] = useState<UstawieniaStolarni | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    api.ustawienia().then(setU);
  }, []);
  if (!u) return <div className="page muted">Wczytywanie…</div>;

  const zapisz = async (sekcja: Sekcja, klucz: string, wartosc: number | boolean | string) => {
    const r = await api.zmienUstawienia({ [sekcja]: { [klucz]: wartosc } });
    setU(r.ustawienia);
    setInfo(r.ostrzezenia.length ? r.ostrzezenia.join(" ") : "Zapisano.");
  };

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="row">
        <h1>Ustawienia stolarni</h1>
        <span className="spacer" />
        {info && <span className="muted">{info}</span>}
      </div>
      {POLA.map(({ sekcja, tytul, pola }) => (
        <div key={sekcja} className="card">
          <div className="card-h"><h2>{tytul}</h2></div>
          <div className="card-b grid3">
            {pola.map(([k, l]) => (
              <Pole key={k} label={l} value={(u[sekcja] as unknown as Record<string, number>)[k]} onSave={(v) => zapisz(sekcja, k, v)} />
            ))}
            {sekcja === "rozkroj" && (
              <label className="check">
                <input type="checkbox" checked={u.rozkroj.uwzgledniajKierunekDekoru} onChange={(e) => zapisz("rozkroj", "uwzgledniajKierunekDekoru", e.target.checked)} />
                Uwzględniaj kierunek dekoru
              </label>
            )}
          </div>
        </div>
      ))}
      <div className="card">
        <div className="card-h"><h2>Dane firmy</h2></div>
        <div className="card-b grid3">
          {(Object.keys(u.daneFirmy) as (keyof typeof u.daneFirmy)[]).map((k) => (
            <div key={k} className="field">
              <label>{k}</label>
              <input className="input" defaultValue={u.daneFirmy[k]} onBlur={(e) => e.target.value !== u.daneFirmy[k] && zapisz("daneFirmy", k, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pole({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <div className="field">
      <label>{label}</label>
      <input
        className="input num"
        inputMode="decimal"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = Number(v.replace(",", "."));
          if (Number.isFinite(n) && n !== value) onSave(n);
          else setV(String(value));
        }}
      />
    </div>
  );
}
