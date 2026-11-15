import { useEffect, useState, useRef } from "react";
import { request } from "../v2/api";
import { useResource } from "../v2/useResource";
import { Feedback } from "../v2/ui";
import { DecorPicker, type Decor } from "../v2/quick/parts";
import "../v2/quick/quick.css";

// Ustawienia → „Dekory stolarni”: krótka lista, od której startuje galeria szybkiego projektu
// (OCENA-kreatora §4, zmiana 6). Pusta lista = kreator pokazuje najczęściej używane dekory z projektów.
export function DekoryStolarni() {
  type List = { zrodlo: string; klucze: string[] };
  const catalog = useResource<Decor[]>("/api/dekory"),
    initial = useResource<List>("/api/dekory-stolarni");
  const decors = catalog.data;
  const [saved, setLista] = useState<List | null>(null);
  const lista = saved ?? initial.data;
  const [wybor, setWybor] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const operation = useRef<AbortController | null>(null);
  useEffect(() => () => operation.current?.abort(), []);

  const zapisz = async (klucze: string[]) => {
    if (busy || !lista) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setBlad(null);
    try {
      const result = await request<List>("/api/dekory-stolarni", {
        method: "PUT",
        signal: controller.signal,
        body: JSON.stringify({ klucze }),
      });
      if (!controller.signal.aborted) setLista(result);
    } catch (e) {
      if (!controller.signal.aborted) setBlad((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  const wlasne = lista?.zrodlo === "stolarnia" ? lista.klucze : [];
  const poKluczu = new Map((decors ?? []).map((d) => [d.key, d]));

  return (
    <div className="card" data-testid="workshop-decors">
      <div className="card-h">
        <h2>Dekory stolarni (szybki projekt)</h2>
      </div>
      <div className="card-b" style={{ display: "grid", gap: 12 }}>
        <p className="muted" style={{ margin: 0 }}>
          Od tych dekorów zaczyna się galeria w kreatorze przy kliencie; pełna
          lista jest pod „Pokaż wszystkie”.
          {lista?.zrodlo === "projekty" &&
            " Lista jest pusta, więc kreator pokazuje teraz najczęściej używane dekory z projektów."}
        </p>
        {(catalog.busy || initial.busy || busy) && (
          <p role="status">
            {busy ? "Zapisywanie dekorów…" : "Wczytywanie dekorów…"}
          </p>
        )}
        {(catalog.error || initial.error) && (
          <Feedback
            retry={() => {
              catalog.retry();
              initial.retry();
            }}
          >
            {catalog.error || initial.error}
          </Feedback>
        )}
        {blad && <Feedback>{blad}</Feedback>}
        <div className="qp-shots" aria-label="Dekory stolarni">
          {wlasne.map((k) => {
            const d = poKluczu.get(k);
            return (
              <figure key={k}>
                {d && <img src={d.obraz} alt="" />}
                <b>{d ? `${d.manufacturer} ${d.id}` : k}</b>
                <span className="muted">{d?.name}</span>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  aria-label={`Usuń dekor ${d?.name ?? k}`}
                  onClick={() => void zapisz(wlasne.filter((x) => x !== k))}
                >
                  Usuń
                </button>
              </figure>
            );
          })}
        </div>
        <div className="row">
          <button
            type="button"
            className="btn primary"
            onClick={() => setWybor(true)}
            disabled={busy || !lista || !decors || wlasne.length >= 60}
          >
            Dodaj dekor
          </button>
          {wlasne.length > 0 && (
            <span className="muted">{wlasne.length} / 60</span>
          )}
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
