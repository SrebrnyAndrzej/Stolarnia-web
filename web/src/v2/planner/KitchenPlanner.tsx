import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconDownload,
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconArrowBackUp,
  IconUpload,
  IconRulerMeasure,
} from "@tabler/icons-react";
import { Logo, Feedback } from "../ui";
import { Rzut } from "../../views/Rzut";
import { Elewacja } from "../../views/Elewacja";
import {
  brief,
  catalog,
  finishes,
  HANDOFF_KEY,
  isUpper,
  layoutIssues,
  newDraft,
  readDraft,
  startOffset,
  STORAGE_KEY,
  toAnalysis,
  wallIds,
  wallLength,
  type Draft,
} from "./model";
import "./planner.css";
const View3D = lazy(() =>
  import("../../views/Widok3D").then((m) => ({ default: m.Widok3D })),
);
class PreviewBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Feedback>
        Podgląd 3D nie jest dostępny na tym urządzeniu. Wybierz rzut lub widok
        od przodu.
      </Feedback>
    ) : (
      this.props.children
    );
  }
}
function initialDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { draft: raw ? readDraft(raw) : newDraft(), error: "" };
  } catch {
    return {
      draft: newDraft(),
      error:
        "Nie udało się odtworzyć szkicu. Możesz rozpocząć nowy lub wczytać plik.",
    };
  }
}
export function KitchenPlanner() {
  const [initial] = useState(initialDraft);
  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [history, setHistory] = useState<Draft[]>([]);
  const [step, setStep] = useState(0);
  const [wall, setWall] = useState<"a" | "b" | "c">(
    initial.draft.items[0]?.wall ?? "a",
  );
  const [view, setView] = useState<"front" | "plan" | "3d">("front");
  const [selected, setSelected] = useState<string | null>(null);
  const [group, setGroup] = useState("base");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(initial.error);
  const [saved, setSaved] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [dims, setDims] = useState({
    width: String(draft.width),
    depth: String(draft.depth),
    returnLength: String(draft.returnLength),
    height: String(draft.height),
  });
  const [dimensionError, setDimensionError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const analysis = useMemo(() => toAnalysis(draft), [draft]);
  const issues = useMemo(() => layoutIssues(draft), [draft]);
  const matMap = useMemo(
    () => new Map(analysis.materialy.map((m) => [m.id, m])),
    [analysis],
  );
  const change = (next: Draft) => {
    setHistory((h) => [...h.slice(-29), draft]);
    setDraft(next);
    setNotice("");
    setError("");
    setSaved(false);
  };
  const syncDimensions = (d: Draft) =>
    setDims({
      width: String(d.width),
      depth: String(d.depth),
      returnLength: String(d.returnLength),
      height: String(d.height),
    });
  useEffect(() => {
    if (conflict !== null) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaved(true);
      setStorageFailed(false);
    } catch {
      setSaved(false);
      setStorageFailed(true);
    }
  }, [draft, conflict]);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setConflict(e.newValue ?? "");
        setSaved(false);
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (
        !saved ||
        Object.entries(dims).some(
          ([k, v]) => Number(v) !== draft[k as keyof typeof dims],
        )
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [saved, dims, draft]);
  const go = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setDraft(prev);
    syncDimensions(prev);
    setWall("a");
    setHistory((h) => h.slice(0, -1));
    setNotice("Cofnięto ostatnią zmianę.");
  };
  const add = (catalogId: string) => {
    setNotice("");
    if (draft.items.length >= 24) {
      setError("Szkic może zawierać do 24 szafek.");
      return;
    }
    const next = {
      ...draft,
      items: [...draft.items, { id: crypto.randomUUID(), catalogId, wall }],
    };
    const problems = layoutIssues(next);
    if (problems.length) {
      setError(problems[0]);
      return;
    }
    change(next);
    setSelected(next.items.at(-1)!.id);
    setNotice("Dodano szafkę do ściany " + wall.toUpperCase() + ".");
  };
  const move = (id: string, delta: number) => {
    const index = draft.items.findIndex((i) => i.id === id);
    const item = draft.items[index];
    const peers = draft.items.filter(
      (i) =>
        i.wall === item.wall &&
        isUpper(i.catalogId) === isUpper(item.catalogId),
    );
    const target = peers[peers.findIndex((i) => i.id === id) + delta];
    if (!target) return;
    const items = [...draft.items];
    const ti = items.findIndex((i) => i.id === target.id);
    [items[index], items[ti]] = [items[ti], items[index]];
    change({ ...draft, items });
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pan-stolarz-moja-kuchnia.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Pobrano szkic. Możesz wczytać go ponownie w kreatorze.");
  };
  const importFile = async (f: File) => {
    try {
      if (f.size > 50000) throw new Error();
      const next = readDraft(await f.text());
      change(next);
      syncDimensions(next);
      setWall("a");
      setSelected(null);
      setNotice(
        "Wczytano szkic z pliku. Poprzednią wersję możesz przywrócić przyciskiem Cofnij.",
      );
    } catch {
      setError(
        "Nie można wczytać pliku. Wybierz szkic JSON pobrany z kreatora Pan Stolarz (do 50 KB).",
      );
    }
  };
  const handoff = () => {
    try {
      sessionStorage.setItem(HANDOFF_KEY, brief(draft));
      location.hash = "#/zapytanie/kuchnia";
    } catch {
      setError(
        "Nie można przenieść opisu. Pobierz szkic i zachowaj go do rozmowy ze stolarnią.",
      );
    }
  };
  useEffect(() => {
    if (error) document.getElementById("kp-global-error")?.focus();
  }, [error]);
  const activeModules = analysis.projekt.moduly.filter(
    (m) => m.scianaId === wall,
  );
  const length = wallLength(draft, wall);
  const used = Math.max(
    startOffset(draft, wall),
    ...activeModules
      .filter((m) => m.kategoria !== "wall")
      .map((m) => m.pozycjaXMM + m.szerokoscMM),
  );
  return (
    <div className="kp-page">
      <header className="ps-public-header">
        <a href="#/">
          <Logo />
        </a>
        <span className="kp-header-label">Kreator kuchni</span>
        <a className="ps-text-button" href="#/">
          Strona główna <IconArrowLeft size={18} />
        </a>
      </header>
      <main className="kp-main">
        <div className="kp-intro">
          <div>
            <span className="ps-eyebrow">
              Twój pomysł. Nasze doświadczenie.
            </span>
            <h1 ref={heading} tabIndex={-1}>
              Zaplanuj swoją kuchnię
            </h1>
            <p>Ułóż wstępny projekt. Razem dopracujemy go przed realizacją.</p>
          </div>
          <span className="kp-save" role="status">
            {conflict !== null
              ? "Zmiana w innej karcie"
              : saved
                ? "Szkic zapisany na tym urządzeniu"
                : storageFailed
                  ? "Zapis lokalny niedostępny — pobierz szkic"
                  : "Zapisywanie szkicu…"}
          </span>
        </div>
        <nav className="kp-steps" aria-label="Etapy planowania">
          {["Pomieszczenie", "Szafki i wygląd", "Twój szkic"].map(
            (label, i) => (
              <button
                key={label}
                aria-current={step === i ? "step" : undefined}
                disabled={i > step && step === 0}
                onClick={() => go(i)}
              >
                <span>{i + 1}</span>
                {label}
              </button>
            ),
          )}
        </nav>
        {conflict !== null && (
          <Feedback>
            W innej karcie zmieniono szkic. Wybierz wersję, którą chcesz
            zachować.
            <div className="kp-actions">
              <button
                className="ps-button secondary"
                onClick={() => {
                  try {
                    const next = conflict ? readDraft(conflict) : newDraft();
                    setDraft(next);
                    syncDimensions(next);
                    setHistory([]);
                    setWall("a");
                    setConflict(null);
                  } catch {
                    setError("Szkic z innej karty jest niepoprawny.");
                  }
                }}
              >
                Wczytaj wersję z innej karty
              </button>
              <button
                className="ps-button secondary"
                onClick={() => setConflict(null)}
              >
                Zachowaj mój szkic
              </button>
            </div>
          </Feedback>
        )}
        {error && (
          <div id="kp-global-error" tabIndex={-1}>
            <Feedback>{error}</Feedback>
          </div>
        )}
        {notice && (
          <p className="kp-notice" role="status">
            {notice}
          </p>
        )}
        {step === 0 ? (
          <section className="kp-setup">
            <div className="kp-panel">
              <h2>Jaki układ planujesz?</h2>
              <div className="kp-layouts">
                {(["straight", "l", "u"] as const).map((layout) => (
                  <button
                    key={layout}
                    aria-pressed={draft.layout === layout}
                    onClick={() => {
                      if (
                        draft.items.some(
                          (i) => !wallIds({ layout }).includes(i.wall),
                        )
                      ) {
                        setError(
                          "Najpierw usuń szafki ze ścian, które nie występują w nowym układzie.",
                        );
                        return;
                      }
                      change({ ...draft, layout });
                      setWall("a");
                      setSelected(null);
                    }}
                  >
                    <span
                      className={`kp-layout-symbol ${layout}`}
                      aria-hidden="true"
                    />
                    {layout === "straight"
                      ? "Jedna ściana"
                      : layout === "l"
                        ? "Układ L"
                        : "Układ U"}
                    <small>
                      {layout === "straight"
                        ? "Zabudowa w jednej linii"
                        : layout === "l"
                          ? "Dwie ściany pod kątem prostym"
                          : "Trzy ściany wokół Ciebie"}
                    </small>
                  </button>
                ))}
              </div>
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  const values = {
                    width: Number(dims.width),
                    depth: Number(dims.depth),
                    returnLength: Number(dims.returnLength),
                    height: Number(dims.height),
                  };
                  if (
                    !Number.isInteger(values.width) ||
                    values.width < 1800 ||
                    values.width > 8000 ||
                    !Number.isInteger(values.height) ||
                    values.height < 2300 ||
                    values.height > 3500 ||
                    (draft.layout !== "straight" &&
                      (!Number.isInteger(values.depth) ||
                        values.depth < 1800 ||
                        values.depth > 8000)) ||
                    (draft.layout === "u" &&
                      (!Number.isInteger(values.returnLength) ||
                        values.returnLength < 1800 ||
                        values.returnLength > 8000))
                  ) {
                    setDimensionError(
                      "Podaj całe milimetry: ściany 1800–8000 mm, wysokość 2300–3500 mm.",
                    );
                    document.getElementById("kp-width")?.focus();
                    return;
                  }
                  setDimensionError("");
                  change({ ...draft, ...values });
                  go(1);
                }}
              >
                <h2>Podaj wymiary w milimetrach</h2>
                <p className="kp-muted">
                  Zmierz od narożnika do narożnika. 1 metr = 1000 mm.
                </p>
                <div className="kp-dimensions">
                  {(
                    [
                      "width",
                      ...(draft.layout !== "straight" ? ["depth"] : []),
                      ...(draft.layout === "u" ? ["returnLength"] : []),
                      "height",
                    ] as (keyof typeof dims)[]
                  ).map((key) => (
                    <label key={key} htmlFor={`kp-${key}`}>
                      {key === "width"
                        ? "Długość ściany A"
                        : key === "depth"
                          ? "Długość ściany B"
                          : key === "returnLength"
                            ? "Długość ściany C"
                            : "Wysokość pomieszczenia"}
                      <span>
                        <input
                          id={`kp-${key}`}
                          inputMode="numeric"
                          type="number"
                          step="1"
                          min={key === "height" ? 2300 : 1800}
                          max={key === "height" ? 3500 : 8000}
                          value={dims[key]}
                          aria-invalid={!!dimensionError}
                          aria-describedby={
                            dimensionError ? "kp-dim-error" : undefined
                          }
                          onChange={(e) =>
                            setDims((d) => ({ ...d, [key]: e.target.value }))
                          }
                        />{" "}
                        mm
                      </span>
                    </label>
                  ))}
                </div>
                {dimensionError && (
                  <p className="kp-error" id="kp-dim-error" role="alert">
                    {dimensionError}
                  </p>
                )}
                <button className="ps-button">
                  Przejdź do szafek <IconArrowRight size={18} />
                </button>
              </form>
            </div>
            <aside className="kp-measure">
              <IconRulerMeasure size={44} stroke={1.2} />
              <h2>Zacznij od wymiarów</h2>
              <p>
                Na tym etapie wystarczy prosty obrys. Okna, drzwi i przyłącza
                omówimy podczas konsultacji.
              </p>
              {draft.layout !== "straight" && (
                <p>
                  W narożniku ściany B
                  {draft.layout === "u" ? " i ściany C" : ""} zostawiamy po 650
                  mm pustej strefy. Sposób zabudowy narożnika dobierze stolarz.
                </p>
              )}
              <strong>Szkic nie zastępuje pomiaru w Twoim domu.</strong>
              <div className="kp-actions">
                <button
                  className="ps-button secondary"
                  onClick={() => file.current?.click()}
                >
                  <IconUpload size={18} />
                  Wczytaj szkic
                </button>
              </div>
            </aside>
          </section>
        ) : (
          <>
            <div className="kp-workbench">
              <aside className="kp-panel kp-catalog">
                <h2>{step === 1 ? "Dodaj szafki" : "Podsumowanie"}</h2>
                {step === 1 ? (
                  <>
                    <div
                      className="kp-wall-buttons"
                      role="group"
                      aria-label="Wybierz ścianę"
                    >
                      {wallIds(draft).map((w) => (
                        <button
                          key={w}
                          aria-pressed={wall === w}
                          onClick={() => {
                            setWall(w as "a" | "b" | "c");
                            setSelected(null);
                          }}
                        >
                          Ściana {w.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <p className="kp-capacity">
                      Dolna zabudowa:{" "}
                      <strong>{Math.max(0, length - used)} mm wolne</strong>
                    </p>
                    <label className="kp-select-label">
                      Rodzaj szafek
                      <select
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                      >
                        <option value="base">Dolne z drzwiami</option>
                        <option value="drawers">Z szufladami</option>
                        <option value="wall">Wiszące</option>
                        <option value="tall">Słupki</option>
                        <option value="appliance">Zlew i AGD</option>
                      </select>
                    </label>
                    <div className="kp-catalog-items">
                      {catalog
                        .filter((m) =>
                          group === "drawers"
                            ? m.construction === "drawers"
                            : group === "base"
                              ? m.category === "base" &&
                                m.construction === "shelves"
                              : group === "tall"
                                ? m.heightMM > 1500
                                : group === "appliance"
                                  ? m.category === "appliance" &&
                                    m.heightMM < 1500
                                  : m.category === "wall",
                        )
                        .map((m) => (
                          <button key={m.id} onClick={() => add(m.id)}>
                            <span
                              className={`kp-cabinet-icon ${m.construction}`}
                              aria-hidden="true"
                            />
                            <span>
                              <strong>Dodaj: {m.name}</strong>
                              <small>
                                {m.widthMM} × {m.heightMM} × {m.depthMM} mm
                              </small>
                            </span>
                            <IconPlus size={18} />
                          </button>
                        ))}
                    </div>
                    <p className="kp-muted">
                      Dodajemy na końcu wybranego rzędu. Kolejność zmienisz
                      strzałkami pod podglądem.
                    </p>
                  </>
                ) : (
                  <>
                    <dl className="kp-summary">
                      <dt>Układ</dt>
                      <dd>
                        {draft.layout === "u"
                          ? "U"
                          : draft.layout === "l"
                            ? "L"
                            : "Prosty"}
                      </dd>
                      <dt>Ściana A</dt>
                      <dd>{draft.width} mm</dd>
                      {draft.layout !== "straight" && (
                        <>
                          <dt>Ściana B</dt>
                          <dd>{draft.depth} mm</dd>
                        </>
                      )}
                      {draft.layout === "u" && (
                        <>
                          <dt>Ściana C</dt>
                          <dd>{draft.returnLength} mm</dd>
                        </>
                      )}
                      <dt>Wysokość</dt>
                      <dd>{draft.height} mm</dd>
                      <dt>Szafki</dt>
                      <dd>{draft.items.length}</dd>
                      <dt>Fronty</dt>
                      <dd>
                        {finishes.find((f) => f.id === draft.finish)?.name}
                      </dd>
                    </dl>
                    <p>
                      To punkt wyjścia do rozmowy. Stolarz sprawdzi układ,
                      instalacje, materiały i przygotuje wycenę.
                    </p>
                    <button
                      className="ps-button"
                      disabled={
                        !draft.items.length ||
                        !!issues.length ||
                        conflict !== null
                      }
                      onClick={handoff}
                    >
                      Przejdź do zapytania <IconArrowRight size={18} />
                    </button>
                    <p className="kp-muted">
                      Opis układu trafi do formularza. Przed wysłaniem podasz
                      dane kontaktowe.
                    </p>
                    <button className="ps-button secondary" onClick={download}>
                      <IconDownload size={18} />
                      Pobierz szkic JSON
                    </button>
                  </>
                )}
              </aside>
              <section className="kp-preview-area" aria-label="Podgląd kuchni">
                <div className="kp-preview-toolbar">
                  <div role="group" aria-label="Widok projektu">
                    {(
                      [
                        ["front", "Od przodu"],
                        ["plan", "Rzut z góry"],
                        ["3d", "3D"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={view === id}
                        onClick={() => setView(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    className="ps-text-button"
                    disabled={!history.length}
                    onClick={undo}
                  >
                    <IconArrowBackUp size={18} />
                    Cofnij
                  </button>
                </div>
                <div className="kp-canvas">
                  {view === "front" ? (
                    <Elewacja
                      analiza={analysis}
                      scianaId={wall}
                      dlugosc={length}
                      wysokosc={draft.height}
                      matMap={matMap}
                      wybrany={selected}
                      onWybierz={setSelected}
                      readOnly
                    />
                  ) : view === "plan" ? (
                    <Rzut
                      analiza={analysis}
                      pomieszczenieId="kitchen"
                      scianaId={wall}
                      wybrany={selected}
                      matMap={matMap}
                      onSciana={(id) => setWall(id as "a" | "b" | "c")}
                      onWybierz={setSelected}
                    />
                  ) : (
                    <PreviewBoundary key={view}>
                      <Suspense
                        fallback={<p role="status">Wczytywanie podglądu 3D…</p>}
                      >
                        <View3D
                          key={wall}
                          fitContainer
                          analiza={analysis}
                          pomieszczenieId="kitchen"
                          scianaId={wall}
                          wybrany={selected}
                          matMap={matMap}
                          onWybierz={setSelected}
                        />
                      </Suspense>
                    </PreviewBoundary>
                  )}
                  {!draft.items.length && (
                    <div className="kp-canvas-empty">
                      <strong>Tu powstanie Twoja kuchnia</strong>
                      <span>Dodaj pierwszą szafkę z katalogu.</span>
                    </div>
                  )}
                </div>
                <p className="kp-preview-caption">
                  {view === "3d"
                    ? "Przeciągnij, aby obrócić. Przybliżaj kółkiem myszy lub gestem."
                    : `Ściana ${wall.toUpperCase()} · ${length} mm · wybierz szafkę na liście poniżej.`}{" "}
                  Kolory są poglądowe.
                </p>
                {issues.length > 0 && (
                  <Feedback>
                    {issues.map((i) => (
                      <p key={i}>{i}</p>
                    ))}
                  </Feedback>
                )}
                <div className="kp-finish-row">
                  <strong>Kolor frontów</strong>
                  <div role="group" aria-label="Kolor frontów">
                    {finishes.map((f) => (
                      <button
                        key={f.id}
                        aria-pressed={draft.finish === f.id}
                        onClick={() => change({ ...draft, finish: f.id })}
                      >
                        <span style={{ background: f.color }} />
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="kp-arrangement">
                  <h2>Szafki · ściana {wall.toUpperCase()}</h2>
                  {draft.layout !== "straight" && (
                    <div
                      className="kp-wall-buttons"
                      role="group"
                      aria-label="Ściana listy szafek"
                    >
                      {wallIds(draft).map((w) => (
                        <button
                          key={w}
                          aria-pressed={wall === w}
                          onClick={() => setWall(w as "a" | "b" | "c")}
                        >
                          Ściana {w.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                  {activeModules.length ? (
                    <ol>
                      {activeModules.map((m) => {
                        const peers = activeModules.filter(
                          (p) =>
                            (p.kategoria === "wall") ===
                            (m.kategoria === "wall"),
                        );
                        const index = peers.findIndex((p) => p.id === m.id);
                        return (
                          <li
                            key={m.id}
                            className={selected === m.id ? "selected" : ""}
                          >
                            <button
                              className="kp-item-name"
                              onClick={() => setSelected(m.id)}
                              aria-pressed={selected === m.id}
                            >
                              <strong>{m.nazwa}</strong>
                              <small>
                                {m.kategoria === "wall"
                                  ? "Wisząca"
                                  : "Dolna / słupek"}{" "}
                                · od {m.pozycjaXMM} mm
                              </small>
                            </button>
                            <div>
                              <button
                                aria-label={`Przesuń wcześniej: ${m.nazwa}`}
                                disabled={index === 0}
                                onClick={() => move(m.id, -1)}
                              >
                                <IconArrowUp size={18} />
                              </button>
                              <button
                                aria-label={`Przesuń później: ${m.nazwa}`}
                                disabled={index === peers.length - 1}
                                onClick={() => move(m.id, 1)}
                              >
                                <IconArrowDown size={18} />
                              </button>
                              <button
                                aria-label={`Usuń: ${m.nazwa}`}
                                onClick={() => {
                                  change({
                                    ...draft,
                                    items: draft.items.filter(
                                      (i) => i.id !== m.id,
                                    ),
                                  });
                                  setSelected(null);
                                  setNotice(
                                    "Usunięto szafkę. Możesz cofnąć tę zmianę.",
                                  );
                                }}
                              >
                                <IconTrash size={18} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p>
                      Ta ściana jest jeszcze pusta. Wybierz szafki w katalogu.
                    </p>
                  )}
                </div>
              </section>
            </div>
            <div className="kp-bottom-actions">
              <button
                className="ps-button secondary"
                onClick={() => go(step - 1)}
              >
                <IconArrowLeft size={18} />
                {step === 1 ? "Wymiary pomieszczenia" : "Wróć do szafek"}
              </button>
              {step === 1 && (
                <button
                  className="ps-button"
                  disabled={!draft.items.length || !!issues.length}
                  onClick={() => go(2)}
                >
                  Zobacz podsumowanie <IconArrowRight size={18} />
                </button>
              )}
            </div>
          </>
        )}
        <footer className="kp-footer">
          <p>
            Szkic koncepcyjny · bez wyceny i dokumentacji produkcyjnej. Nie
            sprawdzamy instalacji, kolizji otwierania i wymaganych luzów
            montażowych.
          </p>
          <div className="kp-actions">
            <button className="ps-text-button" onClick={download}>
              <IconDownload size={18} />
              Pobierz szkic
            </button>
            <button
              className="ps-text-button"
              onClick={() => file.current?.click()}
            >
              <IconUpload size={18} />
              Wczytaj szkic
            </button>
            <button
              className="ps-text-button"
              ref={resetTrigger}
              onClick={() => resetDialog.current?.showModal()}
            >
              Zacznij od nowa
            </button>
          </div>
        </footer>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          aria-label="Plik szkicu kuchni"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f);
            e.target.value = "";
          }}
        />
        <dialog
          className="kp-dialog"
          ref={resetDialog}
          aria-labelledby="kp-reset-title"
          onClose={() => resetTrigger.current?.focus()}
        >
          <h2 id="kp-reset-title">Rozpocząć nową kuchnię?</h2>
          <p>
            Usuniemy aktualny szkic z tego urządzenia. Pobierz go wcześniej,
            jeśli chcesz go zachować.
          </p>
          <div className="kp-actions">
            <button
              autoFocus
              className="ps-button secondary"
              onClick={() => resetDialog.current?.close()}
            >
              Zachowaj szkic
            </button>
            <button
              className="ps-button"
              onClick={() => {
                change(newDraft());
                syncDimensions(newDraft());
                setWall("a");
                setSelected(null);
                go(0);
                resetDialog.current?.close();
              }}
            >
              Rozpocznij nowy szkic
            </button>
          </div>
        </dialog>
      </main>
    </div>
  );
}
