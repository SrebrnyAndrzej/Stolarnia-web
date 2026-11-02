import test from "node:test";
import assert from "node:assert/strict";
import { createEmployee, employeeActivation, memberCreate } from "./members.js";
import type { Principal } from "./access.js";
const owner: Principal = {
  user_id: "00000000-0000-4000-8000-000000000001",
  role: "owner",
  active: true,
  display_name: "Owner",
  project_ids: [],
  email: "owner@example.com",
};
const input = {
  operation_id: "00000000-0000-4000-8000-000000000002",
  display_name: "Test Employee",
  email: "Employee@example.com",
  job_role: "Montażysta",
  access_profile: "montaz",
  project_ids: ["p1"],
};
test("employee creation never accepts owner privilege or unknown fields", () => {
  assert.equal(
    memberCreate.safeParse({ ...input, role: "owner" }).success,
    false,
  );
  assert.equal(memberCreate.parse(input).email, "employee@example.com");
  const { access_profile: _p, ...bezProfilu } = input;
  assert.equal(memberCreate.safeParse(bezProfilu).success, false, "profil dostępu wymagany");
});
test("only active owners can create accounts or activation links", async () => {
  const admin = {} as never;
  for (const person of [
    { ...owner, role: "employee" as const },
    { ...owner, active: false },
  ]) {
    await assert.rejects(
      createEmployee(
        admin,
        person,
        input,
        new Set(["p1"]),
        "https://panstolarz.pro",
      ),
      (e: any) => e.status === 403,
    );
    await assert.rejects(
      employeeActivation(
        admin,
        person,
        input.operation_id,
        "https://panstolarz.pro",
      ),
      (e: any) => e.status === 403,
    );
  }
});
test("unassigned project is rejected before creating an identity", async () => {
  await assert.rejects(
    createEmployee(
      {} as never,
      owner,
      input,
      new Set(),
      "https://panstolarz.pro",
    ),
    (e: any) => e.status === 400,
  );
});
test("creates an employee, never sends mail, and returns an activation fragment only to the owner", async () => {
  let saved: any;
  const admin = {
    auth: {
      admin: {
        generateLink: async () => ({
          data: {
            user: { id: input.operation_id },
            properties: { hashed_token: "one-time-test-hash" },
          },
          error: null,
        }),
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
      insert: async (row: unknown) => {
        saved = row;
        return { error: null };
      },
    }),
  };
  const result = await createEmployee(
    admin as never,
    owner,
    input,
    new Set(["p1"]),
    "https://panstolarz.pro",
  );
  assert.equal(saved.role, "employee");
  assert.equal(saved.job_role, "Montażysta");
  assert.equal(saved.access_profile, "montaz");
  assert.deepEqual(saved.project_ids, ["p1"]);
  const url = new URL(result.activation_url);
  assert.equal(url.search, "");
  assert.match(url.hash, /^#\/aktywacja\?token=/);
  assert.equal(url.origin, "https://panstolarz.pro");
});
test("existing owners cannot be overwritten by account creation", async () => {
  const admin = {
    auth: {
      admin: {
        generateLink: async () => ({
          data: {
            user: { id: owner.user_id },
            properties: { hashed_token: "hash" },
          },
          error: null,
        }),
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { role: "owner", creation_id: null },
            error: null,
          }),
        }),
      }),
    }),
  };
  await assert.rejects(
    createEmployee(
      admin as never,
      owner,
      input,
      new Set(["p1"]),
      "https://panstolarz.pro",
    ),
    (e: any) => e.status === 409,
  );
});
test("retrying the same operation returns a link without a second membership row", async () => {
  let inserts = 0;
  const admin = {
    auth: {
      admin: {
        generateLink: async () => ({
          data: {
            user: { id: "00000000-0000-4000-8000-000000000003" },
            properties: { hashed_token: "retry-test-hash" },
          },
          error: null,
        }),
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { role: "employee", creation_id: input.operation_id },
            error: null,
          }),
        }),
      }),
      insert: async () => {
        inserts++;
        return { error: null };
      },
    }),
  };
  const result = await createEmployee(
    admin as never,
    owner,
    input,
    new Set(["p1"]),
    "https://panstolarz.pro",
  );
  assert.equal(inserts, 0);
  assert.match(result.activation_url, /token=retry-test-hash/);
});
test("missing application origin stops before any account is created", async () => {
  let called = false;
  const admin = {
    auth: {
      admin: {
        generateLink: async () => {
          called = true;
          return { data: null, error: null };
        },
      },
    },
  };
  for (const origin of ["", "http://panstolarz.pro", "nie-adres"]) {
    await assert.rejects(
      createEmployee(admin as never, owner, input, new Set(["p1"]), origin),
      (e: any) => e.status === 503,
    );
  }
  assert.equal(called, false);
});
