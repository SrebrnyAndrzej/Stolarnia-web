import { z } from "zod";

const money = z.number().finite().min(0).max(1000000);
export const fairQuoteSchema = z
  .object({
    materialsNet: money,
    preparationNet: money.default(0),
    productionHours: z.number().finite().min(0).max(2000),
    productionHourCostNet: money,
    overheadNet: money.default(0),
    installationNet: money.default(0),
    transportNet: money.default(0),
    boughtWorktopNet: money.default(0),
    worktopMarkupPercent: z.number().finite().min(0).max(100).default(10),
    materialMultiplier: z.number().finite().min(1).max(4).default(2),
    reservePercent: z.number().finite().min(0).max(30).default(3),
    minimumMarginPercent: z.number().finite().min(0).max(60).default(15),
    targetMarginPercent: z.number().finite().min(0).max(70).default(25),
    minimumProfitNet: money.default(500),
    minimumOrderNet: money.default(1500),
    vatPercent: z.number().finite().min(0).max(30).default(23),
    roundGrossTo: z.number().finite().min(0).max(500).default(50),
  })
  .superRefine((p, ctx) => {
    if (p.targetMarginPercent < p.minimumMarginPercent)
      ctx.addIssue({
        code: "custom",
        path: ["targetMarginPercent"],
        message: "Docelowa marża nie może być niższa od minimalnej.",
      });
    if (p.productionHours > 0 && p.productionHourCostNet === 0)
      ctx.addIssue({
        code: "custom",
        path: ["productionHourCostNet"],
        message: "Praca wymaga podania kosztu osobogodziny.",
      });
    if (
      p.materialsNet +
        p.preparationNet +
        p.productionHours * p.productionHourCostNet +
        p.installationNet +
        p.transportNet +
        p.boughtWorktopNet +
        p.overheadNet ===
      0
    )
      ctx.addIssue({
        code: "custom",
        path: ["materialsNet"],
        message: "Podaj materiały lub koszt pracy, aby obliczyć wycenę.",
      });
  });
export type FairQuoteInput = z.infer<typeof fairQuoteSchema>;

/** All money is handled in grosz. A multiplier is a proposal, never a substitute for a cost check. */
export function fairQuote(raw: unknown) {
  const input = fairQuoteSchema.parse(raw),
    cents = (n: number) => Math.round(n * 100),
    pln = (n: number) => n / 100;
  const materials = cents(input.materialsNet) + cents(input.preparationNet);
  const production = cents(input.productionHours * input.productionHourCostNet);
  const worktop = cents(input.boughtWorktopNet),
    installation = cents(input.installationNet),
    transport = cents(input.transportNet),
    overhead = cents(input.overheadNet);
  const base =
    materials + production + worktop + installation + transport + overhead;
  const reserve = Math.ceil((base * input.reservePercent) / 100),
    protectedCost = base + reserve;
  const floor = Math.max(
    Math.ceil(protectedCost / (1 - input.minimumMarginPercent / 100)),
    protectedCost + cents(input.minimumProfitNet),
    cents(input.minimumOrderNet),
  );
  const target = Math.max(
    floor,
    Math.ceil(protectedCost / (1 - input.targetMarginPercent / 100)),
  );
  // Production is funded from the multiplier's second half; adding full production here would count it twice.
  const multiplier =
    Math.ceil(materials * input.materialMultiplier) +
    Math.ceil(worktop * (1 + input.worktopMarkupPercent / 100)) +
    installation +
    transport;
  const selected = Math.max(floor, Math.min(multiplier, target));
  const grossBeforeRounding = Math.ceil(
    selected * (1 + input.vatPercent / 100),
  );
  const step = cents(input.roundGrossTo);
  const gross = step
    ? Math.ceil(grossBeforeRounding / step) * step
    : grossBeforeRounding;
  const net = Math.round(gross / (1 + input.vatPercent / 100));
  const profit = net - protectedCost;
  const multiplierProfit = multiplier - protectedCost;
  return {
    version: "fair-quote-v1" as const,
    input,
    costs: {
      materialsNet: pln(materials),
      productionNet: pln(production),
      boughtWorktopNet: pln(worktop),
      installationNet: pln(installation),
      transportNet: pln(transport),
      overheadNet: pln(overhead),
      baseNet: pln(base),
      reserveNet: pln(reserve),
      protectedCostNet: pln(protectedCost),
    },
    multiplier: {
      net: pln(multiplier),
      gross: pln(Math.ceil(multiplier * (1 + input.vatPercent / 100))),
      profitNet: pln(multiplierProfit),
      marginPercent: multiplier ? (100 * multiplierProfit) / multiplier : 0,
    },
    minimumNet: pln(floor),
    targetNet: pln(target),
    net: pln(net),
    gross: pln(gross),
    vat: pln(gross - net),
    profitNet: pln(profit),
    marginPercent: net ? (100 * profit) / net : 0,
    adjustment:
      multiplier < floor
        ? ("floor" as const)
        : multiplier > target
          ? ("cap" as const)
          : ("multiplier" as const),
    warnings: [
      ...(multiplier < floor
        ? [
            "Mnożnik nie pokrywa założonego minimum. Cenę podniesiono do progu kosztów i wynagrodzenia firmy.",
          ]
        : []),
      ...(multiplier > target
        ? [
            "Mnożnik daje więcej niż cena wynikająca z kosztów i docelowej marży. Ograniczono go do tego poziomu.",
          ]
        : []),
      "Wynik zależy od podanych kosztów i osobogodzin. Wynagrodzenie za Twoją pracę musi być kosztem, a nie pozostałością z zysku.",
      "Zysk kalkulacyjny jest po kosztach pracy i rezerwie, przed podatkiem dochodowym. Rzeczywiste koszty i termin wymagają sprawdzenia.",
    ],
  };
}
export type FairQuoteResult = ReturnType<typeof fairQuote>;
