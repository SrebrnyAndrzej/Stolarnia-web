import {
  DOMYSLNY_FORMULARZ,
  przywrocFormularz,
  type FormularzSzuflad,
} from "./model";

export const DRAWER_MEMORY = "stolarnia.kalkulator-szuflad.v1";
export const DRAWER_BRIDGE_MEMORY = `${DRAWER_MEMORY}.kitchen`;

export function drawerSession(
  initial?: Partial<FormularzSzuflad>,
  sourceKey = "",
) {
  const defaults = przywrocFormularz({ ...DOMYSLNY_FORMULARZ, ...initial });
  // Automatic-width preference is a calculator setting, not a changed project measurement.
  // Excluding it also keeps snapshots created before that setting was introduced readable.
  const sourceDefaults = Object.fromEntries(
    Object.entries(defaults).filter(([key]) => key !== "frontWewSzerAuto"),
  );
  const fingerprint = initial
    ? JSON.stringify([sourceKey, sourceDefaults])
    : "";
  return {
    key: initial ? DRAWER_BRIDGE_MEMORY : DRAWER_MEMORY,
    fingerprint,
    defaults,
  };
}
export function restoreDrawerSession(
  raw: string | null,
  session: ReturnType<typeof drawerSession>,
): FormularzSzuflad {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!session.fingerprint) return przywrocFormularz(value);
    if (
      value &&
      typeof value === "object" &&
      "version" in value &&
      value.version === 1 &&
      "fingerprint" in value &&
      value.fingerprint === session.fingerprint &&
      "form" in value
    )
      return przywrocFormularz(value.form, session.defaults);
  } catch {
    /* A broken local copy never replaces the source dimensions. */
  }
  return { ...session.defaults };
}
export function serializeDrawerSession(
  form: FormularzSzuflad,
  session: ReturnType<typeof drawerSession>,
) {
  return JSON.stringify(
    session.fingerprint
      ? { version: 1, fingerprint: session.fingerprint, form }
      : form,
  );
}
