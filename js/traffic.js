import {getState,setState} from './state.js';

export const TrafficEventType={CONGESTION:'CONGESTION',ACCIDENT:'ACCIDENT',ROADWORK:'ROADWORK',CLOSURE:'CLOSURE'};
export class DemoTrafficProvider{
  constructor(url='./data/traffic.json'){this.url=url;this.snapshot=null;this.loading=null;this.isDemo=true;}
  async load(){if(this.snapshot)return this.snapshot;if(!this.loading)this.loading=fetch(this.url).then(r=>{if(!r.ok)throw new Error('離線交通資料無法載入');return r.json()}).then(d=>{this.snapshot=d;return d});return this.loading;}
  async getEvents(){return (await this.load()).events||[];}
  async getSnapshot(){return this.load();}
}
export class TrafficEngine{
  constructor(provider=new DemoTrafficProvider()){this.provider=provider;this.events=[];this.source='DEMO_OFFLINE_SNAPSHOT';this.isLive=false;}
  async refresh(){this.events=await this.provider.getEvents();const snap=await this.provider.getSnapshot();this.source=snap.source||'UNKNOWN';this.isLive=Boolean(snap.isLive);setState({trafficEvents:this.events});return this.events;}
  eventsForEdge(edge){return this.events.filter(e=>(e.road&&e.road===edge.road)||((e.from===edge.from&&e.to===edge.to)||(e.from===edge.to&&e.to===edge.from)));}
  edgeImpact(edge){const events=this.eventsForEdge(edge);if(!events.length)return {blocked:false,delaySeconds:0,factor:1,events:[]};if(events.some(e=>e.blocked))return {blocked:true,delaySeconds:Infinity,factor:0,events};const factor=Math.min(...events.map(e=>Number(e.speedFactor)||1));const delaySeconds=events.reduce((s,e)=>s+(Number(e.delaySeconds)||0),0);return {blocked:false,delaySeconds,factor,events};}
  summary(){return {count:this.events.length,high:this.events.filter(e=>e.severity==='HIGH').length,isLive:this.isLive,source:this.source};}
  async applyToState(){await this.refresh();return this.summary();}
}
export const trafficLabel=t=>({CONGESTION:'壅塞',ACCIDENT:'事故',ROADWORK:'施工',CLOSURE:'道路封閉'}[t]||'交通事件');
export const severityLabel=s=>({HIGH:'嚴重',MEDIUM:'中度',LOW:'輕度'}[s]||s);
