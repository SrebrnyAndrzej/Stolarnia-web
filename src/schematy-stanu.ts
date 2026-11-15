import { z } from "zod";

// Schemat stanu projektu przywracanego przez „cofnij / przywróć” (PUT /api/projekty/:id/stan). Wcześniej usługa
// przyjmowała dowolne tablice — teraz pola rdzeniowe są sprawdzane (typy, skończone liczby, limity mm, unikalne id,
// odwołania modułów do ścian). Pola dodatkowe (konfiguracja, drzewo silnika, wykończenia) przechodzą bez zmian,
// bo zapisuje je ten sam klient z migawki pobranej z serwera; silnik waliduje je przy budowie.

const id = z.string().min(1).max(120);
const mm = (maks = 20000) => z.number().finite().min(0).max(maks);
const wymiar = (maks = 20000) => z.number().finite().positive().max(maks);

const sciana = z
  .object({
    id,
    nazwa: z.string().max(200),
    dlugoscMM: wymiar(),
    wysokoscMM: wymiar(),
    x1: z.number().finite().optional(),
    y1: z.number().finite().optional(),
    x2: z.number().finite().optional(),
    y2: z.number().finite().optional(),
    wirtualna: z.boolean().optional(),
  })
  .passthrough();

const pomieszczenie = z
  .object({
    id,
    nazwa: z.string().max(200),
    sciany: z.array(sciana).max(50),
    materialKorpusuId: id,
    materialFrontuId: id,
    materialBlatuId: id.optional(),
    bezUchwytow: z.boolean().optional(),
  })
  .passthrough();

const modul = z
  .object({
    id,
    katalogId: id.optional(),
    nazwa: z.string().max(200),
    kategoria: z.enum(["base", "wall", "tall", "corner", "appliance", "open"]),
    konstrukcja: z.string().min(1).max(60),
    scianaId: id,
    pozycjaXMM: z.number().finite().min(-20000).max(20000),
    pozycjaYMM: mm(),
    szerokoscMM: wymiar(5000),
    wysokoscMM: wymiar(5000),
    glebokoscMM: wymiar(3000),
    konfiguracja: z.record(z.unknown()),
    materialKorpusuId: id.optional(),
    materialFrontuId: id.optional(),
    uwagi: z.string().max(4000).optional(),
    drzewo: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const schematStanuProjektu = z
  .object({
    pomieszczenia: z.array(pomieszczenie).min(1).max(20),
    moduly: z.array(modul).max(2000),
  })
  .superRefine((stan, ctx) => {
    const sciany = stan.pomieszczenia.flatMap((p) => p.sciany.map((s) => s.id));
    const unikalne = (lista: string[], co: string) => {
      if (new Set(lista).size !== lista.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Powtórzone id: ${co}.` });
    };
    unikalne(stan.pomieszczenia.map((p) => p.id), "pomieszczenia");
    unikalne(sciany, "ściany");
    unikalne(stan.moduly.map((m) => m.id), "moduły");
    const znane = new Set(sciany);
    stan.moduly.forEach((m, i) => {
      if (!znane.has(m.scianaId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["moduly", i, "scianaId"], message: `Moduł „${m.nazwa}” wskazuje nieistniejącą ścianę.` });
    });
  });
