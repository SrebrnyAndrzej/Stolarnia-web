import test from "node:test";
import assert from "node:assert/strict";
import {
  createAccess,
  isWorkshopMember,
  mayReadProject,
  type Membership,
} from "./access.js";

test("staff panels reject legacy clients and recheck role and activation on every request", async () => {
  const originalFetch = globalThis.fetch;
  let member: Membership = {
    user_id: "00000000-0000-4000-8000-000000000001",
    role: "employee",
    active: true,
    display_name: "Test",
    project_ids: ["assigned"],
  };
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.startsWith("https://staff-test.invalid/auth/v1/user"))
      return Response.json({
        id: member.user_id,
        email: "staff@example.com",
        aud: "authenticated",
      });
    if (
      url.startsWith("https://staff-test.invalid/rest/v1/pan_stolarz_members")
    )
      return Response.json([member]);
    throw new Error("Unexpected auth test request");
  };
  try {
    const access = createAccess({
      SUPABASE_URL: "https://staff-test.invalid",
      SUPABASE_PUBLISHABLE_KEY: "public-test",
      SUPABASE_SECRET_KEY: "secret-test",
    });
    const request = {
      get: (name: string) =>
        name === "authorization" ? "Bearer test" : undefined,
    } as never;
    assert.equal((await access.identify(request)).role, "employee");
    assert.equal(mayReadProject(member, "assigned"), true);
    assert.equal(mayReadProject(member, "other"), false);
    member = { ...member, role: "owner" };
    assert.equal((await access.identify(request)).role, "owner");
    assert.equal(mayReadProject(member, "other"), true);
    member = { ...member, role: "client" };
    assert.equal(isWorkshopMember(member), false);
    assert.equal(mayReadProject(member, "assigned"), false);
    await assert.rejects(
      access.identify(request),
      (e: any) => e.status === 403,
    );
    member = { ...member, role: "employee", active: false };
    await assert.rejects(
      access.identify(request),
      (e: any) => e.status === 403,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
