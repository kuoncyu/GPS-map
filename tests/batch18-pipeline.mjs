import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root=new URL('../data/offline/tpe/',import.meta.url);
const m=JSON.parse(await fs.readFile(new URL('manifest.json',root),'utf8'));
if(!m.files.length) throw new Error('manifest empty');
for(const f of m.files){const b=await fs.readFile(new URL(f.path,root));const h=crypto.createHash('sha256').update(b).digest('hex');if(h!==f.sha256)throw new Error(`hash mismatch: ${f.path}`);if(b.length!==f.size)throw new Error(`size mismatch: ${f.path}`)}
const g=JSON.parse(await fs.readFile(new URL('routing/graph.json',root),'utf8')); if(!g.nodes.length||!g.edges.length)throw new Error('graph empty');
const s=JSON.parse(await fs.readFile(new URL('search/index.json',root),'utf8')); if(!s.items.length)throw new Error('search index empty');
console.log('BATCH18_PIPELINE_OK',JSON.stringify({files:m.files.length,nodes:g.nodes.length,edges:g.edges.length,pois:s.items.length}));
