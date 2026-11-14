import type { Express, Request } from "express";
import { ZodError } from "zod";
import { calculateKitchenEstimate } from "../core/kitchen-estimate.js";
import { standardOfferPdf } from "../export/offer-standard.js";

export function registerKitchenEstimate(
  app: Express,
  checkOrigin: (req: Request) => void,
) {
  for (const pdf of [false, true])
    app.post(
      `/api/public/kitchen-estimate${pdf ? "/pdf" : ""}`,
      async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        try {
          checkOrigin(req);
          const { input, estimate, modules, built } = calculateKitchenEstimate(
            req.body,
          );
          if (!pdf) {
            res.json(estimate);
            return;
          }
          if (estimate.status !== "estimated") {
            res.status(422).json({ blad: estimate.issues.join(" ") });
            return;
          }
          const buffer = await standardOfferPdf({
            title: "Kuchnia dopasowana do Państwa wnętrza.",
            date: new Date(),
            reference: estimate.version,
            gross: estimate.gross,
            groups: estimate.groups,
            scope: estimate.scope,
            notes: estimate.notes,
            modules,
            built,
            preliminary: true,
            frontColor: {
              white: "#eeede8",
              oak: "#b89668",
              sage: "#929d87",
              graphite: "#435058",
              cashmere: "#d8cfc1",
            }[input.finish],
            frontFluted: input.quote.front === "fluted",
            worktopColor:
              input.quote.worktop === "compact" ? "#6c7476" : "#b58c5e",
          });
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="Pan-Stolarz-wstepna-wycena-kuchni.pdf"',
          );
          res.send(buffer);
        } catch (e) {
          if (e instanceof ZodError) {
            res.status(400).json({
              blad: "Niepoprawny szkic kuchni. Sprawdź wymiary, szafki i wyposażenie.",
            });
            return;
          }
          const status =
            typeof e === "object" && e !== null && "status" in e
              ? Number(e.status)
              : 500;
          res.status(status >= 400 && status <= 599 ? status : 500).json({
            blad: "Nie udało się przygotować wyceny. Spróbuj ponownie.",
          });
        }
      },
    );
}
