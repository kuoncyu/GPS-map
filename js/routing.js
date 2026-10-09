import {getState,setState} from './state.js';
import {TrafficEngine} from './traffic.js';
import {Storage} from './storage.js';

const EARTH=6371000;
const toRad=d=>d*Math.PI/180;
function geoDistance(a,b){const p1=toRad(a.lat),p2=toRad(b.lat),dp=toRad(b.lat-a.lat),dl=toRad(b.lng-a.lng);const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return EARTH*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
const validPoint=p=>!!p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lng))<=180;
export function validateRoutingGraph(graph){
 if(!graph||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))throw new Error('離線路網資料缺少 nodes 或 edges。');
 const ids=new Set();
 for(const n of graph.nodes){if(!n||n.id==null||String(n.id).trim()===''||ids.has(String(n.id)))throw new Error('離線路網包含缺失或重複的節點 ID。');if(!validPoint(n))throw new Error(`離線路網節點 ${n?.id??'unknown'} 的座標無效。`);ids.add(String(n.id));}
 for(const e of graph.edges){if(!e||!ids.has(String(e.from))||!ids.has(String(e.to)))throw new Error('離線路網包含無法連接既有節點的道路邊。');if(String(e.from)===String(e.to))throw new Error('離線路網包含起訖節點相同的道路邊。');if(!Number.isFinite(Number(e.distance))||Number(e.distance)<=0||!Number.isFinite(Number(e.seconds))||Number(e.seconds)<=0)throw new Error('離線路網道路邊的距離或通行時間無效。');}
 return true;
}

