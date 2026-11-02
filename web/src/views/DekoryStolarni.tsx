import { useEffect, useState } from "react";
import { api } from "../api";
import { DecorPicker, type Decor } from "../v2/quick/parts";
import "../v2/quick/quick.css";

// Ustawienia → „Dekory stolarni”: krótka lista, od której startuje galeria szybkiego projektu
// (OCENA-kreatora §4, zmiana 6). Pusta lista = kreator pokazuje najczęściej używane dekory z projektów.
export function DekoryStolarni() {
  const [decors, setDecors] = useState<Decor[] | null>(null);
  const [lista, setLista] = useState<{ zrodlo: string; klucze: string[] } | null>(null);
  const [wybor, setWybor] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  useEffect(() => {
    api.dekoryStolarni().then(setLista).catch((e: Error) => setBlad(e.message));
    api.dekoryGaleria().then((d) => setDecors(d as Decor[])).catch((e: Error) => setBlad(e.message));
  }, []);

  const zapisz = async (klucze: string[]) => {
    setBlad(null);
    try {
      setLista(await api.ustawDekoryStolarni(klucze));
    } catch (e) {
      setBlad((e as Error).message);
    }
  };
  const wlasne = lista?.zrodlo === "stolarnia" ? lista.klucze : [];
  const poKluczu = new Map((decors ?? []).map((d) => [d.key, d]));

  return (
    <div className="card">
      <div className="card-h">
        <h2>Dekory stolarni (szybki projekt)</h2>
      </div>
      <div className="card-b" style={{ display: "grid", gap: 12 }}>
        <p className="muted" style={{ margin: 0 }}>
          Od tych dekorów zaczyna się galeria w kreatorze przy kliencie; pełna lista jest pod „Pokaż wszystkie”.
          {lista?.zrodlo === "projekty" && " Lista jest pusta, więc kreator pokazuje teraz najczęściej używane dekory z projektów."}
        </p>
        {blad && <p className="error">{blad}</p>}
        <div className="qp-shots" aria-label="Dekory stolarni">
          {wlasne.map((k) => {
            const d = poKluczu.get(k);
            return (
              <figure key={k}>
                {d && <img src={d.obraz} alt="" />}
                <b>{d ? `${d.manufacturer} ${d.id}` : k}</b>
                <span className="muted">{d?.name}</span>
                <button type="button" className="btn" onClick={() => void zapisz(wlasne.filter((x) => x !== k))}>
                  Usuń
                </button>
              </figure>
            );
          })}
        </div>
        <div className="row">
          <button type="button" className="btn primary" onClick={() => setWybor(true)} disabled={!decors || wlasne.length >= 60}>
            Dodaj dekor
          </button>
          {wlasne.length > 0 && <span className="muted">{wlasne.length} / 60</span>}
        </div>
      </div>
      {wybor && decors && (
        <DecorPicker
          decors={decors}
          role="front"
          title="dodaj do dekorów stolarni"
          onClose={() => setWybor(false)}
          onPick={(d) => {
            setWybor(false);
            if (!wlasne.includes(d.key)) void zapisz([...wlasne, d.key]);
          }}
        />
      )}
    </div>
  );
}
