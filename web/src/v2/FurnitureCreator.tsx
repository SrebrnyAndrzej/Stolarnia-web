import { NumberField } from "./FurnitureNumberField";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  freshFurniture,
  carcass,
  resizeFurniture,
  plateSpecificationIssues,
  plateThickness,
  freshPlateSpecification,
  freshConstructionStandard,
  applyConstructionStandard,
  standardPlateSpecification,
  backDepth,
  applySuggestedLayout,
  deskStartingModel,
  isDeskVariant,
  deskWorktopHeight,
  deskLegWidth,
  deskCabinetWidth,
  fitDrawerFronts,
  layoutVariants,
  type LayoutVariant,
  furnitureIssues,
  furnitureOutline,
  platePolygon,
  type FurnitureModel,
  type FurniturePlate,
  type FurnitureEntry,
  type Point,
} from "../../../src/core/furniture";
import { request } from "./api";
import { Feedback } from "./ui";
import { SlopeCutting } from "./SlopeCutting";
import { useDraftGuard } from "./useDraftGuard";
import { PlateSpecification } from "./PlateSpecification";
import { ConstructionStandard } from "./ConstructionStandard";
import { FurnitureParts } from "./FurnitureParts";
import { FurnitureDrawers } from "./FurnitureDrawers";
import { DeskStorage } from "./DeskStorage";
import {
  furnitureDrawerCalculations,
  type FurnitureDrawerCalculation,
} from "../../../src/core/furniture-drawers";
import "./furniture.css";

