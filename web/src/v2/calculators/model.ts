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
