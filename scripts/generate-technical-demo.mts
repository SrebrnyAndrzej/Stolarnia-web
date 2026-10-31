// Synthetic documentation only. No production database or customer fixtures.
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Magazyn} from '../src/store/store.ts';
import {Stolarnia} from '../src/service.ts';
const directory = mkdtempSync(join(tmpdir(), 'pan-stolarz-demo-docs-'));
// This script must never use configured cloud storage.
delete process.env.SUPABASE_URL;
try {
  const store = new Magazyn(directory);
  const service = new Stolarnia(store);
  const project = service.utworzProjekt({nazwa:'PRZYKŁAD — szafka demonstracyjna — NIE DO PRODUKCJI'});
  const room = service.dodajPomieszczenie(project.id, {nazwa:'Pomieszczenie demonstracyjne'});
  service.dodajModul(project.id, {nazwa:'Szafka demonstracyjna', scianaId:room.sciany[0].id, konstrukcja:'shelves', kategoria:'base', szerokoscMM:600, wysokoscMM:720, glebokoscMM:560});
  const out = join(process.cwd(), 'web/public/documents');
  mkdirSync(out, {recursive:true});
  for(const kind of ['techniczne','montazowe']) {
    const pdf = await service.dokumentacjaPdf(project.id, {skrocony:kind==='montazowe', ukryjDaneKlienta:true});
    writeFileSync(join(out, `demo-${kind}.pdf`), pdf);
  }
} finally { rmSync(directory,{recursive:true,force:true}); }
