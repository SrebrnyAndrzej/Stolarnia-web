import express from "express";
import { randomUUID } from "node:crypto";
import { freshFurniture, carcass } from "../src/core/furniture.js";
import { furnitureSave } from "../src/core/furniture-schema.js";
const model = freshFurniture();
model.name = "Próba okuć - dane testowe";
model.plates = carcass(model, randomUUID);
model.plates.push({
  id: randomUUID(),
  name: "Front testowy",
  kind: "door",
  x: 18,
  y: 18,
  z: 560,
  width: 450,
  height: 1800,
  depth: 18,
});
let library = [
  {
    id: randomUUID(),
    version: 1,
    model,
    createdBy: "hardware-qa",
    updatedBy: "hardware-qa",
    updatedAt: new Date().toISOString(),
  },
];
const app = express();
app.use(express.json());
app.get("/api/v2/session", (_q, s) =>
  s.json({
    user_id: "hardware-qa",
    role: "employee",
    active: true,
    display_name: "Próba lokalna",
    email: "test@example.com",
    project_ids: [],
  }),
);
app.get("/api/v2/config", (_q, s) => s.json({ authReady: true }));
app.get("/api/v2/furniture", (_q, s) => s.json(library));
app.put("/api/v2/furniture", (q, s) => {
  const p = furnitureSave.safeParse(q.body);
  if (!p.success) return s.status(400).json({ blad: "Nieprawidłowy szkic" });
  const e = {
    ...p.data,
    version: p.data.version + 1,
    createdBy: "hardware-qa",
    updatedBy: "hardware-qa",
    updatedAt: new Date().toISOString(),
  };
  library = [e];
  s.json(e);
});
app.get("/api/*", (_q, s) => s.json([]));
app.use(express.static("dist/web"));
app.listen(4195, "127.0.0.1", () =>
  console.log(
    `Test UI: http://127.0.0.1:4195/#/panel/meble?model=${library[0].id}&version=1`,
  ),
);
