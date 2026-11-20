import type { Modul } from "../../../src/core/types";

export function kitchenPlanLabel(m: Pick<Modul, "konstrukcja">) {
  return (
    {
      sink: "Zlew",
      oven: "Płyta",
      dishwasherFront: "Zmywarka",
      refrigerator: "Lodówka",
      hood: "Okap",
    } as Record<string, string>
  )[m.konstrukcja];
}
/** Schematic symbols; these are neither cutouts nor manufacturer dimensions. */
export function KitchenPlanSymbol({
  kind,
  x,
  y,
  scale = 1,
  angle = 0,
}: {
  kind: Modul["konstrukcja"];
  x: number;
  y: number;
  scale?: number;
  angle?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}
      pointerEvents="none"
      aria-hidden="true"
    >
      <svg
        x={-150}
        y={-100}
        width={300}
        height={200}
        viewBox="0 0 100 70"
        fill="none"
        stroke="var(--text)"
        strokeWidth={2.2}
      >
        <rect
          x={3}
          y={3}
          width={94}
          height={64}
          rx={5}
          fill="var(--panel)"
          fillOpacity={0.95}
        />
        {kind === "oven" ? (
          <>
            {[
              [30, 22],
              [70, 22],
              [30, 49],
              [70, 49],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={10} />
            ))}
          </>
        ) : kind === "sink" ? (
          <>
            <rect x={17} y={18} width={66} height={41} rx={10} />
            <circle cx={50} cy={39} r={4} />
            <path d="M50 21V10h12" />
          </>
        ) : kind === "refrigerator" ? (
          <>
            <path d="M3 25h94M14 12v7M14 37v13" />
            <path d="m48 37 5 9m0-9-5 9m-3-4h12" />
          </>
        ) : kind === "dishwasherFront" ? (
          <>
            <path d="M3 17h94M17 10h3m8 0h3M20 56h60M25 27l7 20m12-20 7 20m12-20 7 20" />
          </>
        ) : kind === "hood" ? (
          <>
            <path d="M38 9h24v20l21 25H17l21-25ZM30 45h40" />
          </>
        ) : null}
      </svg>
    </g>
  );
}
