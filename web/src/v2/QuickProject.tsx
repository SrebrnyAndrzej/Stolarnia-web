import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Analiza,
  Material,
  OkuciaProjektu,
  OpcjeOkucProjektu,
  Projekt,
  RolaStylu,
  StylPomieszczenia,
  WyborMaterialu,
  WynikSzybkiegoUkladu,
  WynikStylu,
  ZadanieSzybkiegoUkladu,
} from "../api";
import { currency, request, type Principal } from "./api";
import {
  Choice,
  DecorPicker,
  Elevation,
  Field,
  HardwareGroup,
  Legend,
  MissingData,
  Notes,
  NumField,
  PlanView,
  type PlanMarker,
  variantInside,
  ROLES,
  ShapeIcon,
  mm,
  num,
  type Decor,
  type Kind,
} from "./quick/parts";
import "./quick/quick.css";

// Szybki projekt kuchni przy kliencie (tablet, dotyk): układ → podgląd → styl → okucia → wycena.
// Cała logika (układ, styl, okucia, ceny) jest w silniku; ten widok zbiera wybory i pokazuje wyniki.
// Kontrakt API: docs/SZYBKI-PROJEKT.md. Uwierzytelnianie: ciasteczko sesji v2 (klient ./api).

const Widok3D = lazy(() =>
  import("../views/Widok3D").then((m) => ({ default: m.Widok3D })),
);

type Step = "uklad" | "podglad" | "styl" | "okucia" | "wycena";
const STEPS: { id: Step; name: string }[] = [
  { id: "uklad", name: "Układ" },
  { id: "podglad", name: "Podgląd" },
  { id: "styl", name: "Styl" },
  { id: "okucia", name: "Okucia" },
  { id: "wycena", name: "Wycena" },
];
type Fridge = "slupek" | "wolnostojaca" | "brak";
type PicksMap = Partial<Record<RolaStylu, Decor>>;
type FixedPoint = "zlew" | "plyta" | "lodowka";
type FixedPos = { wall: number | null; from: string };
const FIXED: { id: FixedPoint; name: string; short: string; widthMM: number }[] = [
  { id: "zlew", name: "Zlew (przyłącze wody), razem ze zmywarką", short: "Z", widthMM: 600 },
  { id: "plyta", name: "Płyta (gaz / 400 V)", short: "P", widthMM: 600 },
  { id: "lodowka", name: "Lodówka", short: "L", widthMM: 600 },
];

const post = <T,>(url: string, body: unknown) =>
  request<T>(url, { method: "POST", body: JSON.stringify(body) });

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="qp-note warn" role="alert">
        Nie udało się uruchomić podglądu 3D na tym urządzeniu (brak WebGL). Rzut
        i wycena działają normalnie.
      </div>
    ) : (
      this.props.children
    );
  }
}

