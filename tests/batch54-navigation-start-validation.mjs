import assert from 'node:assert/strict';
import {NavigationEngine,validateNavigationStart,isNavigationTransitionAllowed} from '../js/navigation.js';
import {getState,setState} from '../js/state.js';
const results=[];
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e?.stack||e?.message||String(e)});}}
const destination={id:'poi-1',name:'測試目的地',lat:25.01,lng:121.01,_offlinePackageRecordId:'pkg-record-1',_offlinePackageId:'TW-DEMO',_offlinePackageVersion:'v1'};
const route={id:'route-1',points:[{lat:25,lng:121},{lat:25.01,lng:121.01}],distance:1500,seconds:180,roads:['示範道路'],destinationKey:JSON.stringify({id:destination.id,lat:destination.lat,lng:destination.lng,name:destination.name,recordId:destination._offlinePackageRecordId,packageId:destination._offlinePackageId,version:destination._offlinePackageVersion}),sourcePackageRecordId:'pkg-record-1'};
function reset(overrides={}){setState({currentLocation:{lat:25,lng:121},destination,route,waypoints:[],navigationStatus:'ROUTE_READY',gpsStatus:'LIVE_GPS',remainingDistance:1500,remainingTime:180,...overrides});}
await check('Valid selected destination and route pass preflight',()=>{reset();assert.equal(validateNavigationStart(getState()),true);});
await check('Missing destination is rejected',()=>{reset({destination:null});assert.throws(()=>validateNavigationStart(getState()),/目的地/);});
await check('Invalid destination coordinates are rejected',()=>{reset({destination:{...destination,lat:999}});assert.throws(()=>validateNavigationStart(getState()),/座標無效/);});
await check('Missing route is rejected',()=>{reset({route:null});assert.throws(()=>validateNavigationStart(getState()),/路線資料不完整/);});
await check('Incomplete route is rejected',()=>{reset({route:{...route,points:[route.points[0]]}});assert.throws(()=>validateNavigationStart(getState()),/路線資料不完整/);});
await check('Route for an older destination is rejected',()=>{reset({route:{...route,destinationKey:'old-destination'}});assert.throws(()=>validateNavigationStart(getState()),/目的地不一致/);});
await check('Package record mismatch is rejected',()=>{reset({route:{...route,sourcePackageRecordId:'old-record'}});assert.throws(()=>validateNavigationStart(getState()),/資料包版本不一致/);});
await check('Invalid route point is rejected',()=>{reset({route:{...route,points:[route.points[0],{lat:100,lng:121}]}});assert.throws(()=>validateNavigationStart(getState()),/路線包含無效座標/);});
await check('Illegal transition from ARRIVED to NAVIGATING is rejected',()=>{reset({navigationStatus:'ARRIVED'});const e=new NavigationEngine({router:{}});try{assert.throws(()=>e.start(),/不允許開始導航/);}finally{e.destroy();}});
await check('Valid route starts navigation',()=>{reset();const e=new NavigationEngine({router:{}});try{e.start();assert.equal(getState().navigationStatus,'NAVIGATING');}finally{e.destroy();setState({navigationStatus:'ROUTE_READY'});}});
await check('Transition matrix permits route-ready navigation',()=>{assert.equal(isNavigationTransitionAllowed('ROUTE_READY','NAVIGATING'),true);});
await check('Transition matrix blocks arrived navigation restart',()=>{assert.equal(isNavigationTransitionAllowed('ARRIVED','NAVIGATING'),false);});
console.log(JSON.stringify({suite:'batch54-navigation-start-validation',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results},null,2));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
