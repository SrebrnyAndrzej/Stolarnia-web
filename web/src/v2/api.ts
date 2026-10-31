import type { Principal, Membership } from "../../../src/server/access";
import type { TechnicalAnalysis } from "../../../src/server/technical";
import type { StatusProjektu } from "../../../src/core/statusy";

export type { Principal, Membership, TechnicalAnalysis };
export interface ProjectSummary {
  id: string;
  nazwa: string;
  status: StatusProjektu;
  zmieniono: string;
  liczbaModulow: number;
}
export interface CustomerRequest {
  id: string;
  created_at: string;
  name: string;
  email: string;
  kind: string;
  city: string;
  description: string;
  status: string;
}
export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;
  try {
    const r = await fetch(url, {
      ...options,
      signal,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (
        r.status === 401 &&
        !url.endsWith("/login") &&
        !url.endsWith("/session")
      )
        window.dispatchEvent(new Event("pan-stolarz-session-expired"));
      throw new Error(
        body.blad ?? `Nie udało się wykonać operacji (${r.status}).`,
      );
    }
    return body as T;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        "Serwer nie odpowiedział na czas. Sprawdź połączenie i spróbuj ponownie.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export const roles = {
  owner: "Właściciel",
  employee: "Pracownik",
  client: "Klient",
};
export const currency = (n: number) =>
  n.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  });
export const date = (s: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(s));
