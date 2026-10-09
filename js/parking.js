import {getState,setState} from './state.js';
const R=6371000,rad=d=>d*Math.PI/180;
function distance(a,b){const p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lng-a.lng);const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
export class ParkingEngine{
 constructor({dataUrl='./data/parking.json'}={}){this.dataUrl=dataUrl;this.data=[];}
 async init(){this.data=await fetch(this.dataUrl).then(r=>r.json());return this.data;}
 nearby(limit=5){const s=getState(),origin=s.destination||s.currentLocation;if(!origin)return [];const rows=this.data.map(p=>({...p,distance:Math.round(distance(origin,p))})).sort((a,b)=>a.distance-b.distance).slice(0,limit);setState({parking:rows});return rows;}
}
