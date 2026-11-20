import { randomId } from "../../uuid";
import { request } from "../api";
import {
  readArchitectFile,
  storeArchitectFiles,
  architectBlobBase64 as base64,
} from "./architect-storage";
import { readDraft, type Draft } from "./model";
export type OnlineProject = {
  id: string;
  revision: number;
  draft: Draft;
  frozen: boolean;
  expires: string;
  canEdit?: boolean;
  readToken?: string;
  editToken?: string;
  sourceRevision?: number;
};
export type OnlineAccess = { id: string; token: string; edit: boolean };
type Connection = {
  id: string;
  revision: number;
  readToken: string;
  editToken: string;
};
const KEY = "pan-stolarz.kuchnia-online.v1",
  CLIENT = "pan-stolarz.kuchnia-online-client.v1";
const CHUNK = 2 * 1024 * 1024;
export const onlineHeaders = (token: string) => ({
  Authorization: `Kitchen ${token}`,
});
export const onlinePath = (id: string) => `/api/public/kitchen-projects/${id}`;
export function onlineLink(id: string, token: string, edit = false) {
  return `${location.origin}/#/kreator-kuchni?projekt=${id}&klucz=${token}${edit ? "&edycja=1" : ""}`;
}
export function onlineAccess(): OnlineAccess | null {
  const q = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const id = q.get("projekt"),
    token = q.get("klucz");
  return id &&
    /^[a-f0-9-]{36}$/.test(id) &&
    token &&
    /^[a-f0-9]{64}$/.test(token)
    ? { id, token, edit: q.get("edycja") === "1" }
    : null;
}
const connection = (): Connection | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
};
export function forgetOnlineProject() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
export function resumeOnlineProject(access: OnlineAccess, p: OnlineProject) {
  if (!access.edit || !p.canEdit || p.frozen) {
    forgetOnlineProject();
    return;
  }
  // A resumed edit link can save and obtain its existing read link only when already known locally.
  const old = connection();
  localStorage.setItem(
    KEY,
    JSON.stringify({
      id: p.id,
      revision: p.revision,
      editToken: access.token,
      readToken: old?.id === p.id ? old.readToken : "",
    }),
  );
}
export async function readOnlineProject(a: OnlineAccess, signal?: AbortSignal) {
  const p = await request<OnlineProject>(onlinePath(a.id), {
    headers: onlineHeaders(a.token),
    signal,
  });
  return { ...p, draft: readDraft(JSON.stringify(p.draft)) };
}
export async function downloadOnlineOriginals(
  a: OnlineAccess,
  p: OnlineProject,
  signal?: AbortSignal,
) {
  const originals: { id: string; blob: Blob }[] = [];
  for (const file of p.draft.architectFiles ?? []) {
    const chunks: Blob[] = [];
    for (let part = 0; part * CHUNK < file.size; part++) {
      const r = await fetch(
        `${onlinePath(a.id)}/files/${file.id}?part=${part}`,
        {
          headers: onlineHeaders(a.token),
          credentials: "same-origin",
          cache: "no-store",
          signal,
        },
      );
      if (!r.ok)
        throw new Error(
          `Nie udało się pobrać oryginału: ${file.name}. Spróbuj ponownie.`,
        );
      chunks.push(await r.blob());
    }
    const blob = new Blob(chunks);
    if (blob.size !== file.size)
      throw new Error(`Niepełny plik: ${file.name}.`);
    originals.push({ id: file.id, blob });
  }
  if (originals.length) await storeArchitectFiles(originals);
}
export async function saveKitchenOnline(draft: Draft, copy = false) {
  // Read every original first: missing local files must not produce a false successful save.
  const files = await Promise.all(
    (draft.architectFiles ?? []).map(async (file) => ({
      file,
      blob: await readArchitectFile(file),
    })),
  );
  let current = copy ? null : connection();
  let clientId = localStorage.getItem(CLIENT);
  if (!clientId) {
    clientId = randomId();
    localStorage.setItem(CLIENT, clientId);
  }
  const p = await request<OnlineProject>(
    current ? onlinePath(current.id) : "/api/public/kitchen-projects",
    {
      method: current ? "PUT" : "POST",
      headers: current ? onlineHeaders(current.editToken) : {},
      body: JSON.stringify({ draft, revision: current?.revision, clientId }),
    },
  );
  current = current
    ? { ...current, revision: p.revision }
    : {
        id: p.id,
        revision: p.revision,
        readToken: p.readToken!,
        editToken: p.editToken!,
      };
  localStorage.setItem(KEY, JSON.stringify(current));
  for (const { file, blob } of files)
    for (let part = 0; part * CHUNK < blob.size; part++) {
      await request(`${onlinePath(p.id)}/files/${file.id}`, {
        method: "PUT",
        headers: onlineHeaders(current.editToken),
        body: JSON.stringify({
          part,
          base64: await base64(blob.slice(part * CHUNK, (part + 1) * CHUNK)),
        }),
      });
    }
  return { ...p, ...current };
}
export async function freezeKitchenOnline(draft: Draft) {
  const p = await saveKitchenOnline(draft);
  return request<OnlineProject>(`${onlinePath(p.id)}/handoff`, {
    method: "POST",
    headers: onlineHeaders(p.editToken),
    body: JSON.stringify({ revision: p.revision }),
  });
}