const FurnitureScene = lazy(() =>
  import("./FurnitureScene").then((m) => ({ default: m.FurnitureScene })),
);
const uid = () => crypto.randomUUID();
const initial = () => {
  const m = freshFurniture();
  m.plates = carcass(m, uid);
  return applySuggestedLayout(m, "auto", uid);
};
export function FurnitureCreator({ demo }: { demo: boolean }) {
  const [model, setModel] = useState(initial);
  const [id, setId] = useState<string>(uid);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState("");
  const [library, setLibrary] = useState<FurnitureEntry[]>([]);
  const [loading, setLoading] = useState(!demo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [savedDrawers, setSavedDrawers] = useState<
    FurnitureDrawerCalculation[] | null
  >(null);
  const [history, setHistory] = useState<FurnitureModel[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [drawerCounts, setDrawerCounts] = useState([1, 1, 1]);
  const [drawerHeights, setDrawerHeights] = useState([140, 220, 320]);
  const draftGuard = useDraftGuard(
    dirty,
    () => setDirty(false),
    "Zostań w kreatorze",
  );
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const specificationPanel = useRef<HTMLDivElement>(null);
  const plate = model.plates.find((p) => p.id === selected);
  const issues = furnitureIssues(model);
  const update = (fn: (m: FurnitureModel) => FurnitureModel) => {
    if (!drag.current)
      setHistory((h) => [...h.slice(-39), structuredClone(model)]);
    setModel((m) => fitDrawerFronts(fn(m)));
    setDirty(true);
    setMessage("");
    setError("");
  };
  const guarded = draftGuard.guarded;
  const loadLibrary = async () => {
    if (demo) return;
    setLoading(true);
    setError("");
    try {
      setLibrary(await request<FurnitureEntry[]>("/api/v2/furniture"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const c = new AbortController();
    if (!demo)
      request<FurnitureEntry[]>("/api/v2/furniture", { signal: c.signal })
        .then(setLibrary)
        .catch((e) => {
          if (!c.signal.aborted) setError(e.message);
        })
        .finally(() => {
          if (!c.signal.aborted) setLoading(false);
        });
    return () => c.abort();
  }, [demo]);
  const reset = () =>
    guarded(() => {
      setId(uid());
      setVersion(0);
      setModel(initial());
      setSavedDrawers(null);
      setHistory([]);
      setSelected("");
      setDirty(false);
      setError("");
      setMessage("");
    });
  const open = (e: FurnitureEntry) =>
    guarded(() => {
      setId(e.id);
      setVersion(e.version);
      setModel(structuredClone(e.model));
      setSavedDrawers(e.drawerCalculations ?? null);
      setHistory([]);
      setSelected("");
      setDirty(false);
      setError("");
      setMessage(`Otworzono wersję ${e.version}.`);
    });
  const copy = () => {
    setId(uid());
    setVersion(0);
    update((m) => ({ ...m, name: `${m.name.slice(0, 88)} — kopia` }));
  };
  const save = async () => {
    if (issues.length || model.name.trim().length < 2) {
      setError(issues[0] ?? "Wpisz nazwę mebla (co najmniej 2 znaki).");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const entry = demo
        ? {
            id,
            version: version + 1,
            model: structuredClone(model),
            createdBy: "demo",
            updatedBy: "demo",
            updatedAt: new Date().toISOString(),
          }
        : await request<FurnitureEntry>("/api/v2/furniture", {
            method: "PUT",
            body: JSON.stringify({ id, version, model }),
          });
      setVersion(entry.version);
      setModel(structuredClone(entry.model));
      setSavedDrawers(
        entry.drawerCalculations ?? furnitureDrawerCalculations(entry.model),
      );
      setLibrary((list) => [entry, ...list.filter((x) => x.id !== id)]);
      setDirty(false);
      setMessage(
        demo
          ? "Zapisano w bibliotece pokazowej tej karty."
          : "Zapisano we wspólnej bibliotece.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const exportConstruction = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const card = await request<unknown>(
        `/api/v2/furniture/${encodeURIComponent(id)}/construction?version=${version}`,
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(card, null, 2)], {
          type: "application/json;charset=utf-8",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `konstrukcja-${id}-v${version}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "Pobrano kartę konstrukcji zapisanej wersji. To szkic do opracowania technologii, nie plik CNC ani zamówienie.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const modifyPlate = (patch: Partial<FurniturePlate>) =>
    update((m) => ({
      ...m,
      ...(plate?.kind === "drawer" &&
      ["x", "y", "z", "width", "height", "depth"].some((k) => k in patch)
        ? { drawerFit: "fixed" as const }
        : {}),
      plates: m.plates.map((p) =>
        p.id === selected
          ? {
              ...p,
              ...patch,
              ...(p.layoutSlot &&
              ["x", "y", "z", "width", "height", "depth"].some(
                (k) => k in patch,
              )
                ? { layoutCustomized: true }
                : {}),
              ...(p.kind === "cap" && patch.kind === "board" && p.specification
                ? {
                    specification: {
                      ...p.specification,
                      face: "unset" as const,
                      grain: "unset" as const,
                      edges: freshPlateSpecification().edges,
                    },
                  }
                : {}),
              ...("x" in patch ||
              "y" in patch ||
              "width" in patch ||
              "height" in patch ||
              "depth" in patch
                ? { anchor: undefined }
                : {}),
            }
          : p,
      ),
    }));
  const addPlate = (vertical: boolean) => {
    const p: FurniturePlate = {
      id: uid(),
      name: vertical ? "Przegroda" : "Półka",
      kind: "board",
      x: vertical ? Math.round(model.width / 2) : model.thickness,
      y: model.thickness + (vertical ? 0 : Math.round(model.lowHeight / 2)),
      z: backDepth(model),
      width: vertical ? model.thickness : model.width - 2 * model.thickness,
      height: vertical ? model.height - model.thickness : model.thickness,
      depth: model.depth - backDepth(model),
    };
    if (model.construction)
      p.specification = standardPlateSpecification(model, {
        ...p,
        anchor: vertical ? "left" : "bottom",
      });
    else
      p.specification = {
        ...freshPlateSpecification(),
        face: vertical ? "yz" : "xz",
      };
    update((m) => ({ ...m, plates: [...m.plates, p] }));
    setSelected(p.id);
  };
  const addDrawers = () => {
    const plates: FurniturePlate[] = [];
    const columns = new Map<string, { x: number; width: number }>();
    model.plates
      .filter(
        (p) =>
          p.kind === "drawer" ||
          (isDeskVariant(model.suggestion?.variant) && p.kind === "door"),
      )
      .forEach((p) =>
        columns.set(`${p.x}/${p.width}`, { x: p.x, width: p.width }),
      );
    if (!columns.size)
      columns.set("body", {
        x: model.thickness + 2,
        width: model.width - 2 * model.thickness - 4,
      });
    for (const column of columns.values()) {
      let y = model.thickness + 2;
      drawerCounts.forEach((count, i) => {
        for (let j = 0; j < count; j++) {
          plates.push({
            id: uid(),
            name: `Szuflada ${["niska", "średnia", "wysoka"][i]} ${j + 1}`,
            kind: "drawer",
            x: column.x,
            y,
            z: model.depth,
            width: column.width,
            height: drawerHeights[i],
            depth: model.thickness,
          });
          y += drawerHeights[i] + 2;
        }
      });
    }
    if (!plates.length) {
      setError("Wybierz co najmniej jedną szufladę.");
      return;
    }
    const next = fitDrawerFronts({
      ...model,
      drawerFit: model.drawerFit ?? "fill",
      customDrawerSet: true,
      desk:
        isDeskVariant(model.suggestion?.variant) && model.desk
          ? { ...model.desk, cabinetFront: "drawers" }
          : model.desk,
      drawerAssemblies: [],
      suggestion: isDeskVariant(model.suggestion?.variant)
        ? model.suggestion
        : { variant: "empty" as const, excludedSlots: [] },
      plates: [
        ...model.plates.filter(
          (p) =>
            p.kind !== "drawer" &&
            !(isDeskVariant(model.suggestion?.variant) && p.kind === "door") &&
            !(
              p.layoutSlot?.startsWith("desk/cabinet/") &&
              p.layoutSlot.endsWith("/shelf")
            ) &&
            (!p.layoutSlot ||
              p.layoutCustomized ||
              isDeskVariant(model.suggestion?.variant)),
        ),
        ...plates,
      ],
    });
    if (model.construction)
      next.plates = next.plates.map((p) =>
        p.kind === "drawer"
          ? { ...p, specification: standardPlateSpecification(model, p) }
          : p,
      );
    const problems = furnitureIssues(next);
    if (problems.length) {
      setError(problems[0]);
      return;
    }
    update(() => next);
    setSelected(plates[0].id);
  };
  const shapeChange = (patch: Partial<FurnitureModel>) =>
    update((m) => resizeFurniture(m, patch, uid));
  const point = (e: PointerEvent): Point => {
    const s = svg.current!;
    const p = s.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const converted = p.matrixTransform(s.getScreenCTM()!.inverse());
    return [converted.x, model.height - converted.y];
  };
  const beginDrag = (e: PointerEvent<SVGPolygonElement>, p: FurniturePlate) => {
    setSelected(p.id);
    if (view !== "2d" || p.kind === "cap" || p.anchor === "back" || busy)
      return;
    const [x, y] = point(e);
    setHistory((h) => [...h.slice(-39), structuredClone(model)]);
    drag.current = { id: p.id, x, y, startX: p.x, startY: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const [x, y] = point(e);
    update((m) => ({
      ...m,
      ...(m.plates.find((p) => p.id === d.id)?.kind === "drawer"
        ? { drawerFit: "fixed" as const }
        : {}),
      plates: m.plates.map((p) =>
        p.id !== d.id
          ? p
          : {
              ...p,
              anchor: undefined,
              ...(p.layoutSlot ? { layoutCustomized: true } : {}),
              x: Math.max(
                0,
                Math.min(m.width - p.width, Math.round(d.startX + x - d.x)),
              ),
              y: Math.max(
                0,
                Math.min(m.height - p.height, Math.round(d.startY + y - d.y)),
              ),
            },
      ),
    }));
  };
  const points = (poly: Point[]) =>
    poly.map(([x, y]) => `${x},${model.height - y}`).join(" ");
  return (
    <section className="fc">
      <header className="fc-header">
        <div>
          <p className="ps-eyebrow">WSPÓLNA BIBLIOTEKA WARSZTATU</p>
          <h1>Kreator mebla</h1>
          <p>Obrys, płyty i szuflady. Wszystkie wymiary w mm.</p>
        </div>
        <div className="fc-actions">
          <button onClick={reset} disabled={busy}>
            Nowy mebel
          </button>
          <button onClick={copy} disabled={busy}>
            Utwórz kopię
          </button>
          <button
            className="ps-button"
            onClick={save}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Zapisywanie…" : "Zapisz w bibliotece"}
          </button>
          <button
            onClick={exportConstruction}
            disabled={busy || dirty || version === 0 || demo}
          >
            Pobierz kartę konstrukcji JSON
          </button>
        </div>
      </header>
      {demo && (
        <p className="ps-feedback">
          Tryb pokazowy — zapis działa tylko w tej karcie. Zaloguj się, aby
          korzystać ze wspólnej biblioteki zespołu.
        </p>
      )}
      {error && <Feedback>{error}</Feedback>}
      {message && (
        <p role="status" className="ps-feedback">
          {message}
        </p>
      )}
      <div className="fc-layout">
        <aside className="fc-library">
          <h2>Biblioteka ogólna</h2>
          <label>
            Szukaj mebla
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button onClick={loadLibrary} disabled={loading || demo}>
            {loading ? "Wczytywanie…" : "Odśwież bibliotekę"}
          </button>
          {!loading && !library.length && (
            <p>
              Brak zapisanych mebli. Utwórz pierwszy model i zapisz go tutaj.
            </p>
          )}
          <ul>
            {library
              .filter((e) =>
                e.model.name
                  .toLocaleLowerCase("pl")
                  .includes(query.toLocaleLowerCase("pl")),
              )
              .map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => open(e)}
                    disabled={busy}
                    aria-current={
                      e.id === id && version > 0 ? "true" : undefined
                    }
                  >
                    <strong>{e.model.name}</strong>
                    <span>
                      {e.model.width} × {e.model.height} × {e.model.depth} mm
                    </span>
                    <small>
                      Wersja {e.version} ·{" "}
                      {new Date(e.updatedAt).toLocaleDateString("pl-PL")}
                    </small>
                  </button>
                </li>
              ))}
          </ul>
        </aside>
        <div className="fc-workbench">
          <fieldset disabled={busy} className="fc-layout-choice">
            <legend>Sugerowany układ startowy</legend>
            <label>
              Układ startowy
              <select
                aria-label="Układ startowy"
                value={model.suggestion?.variant ?? "empty"}
                onChange={(e) => {
                  update((m) =>
                    isDeskVariant(e.target.value)
                      ? isDeskVariant(m.suggestion?.variant)
                        ? applySuggestedLayout(
                            m,
                            e.target.value as LayoutVariant,
                            uid,
                          )
                        : deskStartingModel(
                            m,
                            uid,
                            1600,
                            e.target.value as LayoutVariant,
                          )
                      : applySuggestedLayout(
                          m,
                          e.target.value as LayoutVariant,
                          uid,
                        ),
                  );
                  setSelected("");
                }}
              >
                {layoutVariants.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Nowy mebel od razu ma propozycję wnętrza dopasowaną do obrysu.
              Półki, przegrody i fronty możesz przesuwać, usuwać i zmieniać.
              Ręcznie zmienione elementy zachowują wymiary po zmianie gabarytów.
            </p>
            <button
              onClick={() => {
                update((m) =>
                  applySuggestedLayout(m, m.suggestion?.variant ?? "auto", uid),
                );
                setSelected("");
              }}
            >
              Przywróć sugerowany układ
            </button>
            <p>
              Zmiana wariantu lub przywrócenie zastępuje wnętrze i przypisania
              systemów szuflad. Cofnij odtwarza poprzedni projekt. Materiały
              korpusu pozostają zachowane.
            </p>
            {model.suggestion &&
              model.suggestion.variant !== "empty" &&
              !model.plates.some((p) => p.layoutSlot) && (
                <p role="status">
                  W tych gabarytach brakuje miejsca na sugerowane wnętrze.
                  Zwiększ wymiary lub dodaj elementy ręcznie.
                </p>
              )}
          </fieldset>
          {isDeskVariant(model.suggestion?.variant) && (
            <fieldset disabled={busy}>
              <legend>Biurko — wymiary startowe</legend>
              <p>
                Wybór biurka ustawia 1600 × 800 × 740 mm (szerokość × głębokość
                × wysokość górnej powierzchni). Wszystkie wymiary możesz zmienić
                poniżej. Grubość 28 mm jest założeniem projektu.
              </p>
              <div className="fc-actions">
                <button
                  onClick={() => {
                    update((m) => deskStartingModel(m, uid));
                    setSelected("");
                  }}
                >
                  Biurko 160 × 80 cm
                </button>
                <button
                  onClick={() => {
                    update((m) => deskStartingModel(m, uid, 1200));
                    setSelected("");
                  }}
                >
                  Biurko kompaktowe 120 × 80 cm
                </button>
              </div>
              <p>
                DGUV wskazuje 740 ± 20 mm dla stałej wysokości i 800 mm
                głębokości. Wysokość dopasuj do użytkownika oraz krzesła;
                regulacja jest korzystniejsza dla różnych osób. Wariant 120 cm
                jest przeznaczony do ograniczonej ilości sprzętu i dokumentów.
              </p>
              <p>
                Światło między bokami:{" "}
                {deskLegWidth(model).toLocaleString("pl-PL")} mm · wysokość pod
                blatem:{" "}
                {(deskWorktopHeight(model) - model.thickness).toLocaleString(
                  "pl-PL",
                )}{" "}
                mm.
              </p>
              {(model.depth < 800 ||
                deskWorktopHeight(model) < 720 ||
                deskWorktopHeight(model) > 760 ||
                deskLegWidth(model) < 850) && (
                <p role="status">
                  Wymiary odbiegają od punktu startowego ergonomicznego biurka.
                  Sprawdź dopasowanie do osoby, odległość od ekranu i wolną
                  przestrzeń na nogi.
                </p>
              )}
              <p>
                <a
                  href="https://publikationen.dguv.de/widgets/pdf/download/article/409"
                  target="_blank"
                  rel="noreferrer"
                >
                  Zalecenia DGUV
                </a>{" "}
                ·{" "}
                <a
                  href="https://www.worksafe.qld.gov.au/safety-and-prevention/hazards/hazardous-manual-tasks/working-with-computers/setting-up-your-workstation"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ustawienie stanowiska — WorkSafe
                </a>
              </p>
            </fieldset>
          )}
          {(model.suggestion?.variant === "desk-storage" ||
            model.suggestion?.variant === "desk-hutch") && (
            <DeskStorage
              model={model}
              disabled={busy}
              onChange={(patch, height) =>
                update((m) => {
                  const oldFronts = new Set(
                    m.plates
                      .filter(
                        (p) =>
                          (patch.cabinetFront ||
                            patch.side ||
                            patch.cabinetWidth !== undefined) &&
                          (p.kind === "drawer" ||
                            (p.kind === "door" &&
                              p.layoutSlot?.startsWith("desk/cabinet/"))),
                      )
                      .map((p) => p.id),
                  );
                  return resizeFurniture(
                    {
                      ...m,
                      plates: m.plates.filter((p) => !oldFronts.has(p.id)),
                      drawerAssemblies: m.drawerAssemblies?.filter(
                        (a) => !oldFronts.has(a.frontId),
                      ),
                    },
                    {
                      ...(height === undefined ? {} : { height }),
                      ...(patch.cabinetFront ||
                      patch.side ||
                      patch.cabinetWidth !== undefined
                        ? { customDrawerSet: false, drawerFit: "fill" as const }
                        : {}),
                      desk: {
                        worktopHeight: deskWorktopHeight(m),
                        cabinetWidth: deskCabinetWidth(m),
                        hutchDepth: m.desk?.hutchDepth ?? 300,
                        side: m.desk?.side ?? "right",
                        cabinetFront: m.desk?.cabinetFront ?? "door",
                        ...patch,
                        ...(patch.side
                          ? {
                              cabinetWidth: Math.min(
                                deskCabinetWidth(m),
                                Math.max(
                                  140,
                                  patch.side === "both"
                                    ? (m.width - 850) / 2
                                    : m.width - 850 - m.thickness,
                                ),
                              ),
                            }
                          : {}),
                      },
                    },
                    uid,
                  );
                })
              }
            />
          )}
          <ConstructionStandard
            model={model}
            disabled={busy}
            onChange={(patch) =>
              update((m) =>
                resizeFurniture(
                  m,
                  {
                    construction: {
                      ...(m.construction ?? freshConstructionStandard()),
                      ...patch,
                    },
                  },
                  uid,
                ),
              )
            }
            onApply={(replace) =>
              update((m) =>
                applyConstructionStandard(
                  m,
                  m.construction ?? freshConstructionStandard(),
                  uid,
                  replace,
                ),
              )
            }
          />
          <fieldset disabled={busy}>
            <legend>Gabaryty i obrys</legend>
            <div className="fc-fields">
              <label className="fc-name">
                Nazwa mebla
                <input
                  maxLength={100}
                  value={model.name}
                  onChange={(e) =>
                    update((m) => ({ ...m, name: e.target.value }))
                  }
                />
              </label>
              <label>
                Obrys
                <select
                  aria-label="Obrys"
                  disabled={isDeskVariant(model.suggestion?.variant)}
                  value={model.shape}
                  onChange={(e) =>
                    shapeChange({
                      shape: e.target.value as FurnitureModel["shape"],
                    })
                  }
                >
                  <option value="rectangle">Prostokątny</option>
                  <option value="slope">Pod skosem</option>
                  <option value="stairs">Pod schodami</option>
                </select>
              </label>
              <NumberField
                label="Szerokość"
                min={100}
                value={model.width}
                onChange={(v) => shapeChange({ width: v })}
              />
              <NumberField
                label={
                  model.shape === "slope"
                    ? "Wysokość długiej ścianki"
                    : model.suggestion?.variant === "desk-hutch"
                      ? "Wysokość całkowita z nadstawką"
                      : "Wysokość"
                }
                min={100}
                value={model.height}
                onChange={(v) => shapeChange({ height: v })}
              />
              <NumberField
                label="Głębokość"
                min={100}
                value={model.depth}
                onChange={(v) => shapeChange({ depth: v })}
              />
              <NumberField
                label="Grubość płyty"
                min={3}
                max={100}
                value={model.thickness}
                onChange={(v) => shapeChange({ thickness: v })}
              />
              {model.shape !== "rectangle" && (
                <>
                  <NumberField
                    label={
                      model.shape === "slope"
                        ? "Wysokość krótkiej ścianki"
                        : "Niższy koniec"
                    }
                    min={100}
                    value={model.lowHeight}
                    onChange={(v) => shapeChange({ lowHeight: v })}
                  />
                  <label className="fc-check">
                    <input
                      type="checkbox"
                      checked={model.reverse}
                      onChange={(e) =>
                        shapeChange({ reverse: e.target.checked })
                      }
                    />
                    Odwróć kierunek
                  </label>
                </>
              )}
              {model.shape === "stairs" && (
                <NumberField
                  label="Liczba stopni obrysu"
                  min={2}
                  max={20}
                  value={model.steps}
                  onChange={(v) => shapeChange({ steps: v })}
                />
              )}
            </div>
            <p>
              Po zmianie gabarytów własne płyty zachowują pozycje. Korpus i
              wieniec dopasowują się do obrysu; płyty są docinane w podglądzie
              do skosu i schodów.
            </p>
          </fieldset>
          {model.shape === "slope" && <SlopeCutting model={model} />}
          <div className="fc-toolbar">
            <button
              disabled={busy || !history.length}
              onClick={() => {
                setModel(history[history.length - 1]);
                setHistory((h) => h.slice(0, -1));
                setDirty(true);
                setError("");
              }}
            >
              Cofnij
            </button>
            <button onClick={() => addPlate(false)} disabled={busy}>
              + Półka
            </button>
            <button onClick={() => addPlate(true)} disabled={busy}>
              + Przegroda
            </button>
            <div role="group" aria-label="Widok mebla">
              <button
                aria-pressed={view === "2d"}
                onClick={() => setView("2d")}
              >
                Przód 2D
              </button>
              <button
                aria-pressed={view === "3d"}
                onClick={() => setView("3d")}
              >
                Bryła 3D
              </button>
            </div>
            <span role="status">
              {dirty
                ? "Niezapisane zmiany"
                : version
                  ? `Zapisano · wersja ${version}`
                  : "Nowy szkic"}
            </span>
          </div>
          <div className="fc-drawing">
            {view === "3d" ? (
              <Suspense fallback={<p role="status">Ładowanie widoku 3D…</p>}>
                <FurnitureScene
                  key={id}
                  model={model}
                  selected={selected}
                  onSelect={setSelected}
                />
              </Suspense>
            ) : (
              <svg
                ref={svg}
                role="img"
                aria-label="Mebel: wybierz płytę; w widoku 2D przeciągnij lub użyj pól pozycji"
                viewBox={`-60 -60 ${model.width + 120} ${model.height + 120}`}
                onPointerMove={move}
                onPointerUp={() => {
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
              >
                <polygon
                  points={points(furnitureOutline(model))}
                  className="fc-outline"
                />
                {[...model.plates]
                  .sort((a, b) => a.z - b.z)
                  .map((p) => {
                    const poly = platePolygon(model, p);
                    return (
                      <g
                        key={p.id}
                        className={`fc-plate ${selected === p.id ? "selected" : ""} ${p.kind === "drawer" ? "drawer" : ""}`}
                        onPointerDown={(e) => {
                          if (e.target instanceof SVGPolygonElement)
                            beginDrag(
                              e as unknown as PointerEvent<SVGPolygonElement>,
                              p,
                            );
                        }}
                      >
                        <polygon points={points(poly)}>
                          <title>{p.name}</title>
                        </polygon>
                      </g>
                    );
                  })}
              </svg>
            )}
          </div>
          <FurnitureParts model={model} onSelect={setSelected} />
          <details className="fc-part-review">
            <summary>Karta części · dane materiałowe</summary>
            <p>
              Eksport JSON jest dostępny po zapisaniu bieżących zmian w
              bibliotece. Zachowuje obrysy części i oznacza braki materiałowe.
            </p>
            <p>
              Lista braków nie blokuje zapisu szkicu. Nawet po uzupełnieniu
              danych potrzebny jest odbiór technologii połączeń, obróbki i okuć.
              Nie jest to wydanie produkcyjne.
            </p>
            <ul>
              {model.plates.map((p) => {
                const missing = plateSpecificationIssues(model, p);
                const t = plateThickness(model, p);
                return (
                  <li key={p.id}>
                    <button onClick={() => setSelected(p.id)}>{p.name}</button>
                    <span>
                      {p.specification?.material || "Materiał nieokreślony"} ·{" "}
                      {p.specification?.decor || "Dekor nieokreślony"} ·{" "}
                      {t === null
                        ? "Grubość nieokreślona"
                        : `${t.toLocaleString("pl-PL")} mm`}
                    </span>
                    <small>
                      {missing.length
                        ? missing.join("; ")
                        : "Dane materiałowe uzupełnione · technologia do sprawdzenia"}
                    </small>
                  </li>
                );
              })}
            </ul>
          </details>
          {plate && (
            <div ref={specificationPanel}>
              <PlateSpecification
                model={model}
                plate={plate}
                disabled={busy}
                onChange={(specification) => modifyPlate({ specification })}
              />
            </div>
          )}
          <p className="fc-hint">
            Wybierz płytę w rysunku lub na liście. W 2D przeciągnij ją, a
            dokładną pozycję ustaw polami X i Y. X od lewej, Y od dołu, Z od
            tyłu.
          </p>
          {issues.length > 0 && (
            <div role="alert" className="ps-feedback">
              <strong>Popraw przed zapisem:</strong>
              <ul>
                {issues.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <fieldset disabled={busy}>
            <legend>Szuflady — liczba i wysokość frontów</legend>
            <label className="fc-check">
              <input
                type="checkbox"
                checked={model.drawerFit === "fill"}
                onChange={(e) =>
                  update((m) => ({
                    ...m,
                    drawerFit: e.target.checked ? "fill" : "fixed",
                  }))
                }
              />
              Wypełnij szufladami całą komorę
            </label>
            <p>
              {model.drawerFit === "fill"
                ? "Fronty wypełniają wysokość do najbliższej półki lub wieńca, z luzami 2 mm. Podane wysokości wyznaczają proporcje. Dodanie albo przesunięcie półki dopasuje podział. Ręczna zmiana wymiaru frontu przełącza na własne wysokości."
                : "Własne wysokości: fronty zachowują podane wymiary i pozycje. Włącz wypełnianie, aby automatycznie wykorzystać całą komorę."}
            </p>
            <div className="fc-drawers">
              {["Niskie", "Średnie", "Wysokie"].map((label, i) => (
                <div key={label}>
                  <h3>{label}</h3>
                  <NumberField
                    label={`Liczba: ${label.toLowerCase()}`}
                    max={12}
                    value={drawerCounts[i]}
                    onChange={(v) =>
                      setDrawerCounts((c) => c.map((x, j) => (j === i ? v : x)))
                    }
                  />
                  <NumberField
                    label={`Wysokość frontu: ${label.toLowerCase()}`}
                    min={60}
                    max={1200}
                    value={drawerHeights[i]}
                    onChange={(v) =>
                      setDrawerHeights((c) =>
                        c.map((x, j) => (j === i ? v : x)),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <button onClick={addDrawers}>Ustaw zestaw szuflad</button>
            <p>
              Zastępuje obecne fronty szuflad. Od dołu: niskie, średnie,
              wysokie; odstęp 2 mm. Każdy front możesz potem edytować osobno.
              Skrzynki, prowadnice i otworowanie wymagają osobnego doboru okuć.
              Zastąpienie frontów usuwa ich przypisania systemów; Cofnij
              przywraca poprzedni zestaw.
            </p>
          </fieldset>
          <FurnitureDrawers
            model={model}
            disabled={busy}
            saved={!dirty && version > 0 ? savedDrawers : null}
            onChange={(frontId, selection) =>
              update((m) => ({
                ...m,
                drawerAssemblies: [
                  ...(m.drawerAssemblies ?? []).filter(
                    (p) => p.frontId !== frontId,
                  ),
                  ...(selection ? [selection] : []),
                ],
              }))
            }
          />
          <p className="fc-hint">
            Model konstrukcyjny do dalszego opracowania. Nie stanowi
            zatwierdzonej dokumentacji CNC: połączenia, obrzeża, skrzynki
            szuflad i otworowanie wymagają sprawdzenia technologii.
          </p>
        </div>
        <aside className="fc-inspector">
          <h2>Płyty · {model.plates.length}</h2>
          <label>
            Wybierz płytę
            <select
              aria-label="Wybierz płytę"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Wybierz element…</option>
              {model.plates.map((p, i) => (
                <option value={p.id} key={p.id}>
                  {i + 1}. {p.name}
                </option>
              ))}
            </select>
          </label>
          {plate ? (
            <fieldset disabled={busy}>
              <legend>Parametry płyty</legend>
              <button
                onClick={() => {
                  specificationPanel.current?.scrollIntoView({
                    block: "start",
                  });
                  specificationPanel.current
                    ?.querySelector<HTMLInputElement>("input")
                    ?.focus({ preventScroll: true });
                }}
              >
                Materiał i obrzeża tej płyty
              </button>
              <label>
                Nazwa płyty
                <input
                  value={plate.name}
                  maxLength={100}
                  onChange={(e) => modifyPlate({ name: e.target.value })}
                />
              </label>
              {plate.anchor === "back" && (
                <p>
                  Plecy dopasowują się do obrysu. Zmieniaj je w standardzie
                  konstrukcji, a gabaryty w wymiarach mebla.
                </p>
              )}
              {plate.anchor !== "back" &&
                (["x", "y", "z", "width", "height", "depth"] as const).map(
                  (k, i) => (
                    <NumberField
                      key={k}
                      label={
                        [
                          "Pozycja X",
                          "Pozycja Y",
                          "Pozycja Z",
                          "Szerokość płyty",
                          "Wysokość płyty",
                          "Głębokość płyty",
                        ][i]
                      }
                      value={plate[k]}
                      min={i < 3 ? 0 : 1}
                      onChange={(v) =>
                        modifyPlate({
                          [k]: v,
                          ...(plate.kind === "cap" && k !== "z" && k !== "depth"
                            ? { kind: "board" as const }
                            : {}),
                        })
                      }
                    />
                  ),
                )}
              <button
                disabled={plate.anchor === "back"}
                onClick={() =>
                  update((m) => ({
                    ...m,
                    plates: [
                      ...m.plates,
                      {
                        ...plate,
                        id: uid(),
                        name: `${plate.name.slice(0, 88)} — kopia`,
                        anchor: undefined,
                        layoutSlot: undefined,
                        layoutCustomized: undefined,
                        y: Math.min(m.height - plate.height, plate.y + 100),
                      },
                    ],
                  }))
                }
              >
                Duplikuj płytę
              </button>
              <button
                disabled={plate.anchor === "back"}
                onClick={() => {
                  update((m) => ({
                    ...m,
                    plates: m.plates.filter((p) => p.id !== selected),
                    drawerAssemblies: m.drawerAssemblies?.filter(
                      (p) => p.frontId !== selected,
                    ),
                    suggestion:
                      m.suggestion && plate.layoutSlot
                        ? {
                            ...m.suggestion,
                            excludedSlots: [
                              ...new Set([
                                ...m.suggestion.excludedSlots,
                                plate.layoutSlot,
                              ]),
                            ],
                          }
                        : m.suggestion,
                  }));
                  setSelected("");
                }}
              >
                Usuń płytę
              </button>
              <p>Płytę można przywrócić przyciskiem „Cofnij”.</p>
            </fieldset>
          ) : (
            <p>Wybierz element, aby zmienić wymiary lub pozycję.</p>
          )}
        </aside>
      </div>
      {draftGuard.dialog}
    </section>
  );
}
