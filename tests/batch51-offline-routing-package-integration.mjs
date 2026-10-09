import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {OfflineRouter} from '../js/routing.js';
import {OfflineVectorMapProvider} from '../js/map-provider.js';
import {Storage} from '../js/storage.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const results=[];
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e?.stack||e?.message||String(e)});}}
const enc=value=>new TextEncoder().encode(JSON.stringify(value)).buffer;
const graphA={nodes:[{id:'A',lat:25,lng:121}],edges:[]};
const graphB={nodes:[{id:'B',lat:24,lng:120}],edges:[]};
function packageRecord(id,version,graph=graphA){return {id,packageId:'TW-TPE',version,verified:true,payloads:[{path:'./data/routes.json',data:enc(graph),size:enc(graph).byteLength}]};}
let active=packageRecord('pkg-1','1',graphA);let fetchCalls=0;
const fakeStorage={async reconcileActivePackage(){return active},async getActivePackage(){return active}};
await check('OfflineRouter loads routes.json from active verified package without network fetch',async()=>{const router=new OfflineRouter('./data/routes.json',null,{storage:fakeStorage,fetchImpl:async()=>{fetchCalls++;throw new Error('should not fetch')}});const graph=await router.load();assert.equal(graph.nodes[0].id,'A');assert.equal(router.graphPackageId,'pkg-1');assert.equal(fetchCalls,0);});
await check('Active package version change invalidates the cached route graph',async()=>{const router=new OfflineRouter('./data/routes.json',null,{storage:fakeStorage,fetchImpl:async()=>{throw new Error('should not fetch')}});assert.equal((await router.load()).nodes[0].id,'A');active=packageRecord('pkg-2','2',graphB);assert.equal((await router.load()).nodes[0].id,'B');assert.equal(router.graphPackageId,'pkg-2');});
await check('Active package missing routes.json fails closed instead of mixing static route data',async()=>{const noRoutes={id:'pkg-no-route',packageId:'TW-TPE',version:'3',verified:true,payloads:[{path:'./data/places.json',data:enc({places:[]})}]};let calls=0;const router=new OfflineRouter('./data/routes.json',null,{storage:{async reconcileActivePackage(){return noRoutes}},fetchImpl:async()=>{calls++;return {ok:true,json:async()=>graphA}}});await assert.rejects(router.load(),/缺少 routes\.json/);assert.equal(calls,0);});
await check('Invalid active graph structure is rejected',async()=>{active=packageRecord('pkg-bad','4',{places:[]});const router=new OfflineRouter('./data/routes.json',null,{storage:fakeStorage,fetchImpl:async()=>{throw new Error('should not fetch')}});await assert.rejects(router.load(),/缺少 nodes 或 edges/);});
await check('Malformed JSON payload is rejected with a clear error',async()=>{active={id:'pkg-json',packageId:'TW-TPE',version:'5',verified:true,payloads:[{path:'data/routes.json',data:new TextEncoder().encode('{bad').buffer}]};const router=new OfflineRouter('./data/routes.json',null,{storage:fakeStorage,fetchImpl:async()=>{throw new Error('should not fetch')}});await assert.rejects(router.load(),/JSON 格式錯誤/);});
await check('Static route fallback is used only when no active package exists',async()=>{const storage={async reconcileActivePackage(){return null},async getActivePackage(){return null}};let calls=0;const router=new OfflineRouter('./data/routes.json',null,{storage,fetchImpl:async url=>{calls++;assert.equal(url,'./data/routes.json');return {ok:true,json:async()=>graphA}}});assert.equal((await router.load()).nodes[0].id,'A');assert.equal(calls,1);assert.equal(router.graphPackageId,null);});
await check('Map metadata reports the actual active package version',async()=>{active=packageRecord('pkg-map','6',graphA);const originalReconcile=Storage.reconcileActivePackage,originalGet=Storage.getActivePackage;Storage.reconcileActivePackage=async()=>active;Storage.getActivePackage=async()=>active;try{const meta=await new OfflineVectorMapProvider().getMapMetadata();assert.equal(meta.packageId,'TW-TPE');assert.equal(meta.packageVersion,'6');assert.equal(meta.packageRecordId,'pkg-map');assert.equal(meta.offlineAvailable,true);assert.equal(meta.isLive,false);}finally{Storage.reconcileActivePackage=originalReconcile;Storage.getActivePackage=originalGet;}});
await check('Routing integration is present in the actual engine and provider contracts',()=>{const routing=fs.readFileSync(path.join(root,'js/routing.js'),'utf8');const provider=fs.readFileSync(path.join(root,'js/map-provider.js'),'utf8');assert.match(routing,/Storage/);assert.match(routing,/graphPackageId/);assert.match(routing,/為避免混用其他版本資料/);assert.match(provider,/packageVersion/);assert.match(provider,/offlineAvailable/);});
await check('Service worker and VERSION identify Batch 51',()=>{assert.equal(fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),'1.1.0-b60');assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/ai-gps-release-v1\.1\.0-b60/);});
const report={batch:51,version:'1.1.0-b51',suite:'offline-routing-active-package-integration',scope:'Node.js tests with injected storage/fetch adapters plus static release contract; real browser IndexedDB and device validation not run',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
fs.writeFileSync(path.join(root,'tests/batch51-offline-routing-package-integration-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
