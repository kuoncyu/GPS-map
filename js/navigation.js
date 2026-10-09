import {getState,setState,subscribe} from './state.js';
import {OfflineRouter} from './routing.js';
import {getCurrentGuidance,laneFor,iconFor} from './guidance.js';

const EARTH=6371000;
const NAVIGATION_TRANSITIONS={NAVIGATING:new Set(['GPS_SIGNAL_LOST','OFF_ROUTE','ARRIVED','ROUTE_READY']),GPS_SIGNAL_LOST:new Set(['NAVIGATING','ROUTE_READY']),OFF_ROUTE:new Set(['NAVIGATING','GPS_SIGNAL_LOST','ROUTE_READY','ARRIVED']),ARRIVED:new Set(['ROUTE_READY','READY']),ROUTE_READY:new Set(['NAVIGATING','GPS_SIGNAL_LOST','READY']),READY:new Set(['NAVIGATING','GPS_SIGNAL_LOST','ROUTE_READY'])};
export function isNavigationTransitionAllowed(from,to){return from===to||!!NAVIGATION_TRANSITIONS[from]?.has(to);}
function routeKey(r){if(!r)return '';return JSON.stringify({id:r.id||null,points:(r.points||[]).map(p=>[p.lat,p.lng]),distance:r.distance,seconds:r.seconds,destination:r.destination||null,destinationKey:r.destinationKey||null,sourcePackageRecordId:r.sourcePackageRecordId||null,sourcePackageId:r.sourcePackageId||null,sourcePackageVersion:r.sourcePackageVersion||null,options:r.options||null});}
function locationKey(p){return p?`${p.lat},${p.lng}`:'';}
function validCoordinate(p){return !!p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lng))<=180;}
function destinationIdentity(d){return d?JSON.stringify({id:d.id||null,lat:Number(d.lat),lng:Number(d.lng),name:d.name||null,recordId:d._offlinePackageRecordId||null,packageId:d._offlinePackageId||null,version:d._offlinePackageVersion||null}):'';}
export function validateRerouteResult(route,destination){
 if(!destination||!validCoordinate(destination))throw new Error('重新規劃缺少有效目的地座標。');
 if(!route||!Array.isArray(route.points)||route.points.length<2)throw new Error('重新規劃未回傳完整路線。');
 if(!route.points.every(validCoordinate))throw new Error('重新規劃路線包含無效座標。');
 if(!Number.isFinite(Number(route.distance))||Number(route.distance)<=0)throw new Error('重新規劃路線距離無效。');
 if(!Number.isFinite(Number(route.seconds))||Number(route.seconds)<=0)throw new Error('重新規劃路線時間無效。');
 return true;
}

export function validateNavigationStart(s){
 if(!s?.destination)throw new Error('請先選擇有效的導航目的地。');
 const d=s.destination;
 if(!Number.isFinite(Number(d.lat))||!Number.isFinite(Number(d.lng))||Math.abs(Number(d.lat))>90||Math.abs(Number(d.lng))>180)throw new Error('目的地座標無效，無法開始導航。');
 const r=s.route;
 if(!r||!Array.isArray(r.points)||r.points.length<2||!Number.isFinite(Number(r.distance))||Number(r.distance)<=0||!Number.isFinite(Number(r.seconds))||Number(r.seconds)<=0)throw new Error('目前路線資料不完整，請重新規劃路線。');
 if(r.destinationKey&&r.destinationKey!==destinationIdentity(d))throw new Error('目前路線與所選目的地不一致，請重新規劃路線。');
 if(r.sourcePackageRecordId&&d._offlinePackageRecordId&&r.sourcePackageRecordId!==d._offlinePackageRecordId)throw new Error('路線與目的地的離線資料包版本不一致，請重新搜尋並規劃。');
 for(const p of r.points){if(!Number.isFinite(Number(p?.lat))||!Number.isFinite(Number(p?.lng))||Math.abs(Number(p.lat))>90||Math.abs(Number(p.lng))>180)throw new Error('路線包含無效座標，無法開始導航。');}
 return true;
}
const rad=d=>d*Math.PI/180;
function distance(a,b){const p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lng-a.lng);const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return EARTH*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function bearing(a,b){const p1=rad(a.lat),p2=rad(b.lat),dl=rad(b.lng-a.lng);return (Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*180/Math.PI+360)%360;}
function turnType(prev,next){let d=((next-prev+540)%360)-180;if(Math.abs(d)<18)return 'STRAIGHT';if(d>110)return 'U_TURN';if(d>55)return 'RIGHT';if(d>18)return 'SLIGHT_RIGHT';if(d<-110)return 'U_TURN';if(d<-55)return 'LEFT';return 'SLIGHT_LEFT';}
function nearestOnPath(p,points){let best={distance:Infinity,index:0,along:0};let total=0;for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],seg=distance(a,b);const t=Math.max(0,Math.min(1,((p.lng-a.lng)*(b.lng-a.lng)+(p.lat-a.lat)*(b.lat-a.lat))/((b.lng-a.lng)**2+(b.lat-a.lat)**2||1)));const q={lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t};const d=distance(p,q);if(d<best.distance)best={distance:d,index:i,along:total+seg*t,point:q};total+=seg;}best.total=total;return best;}

