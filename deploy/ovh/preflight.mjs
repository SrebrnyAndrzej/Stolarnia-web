import {existsSync} from 'node:fs';
const required=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','PAN_STOLARZ_ORIGIN'];
const missing=required.filter(k=>!process.env[k]?.trim());
if(!(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)) missing.push('SUPABASE_SECRET_KEY');
if(missing.length){console.error('Missing configuration:',missing.join(', '));process.exit(1);}
for(const key of ['SUPABASE_URL','PAN_STOLARZ_ORIGIN']){
 try {const u=new URL(process.env[key]);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error();}
 catch {console.error('Invalid HTTPS origin:',key);process.exit(1);}
}
for(const file of ['dist/server/index.js','dist/web/index.html','docs/materialy/katalog-dekorow-PL.json','docs/materialy/egger-warianty-program-dostaw-PL.json','docs/okucia/produkty/katalog.json']){
 if(!existsSync(file)){console.error('Missing runtime file:',file);process.exit(1);}
}
console.log('Runtime files and required configuration present. Remote database readiness still requires verification.');
