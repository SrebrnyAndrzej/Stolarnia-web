import express from "express";
import { registerKitchenEstimate } from "../src/server/kitchen-estimate.js";
import {
  drawerSystems,
  calculateDrawer,
  previewCalculator,
} from "../src/server/drawer-preview.js";
import { Stolarnia } from "../src/service.js";
import { Magazyn } from "../src/store/store.js";
import { join } from "node:path";
const app = express();
app.use(express.json({ limit: "64kb" }));
registerKitchenEstimate(app, () => {});
const calculator = previewCalculator(
  new Stolarnia(new Magazyn(join(process.cwd(), "../../work/qa-public-tools"))),
);
app.get("/api/demo/systemy-szuflad", (_q, r) => r.json(drawerSystems()));
app.get("/api/demo/przelicznik-szuflad", (q, r) => {
  try {
    r.json(calculateDrawer(q, calculator));
  } catch (e) {
    r.status(400).json({ blad: (e as Error).message });
  }
});
app.get("/api/v2/session", (_q, r) =>
  r.status(401).json({ blad: "QA: brak sesji" }),
);
app.use(express.static("dist/web"));
app.listen(4201, "127.0.0.1", () =>
  console.log("Kitchen estimate QA: http://127.0.0.1:4201/#/kreator-kuchni"),
);
