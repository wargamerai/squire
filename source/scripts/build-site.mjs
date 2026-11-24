import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await build({configFile:path.join(root,'vite.config.ts')});
const dist=path.join(root,'dist');
for(const entry of await fs.readdir(dist)){
  if(!['index.html','assets','favicon.svg','robots.txt','og-image.svg'].includes(entry))throw Error('Unexpected generated file: '+entry);
  await fs.cp(path.join(dist,entry),path.join(root,'..',entry),{recursive:true});
}
console.log('Updated static homepage in repository root');
