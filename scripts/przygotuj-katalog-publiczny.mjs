import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const items=JSON.parse(readFileSync('docs/materialy/katalog-dekorow-PL.json','utf8'));
mkdirSync('web/public/catalog',{recursive:true});
writeFileSync('web/public/catalog/decors.json',JSON.stringify(items.map(d=>({key:`${d.manufacturer}:${d.id}`,id:d.id,name:d.name,manufacturer:d.manufacturer,obraz:`/api/dekory/obrazy/${d.image_local.replace(/^obrazy\//,'')}`}))));
console.log(`Publiczny katalog statyczny: ${items.length} dekorów`);
