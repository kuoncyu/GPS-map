import {getState,setState,subscribe} from './state.js';
import {TrafficEngine} from './traffic.js';

const EARTH=6371000, rad=d=>d*Math.PI/180;
const dist=(a,b)=>{const p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lng-a.lng);const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return EARTH*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};
const rank={LOW:1,MEDIUM:2,HIGH:3,CRITICAL:4};
const labels={SPEEDING:'超速提醒',SHARP_TURN:'急彎提醒',SCHOOL_ZONE:'慢行區提醒',ROAD_HAZARD:'道路風險',LOW_VISIBILITY:'低能見度',TRAFFIC_EVENT:'前方交通事件'};
export class DriverAssistanceEngine{
 constructor({dataUrl='./data/driver-alerts.json',cooldownMs=12000,traffic=new TrafficEngine()}={}){this.dataUrl=dataUrl;this.cooldownMs=cooldownMs;this.data=null;this.traffic=traffic;this.lastShown=new Map();this.unsubscribe=subscribe(s=>this.evaluate(s));}
 async init(){try{this.data=await fetch(this.dataUrl).then(r=>r.json());try{await this.traffic.refresh();}catch{}setState({driverAlerts:[],driverAssistance:{ready:true,source:this.data.source,isLive:false}});return this.data;}catch(e){setState({driverAssistance:{ready:false,error:e.message}});throw e;}}
 destroy(){this.unsubscribe?.();}
 nearestRoadClass(s){const r=s.route;if(!r?.points?.length)return 'CITY';return r.points[Math.min(r.points.length-1,0)]?.class||'CITY';}
 speedLimit(s){const road=s.currentRoad; if(road&&this.data?.speedLimitsByRoad?.[road])return this.data.speedLimitsByRoad[road]; const roadClass=s.route?.points?.[0]?.class||'CITY';return this.data?.speedLimits?.[roadClass]||50;}
 evaluate(s){if(!this.data||!s.currentLocation)return;const alerts=[];const limit=this.speedLimit(s);const speed=Number(s.speed||0);if(speed>limit+7){alerts.push(this.make('SPEEDING',speed>limit+20?'HIGH':'MEDIUM',`目前 ${Math.round(speed)} km/h，速限 ${limit} km/h`,'SPEEDING'));}
 const loc=s.currentLocation;for(const h of this.data.hazards||[]){const d=dist(loc,h);if(d<=h.radius)alerts.push(this.make(h.type,h.severity,h.message,h.id,d));}
 if(s.weather?.driverRisk?.level==='HIGH')alerts.push(this.make('LOW_VISIBILITY','HIGH',s.weather.driverRisk.message,'WEATHER_RISK'));
 for(const t of s.trafficEvents||[]){if(t.severity==='HIGH'&&t.blocked!==true&&t.road===s.currentRoad)alerts.push(this.make('TRAFFIC_EVENT','HIGH',`前方${t.message||'交通事件'}`,t.id));}
 const dedup=alerts.filter(a=>this.shouldEmit(a)).sort((a,b)=>(rank[b.severity]||0)-(rank[a.severity]||0));
 if(dedup.length){const merged=[...dedup,...(s.driverAlerts||[])].slice(0,6);setState({driverAlerts:merged});}
 }
 make(type,severity,message,id,distance=null){return{id:`${id}-${type}`,type,severity,message,label:labels[type]||type,distance:distance==null?null:Math.round(distance),timestamp:Date.now(),source:'DEMO_OFFLINE',isLive:false};}
 shouldEmit(a){const last=this.lastShown.get(a.id)||0;if(Date.now()-last<this.cooldownMs)return false;this.lastShown.set(a.id,Date.now());return true;}
 acknowledge(id){const s=getState();setState({driverAlerts:(s.driverAlerts||[]).filter(a=>a.id!==id)});}
 clear(){setState({driverAlerts:[]});}
}
export const alertLabel=a=>labels[a?.type]||a?.label||'駕駛提醒';
