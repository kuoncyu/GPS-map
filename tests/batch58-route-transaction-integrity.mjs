import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {routeToDestination} from '../js/routing.js';
import {getState,setState} from '../js/state.js';
const root=path.resolve('.');
const destination={id:'dest58',name:'批次58測試目的地',lat:25.01,lng:121.01};
const route={id:'route58',points:[{lat:25,lng:121,name:'起點'},{lat:25.01,lng:121.01,name:'終點'}],distance:1400,seconds:170,roads:['測試道路']};
const results=[];
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e?.stack||e?.message||String(e)});}}
function reset(overrides={}){setState({currentLocation:{lat:25,lng:121},destination,waypoints:[],route:{...route,id:'existing-route'},alternativeRoutes:[],remainingDistance:1400,remainingTime:170,ETA:null,navigationStatus:'ROUTE_READY',...overrides});}
await check('Valid planned route commits and synchronizes summary metrics',async()=>{reset();const result=await routeToDestination({calculate:async()=>({...route,id:'planned-valid'})},destination);assert.equal(getState().route.id,'planned-valid');assert.equal(getState().destination.id,destination.id);assert.equal(getState().remainingDistance,1400);assert.equal(getState().remainingTime,170);assert.equal(result.destinationCoordinate.lat,25.01);});
await check('Invalid latitude in route points is rejected without replacing existing route',async()=>{reset();await assert.rejects(routeToDestination({calculate:async()=>({...route,points:[route.points[0],{lat:91,lng:121}]})},destination),/無效數值/);assert.equal(getState().route.id,'existing-route');});
await check('Invalid longitude in route points is rejected',async()=>{reset();await assert.rejects(routeToDestination({calculate:async()=>({...route,points:[route.points[0],{lat:25.01,lng:181}]})},destination),/無效數值/);});
await check('Zero distance is rejected',async()=>{reset();await assert.rejects(routeToDestination({calculate:async()=>({...route,distance:0})},destination),/無效數值/);});
await check('Negative travel time is rejected',async()=>{reset();await assert.rejects(routeToDestination({calculate:async()=>({...route,seconds:-2})},destination),/無效數值/);});
await check('Empty and one-point routes are rejected',async()=>{reset();await assert.rejects(routeToDestination({calculate:async()=>({...route,points:[]})},destination),/無效數值/);});
await check('Delayed request is rejected when destination changes',async()=>{reset();let resolve;const pending=routeToDestination({calculate:()=>new Promise(r=>resolve=r)},destination);setState({destination:{...destination,id:'new-destination',lat:25.02,lng:121.02}});resolve({...route,id:'stale-destination-route'});await assert.rejects(pending,/目的地已變更/);assert.equal(getState().route.id,'existing-route');});
await check('Older route request cannot overwrite newer request for same destination',async()=>{reset();let resolveOld;const old=routeToDestination({calculate:()=>new Promise(r=>resolveOld=r)},destination);const newer=await routeToDestination({calculate:async()=>({...route,id:'newest-route',distance:1200})},destination);resolveOld({...route,id:'older-route',distance:1600});await assert.rejects(old,/較新的路線規劃請求/);assert.equal(newer.id,'newest-route');assert.equal(getState().route.id,'newest-route');assert.equal(getState().remainingDistance,1200);});
await check('Route commit preserves offline package provenance',async()=>{const d={...destination,_offlinePackageRecordId:'rec58',_offlinePackageId:'pkg58',_offlinePackageVersion:'v58'};reset({destination:d});const result=await routeToDestination({graphPackageId:'rec58',calculate:async()=>route},d);assert.equal(result.sourcePackageRecordId,'rec58');assert.equal(result.sourcePackageId,'pkg58');assert.equal(result.sourcePackageVersion,'v58');});
await check('Missing destination is rejected without route mutation',async()=>{reset();await assert.rejects(routeToDestination({calculate:async()=>route},null),/尚未選擇目的地/);assert.equal(getState().route.id,'existing-route');});
await check('Release version and service-worker cache are aligned',()=>{assert.equal(fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),'1.1.0-b60');assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/ai-gps-release-v1\.1\.0-b60/);});
const report={suite:'batch58-route-transaction-integrity',version:'1.1.0-b60',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
fs.writeFileSync(path.join(root,'tests/batch58-route-transaction-integrity-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
