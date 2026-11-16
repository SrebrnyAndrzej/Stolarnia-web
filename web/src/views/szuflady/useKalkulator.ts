import { useEffect, useState } from "react";
import type { WynikPrzelicznika } from "../../../../src/core/catalog/drawers";
import type {
  FrontZaDrzwiami,
  MontazSzuflad,
} from "../../../../src/core/kalkulator-szuflad";
import {
  bledyFormularza,
  parametryKalkulatora,
  type FormularzSzuflad,
  frontSzer,
} from "./model";
import {
  drawerSession,
  restoreDrawerSession,
  serializeDrawerSession,
} from "./persistence";

export interface SystemSzuflady {
  id: string;
  producent: string;
  system: string;
  grubosc: number;
  mocowanieFrontuMinMM?: number;
  warianty: { wariant: string; plecyWys: number }[];
}
export interface OdpowiedzKalkulatora {
  LW: number;
  NL: number;
  wyniki: WynikPrzelicznika[];
  montaz?: MontazSzuflad;
  zaDrzwiami?: FrontZaDrzwiami;
}
function wczytaj(session: ReturnType<typeof drawerSession>) {
  try {
    return restoreDrawerSession(localStorage.getItem(session.key), session);
  } catch {
    return { ...session.defaults };
  }
}

export function useKalkulator(
  demo = false,
  initialValues?: Partial<FormularzSzuflad>,
  sourceKey = "",
) {
  const prefix = demo ? "/api/demo" : "/api";
  const [session] = useState(() => drawerSession(initialValues, sourceKey));
  const [form, setForm] = useState(() => wczytaj(session));
  const [systemy, setSystemy] = useState<SystemSzuflady[]>([]);
  const [bladKatalogu, setBladKatalogu] = useState("");
  const [blad, setBlad] = useState("");
  const [liczenie, setLiczenie] = useState(true);
  const [retry, setRetry] = useState(0);
  const [pamiec, setPamiec] = useState(false);
  const [wynik, setWynik] = useState<{
    query: string;
    dane: OdpowiedzKalkulatora;
  } | null>(null);
  const minimum = systemy.find(
    (s) => s.id === form.system,
  )?.mocowanieFrontuMinMM;
  const query = parametryKalkulatora(form, minimum);
  const errors = bledyFormularza(form, minimum);

  useEffect(() => {
    try {
      localStorage.setItem(session.key, serializeDrawerSession(form, session));
      setPamiec(true);
    } catch {
      setPamiec(false);
    }
  }, [form, session]);

  useEffect(() => {
    const c = new AbortController();
    const limit = setTimeout(() => {
      if (!c.signal.aborted) {
        setBladKatalogu(
          "Brak odpowiedzi katalogu. Sprawdź połączenie i ponów.",
        );
        c.abort();
      }
    }, 15000);
    setBladKatalogu("");
    fetch(`${prefix}/systemy-szuflad`, { signal: c.signal })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403)
          window.dispatchEvent(new Event("pan-stolarz-session-expired"));
        if (!r.ok) throw new Error("Nie udało się pobrać systemów szuflad.");
        return r.json() as Promise<SystemSzuflady[]>;
      })
      .then((dane) => {
        if (!c.signal.aborted) setSystemy(dane);
      })
      .catch((e: Error) => {
        if (!c.signal.aborted) setBladKatalogu(e.message);
      })
      .finally(() => clearTimeout(limit));
    return () => {
      clearTimeout(limit);
      c.abort();
    };
  }, [retry, prefix]);

  useEffect(() => {
    const c = new AbortController();
    let limit: ReturnType<typeof setTimeout> | undefined;
    setBlad("");
    if (query === null) {
      setLiczenie(false);
      return () => c.abort();
    }
    setLiczenie(true);
    const t = setTimeout(async () => {
      limit = setTimeout(() => {
        if (!c.signal.aborted) {
          setBlad(
            "Brak odpowiedzi serwera. Sprawdź połączenie i spróbuj ponownie.",
          );
          setLiczenie(false);
          c.abort();
        }
      }, 15000);
      try {
        const r = await fetch(`${prefix}/przelicznik-szuflad?${query}`, {
          signal: c.signal,
        });
        if (r.status === 401 || r.status === 403)
          window.dispatchEvent(new Event("pan-stolarz-session-expired"));
        const dane = await r.json();
        if (!r.ok)
          throw new Error(dane.blad ?? "Nie udało się przeliczyć szuflady.");
        if (!c.signal.aborted) setWynik({ query, dane });
      } catch (e) {
        if (!c.signal.aborted) setBlad((e as Error).message);
      } finally {
        clearTimeout(limit);
        if (!c.signal.aborted) setLiczenie(false);
      }
    }, 300);
    return () => {
      c.abort();
      clearTimeout(t);
      clearTimeout(limit);
    };
  }, [query, retry, prefix]);

  const ustaw = <K extends keyof FormularzSzuflad>(
    key: K,
    value: FormularzSzuflad[K],
  ) => {
    setForm((f) =>
      key === "system"
        ? { ...f, system: String(value), wariant: "", scianka: "drewniana" }
        : key === "frontWewSzerAuto" && value === false
          ? {
              ...f,
              frontWewSzerAuto: false,
              frontWewSzer: f.frontWewSzer.trim()
                ? f.frontWewSzer
                : frontSzer(f),
            }
          : { ...f, [key]: value },
    );
  };
  return {
    form,
    ustaw,
    errors,
    systemy,
    bladKatalogu,
    blad,
    pamiec,
    liczenie: liczenie && query !== null,
    dane: !blad && wynik?.query === query ? wynik.dane : null,
    ponow: () => setRetry((r) => r + 1),
    reset: () => setForm({ ...session.defaults }),
  };
}
