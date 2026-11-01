import { test } from "node:test";
import assert from "node:assert/strict";
import {
  taskCreate,
  taskUpdate,
  requireWorkshop,
  taskFailure,
} from "./tasks.js";
import type { Principal } from "./access.js";
const person = { active: true, role: "employee" } as Principal;
test("clients and inactive workers cannot use workshop tasks", () => {
  assert.doesNotThrow(() => requireWorkshop(person));
  assert.throws(() => requireWorkshop({ ...person, active: false }));
  assert.throws(() => requireWorkshop({ ...person, role: "client" }));
});
test("task commands reject financial or identity fields and invalid revisions", () => {
  assert.equal(
    taskUpdate.safeParse({ version: 1, status: "working", actor: "owner" })
      .success,
    false,
  );
  assert.equal(
    taskUpdate.safeParse({ version: 0, status: "done" }).success,
    false,
  );
  assert.equal(
    taskUpdate.safeParse({ version: 2, status: "working" }).success,
    true,
  );
  assert.equal(
    taskCreate.safeParse({
      title: "test",
      project_id: "p",
      assignee_id: "not-a-user",
    }).success,
    false,
  );
});
test("database conflicts and forbidden updates are not reported as success", () => {
  assert.throws(
    () => taskFailure("task_conflict"),
    (e) => (e as { status: number }).status === 409,
  );
  assert.throws(
    () => taskFailure("task_forbidden"),
    (e) => (e as { status: number }).status === 403,
  );
  assert.throws(
    () => taskFailure("private database details"),
    (e) => (e as Error).message.includes("private") === false,
  );
});
