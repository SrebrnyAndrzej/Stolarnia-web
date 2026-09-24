// Etapy projektu w kolejności realizacji — wspólne dla serwera, MCP i panelu web.
export const STATUSY_PROJEKTU = ["szkic", "wycena", "zaakceptowany", "wZamowieniu", "produkcja", "gotoweDoMontazu", "zakonczony"] as const;

export type StatusProjektu = (typeof STATUSY_PROJEKTU)[number];

export const NAZWY_STATUSOW: Record<StatusProjektu, string> = {
  szkic: "Szkic",
  wycena: "Wycena",
  zaakceptowany: "Zaakceptowany",
  wZamowieniu: "W zamówieniu",
  produkcja: "Produkcja",
  gotoweDoMontazu: "Gotowe do montażu",
  zakonczony: "Zakończony",
};

export const czyStatus = (s: unknown): s is StatusProjektu => typeof s === "string" && (STATUSY_PROJEKTU as readonly string[]).includes(s);
