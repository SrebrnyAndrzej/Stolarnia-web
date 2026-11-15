import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { Principal } from "./server/access.js";
import { projectFileObjects } from "./server/project-files.js";
import { deleteProjectPhoto, listProjectPhotos, photoMime, readProjectPhoto, uploadProjectPhoto } from "./server/project-photos.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

// ST-APP-005: zdjęcia z pomiaru i montażu — dostęp wg przydziału, tylko obrazy, usuwa właściciel lub autor.
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)]);
const osoba = (o: Partial<Principal>): Principal => ({ user_id: randomUUID(), role: "employee", active: true, project_ids: [], display_name: "Test", access_profile: "montaz", email: "", ...o }) as Principal;

test("zdjęcia projektu: przydział, typ pliku, deduplikacja, odczyt, usuwanie", async () => {
  const magazyn = new Magazyn(mkdtempSync(join(tmpdir(), "zdj-")));
  const s = new Stolarnia(magazyn);
  const p = s.utworzProjekt({ nazwa: "Kuchnia", sciany: [{ dlugoscMM: 3000 }] });
  const obiekty = projectFileObjects(magazyn, null);
  const wlasciciel = osoba({ role: "owner", access_profile: undefined });
  const montaz = osoba({ project_ids: [p.id], display_name: "Tomek" });
  const obcy = osoba({ access_profile: "produkcja" });
  const dane = (o = {}) => ({ id: randomUUID(), name: "pomiar.jpg", base64: JPEG.toString("base64"), kategoria: "montaz", opis: "odbiór", ...o });

  const z = await uploadProjectPhoto(magazyn, obiekty, montaz, p.id, dane());
  assert.equal(z.mime, "image/jpeg");
  assert.equal(z.addedByName, "Tomek");
  assert.equal((z as unknown as Record<string, unknown>).objectKey, undefined);
  // to samo zdjęcie drugi raz = ten sam wpis
  assert.equal((await uploadProjectPhoto(magazyn, obiekty, montaz, p.id, dane())).id, z.id);
  await assert.rejects(() => uploadProjectPhoto(magazyn, obiekty, montaz, p.id, dane({ base64: Buffer.from("%PDF-1.4 x").toString("base64") })), /nie jest zdjęcie/);
  await assert.rejects(() => uploadProjectPhoto(magazyn, obiekty, montaz, p.id, dane({ kategoria: "x" })), /kategorię/);
  await assert.rejects(() => uploadProjectPhoto(magazyn, obiekty, obcy, p.id, dane()), /udostępnionego projektu/);
  assert.equal(listProjectPhotos(magazyn, wlasciciel, p.id).length, 1);
  assert.throws(() => listProjectPhotos(magazyn, obcy, p.id), /udostępnionego projektu/);
  const odczyt = await readProjectPhoto(magazyn, obiekty, wlasciciel, p.id, z.id);
  assert.ok(odczyt.bytes.equals(JPEG));
  // usuwa autor albo właściciel
  const inny = osoba({ project_ids: [p.id], access_profile: "produkcja" });
  await assert.rejects(() => deleteProjectPhoto(magazyn, inny, p.id, z.id), /właściciel albo osoba/);
  await deleteProjectPhoto(magazyn, montaz, p.id, z.id);
  assert.equal(listProjectPhotos(magazyn, wlasciciel, p.id).length, 0);
  assert.equal(photoMime(Buffer.from("RIFF0000WEBPVP8 ")), "image/webp");
});
