import {cpSync,existsSync,mkdirSync} from 'node:fs';
if(!existsSync('dist/web/index.html')) throw new Error('Najpierw npm run build');
mkdirSync('dist/ovh-pro',{recursive:true});
cpSync('dist/web','dist/ovh-pro',{recursive:true});
cpSync('deploy/ovh-pro/public','dist/ovh-pro',{recursive:true});
console.log('OVH Pro release: dist/ovh-pro (frontend + fixed API bridge, no secrets)');
