import { lazy, Suspense, useEffect, useState } from "react";
import { request } from "./api";
import { Feedback } from "./ui";
import { useResource } from "./useResource";
import type { FurnitureModel } from "../../../src/core/furniture";
const Scene = lazy(() =>
  import("./FurnitureScene").then((m) => ({ default: m.FurnitureScene })),
);
type Summary = {
  id: string;
  libraryVersion: number;
  expiresAt: string;
  revoked: boolean;
  comments: Array<{
    id: string;
    text: string;
    partId?: string;
    createdAt: string;
  }>;
};
export function FurnitureSharing({
  id,
  version,
  dirty,
}: {
  id: string;
  version: number;
  dirty: boolean;
}) {
  const resource = useResource<Summary[]>(
    version ? `/api/v2/furniture/${id}/presentations?version=${version}` : null,
    [],
  );
  const list = resource.data ?? [];
  const [link, setLink] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setLink("");
    setError("");
  }, [id, version]);
  const reload = resource.retry;
  return (
    <fieldset disabled={busy || resource.busy}>
      <legend>Prezentacja dla klienta</legend>
      <p>
        Tworzy zamrożoną prezentację zapisanej wersji, bez cen i kosztów. Każdy
        posiadacz odnośnika może ją obejrzeć i dodać uwagę przez 7 dni. Link
        można wycofać. To nie jest zgoda na produkcję.
      </p>
      {error && <Feedback>{error}</Feedback>}
      {resource.error && <Feedback retry={reload}>{resource.error}</Feedback>}
      {resource.busy && <p role="status">Ładowanie prezentacji…</p>}
      <button
        disabled={!version || dirty}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const data = await request<{ token: string }>(
              `/api/v2/furniture/${id}/presentations`,
              { method: "POST", body: JSON.stringify({ version }) },
            );
            setLink(
              `${location.origin}${location.pathname}#/prezentacja/${data.token}`,
            );
            await reload();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Utwórz link do zapisanej wersji
      </button>
      {dirty && <p>Zapisz zmiany przed utworzeniem prezentacji.</p>}
      {link && (
        <label>
          Odnośnik do prezentacji
          <input
            value={link}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
      <button
        disabled={!version}
        onClick={() => {
          setError("");
          reload();
        }}
      >
        Odśwież prezentacje i uwagi
      </button>
      {list.map((p) => (
        <div key={p.id}>
          <p>
            Wersja {p.libraryVersion} ·{" "}
            {p.revoked
              ? "Wycofana"
              : `Ważna do ${new Date(p.expiresAt).toLocaleString("pl-PL")}`}
          </p>
          {!p.revoked && (
            <button
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await request(`/api/v2/presentations/${p.id}`, {
                    method: "DELETE",
                  });
                  setLink("");
                  await reload();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Wycofaj tę prezentację
            </button>
          )}
          {p.comments.map((c) => (
            <p key={c.id}>
              Uwaga z linku: {c.text}
              {c.partId ? ` · część ${c.partId}` : ""}
            </p>
          ))}
        </div>
      ))}
    </fieldset>
  );
}
export function FurniturePresentation({ token }: { token: string }) {
  const resource = useResource<{
    model: FurnitureModel;
    libraryVersion: number;
    expiresAt: string;
    comments: Summary["comments"];
  }>(`/api/v2/presentation/${encodeURIComponent(token)}`);
  const data = resource.data;
  const [error, setError] = useState(""),
    [selected, setSelected] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    setError("");
    document.title = "Prezentacja mebla · Pan Stolarz";
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, [token]);
  return (
    <main className="fc fc-presentation">
      <h1>Prezentacja mebla</h1>
      <p>
        Wersja do omówienia z projektantem. Uwagi nie oznaczają akceptacji
        projektu ani zgody na produkcję.
      </p>
      {error && <Feedback>{error}</Feedback>}
      {resource.error && (
        <Feedback retry={resource.retry}>{resource.error}</Feedback>
      )}
      {resource.busy && <p role="status">Ładowanie prezentacji…</p>}
      {data && (
        <>
          <h2>
            {data.model.name} · wersja {data.libraryVersion}
          </h2>
          <p>
            {data.model.width} × {data.model.height} × {data.model.depth} mm ·
            link ważny do {new Date(data.expiresAt).toLocaleDateString("pl-PL")}
          </p>
          <div className="fc-drawing">
            <Suspense fallback={<p role="status">Ładowanie 3D…</p>}>
              <Scene
                model={data.model}
                selected={selected}
                onSelect={setSelected}
              />
            </Suspense>
          </div>
          <label>
            Część do uwagi
            <select
              aria-label="Część do uwagi"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Cały mebel</option>
              {data.model.plates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Uwaga dla projektanta
            <textarea
              className="resize-none"
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button
            disabled={busy || !note.trim()}
            onClick={async () => {
              setBusy(true);
              setError("");
              setStatus("");
              try {
                await request(`/api/v2/presentation/${token}/comments`, {
                  method: "POST",
                  body: JSON.stringify({
                    id: requestId,
                    text: note,
                    ...(selected ? { partId: selected } : {}),
                  }),
                });
                setNote("");
                setRequestId(crypto.randomUUID());
                setStatus(
                  "Uwaga zapisana. Projektant zobaczy ją przy prezentacji.",
                );
                resource.retry();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Zapisz uwagę
          </button>
          {status && <p role="status">{status}</p>}
          {data.comments.map((c) => (
            <p key={c.id}>Uwaga z tego linku: {c.text}</p>
          ))}
        </>
      )}
    </main>
  );
}
