import {
  platePolygon,
  type FurnitureModel,
  type FurniturePlate,
} from "./furniture.js";
export type Box3 = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
};
export function plateBox(m: FurnitureModel, p: FurniturePlate): Box3 {
  const polygon = platePolygon(m, p),
    xs = polygon.map((p) => p[0]),
    ys = polygon.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    z: p.z,
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    depth: p.depth,
  };
}
const overlaps = (a: Box3, b: Box3, tolerance = 0.5) =>
  a.x + a.width > b.x + tolerance &&
  b.x + b.width > a.x + tolerance &&
  a.y + a.height > b.y + tolerance &&
  b.y + b.height > a.y + tolerance &&
  a.z + a.depth > b.z + tolerance &&
  b.z + b.depth > a.z + tolerance;
export function frontMotion(m: FurnitureModel, p: FurniturePlate) {
  const node = m.compartments?.nodes.find((n) =>
    p.layoutSlot?.startsWith(`compartment/${n.id}/`),
  );
  const right =
    node?.front === "pair"
      ? p.layoutSlot?.endsWith("/1")
      : node?.hinge === "right";
  return {
    hinge: right ? ("right" as const) : ("left" as const),
    pivotX: right ? p.x + p.width : p.x,
    pivotZ: p.z + p.depth,
    travel:
      m.drawerAssemblies?.find((a) => a.frontId === p.id)?.nominalLength ??
      Math.min(450, Math.max(60, p.z * 0.7)),
  };
}
export function furnitureReview(m: FurnitureModel) {
  const collisions: { a: string; b: string; message: string }[] = [];
  const plates = m.plates.map((p) => ({ plate: p, box: plateBox(m, p) }));
  for (let i = 0; i < plates.length; i++)
    for (let j = i + 1; j < plates.length; j++)
      if (overlaps(plates[i].box, plates[j].box))
        collisions.push({
          a: plates[i].plate.id,
          b: plates[j].plate.id,
          message: `${plates[i].plate.name} / ${plates[j].plate.name}`,
        });
  const installation: string[] = [];
  const motion: { partId: string; message: string }[] = [];
  for (const { plate, box } of plates.filter(
    (p) => p.plate.kind === "drawer" || p.plate.kind === "door",
  )) {
    const movement = frontMotion(m, plate);
    const candidates = [
      ...plates
        .filter((q) => q.plate.id !== plate.id)
        .map((q) => ({ name: q.plate.name, box: q.box })),
      ...(m.installation?.obstacles ?? []).map((o) => ({
        name: o.name,
        box: o,
      })),
      ...(m.installation?.furniture ?? []).map((o) => ({
        name: o.geometry.name,
        box: {
          x: o.x,
          y: o.y,
          z: o.z,
          width: o.geometry.width,
          height: o.geometry.height,
          depth: o.geometry.depth,
        },
      })),
    ];
    const samples: Box3[] = [];
    if (plate.kind === "drawer")
      samples.push({ ...box, depth: box.depth + movement.travel });
    else
      for (const degrees of [15, 30, 45, 60, 75, 90]) {
        const angle =
          ((movement.hinge === "right" ? 1 : -1) * degrees * Math.PI) / 180;
        const corners = [box.x, box.x + box.width].flatMap((x) =>
          [box.z, box.z + box.depth].map((z) => ({
            x:
              movement.pivotX +
              (x - movement.pivotX) * Math.cos(angle) +
              (z - movement.pivotZ) * Math.sin(angle),
            z:
              movement.pivotZ -
              (x - movement.pivotX) * Math.sin(angle) +
              (z - movement.pivotZ) * Math.cos(angle),
          })),
        );
        const xs = corners.map((p) => p.x),
          zs = corners.map((p) => p.z);
        samples.push({
          ...box,
          x: Math.min(...xs),
          width: Math.max(...xs) - Math.min(...xs),
          z: Math.min(...zs),
          depth: Math.max(...zs) - Math.min(...zs),
        });
      }
    const hit = candidates.find((q) => samples.some((s) => overlaps(s, q.box)));
    if (hit)
      motion.push({
        partId: plate.id,
        message: `${plate.name}: możliwa kolizja przy otwieraniu z „${hit.name}”.`,
      });
  }
  if (m.installation) {
    const room = m.installation;
    if (m.width + room.left + room.right > room.width)
      installation.push("Mebel i luzy boczne przekraczają szerokość wnęki.");
    if (m.height + room.top > room.height)
      installation.push("Mebel i luz nad nim przekraczają wysokość wnęki.");
    if (m.depth + m.thickness > room.depth)
      installation.push("Sprawdź głębokość wnęki z wystającymi frontami.");
    for (const obstacle of room.obstacles)
      if (plates.some(({ box }) => overlaps(box, obstacle)))
        installation.push(
          `Przeszkoda „${obstacle.name}” przecina obwiednię części.`,
        );
    for (const [index, instance] of (room.furniture ?? []).entries()) {
      const bounds = {
        x: instance.x,
        y: instance.y,
        z: instance.z,
        width: instance.geometry.width,
        height: instance.geometry.height,
        depth: instance.geometry.depth,
      };
      if (
        bounds.x + bounds.width > room.width - room.left ||
        bounds.y + bounds.height > room.height ||
        bounds.z + bounds.depth > room.depth
      )
        installation.push(
          `Mebel „${instance.geometry.name}” z biblioteki wychodzi poza pomiar pomieszczenia.`,
        );
      const bodies = instance.geometry.plates.map((p) => {
        const b = plateBox(instance.geometry, p);
        return {
          ...b,
          x: b.x + instance.x,
          y: b.y + instance.y,
          z: b.z + instance.z,
        };
      });
      if (plates.some((p) => bodies.some((b) => overlaps(p.box, b))))
        installation.push(
          `Mebel „${instance.geometry.name}” z biblioteki przecina bieżący mebel.`,
        );
      for (const obstacle of room.obstacles)
        if (bodies.some((b) => overlaps(b, obstacle)))
          installation.push(
            `Mebel „${instance.geometry.name}” przecina przeszkodę „${obstacle.name}”.`,
          );
      for (const previous of (room.furniture ?? []).slice(0, index))
        if (
          overlaps(bounds, {
            x: previous.x,
            y: previous.y,
            z: previous.z,
            width: previous.geometry.width,
            height: previous.geometry.height,
            depth: previous.geometry.depth,
          })
        )
          installation.push(
            `Możliwe przecięcie mebli z biblioteki: „${previous.geometry.name}” / „${instance.geometry.name}”.`,
          );
    }
  }
  return {
    collisions,
    motion,
    installation,
    method:
      "Kontrola obwiedni i poglądowego ruchu: drzwi próbkowane co 15° do 90°, fronty szuflad wzdłuż wysuwu. Wynik wskazuje potencjalne kolizje, nie obejmuje dokładnych kształtów okuć, ugięć i luzów montażowych producenta.",
  };
}
