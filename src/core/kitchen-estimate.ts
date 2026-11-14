// Server-side calculation. No workshop data, purchase costs or margins in its public DTO.
import {
  kitchenInputSchema,
  kitchenModules,
  kitchenIssues,
  kitchenOptions,
  kitchenFinishes,
  type KitchenEstimate,
} from "./kitchen-configuration.js";
import { zbudujModul } from "./builder.js";
import { USTAWIENIA_DOMYSLNE } from "./settings.js";
import {
  MATERIALY_STARTOWE,
  DOMYSLNY_KORPUS,
  DOMYSLNY_FRONT,
  DOMYSLNE_PLECY,
} from "./catalog/materials.js";
import { OKUCIA_STARTOWE } from "./catalog/hardware.js";
import { listaFormatek, zapotrzebowanieObrzeza } from "./production.js";
import { zbudujProjektWyceny, wycenWariant } from "./pricing.js";
import type { Material, Okucie } from "./types.js";

export function calculateKitchenEstimate(raw: unknown) {
  const input = kitchenInputSchema.parse(raw),
    opts = input.quote;
  const settings = structuredClone(USTAWIENIA_DOMYSLNE);
  const materials: Material[] = [
    ...MATERIALY_STARTOWE,
    {
      ...MATERIALY_STARTOWE.find((m) => m.id === "front-mdf-lakier-mat")!,
      id: "customer-fluted",
      nazwa: "MDF ryflowany lakierowany",
      gruboscMM: 18,
      cenaNetto: 600 / 1.23,
    },
  ];
  const fittings: Okucie[] = [
    ...OKUCIA_STARTOWE,
    {
      ...OKUCIA_STARTOWE.find((o) => o.id === "amix.fgv.drawbox")!,
      id: "customer-amix",
      cenaNetto: 83 / 1.23,
      rabatProcent: 0,
    },
    {
      ...OKUCIA_STARTOWE.find((o) => o.typ === "zawias")!,
      id: "customer-hettich",
      producent: "Hettich",
      nazwa: "Hettich Sensys z prowadnikiem",
      cenaNetto: 14.88 / 1.23,
      rabatProcent: 0,
    },
  ];
  const front =
    opts.front === "fluted"
      ? "customer-fluted"
      : opts.front === "lacquer"
        ? "front-mdf-lakier-mat"
        : DOMYSLNY_FRONT;
  const worktop =
    opts.worktop === "compact" ? "blat-kompakt-12" : "blat-lam-38";
  // Geometry uses chosen thickness too; display and pricing share catalog module positions.
  settings.konstrukcja.gruboscFrontuMM = opts.front === "lacquer" ? 19 : 18;
  settings.konstrukcja.gruboscBlatuMM = opts.worktop === "compact" ? 12 : 38;
  const modules = kitchenModules(input);
  const built = modules.map((m) => zbudujModul(m, settings.konstrukcja));
  const mapped = built.map((zm) => ({
    zm,
    materialy: {
      korpus: DOMYSLNY_KORPUS,
      front,
      plecy: DOMYSLNE_PLECY,
      blat: worktop,
    },
  }));
  const formatki = listaFormatek(
    mapped,
    new Map(materials.map((m) => [m.id, m])),
  );
  const edges = zapotrzebowanieObrzeza(formatki, settings.okleinowanie);
  const quantities = zbudujProjektWyceny("Moja kuchnia", mapped, edges);
  // Sheet count for costing is a conservative area allowance, not a cutting plan.
  quantities.liczbaArkuszy = Math.ceil(
    (formatki
      .filter((f) => f.materialId !== worktop)
      .reduce((s, f) => s + (f.dlugoscMM * f.szerokoscMM) / 1e6, 0) /
      5.796) *
      1.15,
  );
  if (!opts.installation) {
    quantities.liczbaGodzinMontazu = 0;
    settings.finanse.kosztMontazuZaGodzine = 0;
  }
  const priced = wycenWariant(
    "standard",
    quantities,
    settings,
    materials,
    fittings,
    {
      systemSzuflad:
        opts.drawers === "amix" ? "customer-amix" : "blum.tandembox.antaro",
      zawiasy: "customer-hettich",
    },
  );
  const issues = kitchenIssues(input);
  if (!modules.length) issues.push("Dodaj szafki, aby obliczyć cenę kuchni.");
  if (priced.pozycje.some((p) => p.jestBledemWyceny))
    issues.push(
      "Brakuje cen dla wybranego zakresu. Cenę ustalimy indywidualnie.",
    );
  const notes = [
    "Cena orientacyjna na stawkach modelowych, do potwierdzenia po pomiarze i wyborze dekorów. Nie jest potwierdzonym cennikiem zakładu.",
    "Bez zakupu AGD, zlewu, baterii, podłączeń i przebudowy instalacji. Transport przyjęto jako lokalny; adres i warunki wniesienia do potwierdzenia.",
    "Narożniki w układach L/U pozostają puste (650 mm na ścianach B/C); ich wykończenie i ewentualne systemy narożne wymagają osobnej wyceny.",
    "Dobór okuć, luzów, wysokości i grubości materiałów wymaga weryfikacji. Rysunki są koncepcyjne, nie produkcyjne.",
  ];
  const rawGroups = [
    {
      label: "Meble z frontami i okuciami",
      value: priced.pozycje
        .filter((p) => !["blaty", "montaz", "transport"].includes(p.kategoria))
        .reduce((s, p) => s + p.kosztNetto, 0),
    },
    {
      label: "Blat",
      value: priced.pozycje
        .filter((p) => p.kategoria === "blaty")
        .reduce((s, p) => s + p.kosztNetto, 0),
    },
    {
      label: opts.installation
        ? "Transport lokalny i montaż"
        : "Transport lokalny (bez montażu)",
      value: priced.pozycje
        .filter((p) => ["montaz", "transport"].includes(p.kategoria))
        .reduce((s, p) => s + p.kosztNetto, 0),
    },
  ];
  const total = Math.round(priced.cenaBrutto);
  const weight = rawGroups.reduce((s, g) => s + g.value, 0);
  const groups = rawGroups.map((g) => ({
    label: g.label,
    gross: Math.round((total * g.value) / weight),
  }));
  groups[0].gross += total - groups.reduce((s, g) => s + g.gross, 0);
  const estimate: KitchenEstimate = {
    version: "oferta-2-a4-v1",
    basis: "Model kalkulacyjny 13.11.2026",
    status: issues.length ? "blocked" : "estimated",
    gross: issues.length ? null : total,
    groups: issues.length ? [] : groups,
    scope: [
      {
        label: "Konstrukcja",
        description: `${modules.length} szafek, korpusy laminowane 18 mm. Układ ${input.layout === "straight" ? "prosty" : input.layout.toUpperCase()}; ściany ${[input.width, ...(input.layout !== "straight" ? [input.depth] : []), ...(input.layout === "u" ? [input.returnLength] : [])].join(" / ")} mm.`,
      },
      {
        label: "Fronty",
        description: `${kitchenOptions.front[opts.front]}. ${input.decor ? `${input.decor.manufacturer} ${input.decor.id}: ${input.decor.name}. ` : ""}Kolor poglądowy: ${kitchenFinishes[input.finish]}. Dekor do potwierdzenia na próbce.`,
      },
      {
        label: "Okucia",
        description: `${kitchenOptions.drawers[opts.drawers]}, ${quantities.liczbaSzuflad} szuflad. Uchwyty standardowe. Liczba zawiasów i model prowadnic do weryfikacji.`,
      },
      {
        label: "Blat",
        description: `${kitchenOptions.worktop[opts.worktop]}, około ${quantities.metryBiezaceBlatu.toLocaleString("pl-PL")} mb. Dekor i wycięcia po sprawdzeniu instalacji.`,
      },
      {
        label: "Realizacja",
        description: opts.installation
          ? "Wykonanie na wymiar, transport lokalny i montaż mebli; bez podłączeń instalacyjnych."
          : "Wykonanie na wymiar i transport lokalny; bez montażu i podłączeń instalacyjnych.",
      },
    ],
    notes,
    issues,
  };
  return { input, estimate, modules, built };
}
