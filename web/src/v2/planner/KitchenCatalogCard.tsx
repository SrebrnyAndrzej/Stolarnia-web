import { IconPlus } from "@tabler/icons-react";
import type { ModulKatalogowy } from "../../../../src/core/types";
import type { RoomUnit } from "./room-dimensions";

export const catalogMeasure = (mm: number, unit: RoomUnit) =>
  (mm / (unit === "cm" ? 10 : 1)).toLocaleString("pl-PL");

export function KitchenCatalogCard({
  entry,
  nominal,
  unit,
  disabled,
  onAdd,
}: {
  entry: ModulKatalogowy;
  nominal: ModulKatalogowy;
  unit: RoomUnit;
  disabled: boolean;
  onAdd: (id: string) => void;
}) {
  const adjusted =
    entry.widthMM !== nominal.widthMM ||
    entry.heightMM !== nominal.heightMM ||
    entry.depthMM !== nominal.depthMM;
  return (
    <button type="button" disabled={disabled} onClick={() => onAdd(entry.id)}>
      <span
        className={`kp-cabinet-icon ${entry.construction}`}
        aria-hidden="true"
      />
      <span>
        <strong>Dodaj: {entry.name}</strong>
        <small>
          {catalogMeasure(entry.widthMM, unit)} ×{" "}
          {catalogMeasure(entry.heightMM, unit)}
          {entry.construction === "filler"
            ? ` ${unit} · blenda`
            : ` × ${catalogMeasure(entry.depthMM, unit)} ${unit}`}
        </small>
        {adjusted && <small>Dopasowana do wybranego miejsca</small>}
      </span>
      <IconPlus size={18} aria-hidden="true" />
    </button>
  );
}
