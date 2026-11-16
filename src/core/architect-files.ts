import { z } from "zod";
export const ARCHITECT_FILE_LIMIT = 10 * 1024 * 1024;
export const ARCHITECT_TOTAL_LIMIT = 40 * 1024 * 1024;
export const imageReferenceSchema = z
  .object({
    pixelWidth: z.number().int().min(1).max(20000),
    pixelHeight: z.number().int().min(1).max(20000),
    crop: z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      width: z.number().int().min(1),
      height: z.number().int().min(1),
    }),
    mmPerPixel: z.number().positive().max(1000),
    calibration: z
      .object({
        from: z.object({
          x: z.number().int().min(0),
          y: z.number().int().min(0),
        }),
        to: z.object({
          x: z.number().int().min(0),
          y: z.number().int().min(0),
        }),
        lengthMM: z.number().positive().max(20000),
      })
      .optional(),
    rotation: z.union([
      z.literal(0),
      z.literal(90),
      z.literal(180),
      z.literal(270),
    ]),
    x: z.number().int().min(-8000).max(8000),
    y: z.number().int().min(-8000).max(8000),
  })
  .superRefine((r, ctx) => {
    if (r.calibration) {
      const { from, to, lengthMM } = r.calibration;
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      if (
        distance < 2 ||
        [from, to].some((p) => p.x > r.pixelWidth || p.y > r.pixelHeight) ||
        Math.abs(distance * r.mmPerPixel - lengthMM) > 0.1
      )
        ctx.addIssue({
          code: "custom",
          message: "Odcinek odniesienia nie zgadza się z obrazem lub skalą.",
        });
    }
    if (
      r.pixelWidth * r.pixelHeight > 24000000 ||
      r.crop.x + r.crop.width > r.pixelWidth ||
      r.crop.y + r.crop.height > r.pixelHeight ||
      Math.max(r.crop.width, r.crop.height) * r.mmPerPixel > 20000
    )
      ctx.addIssue({
        code: "custom",
        message: "Sprawdź kadr i skalę: do 24 mln pikseli i 20 m podkładu.",
      });
  });
export type ImageReference = z.infer<typeof imageReferenceSchema>;
export function imageReferenceSize(r: ImageReference) {
  const width = Math.round(r.crop.width * r.mmPerPixel),
    depth = Math.round(r.crop.height * r.mmPerPixel);
  return r.rotation === 90 || r.rotation === 270
    ? { width: depth, depth: width }
    : { width, depth };
}
export type ArchitectImage = { url: string; reference: ImageReference };
export const architectFileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(180),
  format: z.enum(["dxf", "dwg", "pdf", "jpg", "png"]),
  size: z.number().int().min(1).max(ARCHITECT_FILE_LIMIT),
  room: z.string().min(1).max(80).default("Kuchnia"),
  role: z
    .enum(["plan", "elevation", "installation", "inspiration"])
    .default("plan"),
  imageReference: imageReferenceSchema.optional(),
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
    if (files.filter((f) => f.reference || f.imageReference).length > 4)
      ctx.addIssue({
        code: "custom",
        message:
          "Jednocześnie można włączyć do 4 podkładów DXF lub obrazów. Pozostałe pliki zachowaj jako dokumentację.",
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
    if (
      files.some((f) => f.imageReference && !["jpg", "png"].includes(f.format))
    )
      ctx.addIssue({
        code: "custom",
        message: "Podkład obrazu wymaga JPG lub PNG.",
      });
  });
export type ArchitectFile = z.infer<typeof architectFileSchema>;
export const architectRoles = {
  plan: "Rzut",
  elevation: "Elewacja",
  installation: "Instalacje",
  inspiration: "Inspiracja",
} as const;