export class NavigationEngine{
 constructor({router=new OfflineRouter(),rerouteDelay=1200}={}){this.router=router;this.timer=null;this.rerouteDelay=rerouteDelay;this.lastReroute=0;this.updating=false;this.navGeneration=0;this.unsubscribe=subscribe(s=>this.onState(s));}
 hasUnreliableGps(s){return s.gpsStatus==='GPS_STALE'||s.gpsStatus==='GPS_STOPPED'||s.gpsStatus==='UNAVAILABLE'||String(s.gpsStatus||'').startsWith('GPS_ERROR_');}
 hasUsableLocation(s){return validCoordinate(s?.currentLocation);}
 restoreRouteReadyState(){const route=getState().route;setState({navigationStatus:'ROUTE_READY',remainingDistance:Number.isFinite(Number(route?.distance))?Number(route.distance):null,remainingTime:Number.isFinite(Number(route?.seconds))?Number(route.seconds):null,ETA:null,currentInstruction:null,nextInstruction:null,laneGuidance:null});}
 start(){const s=getState();if(!s.route)throw new Error('請先規劃離線路線');validateNavigationStart(s);if(!isNavigationTransitionAllowed(s.navigationStatus,'NAVIGATING')&&!isNavigationTransitionAllowed(s.navigationStatus,'GPS_SIGNAL_LOST'))throw new Error(`目前狀態 ${s.navigationStatus} 不允許開始導航。`);this.navGeneration++;this.lastReroute=0;if(this.hasUnreliableGps(s)||!this.hasUsableLocation(s)){setState({navigationStatus:'GPS_SIGNAL_LOST'});return;}setState({navigationStatus:'NAVIGATING'});this.update({...s,navigationStatus:'NAVIGATING'});}
 stop(){this.navGeneration++;setState({navigationStatus:'ROUTE_READY',remainingDistance:this.routeDistance(),remainingTime:this.routeSeconds(),ETA:null,currentInstruction:null,nextInstruction:null,laneGuidance:null});}
 routeDistance(){const r=getState().route;return Number.isFinite(Number(r?.distance))?Number(r.distance):null;}
 routeSeconds(){const r=getState().route;return Number.isFinite(Number(r?.seconds))?Number(r.seconds):null;}
 destroy(){this.navGeneration++;this.unsubscribe?.();}
 async onState(s){if(this.updating)return;if(s.navigationStatus==='NAVIGATING'&&(this.hasUnreliableGps(s)||!this.hasUsableLocation(s))){this.navGeneration++;setState({navigationStatus:'GPS_SIGNAL_LOST'});return;}if(s.navigationStatus==='GPS_SIGNAL_LOST'){if(this.hasUnreliableGps(s)||!this.hasUsableLocation(s))return;try{validateNavigationStart(s);}catch{this.navGeneration++;this.restoreRouteReadyState();return;}if(!isNavigationTransitionAllowed('GPS_SIGNAL_LOST','NAVIGATING'))return;setState({navigationStatus:'NAVIGATING'});this.update({...s,navigationStatus:'NAVIGATING'});return;}if(s.navigationStatus!=='NAVIGATING'||!this.hasUsableLocation(s)||!s.route?.points?.length)return;this.update(s);}
 update(s){if(this.hasUnreliableGps(s)||!this.hasUsableLocation(s)){if(s.navigationStatus==='NAVIGATING'){this.navGeneration++;setState({navigationStatus:'GPS_SIGNAL_LOST'});}return false;}const r=s.route;if(!r||!Array.isArray(r.points)||r.points.length<2||!r.points.every(validCoordinate))return false;const n=nearestOnPath(s.currentLocation,r.points);const progress=n.total>0?Math.max(0,Math.min(1,n.along/n.total)):0;const remaining=Math.max(0,Number(r.distance)*(1-progress));const idx=Math.min(r.points.length-2,n.index);const a=r.points[idx],b=r.points[idx+1];const road=r.roads?.[Math.min(idx,r.roads.length-1)]||b.name||'道路';const dToNext=distance(s.currentLocation,b);let nextInstruction={type:'STRAIGHT',distance:Math.round(dToNext),road};if(idx>0&&idx<r.points.length-1){const p0=r.points[idx-1],p1=r.points[idx],p2=r.points[idx+1];const t=bearing(p0,p1),u=bearing(p1,p2);nextInstruction={type:turnType(t,u),distance:Math.round(dToNext),road};}
 const eta=new Date(Date.now()+Math.max(1,r.seconds*(remaining/Math.max(1,r.distance)))*1000).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
 const guide=getCurrentGuidance(r,s.currentLocation); const lane=laneFor(guide?.type||nextInstruction.type,guide?.road||road); this.updating=true;try{setState({remainingDistance:Math.round(remaining),remainingTime:Math.round(Math.max(1,r.seconds*(remaining/Math.max(1,r.distance)))),ETA:eta,currentRoad:road,currentInstruction:nextInstruction,nextInstruction:nextInstruction,laneGuidance:{...lane,icon:iconFor(guide?.type||nextInstruction.type),maneuver:guide?.label||instructionLabel(nextInstruction),distance:Math.round(guide?.distance||dToNext)}});}finally{this.updating=false;}
 if(n.distance>100)this.maybeReroute(s);
 if(remaining<35||distance(s.currentLocation,r.points[r.points.length-1])<35){if(getState().navigationStatus!=='ARRIVED')this.navGeneration++;setState({navigationStatus:'ARRIVED',remainingDistance:0,remainingTime:0,nextInstruction:null,currentInstruction:{type:'ARRIVAL',distance:0,road:r.points.at(-1)?.name||'目的地'}});}
 return true;
 }
 async maybeReroute(s){const initial=getState();if(this.hasUnreliableGps(s)||!this.hasUsableLocation(s)||!validCoordinate(s.destination)||initial.navigationStatus!=='NAVIGATING')return false;const now=Date.now();if(now-this.lastReroute<this.rerouteDelay)return false;this.lastReroute=now;const generation=this.navGeneration,routeAtStart=routeKey(initial.route),destinationAtStart=destinationIdentity(initial.destination),originAtStart=initial.currentLocation?{lat:Number(initial.currentLocation.lat),lng:Number(initial.currentLocation.lng)}:null;const isStillCurrent=()=>{const current=getState();const moved=originAtStart&&current.currentLocation?distance(originAtStart,current.currentLocation):0;return generation===this.navGeneration&&current.navigationStatus==='NAVIGATING'&&!this.hasUnreliableGps(current)&&this.hasUsableLocation(current)&&validCoordinate(current.destination)&&routeKey(current.route)===routeAtStart&&destinationIdentity(current.destination)===destinationAtStart&&Number.isFinite(moved)&&moved<=80;};try{const route=await this.router.calculate({origin:s.currentLocation,destination:s.destination,waypoints:s.waypoints?.map(w=>w.location||w)||[],...(s.route.options||{})});if(!isStillCurrent())return false;const current=getState();validateRerouteResult(route,current.destination);const committed={...route,destinationKey:route.destinationKey||current.route?.destinationKey||destinationIdentity(current.destination),destinationCoordinate:route.destinationCoordinate||current.route?.destinationCoordinate||{lat:Number(current.destination.lat),lng:Number(current.destination.lng)},sourcePackageRecordId:route.sourcePackageRecordId||current.route?.sourcePackageRecordId||current.destination?._offlinePackageRecordId||null,sourcePackageId:route.sourcePackageId||current.route?.sourcePackageId||current.destination?._offlinePackageId||null,sourcePackageVersion:route.sourcePackageVersion||current.route?.sourcePackageVersion||current.destination?._offlinePackageVersion||null};const eta=new Date(Date.now()+Math.max(0,Number(committed.seconds)||0)*1000).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});setState({route:committed,alternativeRoutes:[committed],remainingDistance:committed.distance,remainingTime:committed.seconds,ETA:eta,navigationStatus:'NAVIGATING'});return true;}catch{if(isStillCurrent())setState({navigationStatus:'OFF_ROUTE'});return false;}}
}

export function instructionLabel(i){if(!i)return '等待導航';const labels={STRAIGHT:'直行',LEFT:'左轉',RIGHT:'右轉',SLIGHT_LEFT:'靠左行駛',SLIGHT_RIGHT:'靠右行駛',U_TURN:'迴轉',ARRIVAL:'抵達目的地'};return labels[i.type]||'前進';}
