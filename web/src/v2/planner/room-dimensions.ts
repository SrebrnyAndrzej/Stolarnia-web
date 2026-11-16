import {
  kitchenInputSchema,
  type KitchenInput,
} from "../../../../src/core/kitchen-configuration";

export type RoomUnit = "cm" | "mm";
export type RoomKey = "width" | "depth" | "returnLength" | "height";
export type RoomFields = Record<RoomKey, string>;
export const roomKeys = (layout: KitchenInput["layout"]): RoomKey[] => [
  "width",
  "depth",
  ...(layout === "u" ? ["returnLength" as const] : []),
  "height",
];
export const roomLabel = (key: RoomKey, layout?: KitchenInput["layout"]) =>
  key === "depth" && layout === "parallel"
    ? "Odległość między ścianami A i C"
    : key === "width" && layout === "parallel"
      ? "Długość ciągów A i C"
      : key === "depth" && layout === "straight"
        ? "Głębokość pomieszczenia"
        : key === "height"
          ? "Wysokość pomieszczenia"
          : `Długość ściany ${{ width: "A", depth: "B", returnLength: "C" }[key]}`;
export const roomFields = (
  draft: Pick<KitchenInput, RoomKey>,
  unit: RoomUnit,
): RoomFields =>
  Object.fromEntries(
    (["width", "depth", "returnLength", "height"] as const).map((key) => [
      key,
      String(draft[key] / (unit === "cm" ? 10 : 1)),
    ]),
  ) as RoomFields;

export function roomMillimetres(value: string, unit: RoomUnit): number {
  if (!/^\d+(?:[.,]\d+)?$/.test(value.trim())) return NaN;
  const result =
    Number(value.trim().replace(",", ".")) * (unit === "cm" ? 10 : 1);
  return Math.abs(result - Math.round(result)) < 1e-7
    ? Math.round(result)
    : NaN;
}

export function convertRoomFields(
  fields: RoomFields,
  from: RoomUnit,
  to: RoomUnit,
): RoomFields {
  if (from === to) return fields;
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      const mm = roomMillimetres(value, from);
      return [
        key,
        Number.isFinite(mm) ? String(mm / (to === "cm" ? 10 : 1)) : value,
      ];
    }),
  ) as RoomFields;
}

export function prepareRoomDimensions(
  draft: KitchenInput,
  fields: RoomFields,
  unit: RoomUnit,
) {
  const values = Object.fromEntries(
    roomKeys(draft.layout).map((key) => [
      key,
      roomMillimetres(fields[key], unit),
    ]),
  );
  const candidate = { ...draft, ...values };
  const parsed = kitchenInputSchema.safeParse(candidate);
  const errors: Partial<Record<RoomKey, string>> = {};
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as RoomKey;
      if (!roomKeys(draft.layout).includes(key)) continue;
      const range =
        key === "height"
          ? unit === "cm"
            ? "230–350"
            : "2300–3500"
          : unit === "cm"
            ? "180–800"
            : "1800–8000";
      errors[key] =
        `${roomLabel(key, draft.layout)}: wpisz ${range} ${unit}${unit === "cm" ? (key === "height" ? " (np. 260)" : " (np. 360 lub 360,5)") : ", w całych milimetrach"}.`;
    }
  return { draft: parsed.success ? candidate : undefined, errors };
}
