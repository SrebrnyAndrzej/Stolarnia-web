// Uruchom po kompilacji TypeScript; używa wyłącznie tymczasowej bazy lokalnej.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
process.env.STOLARNIA_DATA = mkdtempSync(join(tmpdir(), 'contracts-api-'));
delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.VERCEL;
const { app } = await import('../dist/server/app.js');
const { WARUNKI_UMOWY, ZAKRESY } = await import('../dist/core/contracts.js');
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
try {
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
  const pr = await post('/projekty', {nazwa:'Test umowy'}); assert.equal(pr.status,200); const p = await pr.json();
  const path = `/projekty/${p.id}/umowy`;
  const bad = await post(path, {}); assert.equal(bad.status,400);
  const data = {numer:'TEST/1',rodzaj:'kuchnia',klient:'Klient testowy',adresKlienta:'Adres klienta',firma:'Firma testowa',adresFirmy:'Adres firmy',nip:'1234567890',adresMontazu:'Adres montażu',miejsce:'',data:'',termin:'',cena:29227.6,zaliczka:14000,zaliczkaZaplacona:true,dataZaliczki:'',zakres:ZAKRESY.kuchnia,warunki:WARUNKI_UMOWY};
  const saved = await post(path, data); assert.equal(saved.status,200); const u=await saved.json();
  const list = await (await fetch(base+path)).json(); assert.equal(list.length,1);
  const pdf = await fetch(base+path+`/${u.id}/pdf`); assert.equal(pdf.status,200);assert.match(pdf.headers.get('content-type'),/application\/pdf/);
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
  console.log('REST OK: validation, create, list, PDF download. Isolated temporary database.');
} finally { server.close(); }
