import { randomId } from "../../uuid";
import { DecorPicker, type DecorChoice } from "../DecorCatalog";
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
  STORAGE_KEY,
  toAnalysis,
  wallIds,
  wallLength,
  type Draft,
} from "./model";
import "./planner.css";
import { KitchenQuote, type QuoteDownloadState } from "./KitchenQuote";
import { KitchenCabinetEditor } from "./KitchenCabinetEditor";
import { useKitchenEstimate, kitchenMoney } from "./useKitchenEstimate";
import { KitchenRoomTools } from "./KitchenRoomTools";
import {
  KitchenProjectReview,
  KitchenCornerTools,
} from "./KitchenProjectTools";
import { KitchenVariants, useKitchenVariants } from "./KitchenVariants";
import { KitchenIslandTools } from "./KitchenIslandTools";
import { KitchenArchitectFiles } from "./KitchenArchitectFiles";
import { useArchitectReferences } from "./useArchitectReferences";
import { kitchenCollisions } from "../../../../src/core/kitchen-collisions";
import { kitchenParallelPassage } from "../../../../src/core/kitchen-passage";
import { kitchenLayoutName } from "../../../../src/core/kitchen-layout";
import { kitchenAdditionFits, planKitchenAddition } from "./catalog-placement";
import { isKitchenUpper } from "../../../../src/core/kitchen-configuration";
import { KitchenDrawerFronts } from "./KitchenDrawerFronts";
import { KitchenRunTools } from "./KitchenRunTools";
import { kitchenFreeGaps } from "../../../../src/core/kitchen-runs";
import { KitchenPlanningTools } from "./KitchenPlanningTools";
import { KitchenZones } from "./KitchenZones";
import { KitchenNeeds, KitchenNeedsReview } from "./KitchenNeeds";
import { kitchenFunction } from "../../../../src/core/kitchen-functions";
import { drawerSourceSchema } from "../calculators/model";
import {
  convertRoomFields,
  prepareRoomDimensions,
  roomFields,
  roomKeys,
  roomLabel,
  roomMillimetres,
  type RoomKey,
  type RoomUnit,
} from "./room-dimensions";
const View3D = lazy(() =>
  import("../../views/Widok3D").then((m) => ({ default: m.Widok3D })),
);
const UNAPPLIED =
  "Najpierw zastosuj zmiany wybranej szafki albo wybierz Anuluj zmiany. Projekt i cena uwzględniają tylko zastosowane wymiary.";