export function QuickProject({
  person,
  projectId,
}: {
  person: Principal;
  projectId?: string;
}) {
  const isOwner = person.role === "owner";
  // Tryb „przy kliencie” (domyślnie włączony): ukrywa koszty i ceny zakupu także właścicielowi.
  const [clientMode, setClientMode] = useState(true);
  const [id, setId] = useState<string | undefined>(projectId);
  const [step, setStep] = useState<Step>("uklad");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(!!projectId);

  // krok 1: układ
  const [name, setName] = useState("Kuchnia");
  const [client, setClient] = useState("");
  const [kind, setKind] = useState<Kind>("L");
  const [lengths, setLengths] = useState(["3000", "2400", "2400"]);
  const [height, setHeight] = useState("2600");
  const [sink, setSink] = useState(true);
  const [hob, setHob] = useState(true);
  const [fridge, setFridge] = useState<Fridge>("slupek");
  const [dishwasher, setDishwasher] = useState<"brak" | "450" | "600">("600");
  const [ovenTower, setOvenTower] = useState(false);
  const [hanging, setHanging] = useState(true);
  const [corner, setCorner] = useState<"slepa" | "L">("slepa");
  // Położenia punktów stałych (opcja B: pola liczbowe). wall = null → silnik wybiera sam.
  const [fixedPos, setFixedPos] = useState<Record<FixedPoint, FixedPos>>({
    zlew: { wall: null, from: "" },
    plyta: { wall: null, from: "" },
    lodowka: { wall: null, from: "" },
  });
  const [windows, setWindows] = useState<{ wall: number; from: string; width: string }[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  // krok 2: podgląd
  const [preview, setPreview] = useState<WynikSzybkiegoUkladu | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [applied, setApplied] = useState(false);

  // krok 3: styl
  const [decors, setDecors] = useState<Decor[] | null>(null);
  const [picks, setPicks] = useState<PicksMap>({});
  const [openRole, setOpenRole] = useState<RolaStylu | null>(null);
  const [styleResult, setStyleResult] = useState<WynikStylu | null>(null);
  const [current, setCurrent] = useState<StylPomieszczenia | null>(null);
  const [entries, setEntries] = useState<Record<string, string>>({});

  // krok 4: okucia
  const [options, setOptions] = useState<OpcjeOkucProjektu | null>(null);
  const [hardware, setHardware] = useState<OkuciaProjektu>({});
  const [hardwareWarnings, setHardwareWarnings] = useState<string[]>([]);

  // krok 5: wycena
  const [analysis, setAnalysis] = useState<Analiza | null>(null);
  const [variant, setVariant] = useState("standard");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [show3D, setShow3D] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  // Stała tożsamość mapy: nowa Map przy każdym renderze przebudowywała całą scenę 3D (Widok3D zależy od matMap).
  const matMap = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );

  const top = useRef<HTMLDivElement>(null);
  const goTo = (s: Step) => {
    setStep(s);
    setError(null);
    setTimeout(() => top.current?.scrollIntoView({ block: "start" }), 0);
  };
  const wallCount = kind === "I" ? 1 : kind === "L" ? 2 : 3;

  const loadStyle = useCallback(async (pid: string) => {
    try {
      setCurrent(await request<StylPomieszczenia>(`/api/projekty/${pid}/styl`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // Ponowne wejście: wymiary, okucia i zapisany styl wracają z serwera.
  useEffect(() => {
    if (!projectId) return;
    const c = new AbortController();
    request<Analiza>(`/api/projekty/${projectId}/analiza`, { signal: c.signal })
      .then((a) => {
        if (c.signal.aborted) return;
        setAnalysis(a);
        setName(a.projekt.nazwa);
        setClient(a.projekt.klient?.nazwa ?? "");
        const walls =
          a.projekt.pomieszczenia[0]?.sciany.filter((s) => !s.wirtualna) ?? [];
        if (walls.length) {
          setKind(walls.length >= 3 ? "U" : walls.length === 2 ? "L" : "I");
          setLengths(
            walls
              .slice(0, 3)
              .map((s) => String(Math.round(s.dlugoscMM)))
              .concat(["2400", "2400"])
              .slice(0, 3),
          );
          setHeight(String(Math.round(walls[0].wysokoscMM)));
        }
        if (a.projekt.okucia) setHardware(a.projekt.okucia);
        const hasModules = a.projekt.moduly.length > 0;
        setApplied(hasModules);
        if (hasModules) setStep("styl");
        return loadStyle(projectId);
      })
      .catch((e) => !c.signal.aborted && setError((e as Error).message))
      .finally(() => !c.signal.aborted && setRestoring(false));
    return () => c.abort();
  }, [projectId, loadStyle]);

  // Dane kroków ładowane przy wejściu.
  useEffect(() => {
    const c = new AbortController();
    const fail = (e: unknown) =>
      !c.signal.aborted && setError((e as Error).message);
    if (step === "styl" && !decors)
      request<Decor[]>("/api/dekory", { signal: c.signal })
        .then(setDecors)
        .catch((e) =>
          fail(
            new Error(
              `Nie udało się wczytać galerii dekorów: ${(e as Error).message}`,
            ),
          ),
        );
    if (step === "okucia" && !options)
      request<OpcjeOkucProjektu>("/api/okucia-projektu/opcje", {
        signal: c.signal,
      })
        .then(setOptions)
        .catch(fail);
    if (step === "wycena") {
      if (id)
        request<Analiza>(`/api/projekty/${id}/analiza`, { signal: c.signal })
          .then(setAnalysis)
          .catch(fail);
      request<Material[]>("/api/materialy", { signal: c.signal })
        .then(setMaterials)
        .catch(() => undefined);
    }
    return () => c.abort();
  }, [step, id, decors, options]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const planMarkers: PlanMarker[] = [
    ...FIXED.filter(
      (f) =>
        ((f.id === "zlew" && sink) || (f.id === "plyta" && hob) || (f.id === "lodowka" && fridge !== "brak")) &&
        fixedPos[f.id].from.trim() !== "",
    ).map((f) => ({
      id: f.id,
      kind: f.id,
      label: f.short,
      wall: Math.min(fixedPos[f.id].wall ?? 0, wallCount - 1),
      xMM: num(fixedPos[f.id].from),
      // Zlew stoi w jednym bloku ze zmywarką — tak liczy silnik (uklad.ts: skład zlewu).
      widthMM: f.id === "zlew" && dishwasher !== "brak" ? f.widthMM + num(dishwasher) : f.widthMM,
    })),
    ...windows
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => w.wall < wallCount && num(w.width) > 0)
      .map(({ w, i }) => ({
        id: `okno${i}`,
        kind: "okno" as const,
        label: `okno ${i + 1}`,
        wall: w.wall,
        xMM: num(w.from),
        widthMM: num(w.width),
      })),
  ];
  const placed = (k: FixedPoint) => {
    const f = fixedPos[k];
    const wall = f.wall !== null && f.wall < wallCount ? f.wall : f.from ? 0 : null;
    if (wall === null) return {};
    return f.from.trim() ? { sciana: wall, xMM: num(f.from) } : { sciana: wall };
  };
  const buildRequest = (): ZadanieSzybkiegoUkladu => ({
    typ: kind,
    dlugosciScianMM: lengths.slice(0, wallCount).map(num),
    wysokoscMM: num(height),
    zlew: sink ? placed("zlew") : null,
    zmywarka:
      sink && dishwasher !== "brak"
        ? { szerokoscMM: dishwasher === "450" ? 450 : 600 }
        : null,
    plyta: hob ? placed("plyta") : null,
    lodowka: fridge === "brak" ? null : { rodzaj: fridge, ...placed("lodowka") },
    przerwyWiszacych: windows
      .filter((w) => w.wall < wallCount && num(w.width) > 0)
      .map((w) => ({ sciana: w.wall, odMM: num(w.from), doMM: num(w.from) + num(w.width) })),
    slupki: ovenTower ? ["tall-oven-600"] : [],
    wiszace: hanging,
    okap: hanging ? "szafka" : "brak",
    naroznik: kind === "I" ? undefined : corner,
    dolne: "drawers",
  });

  const validate = (): string | null => {
    for (let i = 0; i < wallCount; i++)
      if (num(lengths[i]) < 1000)
        return `Ściana ${i + 1}: podaj długość w mm (min. 1000).`;
    if (num(height) < 2000)
      return "Podaj wysokość pomieszczenia w mm (min. 2000).";
    for (const [i, w] of windows.entries())
      if (w.wall < wallCount && num(w.from) + num(w.width) > num(lengths[w.wall]))
        return `Okno ${i + 1} wychodzi poza ścianę ${w.wall + 1}.`;
    return null;
  };

  const ensureProject = async (): Promise<string> => {
    if (id) return id;
    const p = await post<Projekt>("/api/projekty", {
      nazwa: name.trim() || "Kuchnia",
      klient: { nazwa: client.trim() },
      sciany: lengths.slice(0, wallCount).map((d) => ({ dlugoscMM: num(d) })),
    });
    setId(p.id);
    history.replaceState(null, "", `#/szybki/${p.id}`); // bez hashchange: kreator zostaje na ekranie
    return p.id;
  };

  const showPreview = () => {
    const problem = validate();
    setFieldErrors({});
    if (problem) return setError(problem);
    void run("Układam szafki…", async () => {
      const pid = await ensureProject();
      // Podgląd niczego nie zapisuje; liczba usuniętych modułów mówi, czy trzeba potwierdzenia.
      let r: WynikSzybkiegoUkladu;
      try {
        r = await post<WynikSzybkiegoUkladu>(
          `/api/projekty/${pid}/szybki-uklad`,
          { ...buildRequest(), zastap: true, podglad: true },
        );
      } catch (e) {
        // Komunikat silnika o braku miejsca trafia przy pole elementu, którego dotyczy.
        const msg = (e as Error).message;
        const hit = (["zlew", "plyta", "lodowka"] as FixedPoint[]).filter((k) => new RegExp(`(^|[^a-ząćęłńóśźż])${k}($|[^a-ząćęłńóśźż])`, "i").test(msg));
        if (hit.length) {
          setFieldErrors(Object.fromEntries(hit.map((k) => [k, msg])));
          document.getElementById(`qp-pos-${hit[0]}`)?.focus();
          throw new Error("Silnik nie zmieścił punktów stałych — szczegóły przy polach położenia.");
        }
        throw e;
      }
      setPreview(r);
      setConfirmReplace(false);
      setApplied(false);
      goTo("podglad");
    });
  };

  const applyLayout = () => {
    if (!id || !preview) return;
    if (preview.usunieto > 0 && !confirmReplace) return setConfirmReplace(true);
    void run("Zapisuję układ…", async () => {
      const r = await post<WynikSzybkiegoUkladu>(
        `/api/projekty/${id}/szybki-uklad`,
        { ...buildRequest(), zastap: preview.usunieto > 0 },
      );
      setPreview(r);
      setApplied(true);
      setConfirmReplace(false);
      await loadStyle(id);
      goTo("styl");
    });
  };

  const choiceFor = (role: RolaStylu, d: Decor): WyborMaterialu => {
    const w: Record<string, unknown> = { dekor: d.key };
    const fields =
      role === "blat"
        ? ["gruboscMM", "glebokoscMM", "dlugoscMM"]
        : ["gruboscMM", "szerokoscArkuszaMM", "wysokoscArkuszaMM"];
    for (const f of fields) {
      const v = num(entries[`${role}.${f}`] ?? "");
      if (v > 0) w[f] = v;
    }
    const texture = entries[`${role}.struktura`];
    if (texture) w.struktura = texture;
    return w as unknown as WyborMaterialu;
  };

  const applyStyle = (onlyMissing: boolean) => {
    if (!id) return;
    const roles = ROLES.map((r) => r.rola).filter(
      (r) =>
        picks[r] &&
        (!onlyMissing || styleResult?.braki.some((b) => b.rola === r)),
    );
    if (!roles.length) return setError("Wybierz co najmniej jeden dekor.");
    void run("Ustawiam materiały…", async () => {
      const body: Partial<Record<RolaStylu, WyborMaterialu>> = {};
      for (const r of roles) body[r] = choiceFor(r, picks[r]!);
      const w = await post<WynikStylu>(`/api/projekty/${id}/styl`, body);
      setStyleResult((old) => {
        if (!onlyMissing || !old) return w;
        // Ponowienie dotyczyło tylko braków: zachowaj wcześniej ustawione role.
        return {
          ...w,
          ustawiono: { ...old.ustawiono, ...w.ustawiono },
          zrodla: [
            ...old.zrodla.filter((z) => !(z.rola in w.ustawiono)),
            ...w.zrodla,
          ],
          ostrzezenia: [...new Set([...old.ostrzezenia, ...w.ostrzezenia])],
        };
      });
      // Role ustawione w projekcie wracają z serwera (kafelek "zapisany"); wybory z brakami zostają do uzupełnienia.
      setPicks(
        (old) =>
          Object.fromEntries(
            Object.entries(old).filter(([r]) => !(r in w.ustawiono)),
          ) as PicksMap,
      );
      await loadStyle(id);
    });
  };

  const saveHardware = () => {
    if (!id) return;
    void run("Zapisuję okucia…", async () => {
      const clean = Object.fromEntries(
        Object.entries(hardware).filter(([, v]) => v),
      ) as OkuciaProjektu;
      const w = await request<{
        okucia: OkuciaProjektu | null;
        ostrzezenia: string[];
      }>(`/api/projekty/${id}/okucia`, {
        method: "PUT",
        body: JSON.stringify({
          okucia: Object.keys(clean).length ? clean : null,
        }),
      });
      setHardwareWarnings(w.ostrzezenia);
      goTo("wycena");
    });
  };

  const downloadPdf = async (wstepna = false) => {
    if (!id) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      const blob = await request<Blob>(
        `/api/projekty/${id}/oferta.pdf`,
        { method: "POST", body: JSON.stringify({ wariant: variant, ...(wstepna ? { wstepna: true } : {}) }) },
        "pdf",
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${wstepna ? "Propozycja wstępna" : "Oferta"} — ${name}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setPdfError((e as Error).message);
    } finally {
      setPdfBusy(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const maxStep = applied ? 4 : id ? 1 : 0;
  const closePicker = useCallback(() => setOpenRole(null), []);
  const pendingPicks = Object.keys(picks).length > 0;
  const roleTile = (rola: RolaStylu) => {
    const pick = picks[rola];
    const now = current?.[rola] ?? null;
    return { pick, now };
  };

  return (
    <div className="qp" ref={top}>
      <header className="qp-head">
        <div>
          <span className="qp-kicker">Szybki projekt kuchni</span>
          <h1>{id ? name : "Nowa kuchnia przy kliencie"}</h1>
        </div>
        <div className="qp-bar">
          {isOwner && (
            <button
              type="button"
              className="qp-btn secondary"
              aria-pressed={clientMode}
              onClick={() => setClientMode((x) => !x)}
              title="Ukrywa koszty netto i ceny zakupu okuć"
            >
              {clientMode ? "Przy kliencie: koszty ukryte" : "Koszty widoczne"}
            </button>
          )}
          {id && (
            <a className="qp-btn secondary" href={`#/p/${id}`}>
              Otwórz w projektancie
            </a>
          )}
        </div>
      </header>

      <ol className="qp-steps" aria-label="Kroki szybkiego projektu">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={`qp-step ${i < stepIndex ? "done" : ""}`}
              disabled={i > Math.max(maxStep, stepIndex)}
              aria-current={s.id === step ? "step" : undefined}
              aria-label={`Krok ${i + 1}: ${s.name}`}
              onClick={() => goTo(s.id)}
            >
              <span className="qp-step-n" aria-hidden>
                {i < stepIndex ? "✓" : i + 1}
              </span>
              <span className="qp-step-name">{s.name}</span>
            </button>
          </li>
        ))}
      </ol>

      {error && (
        <div className="qp-note error" role="alert">
          {error}
        </div>
      )}
      {(busy || restoring) && (
        <div className="qp-note" role="status">
          {busy ?? "Wczytuję projekt…"}
        </div>
      )}

      {step === "uklad" && (
        <section className="qp-card" aria-labelledby="qp-h-layout">
          <h2 id="qp-h-layout">Wymiary i punkty stałe</h2>
          <div className="qp-grid-2">
            <Field label="Nazwa projektu">
              <input
                className="qp-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!!id}
              />
            </Field>
            <Field label="Klient">
              <input
                className="qp-input"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Imię i nazwisko"
                disabled={!!id}
              />
            </Field>
          </div>

          <h3>Kształt kuchni</h3>
          <div className="qp-tiles">
            {(["I", "L", "U"] as Kind[]).map((t) => (
              <button
                key={t}
                type="button"
                className="qp-tile"
                aria-pressed={kind === t}
                onClick={() => setKind(t)}
              >
                <ShapeIcon kind={t} />
                <b>
                  {t === "I"
                    ? "Jedna ściana"
                    : t === "L"
                      ? "Kształt L"
                      : "Kształt U"}
                </b>
              </button>
            ))}
          </div>

          <h3>Wymiary [mm]</h3>
          <div className="qp-grid-auto">
            {Array.from({ length: wallCount }, (_, i) => (
              <NumField
                key={i}
                label={`Ściana ${i + 1}${kind !== "I" && i === 0 ? " (od lodówki)" : ""}`}
                value={lengths[i]}
                onChange={(v) =>
                  setLengths((d) => d.map((x, j) => (j === i ? v : x)))
                }
                step={100}
              />
            ))}
            <NumField
              label="Wysokość pomieszczenia"
              value={height}
              onChange={setHeight}
              step={50}
            />
          </div>

          <h3>Punkty stałe</h3>
          <div className="qp-grid-auto">
            <Choice
              label="Zlew"
              value={sink ? "tak" : "nie"}
              options={[
                ["tak", "Jest"],
                ["nie", "Brak"],
              ]}
              onChange={(v) => setSink(v === "tak")}
            />
            <Choice
              label="Płyta grzewcza"
              value={hob ? "tak" : "nie"}
              options={[
                ["tak", "Jest"],
                ["nie", "Brak"],
              ]}
              onChange={(v) => setHob(v === "tak")}
            />
            <Choice
              label="Lodówka"
              value={fridge}
              options={[
                ["slupek", "Zabudowana"],
                ["wolnostojaca", "Wolnostojąca"],
                ["brak", "Brak"],
              ]}
              onChange={(v) => setFridge(v as Fridge)}
            />
            <Choice
              label="Zmywarka"
              value={sink ? dishwasher : "brak"}
              options={[
                ["brak", "Brak"],
                ["450", "45 cm"],
                ["600", "60 cm"],
              ]}
              onChange={(v) => setDishwasher(v as "brak" | "450" | "600")}
              disabled={!sink}
              hint={!sink ? "Zmywarka stoi obok zlewu" : undefined}
            />
            <Choice
              label="Słupek z piekarnikiem"
              value={ovenTower ? "tak" : "nie"}
              options={[
                ["nie", "Nie"],
                ["tak", "Tak"],
              ]}
              onChange={(v) => setOvenTower(v === "tak")}
            />
            <Choice
              label="Szafki wiszące"
              value={hanging ? "tak" : "nie"}
              options={[
                ["tak", "Tak"],
                ["nie", "Nie"],
              ]}
              onChange={(v) => setHanging(v === "tak")}
            />
            {kind !== "I" && (
              <Choice
                label="Narożnik"
                value={corner}
                options={[
                  ["slepa", "Ślepy"],
                  ["L", "L"],
                ]}
                onChange={(v) => setCorner(v as "slepa" | "L")}
              />
            )}
          </div>
          <h3>Położenie na ścianach (opcjonalnie)</h3>
          <p className="qp-muted">
            Puste pole = silnik dobierze miejsce sam. Odległość mierzysz od
            punktu ● na rzucie (początek ściany) do lewej krawędzi elementu.
            Stuknij element na rzucie, żeby przejść do jego pola.
          </p>
          <PlanView
            kind={kind}
            lengths={lengths.map(num)}
            markers={planMarkers}
            onPick={(k) => document.getElementById(`qp-pos-${k}`)?.focus()}
          />
          {FIXED.filter(
            (f) =>
              (f.id === "zlew" && sink) ||
              (f.id === "plyta" && hob) ||
              (f.id === "lodowka" && fridge !== "brak"),
          ).map((f) => {
            const v = fixedPos[f.id];
            const set = (n: Partial<FixedPos>) =>
              setFixedPos((o) => ({ ...o, [f.id]: { ...o[f.id], ...n } }));
            return (
              <div className="qp-pos" key={f.id}>
                <span className="qp-pos-name">{f.name}</span>
                <Choice
                  label="Ściana"
                  value={v.wall === null || v.wall >= wallCount ? "auto" : String(v.wall)}
                  options={[
                    ["auto", "Auto"],
                    ...Array.from(
                      { length: wallCount },
                      (_, i) => [String(i), String(i + 1)] as [string, string],
                    ),
                  ]}
                  onChange={(x) => set({ wall: x === "auto" ? null : Number(x) })}
                />
                <Field label="Od ● [mm]">
                  <input
                    id={`qp-pos-${f.id}`}
                    className="qp-input"
                    inputMode="numeric"
                    placeholder="auto"
                    value={v.from}
                    aria-invalid={!!fieldErrors[f.id]}
                    onChange={(e) =>
                      set({
                        from: e.target.value.replace(/[^\d]/g, ""),
                        wall: v.wall ?? 0,
                      })
                    }
                  />
                </Field>
                {fieldErrors[f.id] && (
                  <p className="qp-field-error" role="alert">
                    {fieldErrors[f.id]}
                  </p>
                )}
              </div>
            );
          })}
          {windows.map((w, i) => (
            <div className="qp-pos" key={`okno${i}`}>
              <span className="qp-pos-name">Okno {i + 1}</span>
              <Choice
                label="Ściana"
                value={String(Math.min(w.wall, wallCount - 1))}
                options={Array.from(
                  { length: wallCount },
                  (_, j) => [String(j), String(j + 1)] as [string, string],
                )}
                onChange={(x) =>
                  setWindows((o) => o.map((y, j) => (j === i ? { ...y, wall: Number(x) } : y)))
                }
              />
              <div className="qp-grid-2">
                <Field label="Od ● [mm]">
                  <input
                    id={`qp-pos-okno${i}`}
                    className="qp-input"
                    inputMode="numeric"
                    value={w.from}
                    onChange={(e) =>
                      setWindows((o) =>
                        o.map((y, j) => (j === i ? { ...y, from: e.target.value.replace(/[^\d]/g, "") } : y)),
                      )
                    }
                  />
                </Field>
                <Field label="Szerokość [mm]">
                  <input
                    className="qp-input"
                    inputMode="numeric"
                    value={w.width}
                    onChange={(e) =>
                      setWindows((o) =>
                        o.map((y, j) => (j === i ? { ...y, width: e.target.value.replace(/[^\d]/g, "") } : y)),
                      )
                    }
                  />
                </Field>
              </div>
              <button
                type="button"
                className="qp-btn secondary"
                onClick={() => setWindows((o) => o.filter((_, j) => j !== i))}
              >
                Usuń okno
              </button>
            </div>
          ))}
          <div className="qp-bar">
            <button
              type="button"
              className="qp-btn secondary"
              onClick={() =>
                setWindows((o) => [...o, { wall: wallCount - 1 >= 1 ? 1 : 0, from: "1000", width: "1200" }])
              }
              disabled={windows.length >= 4}
            >
              + Okno (bez szafek wiszących nad nim)
            </button>
          </div>

          <p className="qp-muted">
            Układ proponuje silnik wg założeń ergonomii (blat między zlewem a
            płytą ≥ 600 mm, płyta ≥ 300 mm od narożnika). Szczegóły zobaczysz w
            podglądzie.
          </p>

          <div className="qp-bar">
            <span className="qp-spacer" />
            <button
              type="button"
              className="qp-btn"
              onClick={showPreview}
              disabled={!!busy || restoring}
            >
              Dalej: podgląd →
            </button>
          </div>
        </section>
      )}

      {step === "podglad" && preview && (
        <section className="qp-card" aria-labelledby="qp-h-preview">
          <h2 id="qp-h-preview">Podgląd układu</h2>
          <p className="qp-muted">
            Tak silnik ułożył szafki. Nic nie jest jeszcze zapisane. Sprawdź
            ostrzeżenia i zatwierdź.
          </p>
          <PlanView
            kind={kind}
            lengths={preview.sciany.map((s) => s.dlugoscMM)}
            walls={preview.sciany.map((s) => s.nazwa)}
            modules={preview.moduly
              .filter((m) => m.pozycjaYMM < 1000)
              .map((m) => ({
                wall: preview.sciany.findIndex((s) => s.id === m.scianaId),
                xMM: m.pozycjaXMM,
                widthMM: m.szerokoscMM,
                rola: m.rola,
              }))
              .filter((m) => m.wall >= 0)}
            markers={planMarkers.filter((k) => k.kind === "okno")}
          />
          {preview.sciany.map((s) => (
            <Elevation
              key={s.id}
              wall={s}
              modules={preview.moduly.filter((m) => m.scianaId === s.id)}
              reserves={preview.rezerwacje.filter((r) => r.scianaId === s.id)}
            />
          ))}
          <Legend modules={preview.moduly} />
          <Notes title="Uwaga" items={preview.ostrzezenia} />
          <Notes
            title="Założenia ergonomii (nie normy), potwierdź z klientem"
            items={preview.zalozenia}
            tone="info"
          />
          {preview.usunieto > 0 && (
            <div className="qp-note warn" role="alert">
              Na tych ścianach stoi już {preview.usunieto}{" "}
              {preview.usunieto === 1 ? "moduł" : "modułów"}. Zastosowanie
              układu je usunie.
              {confirmReplace && (
                <div className="qp-bar" style={{ marginTop: 10 }}>
                  <b>Zastąpić istniejące?</b>
                  <button
                    type="button"
                    className="qp-btn secondary"
                    onClick={() => setConfirmReplace(false)}
                  >
                    Nie
                  </button>
                  <button
                    type="button"
                    className="qp-btn danger"
                    onClick={applyLayout}
                    disabled={!!busy}
                  >
                    Tak, zastąp
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="qp-bar qp-sticky">
            <button
              type="button"
              className="qp-btn secondary"
              onClick={() => goTo("uklad")}
            >
              ← Zmień układ
            </button>
            <span className="qp-spacer" />
            {applied ? (
              <button
                type="button"
                className="qp-btn"
                onClick={() => goTo("styl")}
              >
                Dalej: styl →
              </button>
            ) : (
              !confirmReplace && (
                <button
                  type="button"
                  className="qp-btn"
                  onClick={applyLayout}
                  disabled={!!busy}
                >
                  Zastosuj układ
                </button>
              )
            )}
          </div>
        </section>
      )}

      {step === "podglad" && !preview && (
        // Po ponownym wejściu w projekt podgląd nie jest w pamięci: zamiast pustej karty mówimy, co dalej.
        <section className="qp-card" aria-labelledby="qp-h-preview-none">
          <h2 id="qp-h-preview-none">Podgląd układu</h2>
          <p className="qp-muted">
            {applied
              ? "Układ jest już zapisany w projekcie. Aby ułożyć szafki od nowa, wróć do kroku Układ i kliknij „Dalej: podgląd”."
              : "Podgląd jeszcze nie powstał. Wróć do kroku Układ i kliknij „Dalej: podgląd”."}
          </p>
          <div className="qp-bar">
            <button
              type="button"
              className="qp-btn secondary"
              onClick={() => goTo("uklad")}
            >
              ← Zmień układ
            </button>
            <span className="qp-spacer" />
            {applied && (
              <button
                type="button"
                className="qp-btn"
                onClick={() => goTo("styl")}
              >
                Dalej: styl →
              </button>
            )}
          </div>
        </section>
      )}

      {step === "styl" && (
        <section className="qp-card" aria-labelledby="qp-h-style">
          <h2 id="qp-h-style">Dekory</h2>
          <p className="qp-muted">
            Wybierz z galerii{decors ? ` ${decors.length} dekorów` : " dekorów"}{" "}
            (Egger, Kronospan). Grubości i formaty
            Egger pochodzą z artykułów producenta; dla pozostałych wpiszesz je
            sam.
          </p>
          <div className="qp-tiles">
            {ROLES.map(({ rola, nazwa, opis }) => {
              const { pick, now } = roleTile(rola);
              const image = pick?.obraz ?? now?.zdjecieURL;
              return (
                <button
                  key={rola}
                  type="button"
                  className="qp-tile"
                  aria-pressed={!!pick || !!now}
                  onClick={() => setOpenRole(rola)}
                >
                  {image ? (
                    <img className="qp-swatch" src={image} alt="" />
                  ) : (
                    <span className="qp-swatch empty">＋</span>
                  )}
                  <b>{nazwa}</b>
                  <span className="qp-muted">
                    {pick
                      ? `${pick.manufacturer} ${pick.id} · ${pick.name}`
                      : now
                        ? `${now.nazwa ?? "Zapisany materiał"}${now.gruboscMM && !(now.nazwa ?? "").includes(`${mm(now.gruboscMM)} mm`) ? ` · ${mm(now.gruboscMM)} mm` : ""}`
                        : opis}
                  </span>
                  {pick && now && (
                    <span className="qp-tag warn">zmiana niezapisana</span>
                  )}
                  {!pick && now && now.maCene === false && (
                    <span className="qp-tag error">Brak ceny zakupu</span>
                  )}
                  {!pick && now && (
                    <span className="qp-tag">zapisany w projekcie</span>
                  )}
                </button>
              );
            })}
          </div>
          {current && current.modulyZWlasnymMaterialem > 0 && (
            <p className="qp-muted">
              {current.modulyZWlasnymMaterialem} modułów ma własny materiał i
              zachowa go przy zmianie stylu.
            </p>
          )}

          {styleResult && (
            <>
              {Object.keys(styleResult.ustawiono).length > 0 && (
                <div className="qp-note ok">
                  Ustawiono:{" "}
                  {ROLES.filter((r) => styleResult.ustawiono[r.rola])
                    .map((r) => r.nazwa.toLowerCase())
                    .join(", ")}
                  .
                  {styleResult.zrodla.map((z) => (
                    <p key={z.rola} className="qp-muted">
                      {ROLES.find((r) => r.rola === z.rola)?.nazwa}: {z.zrodlo}
                      {z.alternatywy
                        ? ` (+${z.alternatywy} inne pasujące artykuły)`
                        : ""}
                    </p>
                  ))}
                </div>
              )}
              <Notes title="Uwaga" items={styleResult.ostrzezenia} />
              {styleResult.braki.map((b) => (
                <MissingData
                  key={b.rola}
                  role={b.rola}
                  message={b.komunikat}
                  decor={picks[b.rola]}
                  values={entries}
                  onValue={(k, v) => setEntries((w) => ({ ...w, [k]: v }))}
                />
              ))}
              {styleResult.braki.length > 0 && (
                <div className="qp-bar">
                  <button
                    type="button"
                    className="qp-btn"
                    onClick={() => applyStyle(true)}
                    disabled={!!busy}
                  >
                    Ponów z wpisanymi danymi
                  </button>
                </div>
              )}
              {styleResult.aktywowane.length > 0 && (
                <p className="qp-muted">
                  Nowe materiały mają cenę zakupu 0 („brak ceny”). Pozycje w
                  wycenie będą oznaczone do uzupełnienia w cenniku.
                </p>
              )}
            </>
          )}

          {pendingPicks && !styleResult?.braki.length && (
            <div className="qp-note warn" role="status">
              Wybrane dekory nie są jeszcze zapisane w projekcie. Kliknij
              „Zastosuj dekory”, aby wycena i 3D je uwzględniły.
            </div>
          )}

          <div className="qp-bar qp-sticky">
            <button
              type="button"
              className="qp-btn secondary"
              onClick={() => goTo("podglad")}
            >
              ← Wróć
            </button>
            <span className="qp-spacer" />
            <button
              type="button"
              className="qp-btn secondary"
              onClick={() => {
                // Jawne odrzucenie: niezapisany wybór nie może po cichu zniknąć ani wisieć jako „zmiana niezapisana”.
                setPicks({});
                goTo("okucia");
              }}
            >
              {pendingPicks
                ? "Odrzuć wybór i dalej"
                : current?.korpus || current?.front
                  ? "Dalej bez zmian"
                  : "Pomiń styl"}
            </button>
            <button
              type="button"
              className="qp-btn"
              onClick={() => applyStyle(false)}
              disabled={!!busy || !Object.keys(picks).length}
            >
              Zastosuj dekory
            </button>
            <button
              type="button"
              className="qp-btn"
              onClick={() => goTo("okucia")}
              disabled={
                pendingPicks ||
                !!styleResult?.braki.length ||
                (!Object.keys(styleResult?.ustawiono ?? {}).length &&
                  !current?.korpus &&
                  !current?.front)
              }
            >
              Dalej: okucia →
            </button>
          </div>

          {openRole && decors && (
            <DecorPicker
              decors={decors}
              role={openRole}
              title={ROLES.find((r) => r.rola === openRole)!.nazwa}
              current={picks[openRole]?.key ?? current?.[openRole]?.dekor}
              onClose={closePicker}
              onPick={(d) => {
                setPicks((w) => ({ ...w, [openRole]: d }));
                setOpenRole(null);
              }}
            />
          )}
          {openRole && !decors && (
            <div className="qp-note" role="status">
              Wczytuję galerię dekorów…
            </div>
          )}
        </section>
      )}

      {step === "okucia" && (
        <section className="qp-card" aria-labelledby="qp-h-hw">
          <h2 id="qp-h-hw">Okucia projektu</h2>
          <p className="qp-muted">
            Zostaw „Automatycznie”, jeśli wycena ma dobrać okucia według
            wariantu. Pozycja bez ceny w cenniku trafi do wyceny jako błąd.
          </p>
          {!options && !error && (
            <div className="qp-note" role="status">
              Wczytuję opcje okuć…
            </div>
          )}
          {options && (
            <>
              <HardwareGroup
                hidePrices={clientMode}
                name="System szuflad"
                list={options.systemySzuflad}
                value={hardware.systemSzuflad}
                onChange={(v) =>
                  setHardware((o) => ({ ...o, systemSzuflad: v }))
                }
              />
              <HardwareGroup
                hidePrices={clientMode}
                name="Zawiasy"
                list={options.zawiasy}
                value={hardware.zawiasy}
                onChange={(v) => setHardware((o) => ({ ...o, zawiasy: v }))}
              />
              <HardwareGroup
                hidePrices={clientMode}
                name="Podnośniki (szafki wiszące)"
                list={options.podnosniki}
                value={hardware.podnosniki}
                onChange={(v) => setHardware((o) => ({ ...o, podnosniki: v }))}
              />
              {options.profileSzuflad.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  <h3>Profil konstrukcji szuflad</h3>
                  <p className="qp-muted">
                    Wybór systemu szuflad nie ustawia profilu automatycznie. Bez
                    profilu silnik użyje domyślnego ({options.profilDomyslny}) i
                    wypisze ostrzeżenie.
                  </p>
                  <div className="qp-options">
                    <button
                      type="button"
                      className="qp-option"
                      aria-pressed={!hardware.profilSzuflad}
                      onClick={() =>
                        setHardware((o) => ({ ...o, profilSzuflad: undefined }))
                      }
                    >
                      <b>Domyślny</b>
                    </button>
                    {options.profileSzuflad.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="qp-option"
                        aria-pressed={hardware.profilSzuflad === p.id}
                        onClick={() =>
                          setHardware((o) => ({ ...o, profilSzuflad: p.id }))
                        }
                      >
                        <b>
                          {p.producent} {p.system}
                        </b>
                        <span className="qp-muted">
                          płyta {mm(p.gruboscPlytyMM)} mm
                        </span>
                        {!p.zatwierdzonyProdukcyjnie && (
                          <span className="qp-tag warn">
                            niezatwierdzony produkcyjnie
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="qp-bar qp-sticky">
            <button
              type="button"
              className="qp-btn secondary"
              onClick={() => goTo("styl")}
            >
              ← Wróć
            </button>
            <span className="qp-spacer" />
            <button
              type="button"
              className="qp-btn"
              onClick={saveHardware}
              disabled={!!busy || !options}
            >
              Dalej: wycena →
            </button>
          </div>
        </section>
      )}

      {step === "wycena" && (
        <section className="qp-card" aria-labelledby="qp-h-quote">
          <h2 id="qp-h-quote">Wycena</h2>
          <Notes title="Okucia" items={hardwareWarnings} />
          {!analysis && !error && (
            <div className="qp-note" role="status">
              Liczę wycenę…
            </div>
          )}
          {analysis &&
            (() => {
              const w =
                analysis.warianty.find((x) => x.wariant === variant) ??
                analysis.warianty[0];
              if (!w)
                return (
                  <div className="qp-note warn">
                    Brak wariantów wyceny dla tego projektu.
                  </div>
                );
              const faulty = w.pozycje.filter((p) => p.jestBledemWyceny);
              const rows = showAll ? w.pozycje : faulty;
              const showCost =
                !clientMode &&
                w.pozycje.some((p) => typeof p.kosztNetto === "number");
              const inside = variantInside(analysis.warianty);
              const room = analysis.projekt.pomieszczenia[0];
              return (
                <>
                  <div
                    className="qp-variants"
                    role="group"
                    aria-label="Wariant wyceny"
                  >
                    {analysis.warianty.map((v) => {
                      const count = v.pozycje.filter(
                        (p) => p.jestBledemWyceny,
                      ).length;
                      return (
                        <button
                          key={v.wariant}
                          type="button"
                          className="qp-variant"
                          aria-pressed={v.wariant === w.wariant}
                          onClick={() => setVariant(v.wariant)}
                        >
                          <b>{v.nazwa}</b>
                          <strong>{currency(v.cenaBrutto)}</strong>
                          <span className="qp-muted">
                            brutto · netto {currency(v.cenaNetto)}
                          </span>
                          {(inside[v.wariant] ?? []).length > 0 && (
                            <ul className="qp-inside" aria-label={`Co w środku: ${v.nazwa}`}>
                              {inside[v.wariant].map((t) => (
                                <li key={t}>{t}</li>
                              ))}
                            </ul>
                          )}
                          {count > 0 && (
                            <span className="qp-tag error">
                              {count} do uzupełnienia
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {typeof w.cenaKalkulowanaBrutto === "number" && (
                    <div className="qp-note">
                      Cena uzgodniona z klientem:{" "}
                      <b>{currency(w.cenaBrutto)}</b> (bieżąca kalkulacja:{" "}
                      {currency(w.cenaKalkulowanaBrutto)}).
                    </div>
                  )}
                  {faulty.length > 0 ? (
                    <div className="qp-note error" role="alert">
                      <b>
                        {faulty.length}{" "}
                        {faulty.length === 1 ? "pozycja" : "pozycji"} z błędem
                        wyceny
                      </b>
                      <p>
                        Cena może być zaniżona lub przybliżona. Pełna oferta
                        PDF czeka na ceny; klientowi możesz dać propozycję
                        wstępną z widełkami.{" "}
                        {isOwner ? (
                          <>
                            Uzupełnij ceny w{" "}
                            <a href="#/materialy">Materiały i okucia</a>.
                          </>
                        ) : (
                          "Poproś właściciela o uzupełnienie cen w cenniku."
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="qp-note ok">
                      Wszystkie pozycje mają ceny.
                    </div>
                  )}
                  <div className="qp-table-wrap">
                    <table className="qp-table">
                      <caption
                        className="qp-muted"
                        style={{ textAlign: "left", padding: "8px 12px" }}
                      >
                        {showAll
                          ? "Wszystkie pozycje wyceny"
                          : "Pozycje z błędem wyceny"}
                      </caption>
                      <thead>
                        <tr>
                          <th>Pozycja</th>
                          <th className="num">Ilość</th>
                          {showCost && <th className="num">Koszt netto</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p, i) => (
                          <tr
                            key={p.nazwa + i}
                            className={p.jestBledemWyceny ? "error" : ""}
                          >
                            <td>
                              {p.jestBledemWyceny && (
                                <span className="qp-tag error">BRAK CENY</span>
                              )}{" "}
                              {p.nazwa}
                              {p.uwagi ? (
                                <div className="qp-muted">{p.uwagi}</div>
                              ) : null}
                            </td>
                            <td className="num">
                              {mm(p.ilosc)} {p.jednostka}
                            </td>
                            {showCost && (
                              <td className="num">{currency(p.kosztNetto)}</td>
                            )}
                          </tr>
                        ))}
                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={showCost ? 3 : 2} className="qp-muted">
                              Brak pozycji z błędem.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="qp-bar">
                    <button
                      type="button"
                      className="qp-btn secondary"
                      onClick={() => setShowAll((x) => !x)}
                    >
                      {showAll
                        ? "Pokaż tylko błędy"
                        : `Pokaż wszystkie pozycje (${w.pozycje.length})`}
                    </button>
                    <button
                      type="button"
                      className="qp-btn secondary"
                      aria-expanded={show3D}
                      onClick={() => setShow3D((x) => !x)}
                    >
                      {show3D ? "Ukryj 3D" : "Podgląd 3D"}
                    </button>
                  </div>
                  {show3D && room && (
                    <div className="qp-3d">
                      <Boundary>
                        <Suspense
                          fallback={
                            <p className="qp-note" role="status">
                              Wczytuję widok 3D…
                            </p>
                          }
                        >
                          <Widok3D
                            analiza={analysis}
                            pomieszczenieId={room.id}
                            scianaId={room.sciany[0]?.id ?? ""}
                            wybrany={null}
                            matMap={matMap}
                            onWybierz={() => undefined}
                          />
                        </Suspense>
                      </Boundary>
                    </div>
                  )}
                  {pdfError && (
                    <div className="qp-note error" role="alert">
                      <b>Oferta PDF nie powstała.</b>
                      <p>{pdfError}</p>
                    </div>
                  )}
                  <div className="qp-bar qp-sticky">
                    <button
                      type="button"
                      className="qp-btn secondary"
                      onClick={() => goTo("okucia")}
                    >
                      ← Wróć
                    </button>
                    <span className="qp-spacer" />
                    <a className="qp-btn secondary" href={`#/p/${id}`}>
                      Otwórz w projektancie
                    </a>
                    {faulty.length > 0 && (
                      <button
                        type="button"
                        className="qp-btn"
                        onClick={() => void downloadPdf(true)}
                        disabled={pdfBusy}
                        aria-describedby="qp-pdf-hint"
                      >
                        {pdfBusy ? "Składam PDF…" : "Propozycja wstępna PDF"}
                      </button>
                    )}
                    <button
                      type="button"
                      className={faulty.length ? "qp-btn secondary" : "qp-btn"}
                      onClick={() => void downloadPdf(false)}
                      disabled={pdfBusy || faulty.length > 0}
                      aria-describedby={
                        faulty.length ? "qp-pdf-hint" : undefined
                      }
                    >
                      {pdfBusy && !faulty.length ? "Składam PDF…" : "Oferta PDF"}
                    </button>
                  </div>
                  {faulty.length > 0 && (
                    <p id="qp-pdf-hint" className="qp-muted">
                      Pełna oferta wymaga cen wszystkich pozycji. Propozycja
                      wstępna pokazuje widełki (−5% / +15%) ze znakiem „cena
                      do potwierdzenia” — nie jest ofertą ani podstawą umowy.
                    </p>
                  )}
                  <p className="qp-muted">
                    Oferta PDF bez wizualizacji; zdjęcia do oferty wygenerujesz
                    w zakładce Oferta projektu.
                  </p>
                </>
              );
            })()}
        </section>
      )}
    </div>
  );
}
