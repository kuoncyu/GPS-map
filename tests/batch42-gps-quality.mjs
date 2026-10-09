import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {classifyGpsAccuracy,isGpsFixFresh,gpsFixAgeMs} from '../js/gps-quality.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const results=[];
function check(name,fn){try{const detail=fn();results.push({name,status:'PASS',...(detail===undefined?{}:{detail})})}catch(e){results.push({name,status:'FAIL',error:e?.message||String(e)})}}
check('Accuracy bands classify good, fair, poor and unknown',()=>{assert.equal(classifyGpsAccuracy(5),'good');assert.equal(classifyGpsAccuracy(20),'good');assert.equal(classifyGpsAccuracy(21),'fair');assert.equal(classifyGpsAccuracy(100),'fair');assert.equal(classifyGpsAccuracy(101),'poor');assert.equal(classifyGpsAccuracy(null),'unknown');assert.equal(classifyGpsAccuracy(-1),'unknown');});
check('Freshness accepts current fixes and rejects expired or invalid timestamps',()=>{assert.equal(isGpsFixFresh(10000,20000,30000),true);assert.equal(isGpsFixFresh(10000,50000,30000),false);assert.equal(isGpsFixFresh(NaN,20000,30000),false);assert.equal(isGpsFixFresh(30000,20000,30000),true);});
check('Freshness rejects timestamps implausibly far in the future',()=>{assert.equal(isGpsFixFresh(200000,100000,30000),false);});
check('Fix age is non-negative and handles invalid inputs',()=>{assert.equal(gpsFixAgeMs(10000,20000),10000);assert.equal(gpsFixAgeMs(30000,20000),0);assert.equal(gpsFixAgeMs(NaN,20000),null);});
check('Provider integrates freshness and accuracy metadata',()=>{const source=fs.readFileSync(path.join(root,'js/gps-provider.js'),'utf8');assert.match(source,/classifyGpsAccuracy\(accuracy\)/);assert.match(source,/GPS_ERROR_STALE_POSITION/);assert.match(source,/markStale\(/);});
check('Service worker precaches GPS quality module and release versions align',()=>{const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');const version=fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();assert.equal(version,'1.1.0-b60');assert.match(sw,/ai-gps-release-v1\.1\.0-b60/);assert.match(sw,/\.\/js\/gps-quality\.js/);});
const report={batch:42,suite:'gps-quality-freshness',scope:'Pure helper tests plus source integration contract; simulated timestamps only, no physical GPS',total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
fs.writeFileSync(path.join(root,'tests/batch42-gps-quality-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