const ROOM_UNIT_KEY = "pan-stolarz.kuchnia-jednostki.v1";
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
export function KitchenPlanner({ staff = false }: { staff?: boolean } = {}) {
  const [initial] = useState(initialDraft);
  const [returnSource] = useState(() => {
    const q = new URLSearchParams(location.hash.split("?")[1] ?? "");
    const parsed = drawerSourceSchema.safeParse({
      cabinet: q.get("szafka"),
      front: q.get("front"),
    });
    return parsed.success ? parsed.data : undefined;
  });
  const returnItem = initial.draft.items.find(
    (i) => i.id === returnSource?.cabinet,
  );
  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [history, setHistory] = useState<Draft[]>([]);
  const [step, setStep] = useState(returnItem ? 1 : 0);
  const [decorOpen, setDecorOpen] = useState(false);
  const requestedDecor = new URLSearchParams(
    location.hash.split("?")[1] ?? "",
  ).get("dekor");
  useEffect(() => {
    if (!requestedDecor) return;
    const c = new AbortController();
    fetch("/catalog/decors.json", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((rows: DecorChoice[]) => {
        const d = rows.find((x) => x.key === requestedDecor);
        if (d && !c.signal.aborted)
          setDraft((old) => ({ ...old, decor: d as Draft["decor"] }));
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError(
            "Nie udało się wczytać wybranego dekoru. Otwórz katalog i wybierz ponownie.",
          );
      });
    return () => c.abort();
  }, [requestedDecor]);
  const [wall, setWall] = useState<"a" | "b" | "c">(
    returnItem?.wall ?? initial.draft.items[0]?.wall ?? "a",
  );
  const [fitRequest, setFitRequest] = useState(0);
  const [view, setView] = useState<"front" | "plan" | "3d">("front");
  const [selected, setSelected] = useState<string | null>(
    returnItem?.id ?? null,
  );
  const [group, setGroup] = useState("base");
  const [gapId, setGapId] = useState("");
  const [notice, setNotice] = useState(
    returnSource && !returnItem
      ? "Wybrana szafka nie jest dostępna w bieżącym szkicu. Możesz wczytać zapisany projekt lub wybrać inną szafkę."
      : "",
  );
  const [error, setError] = useState(initial.error);
  const [saved, setSaved] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [unit, setUnit] = useState<RoomUnit>(() => {
    try {
      return localStorage.getItem(ROOM_UNIT_KEY) === "mm" ? "mm" : "cm";
    } catch {
      return "cm";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(ROOM_UNIT_KEY, unit);
    } catch {
      /* A display preference must not block the kitchen. */
    }
  }, [unit]);
  const [dims, setDims] = useState(() => roomFields(draft, unit));
  const [dimensionErrors, setDimensionErrors] = useState<
    Partial<Record<RoomKey, string>>
  >({});
  const [dimensionError, setDimensionError] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);
  const [cabinetUnit, setCabinetUnit] = useState<RoomUnit | null>(null);
  const [roomDirty, setRoomDirty] = useState(false);
  const [islandDirty, setIslandDirty] = useState(false);
  const [architectDirty, setArchitectDirty] = useState(false);
  const [needsDirty, setNeedsDirty] = useState(false);
  const [roomFormRevision, setRoomFormRevision] = useState(0);
  const variantModel = useKitchenVariants();
  const pending =
    editorDirty || roomDirty || islandDirty || architectDirty || needsDirty;
  const references = useArchitectReferences(draft.architectFiles);
  const [showPlanFunctions, setShowPlanFunctions] = useState(true);
  const [showPlanUnderlay, setShowPlanUnderlay] = useState(true);
  const [quoteDownload, setQuoteDownload] = useState<QuoteDownloadState>({
    key: "",
    ready: false,
    busy: false,
  });
  const editorBlocked = () => {
    if (!pending) return false;
    setError(
      needsDirty
        ? "Zapisz potrzeby domowników albo anuluj odpowiedzi."
        : islandDirty
          ? "Zastosuj wyspę albo anuluj jej zmiany."
          : architectDirty
            ? "Zapisz ustawienia pliku lub zamknij jego edycję. Poczekaj na zakończenie odczytu plików."
            : roomDirty
              ? "Zapisz oznaczenie pomieszczenia albo anuluj jego edycję."
              : UNAPPLIED,
    );
    requestAnimationFrame(() => {
      if (needsDirty) {
        document.querySelector<HTMLButtonElement>("[data-save-needs]")?.focus();
        return;
      }
      if (islandDirty || architectDirty) {
        const tools = document.querySelector<HTMLDetailsElement>(
          islandDirty ? ".kp-island-tools" : ".kp-architect-tools",
        );
        if (tools) tools.open = true;
        tools
          ?.querySelector<HTMLButtonElement>(
            islandDirty ? "[data-save-island]" : "[data-save-architect]",
          )
          ?.focus();
        return;
      }
      const roomTools =
        document.querySelector<HTMLDetailsElement>(".kp-room-tools");
      if (roomDirty && roomTools) roomTools.open = true;
      document
        .querySelector<HTMLButtonElement>(
          roomDirty ? "[data-save-room-feature]" : "[data-apply-cabinet]",
        )
        ?.focus();
    });
    return true;
  };
  const focusEditor = () =>
    requestAnimationFrame(() =>
      document.getElementById("kp-editor-title")?.focus(),
    );
  const chooseCabinet = (id: string | null, targetWall?: "a" | "b" | "c") => {
    if ((id !== selected || roomDirty) && editorBlocked()) return;
    if (id && draft.island?.items.some((i) => i.id === id)) {
      setSelected(id);
      setView("plan");
      return;
    }
    if ((targetWall as string) === "island") {
      const tools =
        document.querySelector<HTMLDetailsElement>(".kp-island-tools");
      if (tools) {
        tools.open = true;
        tools.scrollIntoView({ block: "center" });
      }
      return;
    }
    const selectedWall =
      targetWall ?? draft.items.find((item) => item.id === id)?.wall;
    if (selectedWall) setWall(selectedWall);
    setSelected(id);
    if (id) setGapId("");
    if (id) focusEditor();
  };
  useEffect(() => {
    if (!pending)
      setError((old) =>
        old === UNAPPLIED ||
        old === "Zapisz potrzeby domowników albo anuluj odpowiedzi." ||
        old === "Zastosuj wyspę albo anuluj jej zmiany." ||
        old ===
          "Zapisz ustawienia pliku lub zamknij jego edycję. Poczekaj na zakończenie odczytu plików." ||
        old === "Zapisz oznaczenie pomieszczenia albo anuluj jego edycję."
          ? ""
          : old,
      );
  }, [pending]);
  const prepareRoom = (): Draft | undefined => {
    const result = prepareRoomDimensions(draft, dims, unit);
    setDimensionErrors(result.errors);
    if (!result.draft) {
      const first = roomKeys(draft.layout).find((key) => result.errors[key]);
      setDimensionError(
        first ? result.errors[first]! : "Sprawdź wymiary pomieszczenia.",
      );
      document.getElementById(`kp-${first ?? "width"}`)?.focus();
      return undefined;
    }
    setDimensionError("");
    return result.draft as Draft;
  };
  const file = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const analysis = useMemo(() => toAnalysis(draft), [draft]);
  const passage = useMemo(
    () => kitchenParallelPassage(draft, analysis.zbudowane),
    [draft, analysis],
  );
  const collisions = useMemo(
    () => kitchenCollisions(draft, analysis.projekt.moduly),
    [draft, analysis],
  );
  const collisionIds = [...new Set(collisions.flatMap((c) => c.ids))];
  useEffect(() => {
    if (!returnItem) return;
    if (
      !analysis.zbudowane
        .find((b) => b.modul.id === returnItem.id)
        ?.elementy.some(
          (e) => e.rola === "front" && e.kod === returnSource?.front,
        )
    )
      setNotice(
        "Wybrany front nie występuje już w tej szafce. Wybierz front z bieżącego układu.",
      );
    const frame = requestAnimationFrame(() =>
      document
        .querySelector<HTMLSelectElement>(".kp-drawer-choice select")
        ?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [returnItem]);
  const issues = useMemo(() => layoutIssues(draft), [draft]);
  const estimate = useKitchenEstimate(
    draft,
    step === 0 ||
      (!draft.items.length && !draft.island?.items.length) ||
      !!issues.length ||
      conflict !== null ||
      pending,
  );
  const gaps = (["base", "wall"] as const).flatMap((t) =>
    kitchenFreeGaps(draft, wall, t),
  );
  const activeGap = gaps.find((g) => g.id === gapId);
  const chooseGap = (targetWall: "a" | "b" | "c", id: string) => {
    if (editorBlocked()) return;
    setWall(targetWall);
    setSelected(null);
    setGapId(id);
    const gap = kitchenFreeGaps(
      draft,
      targetWall,
      id.includes(":wall:") ? "wall" : "base",
    ).find((g) => g.id === id);
    setGroup(
      gap && gap.width < 200
        ? "fillers"
        : id.includes(":wall:")
          ? "wall"
          : "base",
    );
    requestAnimationFrame(() =>
      document.getElementById("kp-catalog-title")?.focus(),
    );
  };
  const availableCatalog = useMemo(
    () =>
      catalog.filter((entry) =>
        kitchenAdditionFits(draft, wall, entry.id, gapId),
      ),
    [draft, wall, gapId],
  );
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
  const syncDimensions = (d: Draft) => setDims(roomFields(d, unit));
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
        pending ||
        Object.entries(dims).some(
          ([k, v]) =>
            roomMillimetres(v, unit) !== draft[k as keyof typeof dims],
        )
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [saved, dims, draft, unit, pending]);
  const go = (next: number, discardEdits = false) => {
    if (!discardEdits && editorBlocked()) return;
    if (next === 2 && !draft.items.length && !draft.island?.items.length) {
      setError("Dodaj szafki lub ułóż proponowaną kuchnię, aby poznać cenę.");
      return;
    }
    setStep(next);
    setNotice("");
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
  };
  const undo = () => {
    if (editorBlocked()) return;
    const prev = history.at(-1);
    if (!prev) return;
    setDraft(prev);
    syncDimensions(prev);
    setWall("a");
    setHistory((h) => h.slice(0, -1));
    setNotice("Cofnięto ostatnią zmianę.");
  };
  const add = (catalogId: string) => {
    if (editorBlocked()) return;
    setNotice("");
    let next: Draft;
    try {
      next = planKitchenAddition(draft, wall, catalogId, gapId, randomId);
    } catch (problem) {
      setError((problem as Error).message);
      return;
    }
    change(next);
    setSelected(
      next.items.find((i) => !draft.items.some((old) => old.id === i.id))!.id,
    );
    setGapId("");
    focusEditor();
    setNotice("Dodano szafkę do ściany " + wall.toUpperCase() + ".");
  };
  const move = (id: string, delta: number) => {
    if (editorBlocked()) return;
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
    if (editorBlocked()) return;
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
    if (editorBlocked()) return;
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
  const visibleCatalog = availableCatalog.filter((m) =>
    group === "drawers"
      ? m.construction === "drawers"
      : group === "base"
        ? m.category === "base" && m.construction === "shelves"
        : group === "tall"
          ? m.category === "tall" && m.construction !== "filler"
          : group === "water"
            ? ["sink", "dishwasherFront"].includes(m.construction)
            : group === "cooking"
              ? ["oven", "hood"].includes(m.construction)
              : group === "cooling"
                ? m.construction === "refrigerator"
                : group === "fillers"
                  ? m.construction === "filler"
                  : m.category === "wall" && m.construction !== "filler",
  );
  const cabinetEditor =
    selected &&
    draft.items.some((i) => i.id === selected) &&
    (() => {
      const item = draft.items.find((i) => i.id === selected)!;
      const module = analysis.projekt.moduly.find((m) => m.id === selected)!;
      const built = analysis.zbudowane.find((b) => b.modul.id === selected)!;
      return (
        <>
          <KitchenCabinetEditor
            key={`editor-${JSON.stringify(item)}`}
            draft={draft}
            item={item}
            module={module}
            defaultUnit={cabinetUnit ?? (staff ? "mm" : unit)}
            onUnitChange={setCabinetUnit}
            onApply={(next) => {
              change(next);
              setNotice(
                "Zmieniono szafkę. Projekt i wycena uwzględnią nowe wyposażenie oraz wymiary. Możesz cofnąć tę zmianę.",
              );
              focusEditor();
            }}
            onClose={() => {
              if (editorBlocked()) return;
              setSelected(null);
              requestAnimationFrame(() =>
                document
                  .querySelector<HTMLButtonElement>(
                    ".kp-preview-toolbar button",
                  )
                  ?.focus(),
              );
            }}
            disabled={conflict !== null || roomDirty}
            onDirtyChange={setEditorDirty}
          />
          {staff && (
            <KitchenDrawerFronts
              key={`drawers-${JSON.stringify(item)}`}
              draft={draft}
              built={built}
              initialCode={
                selected === returnSource?.cabinet
                  ? returnSource.front
                  : undefined
              }
            />
          )}
        </>
      );
    })();
  const catalogPanel = (
    <aside
      key="kitchen-catalog"
      className="kp-panel kp-catalog"
      aria-label={step === 1 ? "Szafki i wyposażenie" : "Wycena kuchni"}
    >
      {step === 1 && cabinetEditor}
      <h2 id="kp-catalog-title" tabIndex={-1}>
        {step === 1 ? "Dodaj szafki" : "Podsumowanie"}
      </h2>
      {step === 1 ? (
        <>
          <KitchenPlanningTools
            key={JSON.stringify([draft.planning, draft.layout])}
            draft={draft}
            disabled={conflict !== null || pending}
            onApply={(next) => {
              change(next);
              setSelected(null);
              setNotice(
                "Ułożono strefy: hydraulika, przygotowanie, gotowanie i chłodzenie. Zmywarka sąsiaduje ze zlewem, okap jest nad płytą. Możesz edytować szafki lub cofnąć cały układ. Przyłącza i narożniki wymagają opracowania.",
              );
            }}
          />
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
                  chooseCabinet(null, w as "a" | "b" | "c");
                }}
              >
                Ściana {w.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="kp-capacity">
            Dolna i wysoka zabudowa:{" "}
            <strong>
              {kitchenFreeGaps(draft, wall, "base").reduce(
                (sum, g) => sum + g.width,
                0,
              )}{" "}
              mm wolne
            </strong>
            <small>
              Górne:{" "}
              {kitchenFreeGaps(draft, wall, "wall").reduce(
                (sum, g) => sum + g.width,
                0,
              )}{" "}
              mm do wykorzystania
            </small>
          </p>
          <label className="kp-select-label">
            Miejsce dodawania
            <select
              aria-label="Miejsce dodawania"
              value={activeGap?.id ?? ""}
              onChange={(e) => {
                if (editorBlocked()) return;
                setGapId(e.target.value);
                if (e.target.value)
                  setGroup(
                    (gaps.find((g) => g.id === e.target.value)?.width ?? 200) <
                      200
                      ? "fillers"
                      : e.target.value.includes(":wall:")
                        ? "wall"
                        : "base",
                  );
              }}
            >
              <option value="">Na końcu rzędu</option>
              {gaps
                .filter((g) => g.width >= 20)
                .map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.tier === "wall" ? "Górne" : "Dolne / wysokie"} ·{" "}
                    {g.width / 10} cm od {g.start / 10} cm
                  </option>
                ))}
            </select>
          </label>
          {gapId && (
            <p className="kp-gap-context" role="status">
              {activeGap
                ? `Wybrana luka: ${activeGap.width / 10} cm. Pokazujemy wyłącznie pasujące warianty; szafki bez AGD mogą mieć dopasowaną szerokość.`
                : "Luka zmieniła się. Wybierz ją ponownie."}
              <button className="ps-text-button" onClick={() => setGapId("")}>
                Zakończ dodawanie w luce
              </button>
            </p>
          )}
          <label className="kp-select-label">
            Rodzaj szafek
            <select
              aria-label="Rodzaj szafek"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option value="base">Dolne z drzwiami</option>
              <option value="drawers">Z szufladami</option>
              <option value="wall">Wiszące</option>
              <option value="tall">Słupki</option>
              <option value="water">Hydraulika · zlew i zmywarka</option>
              <option value="cooking">AGD · gotowanie i okap</option>
              <option value="cooling">AGD · lodówka</option>
              <option value="fillers">Blendy</option>
            </select>
          </label>
          {!visibleCatalog.length && (
            <div className="kp-catalog-empty" role="status">
              <strong>Brak pasujących szafek tego rodzaju.</strong>
              <p>
                Kliknij szafkę na rysunku, aby zmienić jej szerokość lub
                wyposażenie. Możesz też wybrać inną ścianę albo wolną lukę.
              </p>
              {activeModules.length > 0 && (
                <button
                  className="ps-button secondary"
                  disabled={conflict !== null}
                  onClick={() =>
                    chooseCabinet(
                      (
                        activeModules.find(
                          (m) =>
                            m.kategoria === "base" &&
                            ["shelves", "drawers"].includes(m.konstrukcja),
                        ) ?? activeModules[0]
                      ).id,
                    )
                  }
                >
                  Wybierz szafkę do zmiany
                </button>
              )}
            </div>
          )}
          <div className="kp-catalog-items">
            {visibleCatalog.map((m) => (
              <button
                key={m.id}
                disabled={conflict !== null}
                onClick={() => add(m.id)}
              >
                <span
                  className={`kp-cabinet-icon ${m.construction}`}
                  aria-hidden="true"
                />
                <span>
                  <strong>Dodaj: {m.name}</strong>
                  <small>
                    {m.widthMM} × {m.heightMM}
                    {m.construction === "filler"
                      ? " mm · płyta frontowa"
                      : ` × ${m.depthMM} mm`}
                  </small>
                </span>
                <IconPlus size={18} />
              </button>
            ))}
          </div>
          <p className="kp-muted">
            {activeGap
              ? "Dodamy w wybranej luce bez przesuwania pozostałych szafek."
              : "Dodajemy na końcu wybranego rzędu. Możesz też wybrać wolną lukę na rysunku lub w polu Miejsce dodawania."}
          </p>
        </>
      ) : (
        <>
          <KitchenQuote
            estimate={estimate}
            draft={draft}
            onChange={change}
            onDownloadState={setQuoteDownload}
            disabled={!!issues.length || conflict !== null || pending}
          />
          {cabinetEditor}
          <details className="kp-quote-parameters">
            <summary>Parametry szkicu</summary>
            <dl className="kp-summary">
              <dt>Układ</dt>
              <dd>{kitchenLayoutName(draft.layout)}</dd>
              <dt>Ściana A</dt>
              <dd>{draft.width} mm</dd>
              {(draft.layout === "l" || draft.layout === "u") && (
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
              {draft.layout === "parallel" && (
                <>
                  <dt>Ściana C</dt>
                  <dd>{draft.width} mm</dd>
                  <dt>Odległość A–C</dt>
                  <dd>{draft.depth} mm</dd>
                </>
              )}
              <dt>Wysokość</dt>
              <dd>{draft.height} mm</dd>
              <dt>Szafki</dt>
              <dd>{draft.items.length}</dd>
              <dt>Fronty</dt>
              <dd>
                {draft.decor
                  ? `${draft.decor.manufacturer} ${draft.decor.id} — ${draft.decor.name}`
                  : finishes.find((f) => f.id === draft.finish)?.name}
              </dd>
            </dl>
          </details>
          <button
            className="ps-button"
            disabled={
              (!draft.items.length && !draft.island?.items.length) ||
              !!issues.length ||
              conflict !== null
            }
            onClick={handoff}
          >
            Przejdź do zapytania <IconArrowRight size={18} />
          </button>
          <p className="kp-muted">
            Opis układu trafi do formularza. Przed wysłaniem podasz dane
            kontaktowe.
          </p>
          <button className="ps-button secondary" onClick={download}>
            <IconDownload size={18} />
            Pobierz szkic JSON
          </button>
        </>
      )}
    </aside>
  );
  return (
    <div className="kp-page kp-editing">
      <header className="ps-public-header">
        <a href="#/">
          <Logo />
        </a>
        <span className="kp-header-label">Kreator kuchni</span>
        {staff && <a href="#/panel/szuflady">Kalkulatory stolarza</a>}
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
              : pending
                ? needsDirty
                  ? "Potrzeby domowników czekają na zapisanie"
                  : roomDirty
                    ? "Zmiany pomieszczenia czekają na zapisanie"
                    : "Zmiany szafki czekają na zastosowanie"
                : saved
                  ? "Szkic zapisany na tym urządzeniu"
                  : storageFailed
                    ? "Zapis lokalny niedostępny — pobierz szkic"
                    : "Zapisywanie szkicu…"}
          </span>
        </div>
        <nav className="kp-steps" aria-label="Etapy planowania">
          {["Pomieszczenie", "Szafki i wygląd", "Wycena i PDF"].map(
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
                {(["straight", "l", "u", "parallel"] as const).map((layout) => (
                  <button
                    key={layout}
                    aria-pressed={draft.layout === layout}
                    onClick={() => {
                      if (editorBlocked()) return;
                      if (
                        draft.features?.some(
                          (f) => !wallIds({ layout }).includes(f.wall),
                        )
                      ) {
                        setError(
                          "Najpierw przenieś okna, drzwi i przyłącza ze ścian usuwanych z układu.",
                        );
                        return;
                      }
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
                      if (
                        draft.planning?.waterWall &&
                        draft.planning.waterWall !== "auto" &&
                        !wallIds({ layout }).includes(draft.planning.waterWall)
                      ) {
                        setError(
                          "Najpierw zmień ścianę zlewu w założeniach kuchni. Wskazana hydraulika znajduje się na usuwanej ścianie.",
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
                    {kitchenLayoutName(layout)}
                    <small>
                      {layout === "parallel"
                        ? "Dwa równoległe ciągi z przejściem"
                        : layout === "straight"
                          ? "Zabudowa w jednej linii"
                          : layout === "l"
                            ? "Dwie ściany pod kątem prostym"
                            : "Trzy ściany wokół Ciebie"}
                    </small>
                  </button>
                ))}
              </div>
              <form
                id="kp-room-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editorBlocked()) return;
                  const next = prepareRoom();
                  if (!next) return;
                  change(next);
                  go(1);
                }}
              >
                <h2>Podaj wymiary pomieszczenia</h2>
                <label className="kp-unit-choice">
                  Jednostka wymiarów
                  <select
                    aria-label="Jednostka wymiarów"
                    value={unit}
                    onChange={(e) => {
                      const next = e.target.value as RoomUnit;
                      setDims(convertRoomFields(dims, unit, next));
                      setUnit(next);
                      setDimensionError("");
                      setDimensionErrors({});
                    }}
                  >
                    <option value="cm">Centymetry (cm)</option>
                    <option value="mm">Milimetry (mm)</option>
                  </select>
                </label>
                <p className="kp-muted" id="kp-unit-help">
                  Zmierz ściany, przy których staną meble.{" "}
                  {unit === "cm"
                    ? "Np. ściana 3,6 m to 360 cm."
                    : "Np. ściana 3,6 m to 3600 mm."}{" "}
                  Nie musisz znać dokładnego układu szafek.
                </p>
                <div className="kp-dimensions">
                  {roomKeys(draft.layout).map((key) => (
                    <label key={key} htmlFor={`kp-${key}`}>
                      {roomLabel(key, draft.layout)}
                      <span>
                        <input
                          id={`kp-${key}`}
                          inputMode={unit === "cm" ? "decimal" : "numeric"}
                          value={dims[key]}
                          aria-invalid={!!dimensionErrors[key]}
                          aria-describedby={
                            dimensionErrors[key]
                              ? "kp-dim-error kp-unit-help"
                              : "kp-unit-help"
                          }
                          onChange={(e) => {
                            setDims((d) => ({ ...d, [key]: e.target.value }));
                            setDimensionErrors({});
                            setDimensionError("");
                          }}
                        />{" "}
                        {unit}
                      </span>
                    </label>
                  ))}
                </div>
                {dimensionError && (
                  <p className="kp-error" id="kp-dim-error" role="alert">
                    {dimensionError}
                  </p>
                )}
              </form>
              <KitchenPlanningTools
                key={JSON.stringify([draft.planning, draft.layout])}
                draft={draft}
                prepareDraft={prepareRoom}
                wholeKitchen
                disabled={conflict !== null || pending}
                onApply={(next) => {
                  change(next);
                  syncDimensions(next);
                  setSelected(null);
                  go(1);
                  setNotice(
                    "Propozycja gotowa. Wybierz szafkę, aby dopasować jej wymiary i wyposażenie.",
                  );
                }}
              />
              <p className="kp-muted kp-start-help">
                Ułożymy kompletną propozycję z AGD, zlewem i miejscem do pracy.
                Wszystko możesz później zmienić.
              </p>
              <button
                form="kp-room-form"
                type="submit"
                className="ps-text-button kp-manual-start"
              >
                Przejdź do szafek <IconArrowRight size={18} />
                <small>
                  {draft.items.length
                    ? "Zachowaj obecny układ i przejdź do edycji"
                    : "Samodzielnie dodam szafki od zera"}
                </small>
              </button>
              <KitchenRoomTools
                key={roomFormRevision}
                onDirtyChange={setRoomDirty}
                draft={draft}
                disabled={conflict !== null || needsDirty}
                onApply={change}
              />
              <KitchenArchitectFiles
                key={roomFormRevision}
                draft={draft}
                disabled={
                  conflict !== null ||
                  editorDirty ||
                  roomDirty ||
                  islandDirty ||
                  needsDirty
                }
                onDirtyChange={setArchitectDirty}
                onApply={(next) => {
                  change(next);
                  syncDimensions(next);
                }}
              />
            </div>
            <aside className="kp-panel kp-needs-setup">
              <KitchenNeeds
                key={JSON.stringify([
                  draft.needs,
                  draft.planning,
                  roomFormRevision,
                ])}
                draft={draft}
                disabled={
                  conflict !== null ||
                  editorDirty ||
                  roomDirty ||
                  islandDirty ||
                  architectDirty
                }
                onDirtyChange={setNeedsDirty}
                onApply={(next) => {
                  change(next);
                  setNotice(
                    next.items.length
                      ? "Potrzeby zapisane. Szafki pozostają bez zmian. Nowe odpowiedzi wykorzystamy przy układaniu nowej propozycji."
                      : "Potrzeby zapisane. Podaj wymiary i wybierz Ułóż całą kuchnię.",
                  );
                  requestAnimationFrame(() =>
                    document.getElementById("kp-width")?.focus(),
                  );
                }}
              />
              {(draft.layout === "l" || draft.layout === "u") && (
                <p>
                  W propozycji zostawiamy po 65 cm na obu ramionach każdego
                  narożnika, żeby fronty sąsiednich szafek miały miejsce na
                  otwarcie. Tę przestrzeń może wykorzystać właściwie dobrana
                  szafka narożna.
                </p>
              )}
              <p className="kp-muted">
                Szkic nie zastępuje pomiaru w Twoim domu.
              </p>
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
            <div className="kp-workbench" data-step={step}>
              {step === 2 && catalogPanel}
              <section
                key="kitchen-preview"
                className="kp-preview-area"
                aria-label="Podgląd kuchni"
              >
                <div className="kp-preview-stage">
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
                    {view === "3d" && (
                      <button
                        className="ps-text-button"
                        onClick={() => setFitRequest((n) => n + 1)}
                      >
                        Pokaż całość
                      </button>
                    )}
                    <button
                      className="ps-text-button"
                      disabled={!history.length}
                      onClick={undo}
                    >
                      <IconArrowBackUp size={18} />
                      Cofnij
                    </button>
                  </div>
                  {step === 1 && (
                    <div
                      className="kp-live-price"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <span>Cena orientacyjna brutto</span>
                      <strong>
                        {pending
                          ? "Zastosuj zmiany"
                          : issues.length
                            ? "Popraw układ"
                            : !draft.items.length && !draft.island?.items.length
                              ? "Dodaj szafki"
                              : estimate.error
                                ? "Cena niedostępna"
                                : estimate.data?.gross != null
                                  ? kitchenMoney(estimate.data.gross)
                                  : estimate.data?.status === "blocked"
                                    ? "Sprawdź projekt"
                                    : "Obliczamy…"}
                      </strong>
                      {estimate.delta != null &&
                        estimate.delta !== 0 &&
                        !pending &&
                        estimate.data?.gross != null && (
                          <small>
                            Ostatnia zmiana: {estimate.delta > 0 ? "+" : "−"}
                            {kitchenMoney(Math.abs(estimate.delta))}
                          </small>
                        )}
                      {estimate.error && (
                        <button
                          className="ps-text-button"
                          onClick={estimate.retry}
                        >
                          Ponów wycenę
                        </button>
                      )}
                      <small>Stawki modelowe · potwierdzimy po pomiarze</small>
                    </div>
                  )}
                  {view === "plan" && (
                    <div
                      className="kp-plan-tools"
                      role="group"
                      aria-label="Czytelność rzutu"
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={showPlanFunctions}
                          onChange={(e) =>
                            setShowPlanFunctions(e.target.checked)
                          }
                        />{" "}
                        Oznaczenia AGD i zlewu
                      </label>
                      {(references.paths.length > 0 ||
                        references.images.length > 0) && (
                        <label>
                          <input
                            type="checkbox"
                            checked={showPlanUnderlay}
                            onChange={(e) =>
                              setShowPlanUnderlay(e.target.checked)
                            }
                          />{" "}
                          Podkład rzutu
                        </label>
                      )}
                      {passage && (
                        <span data-passage-summary>
                          {passage.distanceMM >= 0
                            ? `Przejście: ${(passage.distanceMM / 10).toLocaleString("pl-PL")} cm`
                            : `Nakładanie zabudowy: ${Math.abs(passage.distanceMM / 10).toLocaleString("pl-PL")} cm`}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="kp-canvas">
                    {view === "front" ? (
                      <Elewacja
                        collisionIds={collisionIds}
                        showFunctions
                        analiza={analysis}
                        scianaId={wall}
                        dlugosc={length}
                        wysokosc={draft.height}
                        matMap={matMap}
                        wybrany={selected}
                        onWybierz={chooseCabinet}
                        readOnly
                        roomFeatures={draft.features}
                        kitchenGaps={step === 1 ? gaps : []}
                        onKitchenGap={(id) => chooseGap(wall, id)}
                      />
                    ) : view === "plan" ? (
                      <Rzut
                        showWorktops
                        showFunctions={showPlanFunctions}
                        showUnderlay={showPlanUnderlay}
                        passage={passage}
                        collisionIds={collisionIds}
                        roomFootprint={
                          draft.island ||
                          references.paths.length ||
                          references.images.length
                            ? { width: draft.width, depth: draft.depth }
                            : undefined
                        }
                        architectPaths={references.paths}
                        architectImages={references.images}
                        roomFeatures={draft.features}
                        analiza={analysis}
                        pomieszczenieId="kitchen"
                        scianaId={wall}
                        wybrany={selected}
                        matMap={matMap}
                        onSciana={(id) =>
                          chooseCabinet(null, id as "a" | "b" | "c")
                        }
                        onWybierz={chooseCabinet}
                      />
                    ) : (
                      <PreviewBoundary key={view}>
                        <Suspense
                          fallback={
                            <p role="status">Wczytywanie podglądu 3D…</p>
                          }
                        >
                          <View3D
                            roomFeatures={draft.features}
                            fitRequest={fitRequest}
                            klient
                            key={wall}
                            fitContainer
                            analiza={analysis}
                            pomieszczenieId="kitchen"
                            scianaId={wall}
                            wybrany={selected}
                            matMap={matMap}
                            onWybierz={chooseCabinet}
                          />
                        </Suspense>
                      </PreviewBoundary>
                    )}
                    {!draft.items.length && !draft.island?.items.length && (
                      <div className="kp-canvas-empty">
                        <strong>Tu powstanie Twoja kuchnia</strong>
                        <span>Dodaj pierwszą szafkę z katalogu.</span>
                      </div>
                    )}
                  </div>
                  {collisions.length > 0 && (
                    <div className="kp-collision-summary">
                      <Feedback>
                        <strong>Kolizja lub zablokowane otwieranie</strong>
                        <p>{collisions[0].message}</p>
                        <div className="kp-actions">
                          {collisions[0].ids.map((id) => {
                            const m = analysis.projekt.moduly.find(
                              (m) => m.id === id,
                            )!;
                            return (
                              <button
                                key={id}
                                className="ps-button secondary"
                                onClick={() =>
                                  chooseCabinet(
                                    id,
                                    m.scianaId as "a" | "b" | "c",
                                  )
                                }
                              >
                                Popraw: {m.nazwa} · {m.scianaId.toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      </Feedback>
                    </div>
                  )}
                  <p className="kp-preview-caption">
                    {view === "3d"
                      ? "Przeciągnij, aby obrócić. Przybliżaj kółkiem myszy lub gestem."
                      : view === "plan"
                        ? "Kliknij szafkę na rzucie lub wybierz ją z listy, aby ją zmienić."
                        : `Ściana ${wall.toUpperCase()} · ${length} mm · kliknij szafkę na rysunku lub wybierz ją z listy.`}{" "}
                    Kolory są poglądowe.
                    {view === "plan" &&
                      passage &&
                      " Przejście mierzymy przy zamkniętych szafkach; otwieranie sprawdzamy osobno."}
                    {view === "plan" &&
                      showPlanFunctions &&
                      " Oznaczenia AGD są schematyczne."}
                  </p>
                </div>
              </section>
              <section
                className="kp-design-tools"
                aria-label="Narzędzia projektu i lista szafek"
              >
                <KitchenNeedsReview
                  draft={draft}
                  onSelect={chooseCabinet}
                  onEdit={() => go(0)}
                />
                {references.errors.map((message, n) => (
                  <Feedback key={n}>{message}</Feedback>
                ))}
                {step === 1 && (
                  <>
                    <KitchenIslandTools
                      key={JSON.stringify(draft.island)}
                      selected={selected}
                      draft={draft}
                      disabled={
                        conflict !== null ||
                        editorDirty ||
                        roomDirty ||
                        architectDirty
                      }
                      onDirtyChange={setIslandDirty}
                      onApply={(next) => {
                        change(next);
                        setSelected(null);
                        setView("plan");
                      }}
                    />
                    <KitchenArchitectFiles
                      key={roomFormRevision}
                      draft={draft}
                      disabled={
                        conflict !== null ||
                        editorDirty ||
                        roomDirty ||
                        islandDirty
                      }
                      onDirtyChange={setArchitectDirty}
                      onApply={(next) => {
                        change(next);
                        syncDimensions(next);
                        setSelected(null);
                        setView("plan");
                      }}
                    />
                  </>
                )}
                {step === 1 && (
                  <KitchenRunTools
                    key={wall}
                    draft={draft}
                    wall={wall}
                    disabled={conflict !== null || pending}
                    onSelect={chooseCabinet}
                    onApply={(items, message) => {
                      change({ ...draft, items });
                      setNotice(message);
                    }}
                  />
                )}
                <details className="kp-zone-details">
                  <summary>Zlew, AGD i miejsce do pracy</summary>
                  <KitchenZones
                    draft={draft}
                    onSelect={(m) => {
                      chooseCabinet(m.id, m.scianaId as "a" | "b" | "c");
                    }}
                  />
                </details>
                {step === 1 && (
                  <>
                    <KitchenProjectReview
                      draft={draft}
                      disabled={pending || conflict !== null}
                      onGap={chooseGap}
                      onSelect={(id) =>
                        chooseCabinet(
                          id,
                          analysis.projekt.moduly.find((m) => m.id === id)
                            ?.scianaId as "a" | "b" | "c",
                        )
                      }
                      onRoom={() => go(0)}
                    />
                    <KitchenRoomTools
                      key={roomFormRevision}
                      onDirtyChange={setRoomDirty}
                      draft={draft}
                      disabled={
                        editorDirty ||
                        islandDirty ||
                        architectDirty ||
                        conflict !== null
                      }
                      onApply={(next) => {
                        change(next);
                        setSelected(null);
                      }}
                    />
                    <KitchenCornerTools
                      draft={draft}
                      disabled={pending || conflict !== null}
                      onApply={(items) => {
                        change({ ...draft, items });
                        setSelected(null);
                      }}
                    />
                  </>
                )}
                <KitchenVariants
                  model={variantModel}
                  draft={draft}
                  disabled={pending || conflict !== null}
                  onApply={(next) => {
                    change(next);
                    syncDimensions(next);
                    setSelected(null);
                    setWall(next.items[0]?.wall ?? "a");
                    setGapId("");
                  }}
                />
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
                        disabled={
                          islandDirty || architectDirty || conflict !== null
                        }
                        aria-pressed={draft.finish === f.id}
                        onClick={() =>
                          change({ ...draft, finish: f.id, decor: undefined })
                        }
                      >
                        <span style={{ background: f.color }} />
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
                <section className="kp-decor-selection">
                  <h2>Dekor frontów z katalogu</h2>
                  {draft.decor && (
                    <div>
                      <img
                        src={draft.decor.obraz}
                        alt={draft.decor.name}
                        width="160"
                        height="90"
                      />
                      <p>
                        {draft.decor.manufacturer} · {draft.decor.id} ·{" "}
                        {draft.decor.name}
                      </p>
                    </div>
                  )}
                  <p>
                    Wybór zapisujemy w szkicu i opisie zapytania. Model 3D
                    pokazuje kolor poglądowy; zdjęcie próbki nie jest teksturą w
                    skali.
                  </p>
                  <button
                    className="ps-button secondary"
                    aria-expanded={decorOpen}
                    disabled={
                      islandDirty || architectDirty || conflict !== null
                    }
                    onClick={() => setDecorOpen((v) => !v)}
                  >
                    {decorOpen ? "Zamknij katalog" : "Wybierz dekor z katalogu"}
                  </button>
                  {decorOpen && (
                    <DecorPicker
                      selected={draft.decor?.key}
                      onSelect={(d) => {
                        if (editorBlocked()) return;
                        change({ ...draft, decor: d as Draft["decor"] });
                        setDecorOpen(false);
                      }}
                    />
                  )}
                </section>
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
                          onClick={() =>
                            chooseCabinet(null, w as "a" | "b" | "c")
                          }
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
                            isUpper(p.katalogId ?? "") ===
                            isUpper(m.katalogId ?? ""),
                        );
                        const index = peers.findIndex((p) => p.id === m.id);
                        return (
                          <li
                            key={m.id}
                            className={selected === m.id ? "selected" : ""}
                          >
                            <button
                              className="kp-item-name"
                              onClick={() => chooseCabinet(m.id)}
                              aria-pressed={selected === m.id}
                            >
                              <strong>{m.nazwa}</strong>
                              <small>
                                {kitchenFunction(m)} · od {m.pozycjaXMM} mm
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
                                disabled={
                                  islandDirty ||
                                  architectDirty ||
                                  conflict !== null
                                }
                                onClick={() => {
                                  if (editorBlocked()) return;
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
              {step === 1 && catalogPanel}
            </div>
            <div
              className="kp-bottom-actions"
              role="group"
              aria-label="Następny krok projektu"
            >
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
                  disabled={
                    (!draft.items.length && !draft.island?.items.length) ||
                    !!issues.length
                  }
                  onClick={() => go(2)}
                >
                  Zobacz podsumowanie <IconArrowRight size={18} />
                </button>
              )}
              {step === 2 && (
                <button
                  className="ps-button"
                  form="kp-offer-download"
                  type="submit"
                  disabled={
                    pending ||
                    conflict !== null ||
                    quoteDownload.key !== JSON.stringify(draft) ||
                    !quoteDownload.ready ||
                    quoteDownload.busy
                  }
                >
                  {quoteDownload.busy ? "Przygotowujemy PDF…" : "Pobierz PDF"}{" "}
                  <IconDownload size={18} />
                </button>
              )}
            </div>
          </>
        )}
        <footer className="kp-footer">
          <p>
            Szkic koncepcyjny · wycena orientacyjna, bez dokumentacji
            produkcyjnej. Sprawdzamy kolizje gabarytów i rezerwy otwierania
            między zabudowami. Instalacje, rzeczywiste zawiasy i luzy wymagają
            weryfikacji.
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
                setRoomFormRevision((n) => n + 1);
                setRoomDirty(false);
                syncDimensions(newDraft());
                setWall("a");
                setSelected(null);
                go(0, true);
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
