import type { KitchenItem } from "./kitchen-configuration.js";

/** Replace storage while retaining position and dimensions, never the previous drawer's construction. */
export function kitchenShelfAlternative(item: KitchenItem): KitchenItem {
  const {
    drawers: _drawers,
    drawerFronts: _fronts,
    innerDrawers: _inner,
    appliance: _appliance,
    ...common
  } = item;
  return { ...common, catalogId: "base-shelves-600", shelves: 1 };
}