export class OfflineRouter{
  constructor(url='./data/routes.json',traffic=new TrafficEngine(),{storage=Storage,fetchImpl=globalThis.fetch}={}){this.url=url;this.graph=null;this.graphPackageId=null;this.graphPackageVersion=null;this.loading=null;this.traffic=traffic;this.storage=storage;this.fetchImpl=fetchImpl;}
  async _activePackage(){
    if(typeof this.storage?.reconcileActivePackage==='function'){
      try{const p=await this.storage.reconcileActivePackage();if(p?.verified&&Array.isArray(p.payloads)&&p.payloads.length)return p;}catch{}
    }
    try{const p=await this.storage?.getActivePackage?.();if(p?.verified&&Array.isArray(p.payloads)&&p.payloads.length)return p;}catch{}
    return null;
  }
  async _parsePayload(payload){
    const data=payload?.data;
    if(data==null)throw new Error(`離線資料包檔案缺少內容：${payload?.path||'unknown'}`);
    let text;
    if(typeof data==='string')text=data;
    else if(data instanceof ArrayBuffer)text=new TextDecoder().decode(data);
    else if(ArrayBuffer.isView(data))text=new TextDecoder().decode(new Uint8Array(data.buffer,data.byteOffset,data.byteLength));
    else if(typeof Blob!=='undefined'&&data instanceof Blob)text=await data.text();
    else throw new Error(`離線資料格式不支援：${payload?.path||'unknown'}`);
    try{return JSON.parse(text)}catch{throw new Error(`離線路網 JSON 格式錯誤：${payload?.path||'unknown'}`)}
  }
  async load(){
    const active=await this._activePackage();
    const activeId=active?.id||null;
    if(this.graph&&this.graphPackageId===activeId&&(!active||this.graphPackageVersion===active.version))return this.graph;
    if(this.loading){await this.loading.catch(()=>{});return this.load();}
    this.loading=(async()=>{
      if(active){
        const payload=active.payloads.find(x=>String(x.path||'').replaceAll('\\','/').replace(/^\.\//,'').split('/').pop()==='routes.json');
        if(!payload)throw new Error(`啟用的離線資料包 ${active.version||active.id} 缺少 routes.json；為避免混用其他版本資料，已停止路線規劃。`);
        const graph=await this._parsePayload(payload);
        if(!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))throw new Error('啟用的離線路網資料缺少 nodes 或 edges，無法規劃路線。');
        validateRoutingGraph(graph);
        this.graph=graph;this.graphPackageId=active.id;this.graphPackageVersion=active.version||null;return graph;
      }
      if(typeof this.fetchImpl!=='function')throw new Error('目前沒有已安裝的離線路網資料，也沒有可用的資料載入功能。');
      const r=await this.fetchImpl(this.url);if(!r.ok)throw new Error('離線路網資料無法載入');const graph=await r.json();
      if(!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))throw new Error('離線路網資料缺少 nodes 或 edges。');
      validateRoutingGraph(graph);
      this.graph=graph;this.graphPackageId=null;this.graphPackageVersion=null;return graph;
    })();
    try{return await this.loading}finally{this.loading=null}
  }
  nearestNode(point){let best=null,dist=Infinity;for(const n of this.graph.nodes){const d=geoDistance(point,n);if(d<dist){dist=d;best=n}}return best;}
  edgeCost(e,options){if(options.avoidHighway&&e.class==='HIGHWAY')return Infinity;if(options.avoidToll&&e.toll)return Infinity;if(options.avoidFerry&&e.ferry)return Infinity;if(options.avoidUnpaved&&e.class==='UNPAVED')return Infinity;const base=options.preference==='shortest'?e.distance:e.seconds*14;const impact=this.traffic?.edgeImpact(e)||{blocked:false,delaySeconds:0,factor:1};if(impact.blocked)return Infinity;let trafficPenalty=options.useTraffic===false?0:impact.delaySeconds*14;let penalty=0;if(options.preference==='eco'&&e.class==='HIGHWAY')penalty+=e.distance*.25;if(options.preference==='scenic'&&e.class==='CITY')penalty-=Math.min(e.distance*.12,base*.12);return Math.max(1,base+penalty+trafficPenalty);}
  shortestPath(startId,endId,options){const nodes=new Map(this.graph.nodes.map(n=>[n.id,n]));const adj=new Map(this.graph.nodes.map(n=>[n.id,[]]));for(const e of this.graph.edges){adj.get(e.from)?.push({...e,to:e.to});adj.get(e.to)?.push({...e,to:e.from});}
    const dist=new Map(),prev=new Map(),used=new Set();for(const n of nodes.keys())dist.set(n,Infinity);dist.set(startId,0);
    while(used.size<nodes.size){let u=null,best=Infinity;for(const [id,d] of dist){if(!used.has(id)&&d<best){best=d;u=id}}if(u===null||u===endId)break;used.add(u);for(const e of adj.get(u)||[]){const c=this.edgeCost(e,options);if(!Number.isFinite(c))continue;const nd=best+c;if(nd<dist.get(e.to)){dist.set(e.to,nd);prev.set(e.to,{node:u,edge:e});}}}
    if(!Number.isFinite(dist.get(endId)))return null;const ids=[];const edges=[];let cur=endId;while(cur!==startId){ids.unshift(cur);const p=prev.get(cur);if(!p)return null;edges.unshift(p.edge);cur=p.node}ids.unshift(startId);return {nodeIds:ids,edges,cost:dist.get(endId),nodes:ids.map(id=>nodes.get(id))};
  }
  summarize(path){const distance=path.edges.reduce((s,e)=>s+e.distance,0);const seconds=path.edges.reduce((s,e)=>s+e.seconds,0);return {distance,seconds,roads:[...new Set(path.edges.map(e=>e.road))],nodeIds:path.nodeIds,points:path.nodes.map(n=>({lat:n.lat,lng:n.lng,name:n.name}))};}
  async calculate({origin,destination,waypoints=[],...options}={}){if(!validPoint(origin))throw new Error('路線起點座標無效，請確認 GPS 定位。');if(!validPoint(destination))throw new Error('路線目的地座標無效，請重新選擇目的地。');if(!Array.isArray(waypoints)||!waypoints.every(validPoint))throw new Error('途經點座標無效，請重新設定途經點。');await this.load();if(!this.graph?.nodes?.length)throw new Error('離線路網沒有可用節點，無法規劃路線。');if(this.traffic&&Array.isArray(this.traffic.events)&&this.traffic.events.length===0&&typeof this.traffic.refresh==='function')await this.traffic.refresh();const opt={preference:'fastest',avoidHighway:false,avoidToll:false,avoidFerry:false,avoidUnpaved:false,...options};const start=this.nearestNode(origin);const target=this.nearestNode(destination);const waypointNodes=waypoints.map(w=>this.nearestNode(w));const targets=[...waypointNodes,target];let current=start;let allEdges=[],allNodes=[start];for(const next of targets){const p=this.shortestPath(current.id,next.id,opt);if(!p)throw new Error(`找不到可行離線路線：${current.name} → ${next.name}`);allEdges.push(...p.edges);allNodes.push(...p.nodes.slice(1));current=next;}const summary=this.summarize({edges:allEdges,nodeIds:allNodes.map(n=>n.id),nodes:allNodes});const edgeTraffic=allEdges.map(e=>({...e,traffic:this.traffic?.edgeImpact(e)||{blocked:false,delaySeconds:0,events:[]}}));const trafficDelaySeconds=edgeTraffic.reduce((s,e)=>s+(Number(e.traffic.delaySeconds)||0),0);summary.seconds+=trafficDelaySeconds;return {id:`OFFLINE-${Date.now()}`,...summary,trafficDelaySeconds,preference:opt.preference,options:opt,originNode:start.id,destinationNode:target.id,edgeTraffic};}
  async alternatives(params){const base=await this.calculate(params);const candidates=[base];const variants=[{preference:'shortest'},{preference:'fastest',avoidHighway:true},{preference:'fastest',avoidToll:true},{preference:'eco'}];for(const v of variants){try{const r=await this.calculate({...params,...v});if(!candidates.some(x=>x.nodeIds.join(',')===r.nodeIds.join(',')))candidates.push(r)}catch{}}return candidates.slice(0,4);}
}

