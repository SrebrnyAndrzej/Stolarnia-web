import type { Stolarnia } from "../service.js";
import type { Principal } from "./access.js";
import { AccessError, mayReadProject } from "./access.js";
import type { DokumentacjaProjektu } from "../core/types.js";

export function requireTechnicalDocuments(
  service: Stolarnia,
  person: Principal,
  id: string,
) {
  if (
    !person.active ||
    !["owner", "employee"].includes(person.role) ||
    !mayReadProject(person, id)
  )
    throw new AccessError(
      403,
      "Nie masz dostępu do dokumentacji tego projektu.",
    );
  if (!service.magazyn.odczytaj().projekty.some((p) => p.id === id))
    throw new AccessError(404, "Nie znaleziono projektu.");
}
export function documentSource(
  service: Stolarnia,
  person: Principal,
  id: string,
  release?: string,
) {
  requireTechnicalDocuments(service, person, id);
  if (!release) {
    if (person.role !== "owner")
      throw new AccessError(
        403,
        "Pracownik drukuje dokumentację z zapisanego wydania. Poproś właściciela o przygotowanie wydania.",
      );
    return { document: service.dokumentacja(id), release: null };
  }
  const found = service.wydania(id).find((w) => w.id === release);
  if (!found)
    throw new AccessError(404, "Nie znaleziono wydania dokumentacji.");
  return { document: service.wydanieDokumentacja(id, release), release: found };
}
function summary(d: DokumentacjaProjektu) {
  return {
    revision: d.rewizja,
    generatedAt: d.wygenerowano,
    ready: d.gotowaDoProdukcji,
    parts: d.czesci.length,
    operations: d.podsumowanie.operacje,
    diagnostics: d.diagnostyka.map((x) => ({
      code: x.kod,
      level: x.poziom,
      description: x.opis,
    })),
    modules: [...new Set(d.czesci.map((c) => c.modulId))].map((id) => ({
      id,
      name: d.czesci.find((c) => c.modulId === id)!.nazwaModulu,
      parts: d.czesci.filter((c) => c.modulId === id).length,
    })),
  };
}
export function technicalDocuments(
  service: Stolarnia,
  person: Principal,
  id: string,
  release?: string,
) {
  requireTechnicalDocuments(service, person, id);
  const releases = service
    .wydania(id)
    .slice(-100)
    .reverse()
    .map((w) => ({
      id: w.id,
      number: w.numer,
      revision: w.rewizja,
      createdAt: w.utworzono,
      ready: w.gotowaDoProdukcji,
    }));
  const selected =
    release ?? (person.role === "employee" ? releases[0]?.id : undefined);
  const source =
    person.role === "employee" && !selected
      ? null
      : documentSource(service, person, id, selected);
  return {
    currentRevision: service.projekt(id).rewizja,
    releases,
    selectedRelease: source?.release?.id ?? null,
    document: source ? summary(source.document) : null,
  };
}
export type TechnicalDocuments = ReturnType<typeof technicalDocuments>;
