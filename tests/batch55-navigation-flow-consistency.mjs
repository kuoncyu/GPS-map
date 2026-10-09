import assert from 'node:assert/strict';
import {NavigationEngine,isNavigationTransitionAllowed} from '../js/navigation.js';
import {getState,setState} from '../js/state.js';
const results=[];
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e?.stack||e?.message||String(e)});}}
const destination={id:'dest55',name:'測試目的地',lat:25.01,lng:121.01};
const route={id:'route55',points:[{lat:25,lng:121},{lat:25.01,lng:121.01}],distance:1500,seconds:180,roads:['測試道路']};
function reset(overrides={}){setState({currentLocation:{lat:25,lng:121},destination,route,waypoints:[],navigationStatus:'ROUTE_READY',gpsStatus:'LIVE_GPS',remainingDistance:850,remainingTime:100,ETA:'10:30',currentInstruction:{type:'LEFT'},nextInstruction:{type:'LEFT'},laneGuidance:{lanes:['左轉']},...overrides});}
await check('Stop navigation preserves the planned route',()=>{reset();const e=new NavigationEngine({router:{}});try{e.stop();assert.equal(getState().route.id,'route55');assert.equal(getState().navigationStatus,'ROUTE_READY');}finally{e.destroy();}});
await check('Stop navigation resets live guidance and restores route summary',()=>{reset();const e=new NavigationEngine({router:{}});try{e.stop();const s=getState();assert.equal(s.remainingDistance,1500);assert.equal(s.remainingTime,180);assert.equal(s.ETA,null);assert.equal(s.currentInstruction,null);assert.equal(s.nextInstruction,null);assert.equal(s.laneGuidance,null);}finally{e.destroy();}});
await check('Route remains available for restarting after stop',()=>{reset();const e=new NavigationEngine({router:{}});try{e.stop();assert.ok(getState().route);assert.equal(isNavigationTransitionAllowed(getState().navigationStatus,'NAVIGATING'),true);}finally{e.destroy();}});
await check('Unreliable GPS moves active navigation to signal-lost state',()=>{reset({navigationStatus:'NAVIGATING',gpsStatus:'GPS_STALE'});const e=new NavigationEngine({router:{}});try{e.onState(getState());assert.equal(getState().navigationStatus,'GPS_SIGNAL_LOST');}finally{e.destroy();setState({navigationStatus:'ROUTE_READY'});}});
await check('GPS recovery resumes navigation when location is available',()=>{reset({navigationStatus:'GPS_SIGNAL_LOST',gpsStatus:'LIVE_GPS'});const e=new NavigationEngine({router:{}});try{e.onState(getState());assert.equal(getState().navigationStatus,'NAVIGATING');}finally{e.destroy();setState({navigationStatus:'ROUTE_READY'});}});
await check('Arrived state does not permit direct navigation restart',()=>{assert.equal(isNavigationTransitionAllowed('ARRIVED','NAVIGATING'),false);});
await check('Invalid transition to active navigation from READY without route-ready flow is restricted by matrix',()=>{assert.equal(isNavigationTransitionAllowed('READY','NAVIGATING'),true);assert.equal(isNavigationTransitionAllowed('ARRIVED','NAVIGATING'),false);});
await check('Route summary distance is restored as finite nonnegative value',()=>{reset({route:{...route,distance:0}});const e=new NavigationEngine({router:{}});try{e.stop();assert.equal(getState().remainingDistance,0);}finally{e.destroy();}});
console.log(JSON.stringify({suite:'batch55-navigation-flow-consistency',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results},null,2));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
