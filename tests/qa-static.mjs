import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'.');
const js=[]; const json=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.name==='node_modules')continue;if(e.isDirectory())walk(p);else if(e.name.endsWith('.js'))js.push(p);else if(e.name.endsWith('.json'))json.push(p)}}
walk(root);
let failed=0;
for(const f of js){const r=await import('node:child_process').then(({execFileSync})=>{try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});return null}catch(e){return e.stderr?.toString()||e.message}});if(r){console.error('JS FAIL',f,r);failed++}}
for(const f of json){try{JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){console.error('JSON FAIL',f,e.message);failed++}}
const required=['index.html','sw.js','js/app.js','js/state.js','js/navigation.js','js/routing.js','js/gps.js','js/offline-manager.js','js/offline-package-integrity.js','js/package-manager.js','js/search.js','js/ai-assistant.js','js/voice.js','js/media.js','js/phone.js','js/notifications.js'];
for(const f of required)if(!fs.existsSync(path.join(root,f))){console.error('MISSING',f);failed++}
console.log(JSON.stringify({js:js.length,json:json.length,required:required.length,failed},null,2));
process.exit(failed?1:0);
