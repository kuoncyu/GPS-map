#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const [,, inputFile, outputDir='dist-offline'] = process.argv;
if(!inputFile){console.error('Usage: node build-offline-package.mjs <roads.geojson> [outputDir]');process.exit(2)}
const input=JSON.parse(await fs.readFile(inputFile,'utf8'));
if(input.type!=='FeatureCollection') throw new Error('Input must be GeoJSON FeatureCollection');
const roads=input.features.filter(f=>f.geometry?.type==='LineString');
const pois=input.features.filter(f=>f.geometry?.type==='Point');
const out=path.resolve(outputDir); await fs.rm(out,{recursive:true,force:true});
for(const d of ['routing','search','poi','maps']) await fs.mkdir(path.join(out,d),{recursive:true});
const nodes=new Map(),edges=[];
const key=(lat,lng)=>`${lat.toFixed(6)},${lng.toFixed(6)}`;
function node(coord){const [lng,lat]=coord,k=key(lat,lng);if(!nodes.has(k))nodes.set(k,{id:`N${nodes.size}`,lat,lng,name:''});return nodes.get(k)}
function dist(a,b){const R=6371000,r=x=>x*Math.PI/180,dLat=r(b.lat-a.lat),dLng=r(b.lng-a.lng),h=Math.sin(dLat/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
for(const f of roads){const c=f.geometry.coordinates,p=f.properties||{};if(c.length<2)continue;for(let i=0;i<c.length-1;i++){const a=node(c[i]),b=node(c[i+1]),d=Math.max(1,Math.round(dist(a,b))),speed=Math.max(5,Number(p.speedKmh||40)),sec=Math.max(1,Math.round(d/(speed*1000/3600))),base={name:String(p.name||'未命名道路'),type:p.type||'CITY',distanceM:d,timeS:sec,toll:Boolean(p.toll),ferry:Boolean(p.ferry),unpaved:Boolean(p.unpaved)};a.name=a.name||base.name;b.name=b.name||base.name;edges.push({from:a.id,to:b.id,...base});if(!p.oneWay)edges.push({from:b.id,to:a.id,...base})}}
const places=pois.map((f,i)=>{const [lng,lat]=f.geometry.coordinates,p=f.properties||{};return{id:p.id||`P${i+1}`,name:p.name||`POI ${i+1}`,category:p.category||'其他',address:p.address||'',lat,lng,tags:p.tags||[]}});
const graph={schema:'offline-routing-2',region:input.region||'unknown',nodes:[...nodes.values()],edges};
const search={schema:'offline-search-1',region:graph.region,items:places.map(p=>({...p,searchText:[p.name,p.category,p.address,...p.tags].join(' ').toLowerCase()}))};
await fs.writeFile(path.join(out,'routing','graph.json'),JSON.stringify(graph,null,2));
await fs.writeFile(path.join(out,'search','index.json'),JSON.stringify(search,null,2));
await fs.writeFile(path.join(out,'poi','places.json'),JSON.stringify(places,null,2));
const files=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.name!=='manifest.json')files.push(p)}}await walk(out);
const manifestFiles=[];for(const p of files){const b=await fs.readFile(p),h=crypto.createHash('sha256').update(b).digest('hex');manifestFiles.push({path:path.relative(out,p).replaceAll(path.sep,'/'),size:b.length,sha256:h})}
const manifest={packageId:`OFFLINE-${String(input.region||'REGION').toUpperCase().replace(/[^A-Z0-9]+/g,'-')}`,version:new Date().toISOString().slice(0,10),schemaVersion:2,region:input.region||'unknown',createdAt:new Date().toISOString(),requires:['base-map','routing','search-index'],files:manifestFiles};
const total=manifestFiles.reduce((n,f)=>n+f.size,0);manifest.sizeBytes=total;manifest.sha256=crypto.createHash('sha256').update(JSON.stringify(manifestFiles)).digest('hex');
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({output:out,nodes:graph.nodes.length,edges:graph.edges.length,pois:places.length,files:manifestFiles.length,sizeBytes:total},null,2));
