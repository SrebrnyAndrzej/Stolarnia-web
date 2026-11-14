import { useState } from "react";
import { Logo, Feedback } from "../ui";
import { StudioTabs } from "../StudioTabs";
import { PrzelicznikSzuflad } from "../../views/PrzelicznikSzuflad";
import { SlopeCutting } from "../SlopeCutting";
import { freshFurniture, carcass } from "../../../../src/core/furniture";
import { splitFronts } from "../../../../src/core/front-split";
import { drawerBridge } from "./model";
import { useCalculatorParameters } from "./useCalculatorParameters";
import "../furniture.css";
import "./calculators.css";

function SlopeCalculator() {
  const { form, setForm, saved } = useCalculatorParameters(
    "pan-stolarz.kalkulator-skosu.v1",
    {
      width: "1200",
      height: "2200",
      lowHeight: "1600",
      depth: "560",
      thickness: "18",
    },
  );
  const [reverse, setReverse] = useState(false);
  const dims = Object.fromEntries(
    Object.entries(form).map(([k, v]) => [k, Number(v.replace(",", "."))]),
  );
  const valid =
    Object.values(form).every((v) => v.trim()) &&
    Object.values(dims).every(
      (n) => Number.isFinite(n) && n > 0 && n <= 8000,
    ) &&
    dims.height >= dims.lowHeight &&
    dims.width > 2 * dims.thickness &&
    dims.lowHeight > 2 * dims.thickness &&
    dims.thickness <= 50 &&
    dims.depth > dims.thickness;
  const model = {
    ...freshFurniture(),
    ...dims,
    shape: "slope" as const,
    width: dims.width,
    height: dims.height,
    lowHeight: dims.lowHeight,
    depth: dims.depth,
    thickness: dims.thickness,
    reverse,
  };
  let serial = 0;
  if (valid) model.plates = carcass(model, () => `slope-public-${serial++}`);
  return (
    <section className="pc-slope">
      <h1>Kalkulator skosu</h1>
      <p>
        Podaj krótki i długi bok oraz poziomą szerokość mebla. Wymiary w
        milimetrach.
      </p>
      <div className="pc-number-grid">
        {(
          [
            ["width", "Szerokość pozioma"],
            ["lowHeight", "Krótki bok"],
            ["height", "Długi bok"],
            ["depth", "Głębokość mebla"],
            ["thickness", "Grubość płyty"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              inputMode="decimal"
              value={form[key]}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>
      <label className="pc-check">
        <input
          type="checkbox"
          checked={reverse}
          onChange={(e) => setReverse(e.target.checked)}
        />{" "}
        Długi bok po lewej stronie
      </label>
      <p className="kp-muted" role="status">
        {saved
          ? "Wymiary zapisane na tym urządzeniu."
          : "Zapis lokalny niedostępny; obliczenia nadal działają."}
      </p>
      {valid ? (
        <SlopeCutting model={model} />
      ) : (
        <Feedback>
          Wpisz dodatnie wymiary. Długi bok nie może być krótszy od krótkiego, a
          szerokość musi pomieścić oba boki. Grubość płyty: do 50 mm.
        </Feedback>
      )}
    </section>
  );
}
function FrontCalculator() {
  const { form, setForm, saved } = useCalculatorParameters(
    "pan-stolarz.podzial-frontow.v1",
    {
      total: "970",
      count: "2",
      gap: "3",
      edge: "3",
    },
  );
  const [vertical, setVertical] = useState(false);
  let pieces: ReturnType<typeof splitFronts> = [],
    error = "";
  try {
    if (Object.values(form).some((v) => !v.trim()))
      throw new Error("Uzupełnij wszystkie wymiary.");
    pieces = splitFronts(
      Number(form.total.replace(",", ".")),
      Number(form.count),
      Number(form.gap.replace(",", ".")),
      Number(form.edge.replace(",", ".")),
    );
  } catch (e) {
    error = (e as Error).message;
  }
  const total = Number(form.total.replace(",", "."));
  return (
    <section>
      <h1>Podział frontów</h1>
      <p>
        Równe skrzydła drzwi lub fronty szuflad, z osobnym uwzględnieniem
        szczelin zewnętrznych i pomiędzy frontami.
      </p>
      <label className="pc-check">
        <input
          type="checkbox"
          checked={vertical}
          onChange={(e) => setVertical(e.target.checked)}
        />{" "}
        Podział w pionie (szuflady)
      </label>
      <div className="pc-number-grid">
        {(
          [
            ["total", vertical ? "Łączna wysokość" : "Łączna szerokość"],
            ["count", "Liczba frontów"],
            ["gap", "Szczelina między frontami"],
            ["edge", "Szczelina przy każdej krawędzi"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              inputMode="decimal"
              value={form[key]}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>
      {error ? (
        <Feedback>{error}</Feedback>
      ) : (
        <>
          <svg
            viewBox="0 0 600 330"
            role="img"
            aria-label={
              vertical
                ? "Podział wysokości na fronty szuflad"
                : "Podział szerokości na skrzydła"
            }
          >
            {pieces.map((p, i) => {
              const start = 20 + (560 * p.start) / total,
                size = (560 * p.size) / total;
              return (
                <g key={i}>
                  <rect
                    x={vertical ? 180 : start}
                    y={vertical ? 20 + (290 * p.start) / total : 65}
                    width={vertical ? 240 : size}
                    height={vertical ? (290 * p.size) / total : 200}
                  />
                  <text
                    x={vertical ? 300 : start + size / 2}
                    y={
                      vertical
                        ? 20 + (290 * (p.start + p.size / 2)) / total
                        : 165
                    }
                    textAnchor="middle"
                  >
                    {pieces.length > 6
                      ? String(i + 1)
                      : p.size.toLocaleString("pl-PL", {
                          maximumFractionDigits: 3,
                        }) + " mm"}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="pc-front-results" aria-live="polite">
            {pieces.map((p, i) => (
              <p key={i}>
                Front {i + 1}:{" "}
                <strong>
                  {p.size.toLocaleString("pl-PL", { maximumFractionDigits: 3 })}{" "}
                  mm
                </strong>
              </p>
            ))}
          </div>
          <p>
            Odjęto dwie szczeliny krawędziowe i wszystkie szczeliny pomiędzy
            frontami. Wynik geometryczny, przed doborem nakładania i zawiasów.
          </p>
        </>
      )}
      <p className="kp-muted" role="status">
        {saved
          ? "Wymiary zapisane na tym urządzeniu."
          : "Zapis lokalny niedostępny; obliczenia nadal działają."}
      </p>
    </section>
  );
}
export function Calculators({ hash }: { hash: string }) {
  const [path, search = ""] = hash.split("?");
  const tool = path.split("/")[2] ?? "szuflady";
  const active = ["szuflady", "skosy", "fronty"].includes(tool)
    ? tool
    : "szuflady";
  let initial: ReturnType<typeof drawerBridge>,
    bridgeError = "";
  try {
    initial = drawerBridge(search);
  } catch {
    bridgeError =
      "Link zawiera niepoprawne wymiary szuflady. Wpisz je ręcznie lub wróć do szafki w kreatorze.";
  }
  const tabs = [
    { id: "szuflady", label: "Szuflady" },
    { id: "skosy", label: "Skosy i wieniec" },
    { id: "fronty", label: "Podział frontów" },
  ];
  return (
    <div className="pc-page">
      <header className="ps-public-header">
        <a href="#/">
          <Logo />
        </a>
        <a href="#/kreator-kuchni">Wróć do kreatora kuchni</a>
        <a href="#/">Strona główna</a>
      </header>
      <main className="pc-main">
        <p className="ps-eyebrow">Narzędzia stolarza</p>
        <StudioTabs
          id="public-tools"
          label="Wybierz kalkulator"
          value={active}
          items={tabs}
          onChange={(id) => {
            location.hash = `#/kalkulatory/${id}`;
          }}
        />
        {tabs.map((t) => (
          <div
            key={t.id}
            id={`public-tools-panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`public-tools-tab-${t.id}`}
            hidden={active !== t.id}
          >
            {t.id === "szuflady" ? (
              <>
                {bridgeError && <Feedback>{bridgeError}</Feedback>}
                {initial && !bridgeError && (
                  <p className="pc-bridge" role="status">
                    Wczytano wymiary pierwszej szuflady z wybranej szafki.
                    Dopasuj wariant boku i sprawdź mocowania.
                  </p>
                )}
                <PrzelicznikSzuflad key={search} demo initialValues={initial} />
              </>
            ) : t.id === "skosy" ? (
              <SlopeCalculator />
            ) : (
              <FrontCalculator />
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
