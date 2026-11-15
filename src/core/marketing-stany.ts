// Nazwy stanów dostarczeń posta — bez zależności od Node (używane też w panelu przeglądarki).
export type StanDostarczenia = "pending" | "queued" | "manual" | "blocked" | "publishing" | "published" | "simulated" | "failed" | "unknown" | "superseded";
export const NAZWY_STANOW: Record<StanDostarczenia, string> = {
  pending: "czeka na akceptację",
  queued: "w kolejce",
  manual: "do ręcznej publikacji",
  blocked: "wstrzymane",
  publishing: "wysyłanie",
  published: "opublikowane",
  simulated: "symulacja (nie wysłano)",
  failed: "błąd",
  unknown: "niepewne — sprawdź na profilu",
  superseded: "zastąpione nowszą wersją",
};
