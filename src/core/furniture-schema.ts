import { z } from "zod";
import { compartmentSchema } from "./furniture-compartments.js";
import { frontHardwareSchema } from "./front-hardware.js";
const mm = z.number().finite().min(1).max(10000);
const coordinate = z.number().finite().min(0).max(10000);
const edge = z
  .object({
    state: z.enum(["unset", "none", "band"]),
    material: z.string().trim().max(120),
    thickness: z.number().finite().min(0.1).max(10),
  })
  .strict();
const specification = z
  .object({
    material: z.string().trim().max(120),
    decor: z.string().trim().max(120),
    face: z.enum(["unset", "xy", "xz", "yz", "slope"]),
    grain: z.enum(["unset", "none", "u", "v"]),
    edges: z.object({ u0: edge, u1: edge, v0: edge, v1: edge }).strict(),
  })
  .strict();
const plate = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    kind: z.enum(["board", "drawer", "door", "cap"]),
    anchor: z.enum(["left", "right", "bottom", "top", "back"]).optional(),
    x: coordinate,
    y: coordinate,
    z: coordinate,
    width: mm,
    height: mm,
    depth: mm,
    specification: specification.optional(),
    frontHardware: frontHardwareSchema.optional(),
    layoutSlot: z.string().min(1).max(100).optional(),
    layoutCustomized: z.boolean().optional(),
  })
  .strict();
export const furnitureSave = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().min(0),
    model: z
      .object({
        name: z.string().trim().min(2).max(100),
        width: mm.min(100),
        height: mm.min(100),
        depth: mm.min(100),
        thickness: mm.max(100),
        shape: z.enum(["rectangle", "slope", "stairs"]),
        lowHeight: mm,
        steps: z.number().int().min(2).max(20),
        reverse: z.boolean(),
        plates: z.array(plate).min(1).max(150),
        drawerFit: z.enum(["fill", "fixed"]).optional(),
        customDrawerSet: z.boolean().optional(),
        compartments: compartmentSchema.optional(),
        appearance: z
          .object({
            bodyColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
            frontColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
          })
          .strict()
          .optional(),
        installation: z
          .object({
            width: mm,
            height: mm,
            depth: mm,
            left: coordinate,
            right: coordinate,
            top: coordinate,
            furniture: z
              .array(
                z
                  .object({
                    id: z.string().uuid(),
                    sourceId: z.string().uuid(),
                    sourceVersion: z.number().int().positive(),
                    x: coordinate,
                    y: coordinate,
                    z: coordinate,
                    geometry: z
                      .object({
                        name: z.string().trim().min(2).max(100),
                        width: mm,
                        height: mm,
                        depth: mm,
                        thickness: mm.max(100),
                        shape: z.enum(["rectangle", "slope", "stairs"]),
                        lowHeight: mm,
                        steps: z.number().int().min(2).max(20),
                        reverse: z.boolean(),
                        plates: z.array(plate).min(1).max(150),
                      })
                      .strict(),
                  })
                  .strict(),
              )
              .max(12)
              .optional(),
            obstacles: z
              .array(
                z
                  .object({
                    id: z.string().uuid(),
                    name: z.string().trim().min(1).max(80),
                    x: coordinate,
                    y: coordinate,
                    z: coordinate,
                    width: mm,
                    height: mm,
                    depth: mm,
                  })
                  .strict(),
              )
              .max(20),
          })
          .strict()
          .optional(),
        desk: z
          .object({
            worktopHeight: z.number().finite().min(100).max(3000),
            cabinetWidth: z.number().finite().min(100).max(3000),
            hutchDepth: z.number().finite().min(50).max(2000),
            side: z.enum(["left", "right", "both"]),
            cabinetFront: z.enum(["open", "door", "drawers"]),
          })
          .strict()
          .optional(),
        suggestion: z
          .object({
            variant: z.enum([
              "auto",
              "wardrobe",
              "shelves",
              "drawers",
              "mixed",
              "desk",
              "desk-storage",
              "desk-hutch",
              "empty",
            ]),
            excludedSlots: z.array(z.string().min(1).max(100)).max(150),
          })
          .strict()
          .optional(),
        drawerAssemblies: z
          .array(
            z
              .object({
                frontId: z.string().uuid(),
                profileId: z.string().trim().min(1).max(100),
                variant: z.string().trim().max(30),
                nominalLength: z
                  .number()
                  .finite()
                  .positive()
                  .max(3000)
                  .nullable(),
                leftBoundaryId: z.string().uuid().optional(),
                rightBoundaryId: z.string().uuid().optional(),
              })
              .strict(),
          )
          .max(36)
          .optional(),
        construction: z
          .object({
            version: z.literal(1),
            back: z.enum(["none", "applied"]),
            backThickness: z.number().finite().min(1).max(30),
            dimensionMode: z.enum(["unset", "finished", "substrate"]),
            bodyMaterial: z.string().trim().max(120),
            bodyDecor: z.string().trim().max(120),
            frontMaterial: z.string().trim().max(120),
            frontDecor: z.string().trim().max(120),
            backMaterial: z.string().trim().max(120),
            backDecor: z.string().trim().max(120),
            edgeMaterial: z.string().trim().max(120),
            edgeThickness: z.number().finite().min(0.1).max(10),
          })
          .strict()
          .optional(),
      })
      .strict(),
  })
  .strict();
