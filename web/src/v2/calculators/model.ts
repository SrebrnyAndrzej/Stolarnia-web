import { z } from "zod";
import {
  DOMYSLNY_FORMULARZ,
  type FormularzSzuflad,
} from "../../views/szuflady/model";

const bridgeSchema = z.object({
  lw: z.coerce.number().positive().max(1200),
  nl: z.coerce.number().int().min(270).max(650),
  width: z.coerce.number().positive().max(1200),
  height: z.coerce.number().positive().max(2600),
  system: z.enum(["amix", "blum"]),
});
export const drawerSourceSchema = z.object({
  cabinet: z.string().uuid(),
  front: z.string().regex(/^FRONT-SZ\d{2}$/),
});
export function drawerSource(search: string) {
  const q = new URLSearchParams(search);
  if (!q.has("cabinet") && !q.has("front")) return undefined;
  return drawerSourceSchema.parse({
    cabinet: q.get("cabinet"),
    front: q.get("front"),
  });
}
export function drawerReturnLink(source?: z.infer<typeof drawerSourceSchema>) {
  return source
    ? `#/kreator-kuchni?${new URLSearchParams({ szafka: source.cabinet, front: source.front })}`
    : "#/kreator-kuchni";
}
/** Keep only supported, validated calculator values when moving between tools. */
export function drawerQuery(search: string) {
  if (!search) return "";
  const d = bridgeSchema.parse(Object.fromEntries(new URLSearchParams(search)));
  const source = drawerSource(search);
  return new URLSearchParams({
    ...Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v)])),
    ...source,
  }).toString();
}
export function drawerBridge(search: string): FormularzSzuflad | undefined {
  if (!search) return undefined;
  const input = Object.fromEntries(new URLSearchParams(search));
  const d = bridgeSchema.parse(input);
  return {
    ...DOMYSLNY_FORMULARZ,
    system:
      d.system === "amix"
        ? "amix-elite-standard"
        : "blum-tandembox-antaro-m-wood",
    wariant: "",
    szerokoscTryb: "lw",
    lw: String(d.lw),
    nl: String(d.nl),
    frontZewSzer: String(d.width),
    frontZewWys: String(d.height),
    otworZew: "",
    otworWew: "",
    rozstaw: false,
  };
}
