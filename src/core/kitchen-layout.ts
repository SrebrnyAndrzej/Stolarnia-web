import { z } from "zod";
export const kitchenLayoutSchema = z.enum(["straight", "l", "u", "parallel"]);
export type KitchenLayout = z.infer<typeof kitchenLayoutSchema>;
type Room = {
  layout: KitchenLayout;
  width: number;
  depth: number;
  returnLength: number;
};
export const kitchenLayoutWalls = (d: {
  layout: KitchenLayout;
}): ("a" | "b" | "c")[] =>
  d.layout === "parallel"
    ? ["a", "c"]
    : d.layout === "u"
      ? ["a", "b", "c"]
      : d.layout === "l"
        ? ["a", "b"]
        : ["a"];
export const kitchenWallStart = (d: { layout: KitchenLayout }, wall: string) =>
  (d.layout === "l" || d.layout === "u") && wall !== "a" ? 650 : 0;
export const kitchenWallLength = (d: Room, wall: string) =>
  wall === "a" || (wall === "c" && d.layout === "parallel")
    ? d.width
    : wall === "b"
      ? d.depth
      : d.returnLength;
export const kitchenLayoutName = (layout: KitchenLayout) =>
  ({
    straight: "Jedna ściana",
    l: "Układ L",
    u: "Układ U",
    parallel: "Dwie ściany naprzeciwko siebie",
  })[layout];
