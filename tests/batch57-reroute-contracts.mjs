import assert from 'node:assert/strict';
import {NavigationEngine,validateRerouteResult} from '../js/navigation.js';
import {getState,setState} from '../js/state.js';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const destination={id:'dest57',name:'整合測試目的地',lat:25.01,lng:121.01};
const route={id:'route57',points:[{lat:25,lng:121},{lat:25.01,lng:121.01}],distance:1500,seconds:180,roads:['測試道路']};
const results=[];
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e?.stack||e?.message||String(e)});}}
function reset(overrides={}){setState({currentLocation:{lat:25,lng:121},heading:0,speed:0,accuracy:5,destination,waypoints:[],route,alternativeRoutes:[route],remainingDistance:1500,remainingTime:180,ETA:null,currentInstruction:null,nextInstruction:null,laneGuidance:null,navigationStatus:'NAVIGATING',gpsStatus:'LIVE_GPS',...overrides});}
await check('Valid reroute payload passes contract',()=>assert.equal(validateRerouteResult({...route,id:'reroute'},destination),true));
await check('Missing destination is rejected',()=>assert.throws(()=>validateRerouteResult(route,null),/目的地座標/));
await check('Out-of-range destination is rejected',()=>assert.throws(()=>validateRerouteResult(route,{lat:95,lng:121}),/目的地座標/));
await check('Route with fewer than two points is rejected',()=>assert.throws(()=>validateRerouteResult({...route,points:[route.points[0]]},destination),/完整路線/));
await check('Malformed route point is rejected',()=>assert.throws(()=>validateRerouteResult({...route,points:[route.points[0],{lat:100,lng:121}]},destination),/無效座標/));
await check('Non-positive route distance is rejected',()=>assert.throws(()=>validateRerouteResult({...route,distance:0},destination),/距離無效/));
await check('Non-positive route time is rejected',()=>assert.throws(()=>validateRerouteResult({...route,seconds:-1},destination),/時間無效/));
await check('Reroute is not requested without usable GPS coordinates',async()=>{reset({currentLocation:null});const e=new NavigationEngine({router:{calculate:async()=>{throw new Error('should not run')}}});try{assert.equal(await e.maybeReroute(getState()),false);}finally{e.destroy();}});
await check('Reroute is not requested with stale GPS',async()=>{reset({gpsStatus:'GPS_STALE'});const e=new NavigationEngine({router:{calculate:async()=>{throw new Error('should not run')}}});try{assert.equal(await e.maybeReroute(getState()),false);}finally{e.destroy();}});
await check('Invalid asynchronous reroute is not committed',async()=>{reset();const e=new NavigationEngine({router:{calculate:async()=>({...route,points:[route.points[0],{lat:999,lng:999}]})},rerouteDelay:0});try{assert.equal(await e.maybeReroute(getState()),false);assert.equal(getState().route.id,'route57');assert.equal(getState().navigationStatus,'OFF_ROUTE');}finally{e.destroy();setState({navigationStatus:'ROUTE_READY'});}});
await check('Reroute result is discarded if navigation stops while request is pending',async()=>{reset();let resolve;const e=new NavigationEngine({router:{calculate:()=>new Promise(r=>resolve=r)},rerouteDelay:0});try{const pending=e.maybeReroute(getState());setState({navigationStatus:'ROUTE_READY'});resolve({...route,id:'late-route'});assert.equal(await pending,false);assert.equal(getState().route.id,'route57');assert.equal(getState().navigationStatus,'ROUTE_READY');}finally{e.destroy();}});
await check('Successful reroute commits validated route and retains destination metadata',async()=>{reset();const e=new NavigationEngine({router:{calculate:async()=>({...route,id:'route57-new',distance:1200,seconds:150})},rerouteDelay:0});try{assert.equal(await e.maybeReroute(getState()),true);const s=getState();assert.equal(s.route.id,'route57-new');assert.equal(s.route.destinationKey,JSON.stringify({id:destination.id,lat:destination.lat,lng:destination.lng,name:destination.name,recordId:null,packageId:null,version:null}));assert.equal(s.remainingDistance,1200);assert.equal(s.navigationStatus,'NAVIGATING');}finally{e.destroy();setState({navigationStatus:'ROUTE_READY'});}});
await check('Release version and service-worker cache are aligned',()=>{assert.equal(fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),'1.1.0-b60');assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/ai-gps-release-v1\.1\.0-b60/);});
const report={suite:'batch57-reroute-contracts',version:'1.1.0-b60',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
