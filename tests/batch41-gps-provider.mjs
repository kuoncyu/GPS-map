import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let watchCallback, errorCallback, cleared = [], watchCalls = 0, watchOptions;
let geolocation = {
  watchPosition(success, failure, options) { watchCalls++; watchCallback = success; errorCallback = failure; watchOptions = options; return 7; },
  clearWatch(id) { cleared.push(id); }
};
Object.defineProperty(globalThis, 'navigator', {configurable:true, value:{onLine:true, geolocation}});
const {getState} = await import('../js/state.js');
const {BrowserGeolocationProvider} = await import('../js/gps-provider.js');
const results=[];
function check(name, fn) { try { const detail=fn(); results.push({name,status:'PASS',...(detail===undefined?{}:{detail})}); } catch(e) { results.push({name,status:'FAIL',error:e?.message||String(e)}); } }
const provider = new BrowserGeolocationProvider({timeout:3000});
check('Provider advertises GPS capabilities',()=>{const c=provider.capabilities();assert.equal(c.kind,'gps');assert.equal(c.offlineCapable,true);return c;});
check('Start requests browser watch with configured options',()=>{assert.equal(provider.start(),true);assert.equal(watchCalls,1);assert.equal(watchOptions.timeout,3000);assert.equal(getState().gpsStatus,'GPS_SEARCHING');return {watchCalls,watchOptions};});
check('Repeated start does not create duplicate watch',()=>{provider.start();assert.equal(watchCalls,1);return {watchCalls};});
check('Valid coordinates update location and unit conversions',()=>{watchCallback({coords:{latitude:25.03,longitude:121.56,heading:90,speed:10,accuracy:5}});const s=getState();assert.deepEqual(s.currentLocation,{lat:25.03,lng:121.56});assert.equal(s.heading,90);assert.equal(s.speed,36);assert.equal(s.accuracy,5);assert.equal(s.gpsStatus,'LIVE_GPS');assert.equal(s.driverAssistance.isLive,true);return {location:s.currentLocation,speedKmh:s.speed,status:s.gpsStatus};});
check('Invalid coordinates are rejected',()=>{assert.equal(provider.onPosition({coords:{latitude:999,longitude:121}}),false);assert.equal(getState().gpsStatus,'GPS_ERROR_INVALID_POSITION');assert.equal(getState().driverAssistance.isLive,false);});
check('Permission, unavailable-position and timeout errors have explicit status',()=>{assert.equal(provider.onError({code:1}),'GPS_ERROR_PERMISSION_DENIED');assert.equal(provider.onError({code:2}),'GPS_ERROR_POSITION_UNAVAILABLE');assert.equal(provider.onError({code:3}),'GPS_ERROR_TIMEOUT');assert.equal(getState().gpsStatus,'GPS_ERROR_TIMEOUT');assert.equal(getState().driverAssistance.isLive,false);});
check('A later valid fix recovers live GPS state after signal error',()=>{watchCallback({coords:{latitude:24.99,longitude:121.3,heading:null,speed:null,accuracy:12}});const s=getState();assert.equal(s.gpsStatus,'LIVE_GPS');assert.equal(s.driverAssistance.isLive,true);assert.deepEqual(s.currentLocation,{lat:24.99,lng:121.3});assert.equal(s.speed,0);return {status:s.gpsStatus,location:s.currentLocation};});
check('Stop clears active watch and marks provider not live',()=>{provider.stop();assert.deepEqual(cleared,[7]);assert.equal(getState().gpsStatus,'GPS_STOPPED');assert.equal(getState().driverAssistance.isLive,false);});
check('Missing geolocation is reported unavailable',()=>{Object.defineProperty(globalThis, 'navigator', {configurable:true, value:{onLine:true}});const noGps=new BrowserGeolocationProvider();assert.equal(noGps.start(),false);assert.equal(getState().gpsStatus,'UNAVAILABLE');assert.equal(getState().driverAssistance.isLive,false);return {status:getState().gpsStatus};});
const report={batch:41,suite:'gps-provider-lifecycle',executedAt:new Date().toISOString(),scope:'Node.js tests with simulated Geolocation API; no physical GPS hardware',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
fs.writeFileSync(path.join(root,'tests/batch41-gps-provider-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.failed) process.exitCode=1;
