import { useEffect, useRef, useState } from "react";
import { Feedback } from "../ui";
import { request } from "../api";
import { Rzut } from "../../views/Rzut";
import { toAnalysis, type Draft } from "./model";
import {
  downloadOnlineOriginals,
  onlineAccess,
  onlineHeaders,
  onlineLink,
  onlinePath,
  readOnlineProject,
  resumeOnlineProject,
  saveKitchenOnline,
  type OnlineProject,
} from "./kitchen-online";
import { kitchenMoney, useKitchenEstimate } from "./useKitchenEstimate";
import { readArchitectFile, architectBlobBase64 } from "./architect-storage";

function download(body: string, name: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function KitchenProjectHub({
  draft,
  disabled,
  owner,
  onLoad,
  onBusy,
}: {
  draft: Draft;
  disabled: boolean;
  owner: boolean;
  onLoad: (d: Draft) => void;
  onBusy: (b: boolean) => void;
}) {
  const [state, setState] = useState<{
    key: string;
    project: Awaited<ReturnType<typeof saveKitchenOnline>>;
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [access, setAccess] = useState(onlineAccess),
    [remote, setRemote] = useState<OnlineProject | null>(null),
    [open, setOpen] = useState(!!access);
  const [loaded, setLoaded] = useState(false),
    [packet, setPacket] = useState<{
      csv: string;
      [key: string]: unknown;
    } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    title = useRef<HTMLHeadingElement>(null);
  const estimate = useKitchenEstimate(remote?.draft ?? null, false);
  useEffect(() => {
    const fn = () => {
      const a = onlineAccess();
      setAccess(a);
      setOpen(!!a);
      setRemote(null);
      setPacket(null);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    if (!access) return;
    const c = new AbortController();
    setError("");
    readOnlineProject(access, c.signal)
      .then(setRemote)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [access, loaded]);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      title.current?.focus();
    } else dialog.current?.close();
  }, [open]);
  const close = () => {
    if (busy) return;
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  const work = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  };
  const analysis = remote ? toAnalysis(remote.draft) : null;
  return (
    <section className="kp-online" aria-label="Zapis online i współpraca">
      <div className="kp-actions">
        <button
          ref={trigger}
          className="ps-button secondary"
          disabled={disabled || busy}
          onClick={() =>
            work(async () => {
              const p = await saveKitchenOnline(draft);
              setState({ key: JSON.stringify(draft), project: p });
            })
          }
        >
          {busy
            ? "Zapisywanie projektu i plików…"
            : "Zapisz online i udostępnij"}
        </button>
        <button
          className="ps-text-button"
          disabled={disabled || busy}
          onClick={() =>
            work(async () => {
              const p = await saveKitchenOnline(draft, true);
              setState({ key: JSON.stringify(draft), project: p });
            })
          }
        >
          Zapisz osobną kopię
        </button>
        {access && (
          <button
            className="ps-text-button"
            disabled={busy}
            onClick={() => setOpen(true)}
          >
            Otwórz projekt z linku
          </button>
        )}
      </div>
      {state && (
        <details open className="kp-online-links">
          <summary>
            Wersja {state.project.revision} ·{" "}
            {state.key === JSON.stringify(draft)
              ? "zapisana online"
              : "lokalne zmiany czekają na zapis"}
          </summary>
          <label>
            Link do edycji — zachowaj dla siebie
            <input
              readOnly
              value={onlineLink(
                state.project.id,
                state.project.editToken,
                true,
              )}
              onFocus={(e) => e.target.select()}
            />
          </label>
          {state.project.readToken ? (
            <label>
              Link do podglądu — dla partnera lub projektanta
              <input
                readOnly
                value={onlineLink(state.project.id, state.project.readToken)}
                onFocus={(e) => e.target.select()}
              />
            </label>
          ) : (
            <p>
              Wznowiono edycję na innym urządzeniu. Aby otrzymać nowy, osobny
              link podglądu, zapisz kopię.
            </p>
          )}
          <p className="kp-muted">
            Dostęp ma osoba posiadająca link. Zapis obejmuje oryginalne
            załączniki i jest dostępny do{" "}
            {new Date(state.project.expires).toLocaleDateString("pl-PL")}.
            Zapisz ponownie po zmianach.
          </p>
        </details>
      )}
      {!open && error && <Feedback>{error}</Feedback>}
      <dialog
        ref={dialog}
        className="kp-dialog kp-online-dialog"
        aria-labelledby="kp-online-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className="kp-dialog-heading">
          <h2 id="kp-online-title" ref={title} tabIndex={-1}>
            Projekt z prywatnego linku
          </h2>
          <button
            className="ps-text-button"
            disabled={busy}
            aria-label="Zamknij podgląd projektu"
            onClick={close}
          >
            Zamknij
          </button>
        </div>
        {error && (
          <Feedback>
            {error}
            <button
              className="ps-text-button"
              disabled={busy}
              onClick={() => setLoaded((v) => !v)}
            >
              Spróbuj ponownie
            </button>
          </Feedback>
        )}
        {!remote && !error && <p role="status">Wczytywanie projektu…</p>}
        {remote && analysis && (
          <>
            <p>
              Wersja {remote.sourceRevision ?? remote.revision} ·{" "}
              {remote.frozen
                ? "zamknięta do konsultacji"
                : access?.edit
                  ? "link edycji"
                  : "tylko podgląd"}{" "}
              · {remote.draft.items.length} szafek · {remote.draft.width / 10} ×{" "}
              {remote.draft.depth / 10} cm
            </p>
            <div className="kp-shared-plan">
              <Rzut
                analiza={analysis}
                pomieszczenieId={analysis.projekt.pomieszczenia[0].id}
                scianaId="a"
                wybrany={null}
                matMap={new Map(analysis.materialy.map((m) => [m.id, m]))}
                onSciana={() => {}}
                onWybierz={() => {}}
                roomFeatures={remote.draft.features}
                showFunctions
                roomFootprint={{
                  width: remote.draft.width,
                  depth: remote.draft.depth,
                }}
              />
            </div>
            <p>
              Wstępna cena:{" "}
              <strong>
                {estimate.data?.gross != null
                  ? kitchenMoney(estimate.data.gross)
                  : estimate.error
                    ? "niedostępna"
                    : estimate.data?.status === "blocked"
                      ? "projekt wymaga poprawy"
                      : "obliczanie…"}
              </strong>
              . Model kalkulacyjny; bez zakupu AGD i podłączeń.
            </p>
            <p>
              {remote.draft.architectFiles?.length ?? 0} oryginalnych plików.
              Wczytanie pobierze je na to urządzenie.
            </p>
            <button
              className="ps-button"
              disabled={disabled || busy}
              onClick={() =>
                work(async () => {
                  await downloadOnlineOriginals(access!, remote);
                  resumeOnlineProject(access!, remote);
                  onLoad(remote.draft);
                  setOpen(false);
                })
              }
            >
              {busy
                ? "Pobieranie projektu i plików…"
                : access?.edit && !remote.frozen
                  ? "Wczytaj do edycji — zastąp szkic lokalny"
                  : "Utwórz własną kopię — zastąp szkic lokalny"}
            </button>
            <p className="kp-muted">
              Poprzedni szkic pozostanie dostępny przez Cofnij. Samo otwarcie
              linku go nie zmienia.
            </p>
            {owner && remote.frozen && (
              <div className="kp-workshop-packet">
                <button
                  className="ps-button secondary"
                  disabled={busy}
                  onClick={() =>
                    work(async () => {
                      setPacket(
                        await request(
                          `${onlinePath(remote.id)}/workshop-packet`,
                          {
                            method: "POST",
                            headers: onlineHeaders(access!.token),
                            body: "{}",
                          },
                        ),
                      );
                    })
                  }
                >
                  Przygotuj pakiet tej wersji dla stolarni
                </button>
                {packet && (
                  <>
                    <p>
                      Pakiet roboczy obejmuje model, cenę, AGD, okucia i
                      formatki według dekoru. Przed zamówieniem wymaga
                      weryfikacji technologicznej.
                    </p>
                    <button
                      className="ps-text-button"
                      disabled={busy}
                      onClick={() =>
                        work(async () => {
                          await downloadOnlineOriginals(access!, remote);
                          const files = [];
                          for (const f of remote.draft.architectFiles ?? [])
                            files.push({
                              id: f.id,
                              data: await architectBlobBase64(
                                await readArchitectFile(f),
                              ),
                            });
                          download(
                            JSON.stringify({
                              type: "pan-stolarz-project",
                              version: 1,
                              draft: remote.draft,
                              files,
                              workshop: packet,
                            }),
                            `kuchnia-wersja-${remote.sourceRevision ?? remote.revision}-z-oryginalami.json`,
                          );
                        })
                      }
                    >
                      Pobierz pakiet JSON z oryginałami
                    </button>
                    <button
                      className="ps-text-button"
                      onClick={() =>
                        download(
                          packet.csv,
                          `kuchnia-formatki-wersja-${remote.sourceRevision ?? remote.revision}.csv`,
                          "text/csv;charset=utf-8",
                        )
                      }
                    >
                      Pobierz formatki CSV
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </dialog>
    </section>
  );
}
