import {getState,subscribe} from './state.js';
import {DEFAULT_TILE_MAP} from './map-provider.js';

const NS='http://www.w3.org/2000/svg';
const TILE_SIZE=256;
const VIEW={width:1000,height:650,cx:500,cy:325};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function project(lng,lat,z){
  const n=2**z, safeLat=clamp(Number(lat),-85.05112878,85.05112878);
  const sin=Math.sin(safeLat*Math.PI/180);
  return {x:(Number(lng)+180)/360*TILE_SIZE*n,y:(0.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*TILE_SIZE*n};
}

export class DemoMap{
  constructor(svg){
    this.svg=svg;this.g=document.createElementNS(NS,'g');this.svg.appendChild(this.g);
    this.zoom=1;this.zoomLevel=13;this.tx=0;this.ty=0;this.drag=null;this.mode='2D';this.orientation='HEADING_UP';
    this.center={lat:25.0478,lng:121.5319};this.tileErrors=0;this.build();this.bind();this.render(getState());
    subscribe(s=>this.render(s));
  }
  el(tag,attrs={}){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));return e}
  build(){
    this.background=this.el('rect',{x:0,y:0,width:VIEW.width,height:VIEW.height,fill:'#e8edf0'});this.g.appendChild(this.background);
    this.tileLayer=this.el('g',{class:'map-tiles'});this.g.appendChild(this.tileLayer);this.renderTiles();
    this.routeHighlight=this.el('path',{class:'route-highlight',display:'none'});this.g.appendChild(this.routeHighlight);
    this.poiLayer=this.el('g',{class:'map-pois'});this.g.appendChild(this.poiLayer);
    this.searchPin=this.el('g',{class:'map-search-pin',display:'none'});
    this.searchPin.appendChild(this.el('circle',{cx:0,cy:0,r:16,class:'map-pin-halo'}));
    this.searchPin.appendChild(this.el('path',{d:'M 0 22 C -4 14 -13 5 -13 -4 A 13 13 0 1 1 13 -4 C 13 5 4 14 0 22 Z',class:'map-pin-shape'}));
    this.searchPin.appendChild(this.el('circle',{cx:0,cy:-4,r:4,fill:'#fff'}));this.g.appendChild(this.searchPin);
    this.vehicle=this.el('g',{class:'vehicle'});this.vehicle.appendChild(this.el('circle',{cx:0,cy:0,r:20,class:'vehicle-halo'}));this.vehicle.appendChild(this.el('path',{d:'M 0 -22 L 12 14 L 0 8 L -12 14 Z',class:'vehicle-arrow'}));this.g.appendChild(this.vehicle);
    this.accuracy=this.el('circle',{cx:0,cy:0,r:28,class:'accuracy-ring'});this.g.insertBefore(this.accuracy,this.vehicle);
  }
  renderTiles(){
    this.tileLayer.replaceChildren();this.tileErrors=0;
    const center=project(this.center.lng,this.center.lat,this.zoomLevel),n=2**this.zoomLevel;
    const minX=Math.floor((center.x-VIEW.cx)/TILE_SIZE)-1,maxX=Math.floor((center.x+(VIEW.width-VIEW.cx))/TILE_SIZE)+1;
    const minY=Math.max(0,Math.floor((center.y-VIEW.cy)/TILE_SIZE)-1),maxY=Math.min(n-1,Math.floor((center.y+(VIEW.height-VIEW.cy))/TILE_SIZE)+1);
    for(let rawX=minX;rawX<=maxX;rawX++)for(let y=minY;y<=maxY;y++){
      const x=((rawX%n)+n)%n,img=this.el('image',{x:rawX*TILE_SIZE-center.x+VIEW.cx,y:y*TILE_SIZE-center.y+VIEW.cy,width:TILE_SIZE,height:TILE_SIZE,preserveAspectRatio:'none',class:'map-tile'});
      img.setAttribute('href',DEFAULT_TILE_MAP.template.replace('{z}',this.zoomLevel).replace('{x}',x).replace('{y}',y));
      img.addEventListener('error',()=>{this.tileErrors++;const status=document.getElementById('mapSourceStatus');if(status)status.textContent='底圖載入失敗，請檢查網路';});
      img.addEventListener('load',()=>{const status=document.getElementById('mapSourceStatus');if(status&&this.tileErrors===0)status.textContent='線上地圖';});
      this.tileLayer.appendChild(img);
    }
  }
  point(p){if(!p||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))return null;const c=project(this.center.lng,this.center.lat,this.zoomLevel),q=project(Number(p.lng),Number(p.lat),this.zoomLevel);return {x:q.x-c.x+VIEW.cx,y:q.y-c.y+VIEW.cy};}
  bind(){
    const start=e=>{if(e.button!==undefined&&e.button!==0)return;this.drag={x:e.clientX,y:e.clientY,tx:this.tx,ty:this.ty};};
    const move=e=>{if(!this.drag)return;this.tx=this.drag.tx+(e.clientX-this.drag.x)*(VIEW.width/Math.max(1,this.svg.clientWidth));this.ty=this.drag.ty+(e.clientY-this.drag.y)*(VIEW.height/Math.max(1,this.svg.clientHeight));this.apply()};
    const end=()=>this.drag=null;
    this.svg.addEventListener('pointerdown',start);window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);this.svg.addEventListener('pointercancel',end);
    this.svg.addEventListener('wheel',e=>{e.preventDefault();this.zoom=clamp(this.zoom*(e.deltaY<0?1.1:.9),.55,2.4);this.apply()},{passive:false});
  }
  showRoute(route){
    if(!route?.points?.length)return;
    const pts=route.points.map(p=>this.point(p)).filter(Boolean);if(!pts.length)return;
    const d=pts.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');this.routeHighlight.setAttribute('d',d);this.routeHighlight.removeAttribute('display');
    if(pts.length>1){const mid=pts[Math.floor(pts.length/2)];if(mid.x<-100||mid.x>1100||mid.y<-100||mid.y>750){const p=route.points[Math.floor(route.points.length/2)];this.centerOn(p);const projected=route.points.map(q=>this.point(q)).filter(Boolean);this.routeHighlight.setAttribute('d',projected.map((q,i)=>`${i?'L':'M'} ${q.x} ${q.y}`).join(' '));}}
  }
  clearRoute(){this.routeHighlight.setAttribute('display','none');this.routeHighlight.setAttribute('d','');}
  centerOn(p){if(!p||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))return;this.center={lat:Number(p.lat),lng:Number(p.lng)};this.tx=0;this.ty=0;this.zoom=1;this.renderTiles();this.apply();}
  showSearchPin(p){const q=this.point(p);if(!q)return;this.searchPin.setAttribute('transform',`translate(${q.x} ${q.y})`);this.searchPin.setAttribute('display','');this.tx=VIEW.cx-q.x*this.zoom;this.ty=VIEW.cy-q.y*this.zoom;this.apply();}
  setMode(mode){this.mode=mode;this.svg.closest('.map-shell')?.setAttribute('data-map-mode',mode);}
  setOrientation(o){this.orientation=o;this.apply()}
  apply(){const rot=this.orientation==='HEADING_UP'?(getState().heading||0):0;this.g.setAttribute('transform',`translate(${this.tx} ${this.ty}) translate(${VIEW.cx} ${VIEW.cy}) scale(${this.zoom}) translate(${-VIEW.cx} ${-VIEW.cy}) rotate(${this.mode==='3D'?2:0} ${VIEW.cx} ${VIEW.cy})`);this.vehicle.setAttribute('transform',`translate(${this.vehicle.dataset.x||VIEW.cx} ${this.vehicle.dataset.y||VIEW.cy}) rotate(${rot})`);this.accuracy.setAttribute('transform',`translate(${this.vehicle.dataset.x||VIEW.cx} ${this.vehicle.dataset.y||VIEW.cy})`)}
  render(state){
    if(state.currentLocation){const q=this.point(state.currentLocation);if(q){this.vehicle.dataset.x=q.x;this.vehicle.dataset.y=q.y;this.accuracy.setAttribute('r',clamp((state.accuracy||10)*2,20,60));}}
    this.apply();
  }
}
