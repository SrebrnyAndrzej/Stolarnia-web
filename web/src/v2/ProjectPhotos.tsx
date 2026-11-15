import { useRef, useState } from "react";
import type { KategoriaZdjecia, ProjectPhoto } from "../../../src/server/project-photos";
import { date, request } from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./ui";
import "./project-files.css";

// Zdjęcia przy projekcie (ST-APP-005): pomiar, montaż, inne. Dodaje każdy z przydziałem do projektu,
// usuwa właściciel albo autor. Przeglądarka zmniejsza zdjęcie do 2560 px i zapisuje JPEG (także HEIC z iPhone'a).

const KATEGORIE: [KategoriaZdjecia, string][] = [
  ["pomiar", "Pomiar"],
  ["montaz", "Montaż i odbiór"],
  ["inne", "Inne"],
];
const MAX_BOK = 2560;
const LIMIT = 3 * 1024 * 1024;

async function jpegBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`Nie udało się odczytać „${file.name}” jako zdjęcia.`);
  });
  const skala = Math.min(1, MAX_BOK / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * skala);
  canvas.height = Math.round(bitmap.height * skala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const jakosc of [0.85, 0.75, 0.6, 0.45]) {
    const url = canvas.toDataURL("image/jpeg", jakosc);
    const b64 = url.split(",")[1];
    if ((b64.length * 3) / 4 <= LIMIT) return b64;
  }
  throw new Error(`„${file.name}” jest za duże nawet po zmniejszeniu.`);
}

export function ProjectPhotos({ id, userId, owner, onClose }: { id: string; userId: string; owner: boolean; onClose: () => void }) {
  const list = useResource<ProjectPhoto[]>(`/api/v2/projects/${id}/photos`);
  const [kategoria, setKategoria] = useState<KategoriaZdjecia>("pomiar");
  const [filtr, setFiltr] = useState<KategoriaZdjecia | "">("");
  const [opis, setOpis] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const widoczne = (list.data ?? []).filter((x) => !filtr || x.kategoria === filtr);

  const dodaj = async (pliki: FileList | null) => {
    if (!pliki?.length) return;
    setError(null);
    try {
      for (const [i, f] of [...pliki].entries()) {
        setBusy(`Dodaję zdjęcie ${i + 1} z ${pliki.length}…`);
        await request(`/api/v2/projects/${id}/photos`, {
          method: "POST",
          body: JSON.stringify({ id: crypto.randomUUID(), name: f.name.replace(/\.[^.]+$/, "") + ".jpg", base64: await jpegBase64(f), kategoria, opis }),
        });
      }
      setOpis("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
      list.retry();
    }
  };

  return (
    <section className="ps-project-files" aria-labelledby="ps-photos-title">
      <header>
        <h3 id="ps-photos-title">Zdjęcia projektu</h3>
        <button type="button" className="ps-button secondary" onClick={onClose}>
          Zamknij
        </button>
      </header>
      <div className="ps-photo-add">
        <div className="field">
          <label htmlFor="ps-photo-kat">Rodzaj</label>
          <select id="ps-photo-kat" className="input" value={kategoria} onChange={(e) => setKategoria(e.target.value as KategoriaZdjecia)}>
            {KATEGORIE.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ps-photo-opis">Opis (opcjonalnie)</label>
          <input id="ps-photo-opis" className="input" maxLength={200} value={opis} placeholder="np. ściana z oknem, gniazdka" onChange={(e) => setOpis(e.target.value)} />
        </div>
        <label className="ps-button">
          {busy ?? "Dodaj zdjęcia"}
          <input ref={input} type="file" accept="image/*" multiple hidden disabled={!!busy} onChange={(e) => void dodaj(e.target.files)} aria-label="Wybierz zdjęcia" />
        </label>
      </div>
      {error && <Feedback>{error}</Feedback>}
      <div className="ps-photo-filter" role="group" aria-label="Pokaż zdjęcia">
        {([["", "Wszystkie"], ...KATEGORIE] as [KategoriaZdjecia | "", string][]).map(([v, t]) => (
          <button key={v} type="button" className="ps-button secondary" aria-pressed={filtr === v} onClick={() => setFiltr(v)}>
            {t}
          </button>
        ))}
      </div>
      {list.busy ? (
        <p role="status">Wczytywanie zdjęć…</p>
      ) : list.error ? (
        <Feedback retry={list.retry}>{list.error}</Feedback>
      ) : widoczne.length ? (
        <ul className="ps-photo-grid">
          {widoczne.map((z) => (
            <li key={z.id}>
              <a href={`/api/v2/projects/${id}/photos/${z.id}/content`} target="_blank" rel="noreferrer">
                <img src={`/api/v2/projects/${id}/photos/${z.id}/content`} alt={z.opis || z.name} loading="lazy" />
              </a>
              <span>
                {KATEGORIE.find(([v]) => v === z.kategoria)?.[1]} · {date(z.createdAt)}
                {z.addedByName ? ` · ${z.addedByName}` : ""}
              </span>
              {z.opis && <span className="muted">{z.opis}</span>}
              {(owner || z.addedBy === userId) && (
                <button
                  type="button"
                  className="ps-button secondary"
                  onClick={async () => {
                    if (!window.confirm("Usunąć to zdjęcie z projektu?")) return;
                    try {
                      await request(`/api/v2/projects/${id}/photos/${z.id}`, { method: "DELETE" });
                    } catch (e) {
                      setError((e as Error).message);
                    }
                    list.retry();
                  }}
                >
                  Usuń
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{list.data?.length ? "Brak zdjęć tego rodzaju." : "Jeszcze bez zdjęć. Dodaj zdjęcia z pomiaru albo z montażu."}</p>
      )}
    </section>
  );
}
