import { useState } from "react";
import { NumberField } from "./FurnitureNumberField";
import { Feedback } from "./ui";
import { FurniturePreparation } from "./FurniturePreparation";
import { furnitureReview } from "../../../src/core/furniture-review";
import { furnitureParts } from "../../../src/core/furniture-parts";
import {
  platePolygon,
  standardPlateSpecification,
  furnitureGeometrySnapshot,
  type FurnitureModel,
  type FurnitureEntry,
} from "../../../src/core/furniture";
const escape = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const csv = (v: unknown) =>
  `"${String(v ?? "")
    .replace(/^[\s]*[=+@-]/, "'$&")
    .replaceAll('"', '""')}"`;
function download(data: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function FurnitureTools({
  model,
  library,
  id,
  version,
  onChange,
  onSelect,
  disabled,
  dirty,
}: {
  model: FurnitureModel;
  library: FurnitureEntry[];
  id: string;
  version: number;
  onChange: (fn: (m: FurnitureModel) => FurnitureModel) => void;
  onSelect: (id: string) => void;
  disabled: boolean;
  dirty: boolean;
}) {
  const [reference, setReference] = useState(""),
    [labelBusy, setLabelBusy] = useState(false),
    [labelError, setLabelError] = useState(""),
    [roomSource, setRoomSource] = useState(""),
    [roomSelected, setRoomSelected] = useState(""),
    [target, setTarget] = useState("fronts"),
    [obstacle, setObstacle] = useState("");
  const review = furnitureReview(model),
    room = model.installation,
    parts = furnitureParts(model),
    compare = library.find((e) => e.id === reference);
  const patch = (p: Partial<NonNullable<FurnitureModel["installation"]>>) =>
    onChange((m) => ({ ...m, installation: { ...m.installation!, ...p } }));
  const prefix = `${id}-v${version}-szkic`;
  const exportLabels = async () => {
    setLabelBusy(true);
    setLabelError("");
    try {
      const QR = await import("qrcode");
      const labels = await Promise.all(
        parts.map(async (p, i) => {
          const link = `${location.origin}${location.pathname}#/panel/meble?model=${id}&version=${version}&part=${p.id}`;
          const image = await QR.toDataURL(link, {
            width: 160,
            margin: 4,
            errorCorrectionLevel: "M",
          });
          return `<article><img src="${image}" alt="Kod QR części ${i + 1}"><strong>${i + 1}. ${escape(p.name)}</strong><p>${escape(model.name)} · v${version}</p><p>${escape(p.material)} ${escape(p.decor)}</p><p>${escape(p.dimensions?.join(" × "))} / ${escape(p.thickness)} mm</p><small>${escape(p.id)}</small><p>SZKIC — nie do produkcji</p></article>`;
        }),
      );
      download(
        `<!doctype html><html lang="pl"><meta charset="utf-8"><title>Etykiety części — szkic</title><style>body{font:12px system-ui;color:#1c2b30}main{display:grid;grid-template-columns:repeat(2,1fr);gap:8mm}article{border:1px solid #777;padding:4mm;min-height:44mm;break-inside:avoid}img{width:30mm;float:right}small{overflow-wrap:anywhere}p{margin:2mm 0}@media print{h1,header{display:none}}</style><h1>Etykiety części — szkic</h1><header>QR otwiera wskazaną część po zalogowaniu. Gdy wersja biblioteki się zmieni, aplikacja odrzuci nieaktualną etykietę.</header><main>${labels.join("")}</main></html>`,
        `etykiety-${prefix}.html`,
        "text/html;charset=utf-8",
      );
    } catch {
      setLabelError("Nie udało się przygotować etykiet. Spróbuj ponownie.");
    } finally {
      setLabelBusy(false);
    }
  };
  const exportCSV = () =>
    download(
      "\ufeff" +
        [
          [
            "ID",
            "Część",
            "Materiał",
            "Dekor",
            "Grubość mm",
            "Wymiar U mm",
            "Wymiar V mm",
            "Rdzeń U mm",
            "Rdzeń V mm",
            "Braki",
            "Status",
          ],
          ...parts.map((p) => [
            p.id,
            p.name,
            p.material,
            p.decor,
            p.thickness,
            ...(p.dimensions ?? ["", ""]),
            ...(p.substrate ?? ["", ""]),
            p.issues.join("; "),
            "SZKIC — nie do produkcji",
          ]),
        ]
          .map((r) => r.map(csv).join(";"))
          .join("\r\n"),
      `czesci-${prefix}.csv`,
      "text/csv;charset=utf-8",
    );
  const exportDXF = () => {
    const lines: (string | number)[] = [
      0,
      "SECTION",
      2,
      "HEADER",
      9,
      "$INSUNITS",
      70,
      4,
      0,
      "ENDSEC",
      0,
      "SECTION",
      2,
      "ENTITIES",
    ];
    let offset = 0;
    model.plates.forEach((p, i) => {
      const polygon = platePolygon(model, p);
      if (polygon.length < 3) return;
      lines.push(
        0,
        "LWPOLYLINE",
        8,
        `PART_${i + 1}`,
        90,
        polygon.length,
        70,
        1,
      );
      polygon.forEach(([x, y]) => lines.push(10, x + offset, 20, y));
      offset += model.width + 100;
    });
    lines.push(0, "ENDSEC", 0, "EOF");
    download(lines.join("\r\n"), `obrysy-${prefix}.dxf`, "application/dxf");
  };
  const exportHTML = () => {
    const polygons = model.plates
      .map(
        (p) =>
          `<polygon points="${platePolygon(model, p)
            .map(([x, y]) => `${x},${model.height - y}`)
            .join(" ")}" fill="#e2d9c8" stroke="#6e5c40" stroke-width="2"/>`,
      )
      .join("");
    download(
      `<!doctype html><html lang="pl"><meta charset="utf-8"><title>${escape(model.name)} — szkic warsztatowy</title><style>body{font:14px system-ui;color:#1c2b30;margin:32px}svg{width:100%;height:400px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{text-align:left;border-bottom:1px solid #999;padding:8px;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}@media print{body{margin:0}svg{height:300px}}</style><h1>${escape(model.name)}</h1><p>SZKIC — nie jest wydaniem produkcyjnym. Wymaga sprawdzenia konstrukcji i okuć.</p><p>Model ${escape(id)} · wersja bazowa ${version} · stan ${escape(new Date().toISOString())}. Obejmuje także niezapisane zmiany.</p><p>${model.width} × ${model.height} × ${model.depth} mm</p><svg viewBox="-40 -40 ${model.width + 80} ${model.height + 80}">${polygons}</svg><h2>Indeks części</h2><table><thead><tr><th>Nr / ID</th><th>Część</th><th>Materiał</th><th>U×V / grubość</th><th>Braki</th></tr></thead><tbody>${parts.map((p, i) => `<tr><td>${i + 1}<br>${escape(p.id)}</td><td>${escape(p.name)}</td><td>${escape(p.material)} ${escape(p.decor)}</td><td>${escape(p.dimensions?.join(" × "))} / ${escape(p.thickness)}</td><td>${escape(p.issues.join("; "))}</td></tr>`).join("")}</tbody></table><h2>Kontrola</h2><p>${escape(review.method)}</p><ul>${[...review.collisions.map((c) => c.message), ...review.motion.map((c) => c.message), ...review.installation].map((s) => `<li>${escape(s)}</li>`).join("")}</ul><p>Wydrukuj lub wybierz Zapisz jako PDF w przeglądarce.</p></html>`,
      `warsztat-${prefix}.html`,
      "text/html;charset=utf-8",
    );
  };
  const outline = (m: FurnitureModel) => (
    <svg
      viewBox={`-30 -30 ${m.width + 60} ${m.height + 60}`}
      role="img"
      aria-label={`Wariant ${m.name}`}
    >
      {m.plates.map((p) => (
        <polygon
          key={p.id}
          points={platePolygon(m, p)
            .map(([x, y]) => `${x},${m.height - y}`)
            .join(" ")}
          fill={
            p.kind === "door" || p.kind === "drawer" ? "#e2d9c8" : "#c5ab83"
          }
          stroke="#6e5c40"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
  return (
    <>
      <details className="fc-part-review">
        <summary>
          Kontrola konstrukcji i wnęki ·{" "}
          {review.collisions.length +
            review.motion.length +
            review.installation.length}{" "}
          ostrzeżeń
        </summary>
        <p>{review.method}</p>
        {!review.collisions.length &&
        !review.installation.length &&
        !review.motion.length ? (
          <p>
            Nie znaleziono przecinających się obwiedni. Okucia i ruch wymagają
            osobnego sprawdzenia.
          </p>
        ) : (
          <ul>
            {review.collisions.slice(0, 30).map((c, i) => (
              <li key={i}>
                <button onClick={() => onSelect(c.a)}>
                  Sprawdź: {c.message}
                </button>
              </li>
            ))}
            {review.installation.map((s) => (
              <li key={s}>{s}</li>
            ))}
            {review.motion.map((c) => (
              <li key={c.partId}>
                <button onClick={() => onSelect(c.partId)}>{c.message}</button>
              </li>
            ))}
          </ul>
        )}
      </details>
      <fieldset disabled={disabled}>
        <legend>Wnęka i przeszkody</legend>
        <label className="fc-check">
          <input
            type="checkbox"
            checked={!!room}
            onChange={(e) =>
              onChange((m) => ({
                ...m,
                installation: e.target.checked
                  ? {
                      width: m.width + 40,
                      height: m.height + 30,
                      depth: m.depth + 50,
                      left: 10,
                      right: 10,
                      top: 10,
                      obstacles: [],
                    }
                  : undefined,
              }))
            }
          />
          Sprawdzaj dopasowanie do wnęki
        </label>
        {room && (
          <>
            <p>
              Wymiary pomiaru są oddzielne od wymiarów mebla. Początkowe luzy są
              przykładem — ustaw własne wartości montażowe.
            </p>
            <div className="fc-fields">
              {(
                ["width", "height", "depth", "left", "right", "top"] as const
              ).map((k, i) => (
                <NumberField
                  key={k}
                  label={
                    [
                      "Szerokość wnęki",
                      "Wysokość wnęki",
                      "Głębokość wnęki",
                      "Luz po lewej",
                      "Luz po prawej",
                      "Luz nad meblem",
                    ][i]
                  }
                  min={i < 3 ? 1 : 0}
                  value={room[k]}
                  onChange={(v) => patch({ [k]: v })}
                />
              ))}
            </div>
            <button
              onClick={() => {
                const p = {
                  id: crypto.randomUUID(),
                  name: "Belka / przeszkoda",
                  x: 0,
                  y: Math.max(0, model.height - 200),
                  z: 0,
                  width: 100,
                  height: 200,
                  depth: 100,
                };
                patch({ obstacles: [...room.obstacles, p] });
                setObstacle(p.id);
              }}
              disabled={room.obstacles.length >= 20}
            >
              Dodaj przeszkodę
            </button>
            <label>
              Wybierz przeszkodę
              <select
                aria-label="Wybierz przeszkodę"
                value={obstacle}
                onChange={(e) => setObstacle(e.target.value)}
              >
                <option value="">Wybierz…</option>
                {room.obstacles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {room.obstacles
              .filter((p) => p.id === obstacle)
              .map((p) => (
                <div key={p.id}>
                  <label>
                    Nazwa przeszkody
                    <input
                      value={p.name}
                      maxLength={80}
                      onChange={(e) =>
                        patch({
                          obstacles: room.obstacles.map((o) =>
                            o.id === p.id ? { ...o, name: e.target.value } : o,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="fc-fields">
                    {(["x", "y", "z", "width", "height", "depth"] as const).map(
                      (k, i) => (
                        <NumberField
                          key={k}
                          label={`Przeszkoda: ${["X", "Y", "Z", "szerokość", "wysokość", "głębokość"][i]}`}
                          min={i < 3 ? 0 : 1}
                          value={p[k]}
                          onChange={(v) =>
                            patch({
                              obstacles: room.obstacles.map((o) =>
                                o.id === p.id ? { ...o, [k]: v } : o,
                              ),
                            })
                          }
                        />
                      ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      patch({
                        obstacles: room.obstacles.filter((o) => o.id !== p.id),
                      })
                    }
                  >
                    Usuń przeszkodę
                  </button>
                </div>
              ))}
            <h3>Meble z biblioteki w pomieszczeniu</h3>
            <label>
              Model do wstawienia
              <select
                aria-label="Model do wstawienia"
                value={roomSource}
                onChange={(e) => setRoomSource(e.target.value)}
              >
                <option value="">Wybierz zapisany mebel…</option>
                {library.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.model.name} · v{e.version}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={!roomSource || (room.furniture?.length ?? 0) >= 12}
              onClick={() => {
                const entry = library.find((e) => e.id === roomSource);
                if (!entry) return;
                const instance = {
                  id: crypto.randomUUID(),
                  sourceId: entry.id,
                  sourceVersion: entry.version,
                  x: model.width + 100,
                  y: 0,
                  z: 0,
                  geometry: furnitureGeometrySnapshot(entry.model),
                };
                patch({ furniture: [...(room.furniture ?? []), instance] });
                setRoomSelected(instance.id);
              }}
            >
              Wstaw mebel z biblioteki
            </button>
            <label>
              Mebel w pomieszczeniu
              <select
                aria-label="Mebel w pomieszczeniu"
                value={roomSelected}
                onChange={(e) => setRoomSelected(e.target.value)}
              >
                <option value="">Wybierz…</option>
                {room.furniture?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.geometry.name} · v{p.sourceVersion}
                  </option>
                ))}
              </select>
            </label>
            {room.furniture
              ?.filter((p) => p.id === roomSelected)
              .map((p) => (
                <div key={p.id}>
                  <div className="fc-fields">
                    {(["x", "y", "z"] as const).map((k) => (
                      <NumberField
                        key={k}
                        label={`Mebel w pomieszczeniu: ${k.toUpperCase()}`}
                        value={p[k]}
                        onChange={(v) =>
                          patch({
                            furniture: room.furniture!.map((o) =>
                              o.id === p.id ? { ...o, [k]: v } : o,
                            ),
                          })
                        }
                      />
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      patch({
                        furniture: room.furniture!.filter((o) => o.id !== p.id),
                      })
                    }
                  >
                    Usuń mebel z pomieszczenia
                  </button>
                </div>
              ))}
            <p>
              Wstawiany jest zapisany wariant z podanym numerem wersji.
              Późniejsza edycja biblioteki go nie podmienia. X od lewej krawędzi
              bieżącego mebla, Y od podłogi, Z od jego tylnej krawędzi. W 3D
              wybierz Widok początkowy, aby objąć całe pomieszczenie.
            </p>
          </>
        )}
      </fieldset>
      <details className="fc-part-review">
        <summary>Porównanie wariantów A/B</summary>
        <label>
          Zapisany wariant B
          <select
            aria-label="Zapisany wariant B"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          >
            <option value="">Wybierz model z biblioteki…</option>
            {library.map((e) => (
              <option key={e.id} value={e.id}>
                {e.model.name} · wersja {e.version}
              </option>
            ))}
          </select>
        </label>
        {compare && (
          <div className="fc-compare">
            <div>
              <strong>A: bieżący szkic</strong>
              {outline(model)}
              <p>
                {model.width} × {model.height} × {model.depth} mm ·{" "}
                {model.plates.length} części
              </p>
            </div>
            <div>
              <strong>
                B: {compare.model.name} · v{compare.version}
              </strong>
              {outline(compare.model)}
              <p>
                {compare.model.width} × {compare.model.height} ×{" "}
                {compare.model.depth} mm · {compare.model.plates.length} części
              </p>
            </div>
          </div>
        )}
        <p>
          Porównanie nie zmienia modeli. Nowy wariant utworzysz akcją zapisu
          kopii.
        </p>
      </details>
      <fieldset disabled={disabled}>
        <legend>Standard dla grupy części</legend>
        <label>
          Zastosuj obecny standard do
          <select
            aria-label="Zastosuj obecny standard do"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="fronts">Frontów</option>
            <option value="body">Korpusu</option>
            <option value="interior">Wnętrza</option>
          </select>
        </label>
        <button
          disabled={!model.construction}
          onClick={() =>
            onChange((m) => ({
              ...m,
              plates: m.plates.map((p) => {
                const match =
                  target === "fronts"
                    ? p.kind === "door" || p.kind === "drawer"
                    : target === "body"
                      ? !!p.anchor
                      : !p.anchor && p.kind === "board";
                return match
                  ? { ...p, specification: standardPlateSpecification(m, p) }
                  : p;
              }),
            }))
          }
        >
          Zastąp opisy w wybranej grupie
        </button>
        <p>
          Zastępuje opisy materiałów i obrzeży wybranych części według obecnego
          standardu. Cofnij przywraca poprzednie.
        </p>
      </fieldset>
      <fieldset disabled={disabled}>
        <legend>Dokumentacja bieżącego szkicu</legend>
        {labelError && <Feedback>{labelError}</Feedback>}
        <div className="fc-actions">
          <button onClick={exportCSV}>Pobierz części CSV</button>
          <button onClick={exportDXF}>Pobierz obrysy DXF</button>
          <button onClick={exportHTML}>Pobierz kartę do druku / PDF</button>
          <button
            disabled={!version || dirty || labelBusy}
            onClick={exportLabels}
          >
            {labelBusy
              ? "Przygotowanie etykiet…"
              : "Pobierz etykiety części z QR"}
          </button>
        </div>
        <p>
          Eksport obejmuje bieżący szkic. DXF zawiera obrysy od przodu ułożone
          obok siebie, nie rozkrój ani CNC. Karta HTML otwiera się bez internetu
          i pozwala zapisać PDF przez drukowanie. Braki i status szkicu
          pozostają widoczne.
        </p>
      </fieldset>
      <details><summary>Przygotowanie płyt do rozkroju</summary><FurniturePreparation key={`${id}-${version}`} id={id} version={version} model={model} disabled={disabled || dirty || !version} onSelect={onSelect}/></details>
    </>
  );
}
