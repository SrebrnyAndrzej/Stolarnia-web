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
// Explicit loopback-only browser-test fixture. Disabled in the default customer preview.
const qaStaff = (q: express.Request) => {
  if (process.env.PAN_STOLARZ_QA_STAFF_FIXTURES !== "1") return null;
  const role = /(?:^|;\s*)pan_stolarz_qa_staff=(owner|employee)(?:;|$)/.exec(
    q.get("cookie") ?? "",
  )?.[1];
  return role
    ? {
        user_id: "00000000-0000-4000-8000-000000000001",
        role,
        active: true,
        email: "qa@example.test",
        display_name: "QA",
        project_ids: [],
        access_profile: "produkcja",
      }
    : null;
};
app.get("/api/v2/session", (q, r) => {
  const staff = qaStaff(q);
  r.setHeader("Cache-Control", "private, no-store");
  staff
    ? r.json(staff)
    : r.status(401).json({ blad: "Zaloguj się, aby kontynuować." });
});
for (const prefix of ["/api", "/api/demo"]) {
  app.use(
    [`${prefix}/systemy-szuflad`, `${prefix}/przelicznik-szuflad`],
    (q, r, next) => {
      r.setHeader("Cache-Control", "private, no-store");
      if (!qaStaff(q)) {
        r.status(401).json({ blad: "Zaloguj się, aby kontynuować." });
        return;
      }
      next();
    },
  );
  app.get(`${prefix}/systemy-szuflad`, (_q, r) => r.json(drawerSystems()));
  app.get(`${prefix}/przelicznik-szuflad`, (q, r) => {
    try {
      r.json(calculateDrawer(q, calculator));
    } catch (e) {
      r.status(400).json({ blad: (e as Error).message });
    }
  });
}
app.use(express.static("dist/web"));
app.listen(4201, "127.0.0.1", () =>
  console.log("Kitchen estimate QA: http://127.0.0.1:4201/#/kreator-kuchni"),
);