function destinationKey(d){return d?JSON.stringify({id:d.id||null,lat:Number(d.lat),lng:Number(d.lng),name:d.name||null,recordId:d._offlinePackageRecordId||null,packageId:d._offlinePackageId||null,version:d._offlinePackageVersion||null}):'';}
let routeRequestSequence=0;
export async function routeToDestination(router,destination,options={}){
 const requestId=++routeRequestSequence;
 const before=getState();
 if(!destination)throw new Error('尚未選擇目的地');
 if(!Number.isFinite(Number(destination.lat))||!Number.isFinite(Number(destination.lng))||Math.abs(Number(destination.lat))>90||Math.abs(Number(destination.lng))>180)throw new Error('目的地座標無效，無法規劃路線。');
 const requestedKey=destinationKey(destination);
 const stateDestinationKey=destinationKey(before.destination);
 // If the user already has a selected destination, a delayed request must not overwrite a newer selection.
 if(stateDestinationKey&&stateDestinationKey!==requestedKey)throw new Error('目的地已變更，請重新選擇目的地後規劃路線。');
 const origin=before.currentLocation||{lat:25.0478,lng:121.5319};
 const route=await router.calculate({origin,destination,waypoints:before.waypoints?.map(w=>w.location||w)||[],...options});
 const after=getState();
 if(requestId!==routeRequestSequence)throw new Error('已有較新的路線規劃請求，已取消過期結果。');
 if((before.destination&&destinationKey(after.destination)!==stateDestinationKey)||(after.destination&&destinationKey(after.destination)!==requestedKey))throw new Error('規劃路線期間目的地已變更，已取消過期結果，請重新規劃。');
 if(destination._offlinePackageRecordId&&router.graphPackageId!==destination._offlinePackageRecordId)throw new Error('搜尋地點所屬的離線資料包已變更，為避免混用不同版本地圖，請重新搜尋目的地。');
 if(!route||!Array.isArray(route.points)||route.points.length<2||!route.points.every(p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lng))<=180)||!Number.isFinite(Number(route.distance))||Number(route.distance)<=0||!Number.isFinite(Number(route.seconds))||Number(route.seconds)<=0)throw new Error('路線引擎回傳的路線資料不完整或包含無效數值，已取消設定。');
 const committedRoute={...route,destinationKey:requestedKey,destinationCoordinate:{lat:Number(destination.lat),lng:Number(destination.lng)},sourcePackageRecordId:destination._offlinePackageRecordId||null,sourcePackageId:destination._offlinePackageId||null,sourcePackageVersion:destination._offlinePackageVersion||null};
 setState({route:committedRoute,destination,alternativeRoutes:[committedRoute],remainingDistance:committedRoute.distance,remainingTime:committedRoute.seconds,ETA:new Date(Date.now()+committedRoute.seconds*1000).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}),navigationStatus:'ROUTE_READY'});
 return committedRoute;
}
