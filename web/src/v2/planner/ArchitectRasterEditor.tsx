import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  imageReferenceSchema,
  imageReferenceSize,
  type ImageReference,
} from "../../../../src/core/architect-files";
import { imageDimensions } from "./architect-storage";
import { Feedback } from "../ui";

export type RasterEditorHandle = { read: () => ImageReference | undefined };
type Point = { x: number; y: number };
/** Calibration stays local until the existing file form is explicitly saved. */
export const ArchitectRasterEditor = forwardRef<
  RasterEditorHandle,
  {
    blob: Blob;
    initial?: ImageReference;
    onDirtyChange: (v: boolean) => void;
  }
>(function ArchitectRasterEditor({ blob, initial, onDirtyChange }, ref) {
  const [image, setImage] = useState<{
    url: string;
    width: number;
    height: number;
  }>();
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(!!initial);
  const [crop, setCrop] = useState(
    initial?.crop ?? { x: 0, y: 0, width: 1, height: 1 },
  );
  const [rotation, setRotation] = useState(initial?.rotation ?? 0);
  const [offset, setOffset] = useState({
    x: initial?.x ?? 0,
    y: initial?.y ?? 0,
  });
  const [mode, setMode] = useState<"crop" | "ruler">("crop");
  const [first, setFirst] = useState<Point>();
  const [ruler, setRuler] = useState<[Point, Point] | undefined>(
    initial?.calibration
      ? [initial.calibration.from, initial.calibration.to]
      : undefined,
  );
  const [lengthCm, setLengthCm] = useState(
    initial?.calibration ? String(initial.calibration.lengthMM / 10) : "",
  );
  const [widthCm, setWidthCm] = useState(
    initial ? String((initial.crop.width * initial.mmPerPixel) / 10) : "",
  );
  const svg = useRef<SVGSVGElement>(null),
    widthInput = useRef<HTMLInputElement>(null);
  const dirty = () => {
    onDirtyChange(true);
    setError("");
  };
  useEffect(() => {
    let active = true,
      url = "";
    imageDimensions(blob)
      .then(({ width, height }) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setImage({ url, width, height });
        if (!initial) setCrop({ x: 0, y: 0, width, height });
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [blob, initial]);
  const distance = ruler
    ? Math.hypot(ruler[1].x - ruler[0].x, ruler[1].y - ruler[0].y)
    : 0;
  const scale = ruler
    ? (Number(lengthCm) * 10) / distance
    : (Number(widthCm) * 10) / crop.width;
  const candidate = imageReferenceSchema.safeParse({
    pixelWidth: image?.width,
    pixelHeight: image?.height,
    crop,
    rotation,
    ...offset,
    mmPerPixel: scale,
    ...(ruler
      ? {
          calibration: {
            from: ruler[0],
            to: ruler[1],
            lengthMM: Number(lengthCm) * 10,
          },
        }
      : {}),
  });
  const size = candidate.success ? imageReferenceSize(candidate.data) : null;
  useImperativeHandle(ref, () => ({
    read: () => {
      if (!enabled) return undefined;
      if (first || !candidate.success) {
        const message = first
          ? "Dokończ zaznaczenie: wskaż drugi punkt na obrazie."
          : "Ustaw skalę: podaj szerokość kadru lub zaznacz znany odcinek i wpisz jego wymiar. Sprawdź, czy kadr mieści się w obrazie (podkład do 20 m).";
        setError(message);
        widthInput.current?.focus();
        throw new Error(message);
      }
      return candidate.data;
    },
  }));
  const changeMode = (next: "crop" | "ruler") => {
    setMode(next);
    setFirst(undefined);
    setError("");
  };
  return (
    <section className="kp-raster-editor" aria-label="Kadr i skala obrazu">
      <p>
        Wybierz obszar kuchni na rzucie parteru lub piętra. Zaznacz dwa
        przeciwległe narożniki, następnie podaj szerokość tego kadru. Możesz też
        ustalić skalę za pomocą znanego odcinka. Wymiary muszą pochodzić z rzutu
        lub pomiaru.
      </p>
      <label className="field">
        <span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              dirty();
              setEnabled(e.target.checked);
            }}
          />{" "}
          Pokaż obraz jako podkład rzutu
        </span>
      </label>
      {image ? (
        <>
          <div
            className="kp-actions"
            role="group"
            aria-label="Narzędzia obrazu"
          >
            <button
              type="button"
              className="ps-button secondary"
              aria-pressed={mode === "crop"}
              onClick={() => changeMode("crop")}
            >
              Zaznacz kuchnię
            </button>
            <button
              type="button"
              className="ps-button secondary"
              aria-pressed={mode === "ruler"}
              onClick={() => changeMode("ruler")}
            >
              Wskaż znany wymiar
            </button>
            <button
              type="button"
              className="ps-text-button"
              onClick={() => {
                dirty();
                setCrop({
                  x: 0,
                  y: 0,
                  width: image.width,
                  height: image.height,
                });
                setFirst(undefined);
                if (!ruler) setWidthCm("");
              }}
            >
              Cały obraz
            </button>
          </div>
          <p role="status">
            {mode === "crop" ? "Kadr kuchni" : "Znany odcinek"}:{" "}
            {first ? "wskaż drugi punkt" : "wskaż pierwszy punkt na obrazie"}.
            Precyzyjny kadr można też wpisać w polach poniżej.
          </p>
          <svg
            ref={svg}
            className="kp-raster-preview"
            viewBox={`0 0 ${image.width} ${image.height}`}
            role="img"
            aria-label="Rzut ze zdjęcia — zaznacz obszar kuchni lub odcinek"
            onClick={(e) => {
              // The parent fieldset also disables native controls; SVG needs its own guard.
              if (e.currentTarget.closest("fieldset")?.disabled) return;
              const matrix = svg.current?.getScreenCTM();
              if (!matrix) return;
              const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
                matrix.inverse(),
              );
              if (
                point.x < 0 ||
                point.y < 0 ||
                point.x > image.width ||
                point.y > image.height
              )
                return;
              const p = {
                x: Math.min(image.width, Math.max(0, Math.round(point.x))),
                y: Math.min(image.height, Math.max(0, Math.round(point.y))),
              };
              dirty();
              setEnabled(true);
              if (!first) {
                setFirst(p);
                return;
              }
              if (mode === "crop") {
                if (
                  Math.abs(first.x - p.x) < 2 ||
                  Math.abs(first.y - p.y) < 2
                ) {
                  setError(
                    "Zaznacz obszar o niezerowej szerokości i wysokości.",
                  );
                  return;
                }
                setCrop({
                  x: Math.min(first.x, p.x),
                  y: Math.min(first.y, p.y),
                  width: Math.abs(first.x - p.x),
                  height: Math.abs(first.y - p.y),
                });
                // A known width belongs to the old crop; never silently reuse its scale.
                if (!ruler) setWidthCm("");
              } else {
                if (Math.hypot(first.x - p.x, first.y - p.y) < 2) {
                  setError("Wskaż dwa różne końce odcinka.");
                  return;
                }
                setRuler([first, p]);
                setLengthCm("");
              }
              setFirst(undefined);
            }}
          >
            <image href={image.url} width={image.width} height={image.height} />
            <rect
              data-image-crop
              {...{
                x: crop.x,
                y: crop.y,
                width: crop.width,
                height: crop.height,
              }}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            {ruler && (
              <button
                type="button"
                className="ps-button secondary"
                onClick={() => {
                  dirty();
                  setLengthCm("60");
                  setEnabled(true);
                }}
              >
                Głębokość blatu: 60 cm
              </button>
            )}
            {ruler && (
              <line
                x1={ruler[0].x}
                y1={ruler[0].y}
                x2={ruler[1].x}
                y2={ruler[1].y}
                stroke="var(--danger)"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {first && (
              <circle
                cx={first.x}
                cy={first.y}
                r={Math.max(image.width, image.height) / 100}
                fill="var(--accent)"
              />
            )}
          </svg>
          <div className="kp-room-feature-grid">
            <label className="field">
              {ruler
                ? "Długość zaznaczonego odcinka (cm)"
                : "Rzeczywista szerokość kadru (cm)"}
              <input
                ref={widthInput}
                type="number"
                min="0.1"
                step="0.1"
                inputMode="decimal"
                value={ruler ? lengthCm : widthCm}
                onChange={(e) => {
                  dirty();
                  setEnabled(true);
                  ruler
                    ? setLengthCm(e.target.value)
                    : setWidthCm(e.target.value);
                }}
              />
            </label>
            <label className="field">
              Obrót obrazu
              <select
                aria-label="Obrót obrazu"
                value={rotation}
                onChange={(e) => {
                  dirty();
                  setRotation(
                    Number(e.target.value) as ImageReference["rotation"],
                  );
                }}
              >
                {[0, 90, 180, 270].map((v) => (
                  <option key={v} value={v}>
                    {v}°
                  </option>
                ))}
              </select>
            </label>
          </div>
          {ruler && (
            <button
              type="button"
              className="ps-text-button"
              onClick={() => {
                dirty();
                setRuler(undefined);
                setWidthCm("");
                setFirst(undefined);
              }}
            >
              Ustaw skalę szerokością kadru
            </button>
          )}
          <details>
            <summary>Dokładny kadr i przesunięcie</summary>
            <div className="kp-room-feature-grid">
              {(["x", "y", "width", "height"] as const).map((k, i) => (
                <label className="field" key={k}>
                  {
                    [
                      "Kadr od lewej (px)",
                      "Kadr od góry (px)",
                      "Szerokość kadru (px)",
                      "Wysokość kadru (px)",
                    ][i]
                  }
                  <input
                    type="number"
                    min={i < 2 ? 0 : 1}
                    step="1"
                    value={crop[k]}
                    onChange={(e) => {
                      dirty();
                      setFirst(undefined);
                      setCrop({ ...crop, [k]: Number(e.target.value) });
                      if (!ruler) setWidthCm("");
                    }}
                  />
                </label>
              ))}
              {(["x", "y"] as const).map((k) => (
                <label className="field" key={k}>
                  Przesunięcie obrazu {k.toUpperCase()} (cm)
                  <input
                    type="number"
                    min="-800"
                    max="800"
                    step="0.1"
                    value={offset[k] / 10}
                    onChange={(e) => {
                      dirty();
                      setOffset({
                        ...offset,
                        [k]: Math.round(Number(e.target.value) * 10),
                      });
                    }}
                  />
                </label>
              ))}
            </div>
          </details>
          {size && enabled && (
            <p data-image-dimensions>
              Kadr po obrocie:{" "}
              <strong>
                {size.width / 10} × {size.depth / 10} cm
              </strong>
              . Zapisz jako podkład albo przyjmij te wymiary pomieszczenia.
            </p>
          )}
          <p>
            Obraz jest pomocą do planowania. Kreator nie rozpoznaje
            automatycznie ścian, instalacji ani szafek. Zdjęcie z perspektywą
            lub rozciągnięty skan wymaga sprawdzenia obu wymiarów.
          </p>
        </>
      ) : (
        !error && <p>Odczytywanie obrazu…</p>
      )}
      {error && <Feedback>{error}</Feedback>}
    </section>
  );
});
