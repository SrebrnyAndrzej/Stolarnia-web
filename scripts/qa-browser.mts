// Test-only HTTP host. Not imported by the application or any deployment entrypoint.
import express from "express";
import { mkdtempSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { registerKitchenEstimate } from "../src/server/kitchen-estimate.js";
import {
  registerKitchenProjects,
  KitchenProjectRecords,
} from "../src/server/kitchen-projects.js";
import { AccessError } from "../src/server/access.js";
import {
  drawerSystems,
  calculateDrawer,
  previewCalculator,
} from "../src/server/drawer-preview.js";
import { Stolarnia } from "../src/service.js";
import { Magazyn, konfiguracjaChmury } from "../src/store/store.js";

const port = Number(process.env.PAN_STOLARZ_QA_PORT ?? 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid QA port");
const qaTempRoot = realpathSync(tmpdir());
const dataDir = mkdtempSync(join(qaTempRoot, "pan-stolarz-browser-"));
if (konfiguracjaChmury())
  throw new Error("QA server refuses cloud database configuration");
const store = new Magazyn(dataDir);
const calculator = previewCalculator(new Stolarnia(store));
const app = express();
// Match the app's parser so real chunked architect uploads are exercised.
app.use(express.json({ limit: "30mb" }));
registerKitchenEstimate(app, () => {});
const staff = (q: express.Request) => {
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
registerKitchenProjects(app, {
  store,
  admin: null,
  records: new KitchenProjectRecords(join(dataDir, "online")),
  checkOrigin: () => {},
  identify: async (q) => {
    const person = staff(q);
    if (!person) throw new AccessError(401, "Zaloguj się, aby kontynuować.");
    return person;
  },
});
app.get("/api/v2/session", (q, r) => {
  r.setHeader("Cache-Control", "private, no-store");
  const person = staff(q);
  person
    ? r.json(person)
    : r.status(401).json({ blad: "Zaloguj się, aby kontynuować." });
});
for (const prefix of ["/api", "/api/demo"]) {
  app.use(
    [`${prefix}/systemy-szuflad`, `${prefix}/przelicznik-szuflad`],
    (q, r, next) => {
      r.setHeader("Cache-Control", "private, no-store");
      if (!staff(q)) {
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
    } catch (error) {
      r.status(400).json({ blad: (error as Error).message });
    }
  });
}
// All other private APIs need an explicit per-test fixture; never use real data.
app.use(["/api/v2", "/api/projekty"], (_q, r) =>
  r.status(401).json({ blad: "Brak sesji w serwerze QA." }),
);
app.use(express.static("dist/web"));
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`Browser QA: http://127.0.0.1:${port}`),
);
const shutdown = () =>
  server.close(() => {
    const target = realpathSync(dataDir);
    if (
      dirname(target) !== qaTempRoot ||
      !basename(target).startsWith("pan-stolarz-browser-")
    )
      throw new Error("Unsafe QA cleanup path");
    rmSync(target, { recursive: true, force: true });
    process.exit(0);
  });
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
