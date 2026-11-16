import { test } from "node:test";
import assert from "node:assert/strict";
import {
  drawerSession,
  restoreDrawerSession,
  serializeDrawerSession,
  DRAWER_MEMORY,
  DRAWER_BRIDGE_MEMORY,
} from "./persistence";
import { DOMYSLNY_FORMULARZ } from "./model";
const initial = {
  lw: "564",
  nl: "500",
  frontZewSzer: "596",
  frontZewWys: "240",
  otworZew: "",
  wariant: "",
};

test("reloading the same source restores manual drawer settings without touching the standalone calculator", () => {
  const session = drawerSession(initial, "cabinet-a:FRONT-SZ02");
  const edited = {
    ...session.defaults,
    wariant: "199",
    otworZew: "50",
    frontZewWys: "250",
  };
  const raw = serializeDrawerSession(edited, session);
  assert.deepEqual(
    restoreDrawerSession(raw, drawerSession(initial, "cabinet-a:FRONT-SZ02")),
    edited,
  );
  assert.equal(session.key, DRAWER_BRIDGE_MEMORY);
  assert.equal(drawerSession().key, DRAWER_MEMORY);
  const standalone = { ...DOMYSLNY_FORMULARZ, lw: "700" };
  assert.deepEqual(
    restoreDrawerSession(
      serializeDrawerSession(standalone, drawerSession()),
      drawerSession(),
    ),
    standalone,
  );
});

test("a different front, new source dimensions or system discards old holes and uses fresh source values", () => {
  const session = drawerSession(initial, "cabinet-a:FRONT-SZ02");
  const raw = serializeDrawerSession(
    { ...session.defaults, otworZew: "50", wariant: "199" },
    session,
  );
  for (const next of [
    drawerSession(initial, "cabinet-a:FRONT-SZ01"),
    drawerSession({ ...initial, lw: "764" }, "cabinet-a:FRONT-SZ02"),
    drawerSession(
      { ...initial, system: "blum-tandembox-antaro-m-wood" },
      "cabinet-a:FRONT-SZ02",
    ),
  ]) {
    const restored = restoreDrawerSession(raw, next);
    assert.deepEqual(restored, next.defaults);
    assert.equal(restored.otworZew, "");
    assert.equal(restored.wariant, "");
  }
});

test("corrupt and unsupported source memory never replaces initial dimensions", () => {
  const session = drawerSession(initial, "source");
  for (const raw of [
    null,
    "{",
    "null",
    "[]",
    serializeDrawerSession(DOMYSLNY_FORMULARZ, drawerSession()),
    JSON.stringify({
      version: 2,
      fingerprint: session.fingerprint,
      form: { lw: "1" },
    }),
  ])
    assert.deepEqual(restoreDrawerSession(raw, session), session.defaults);
  const custom = drawerSession({ ...initial, lw: "764" }, "source");
  for (const form of [null, undefined, [], { lw: 1, typFrontu: "bad" }])
    assert.deepEqual(
      restoreDrawerSession(
        JSON.stringify({ version: 1, fingerprint: custom.fingerprint, form }),
        custom,
      ),
      custom.defaults,
    );
});

test("snapshots predating automatic width retain manual front and entered mounting positions", () => {
  const session = drawerSession(initial, "old-source");
  const previousDefaults = Object.fromEntries(
    Object.entries(session.defaults).filter(
      ([key]) => key !== "frontWewSzerAuto",
    ),
  );
  const raw = JSON.stringify({
    version: 1,
    fingerprint: JSON.stringify(["old-source", previousDefaults]),
    form: { ...previousDefaults, frontWewSzer: "520", otworWew: "60" },
  });
  const restored = restoreDrawerSession(raw, session);
  assert.equal(restored.frontWewSzer, "520");
  assert.equal(restored.frontWewSzerAuto, false);
  assert.equal(restored.otworWew, "60");
});
