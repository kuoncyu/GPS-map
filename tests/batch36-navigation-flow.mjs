import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getState, setState } from '../js/state.js';
import { NavigationEngine } from '../js/navigation.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const results=[];function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e?.stack||e.message});}}
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('start handler delegates to NavigationEngine and starts GPS',()=>assert.match(app,/\$\('startNavBtn'\)\.addEventListener\('click',[\s\S]*?navigation\.start\(\);gps\.start\(\)/));
test('stop handler stops navigation and GPS',()=>assert.match(app,/\$\('stopNavBtn'\)\.addEventListener\('click',[\s\S]*?navigation\.stop\(\);gps\.stop\(\)/));
test('navigation controls remain present',()=>{for(const id of ['routeBtn','startNavBtn','stopNavBtn','routeSummary','gpsStatus','distance','time','eta','nextAction'])assert.ok(html.includes(`id="${id}"`),`missing ${id}`);});
test('navigation start rejects missing route',()=>{setState({route:null,navigationStatus:'IDLE',currentLocation:null,destination:null});const engine=new NavigationEngine({router:{calculate:async()=>{throw Error('not expected')}}});assert.throws(()=>engine.start(),/請先規劃離線路線/);engine.destroy();});
test('route-ready -> navigating -> route-ready lifecycle',()=>{const route={id:'TEST-ROUTE',distance:1000,seconds:120,points:[{lat:25,lng:121,name:'起點'},{lat:25.001,lng:121.001,name:'終點'}],roads:['測試道路'],options:{}};setState({route,destination:{id:'test',name:'測試目的地',lat:25.001,lng:121.001},currentLocation:{lat:25,lng:121},navigationStatus:'ROUTE_READY'});const engine=new NavigationEngine({router:{calculate:async()=>route}});engine.start();assert.equal(getState().navigationStatus,'NAVIGATING');engine.stop();assert.equal(getState().navigationStatus,'ROUTE_READY');engine.destroy();});
test('stop does not invent a route',()=>{setState({route:null,navigationStatus:'IDLE',currentLocation:null,destination:null});const engine=new NavigationEngine({router:{calculate:async()=>{throw Error('not expected')}}});engine.stop();assert.equal(getState().navigationStatus,'ROUTE_READY');assert.equal(getState().route,null);engine.destroy();});
const report={batch:36,suite:'navigation-flow-contract-and-engine-smoke',scope:'Node module tests and source contracts; no real browser or device is launched.',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};fs.writeFileSync(path.join(root,'tests/batch36-navigation-flow-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
