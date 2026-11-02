import { z } from "zod";
import { AccessError, type Principal } from "./access.js";
import { PROFILE_DOSTEPU } from "./uprawnienia.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const memberCreate = z
  .object({
    operation_id: z.string().uuid(),
    display_name: z.string().trim().min(2).max(120),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    job_role: z.string().trim().min(1).max(80).default("Pracownik"),
    project_ids: z.array(z.string().min(1).max(80)).max(1000).default([]),
    // Profil dostępu decyduje o uprawnieniach (src/server/uprawnienia.ts); funkcja (job_role) jest tylko opisem.
    access_profile: z.enum(PROFILE_DOSTEPU).default("sprzedaz"),
  })
  .strict();
export const memberUpdate = z
  .object({
    active: z.boolean(),
    project_ids: z.array(z.string().max(80)).max(1000),
    job_role: z.string().trim().min(1).max(80).optional(),
    access_profile: z.enum(PROFILE_DOSTEPU).optional(),
  })
  .strict();
export const memberFields =
  "user_id,display_name,role,active,project_ids,job_role,access_profile";
export function requireOwner(person: Principal) {
  if (!person.active || person.role !== "owner")
    throw new AccessError(403, "Tylko właściciel może zarządzać kontami.");
}
function activationUrl(
  origin: string,
  hash: string,
  type: "invite" | "recovery",
) {
  let url: URL;
  try {
    // Only the configured origin (PAN_STOLARZ_ORIGIN), never the request Host.
    url = new URL(new URL(origin).origin);
  } catch {
    throw new AccessError(503, "Brak bezpiecznego adresu aplikacji.");
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost")
    throw new AccessError(503, "Brak bezpiecznego adresu aplikacji.");
  // Fragment is never sent in HTTP request URLs or Referer headers.
  url.hash = `/aktywacja?${new URLSearchParams({ token: hash, type })}`;
  return url.toString();
}
export async function createEmployee(
  admin: SupabaseClient,
  person: Principal,
  body: unknown,
  projectIds: Set<string>,
  origin: string,
) {
  requireOwner(person);
  const input = memberCreate.safeParse(body);
  if (!input.success)
    throw new AccessError(400, "Sprawdź imię, e-mail i funkcję pracownika.");
  const value = input.data;
  if (value.project_ids.some((id) => !projectIds.has(id)))
    throw new AccessError(400, "Wybrany projekt nie istnieje. Odśwież listę.");
  activationUrl(origin, "validate", "invite");
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: value.email,
  });
  if (error || !data.user || !data.properties?.hashed_token)
    throw new AccessError(
      error?.code === "email_exists" ? 409 : 503,
      "Nie utworzono konta. Jeśli e-mail już istnieje, użyj jego obecnego konta i linku aktywacyjnego.",
    );
  const { data: existing, error: lookupError } = await admin
    .from("pan_stolarz_members")
    .select("user_id,role,creation_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (lookupError)
    throw new AccessError(
      503,
      "Nie udało się sprawdzić konta. Ponów operację bez zmiany danych.",
    );
  if (
    existing &&
    (existing.role !== "employee" ||
      existing.creation_id !== value.operation_id)
  )
    throw new AccessError(
      409,
      "To konto już istnieje. Zmień jego dostęp na liście pracowników.",
    );
  if (!existing) {
    const { error: saveError } = await admin
      .from("pan_stolarz_members")
      .insert({
        user_id: data.user.id,
        role: "employee",
        active: true,
        display_name: value.display_name,
        project_ids: [...new Set(value.project_ids)],
        job_role: value.job_role,
        access_profile: value.access_profile,
        creation_id: value.operation_id,
      });
    if (saveError)
      throw new AccessError(
        503,
        "Nie zapisano dostępu. Ponów operację bez zmiany danych; link nie został udostępniony.",
      );
  }
  return {
    user_id: data.user.id,
    activation_url: activationUrl(
      origin,
      data.properties.hashed_token,
      "invite",
    ),
  };
}
export async function employeeActivation(
  admin: SupabaseClient,
  person: Principal,
  id: string,
  origin: string,
) {
  requireOwner(person);
  if (!z.string().uuid().safeParse(id).success)
    throw new AccessError(400, "Niepoprawne konto.");
  activationUrl(origin, "validate", "recovery");
  const { data: member, error } = await admin
    .from("pan_stolarz_members")
    .select("role,active")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw new AccessError(503, "Nie udało się sprawdzić konta.");
  if (!member?.active || member.role !== "employee")
    throw new AccessError(
      403,
      "Link można utworzyć tylko dla aktywnego pracownika.",
    );
  const { data: account, error: accountError } =
    await admin.auth.admin.getUserById(id);
  if (accountError || !account.user.email)
    throw new AccessError(503, "Nie udało się odczytać konta.");
  const type = account.user.email_confirmed_at ? "recovery" : "invite";
  const { data, error: linkError } = await admin.auth.admin.generateLink({
    type,
    email: account.user.email,
  });
  if (linkError || !data.properties?.hashed_token)
    throw new AccessError(
      503,
      "Nie udało się utworzyć linku. Spróbuj ponownie.",
    );
  return {
    activation_url: activationUrl(origin, data.properties.hashed_token, type),
  };
}
