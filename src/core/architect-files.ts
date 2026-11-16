import { z } from "zod";
export const ARCHITECT_FILE_LIMIT = 10 * 1024 * 1024;
export const ARCHITECT_TOTAL_LIMIT = 40 * 1024 * 1024;
export const architectFileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(180),
  format: z.enum(["dxf", "dwg", "pdf"]),
  size: z.number().int().min(1).max(ARCHITECT_FILE_LIMIT),
  room: z.string().min(1).max(80).default("Kuchnia"),
  role: z
    .enum(["plan", "elevation", "installation", "inspiration"])
    .default("plan"),
  reference: z
    .object({
      unit: z.enum(["mm", "cm", "m", "in", "ft"]),
      layer: z.string().max(180),
      rotation: z.union([
        z.literal(0),
        z.literal(90),
        z.literal(180),
        z.literal(270),
      ]),
      x: z.number().int().min(-8000).max(8000),
      y: z.number().int().min(-8000).max(8000),
    })
    .optional(),
});
export const architectFilesSchema = z
  .array(architectFileSchema)
  .max(20)
  .superRefine((files, ctx) => {
    if (files.filter((f) => f.reference).length > 4)
      ctx.addIssue({
        code: "custom",
        message:
          "Jednocześnie można włączyć do 4 podkładów DXF. Pozostałe pliki zachowaj jako dokumentację.",
      });
    if (
      new Set(files.map((f) => f.id)).size !== files.length ||
      files.reduce((s, f) => s + f.size, 0) > ARCHITECT_TOTAL_LIMIT
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Pliki muszą mieć unikalne identyfikatory i łącznie do 40 MiB.",
      });
    if (files.some((f) => f.reference && f.format !== "dxf"))
      ctx.addIssue({ code: "custom", message: "Podkład wymaga pliku DXF." });
  });
export type ArchitectFile = z.infer<typeof architectFileSchema>;
export const architectRoles = {
  plan: "Rzut",
  elevation: "Elewacja",
  installation: "Instalacje",
  inspiration: "Inspiracja",
} as const;
