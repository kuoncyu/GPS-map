import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {OfflineRouter, validateRoutingGraph} from '../js/routing.js';
const root=path.resolve('.');
const valid={nodes:[{id:'A',lat:25,lng:121,name:'A'},{id:'B',lat:25.01,lng:121.01,name:'B'}],edges:[{from:'A',to:'B',distance:1200,seconds:180,road:'測試路'}]};
const results=[];
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e?.stack||e?.message||String(e)});}}
function routerWith(graph){return new OfflineRouter('./data/routes.json',null,{storage:{async reconcileActivePackage(){return null},async getActivePackage(){return null}},fetchImpl:async()=>({ok:true,json:async()=>graph})});}
await check('Valid routing graph passes structural validation',()=>assert.equal(validateRoutingGraph(valid),true));
await check('Duplicate node identifiers are rejected',()=>assert.throws(()=>validateRoutingGraph({...valid,nodes:[...valid.nodes,{...valid.nodes[0]}]}),/重複/));
await check('Invalid node latitude is rejected',()=>assert.throws(()=>validateRoutingGraph({...valid,nodes:[{...valid.nodes[0],lat:91},valid.nodes[1]]}),/座標無效/));
await check('Invalid node longitude is rejected',()=>assert.throws(()=>validateRoutingGraph({...valid,nodes:[valid.nodes[0],{...valid.nodes[1],lng:181}]}),/座標無效/));
await check('Edges referring to missing nodes are rejected',()=>assert.throws(()=>validateRoutingGraph({...valid,edges:[{...valid.edges[0],to:'MISSING'}]}),/無法連接/));
await check('Self-loop edge is rejected',()=>assert.throws(()=>validateRoutingGraph({...valid,edges:[{...valid.edges[0],to:'A'}]}),/起訖節點相同/));
await check('Zero edge distance is rejected',()=>assert.throws(()=>validateRoutingGraph({...valid,edges:[{...valid.edges[0],distance:0}]}),/距離或通行時間無效/));
await check('Non-finite edge duration is rejected',()=>assert.throws(()=>validateRoutingGraph({...valid,edges:[{...valid.edges[0],seconds:Infinity}]}),/距離或通行時間無效/));
await check('Router rejects malformed origin before loading graph',async()=>{const r=routerWith(valid);await assert.rejects(r.calculate({origin:{lat:99,lng:121},destination:{lat:25.01,lng:121.01}}),/起點座標無效/);});
await check('Router rejects malformed destination before loading graph',async()=>{const r=routerWith(valid);await assert.rejects(r.calculate({origin:{lat:25,lng:121},destination:{lat:25,lng:181}}),/目的地座標無效/);});
await check('Router rejects invalid waypoint coordinates',async()=>{const r=routerWith(valid);await assert.rejects(r.calculate({origin:{lat:25,lng:121},destination:{lat:25.01,lng:121.01},waypoints:[{lat:91,lng:121}]}),/途經點座標無效/);});
await check('Malformed graph fetched from offline route source fails closed',async()=>{const r=routerWith({...valid,edges:[{...valid.edges[0],to:'UNKNOWN'}]});await assert.rejects(r.load(),/無法連接/);assert.equal(r.graph,null);});
await check('Bundled offline route graph satisfies routing validation',()=>{const graph=JSON.parse(fs.readFileSync(path.join(root,'data/routes.json'),'utf8'));assert.equal(validateRoutingGraph(graph),true);});
await check('Release version and service-worker cache are aligned',()=>{assert.equal(fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),'1.1.0-b60');assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/ai-gps-release-v1\.1\.0-b60/);});
const report={suite:'batch59-routing-data-readiness',version:'1.1.0-b60',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
fs.writeFileSync(path.join(root,'tests/batch59-routing-data-readiness-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
