/** The runner is rounded down from the ceiling, on the same raster as the main drawer. */
export function hiddenDrawerFloor(
  floor: number,
  ceiling: number,
  opening: number,
  raster: number,
  minimumMain: number,
): number {
  if (
    ![floor, ceiling, opening, raster, minimumMain].every(Number.isFinite) ||
    raster <= 0 ||
    opening <= 0
  )
    throw new Error("Brak poprawnych danych montażu szuflady ukrytej.");
  const position =
    floor + Math.floor((ceiling - opening - floor) / raster + 1e-6) * raster;
  if (position - floor < minimumMain)
    throw new Error(
      "Za mało miejsca na kolejną szufladę ukrytą i skrzynkę główną. Zwiększ front albo zmniejsz liczbę szuflad.",
    );
  return position;
}
