import {getState,setState,subscribe} from './state.js';

const NS='http://www.w3.org/2000/svg';
export class DemoMap{
  constructor(svg){this.svg=svg;this.g=document.createElementNS(NS,'g');this.svg.appendChild(this.g);this.zoom=1;this.tx=0;this.ty=0;this.drag=null;this.mode='2D';this.orientation='HEADING_UP';this.build();this.bind();this.render(getState());subscribe(s=>this.render(s));}
  el(tag,attrs={}){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e}
  build(){
    const bg=this.el('rect',{x:0,y:0,width:1000,height:650,fill:'#0b1624'});this.g.appendChild(bg);
    for(let x=50;x<=950;x+=100)this.g.appendChild(this.el('line',{x1:x,y1:0,x2:x,y2:650,class:'minor-road'}));
    for(let y=50;y<=600;y+=100)this.g.appendChild(this.el('line',{x1:0,y1:y,x2:1000,y2:y,class:'minor-road'}));
    const roads=[['M 60 500 C 220 420 280 300 470 330 S 700 510 940 380'],['M 120 100 C 280 180 360 190 470 330 S 690 360 880 120'],['M 70 270 C 240 250 330 270 470 330 S 730 280 930 290']];
    roads.forEach((d,i)=>{this.g.appendChild(this.el('path',{d,class:i===0?'route-road':'major-road'}));});
    const labels=[['北安路',150,240],['中央大道',520,315],['科技路',700,210],['河岸路',690,455],['中山北路',260,455]];
    labels.forEach(([t,x,y])=>{const e=this.el('text',{x,y,class:'map-label'});e.textContent=t;this.g.appendChild(e)});
    this.route=this.el('path',{d:'M 60 500 C 220 420 280 300 470 330 S 700 510 940 380',class:'route-highlight'});this.g.appendChild(this.route);
    this.poiLayer=this.el('g');this.g.appendChild(this.poiLayer);
    [['加油站',170,150,'⛽'],['停車場',790,170,'P'],['咖啡',840,470,'☕'],['休息站',350,120,'R']].forEach(([n,x,y,icon])=>{const g=this.el('g',{class:'poi'});const c=this.el('circle',{cx:x,cy:y,r:16});const t=this.el('text',{x,y:y+5,'text-anchor':'middle'});t.textContent=icon;g.append(c,t);const l=this.el('text',{x:x+23,y:y+4,class:'poi-label'});l.textContent=n;g.appendChild(l);this.poiLayer.appendChild(g)});
    this.vehicle=this.el('g',{class:'vehicle'});this.vehicle.appendChild(this.el('circle',{cx:0,cy:0,r:18,class:'vehicle-halo'}));this.vehicle.appendChild(this.el('path',{d:'M 0 -20 L 11 14 L 0 9 L -11 14 Z',class:'vehicle-arrow'}));this.g.appendChild(this.vehicle);
    this.accuracy=this.el('circle',{cx:0,cy:0,r:28,class:'accuracy-ring'});this.g.insertBefore(this.accuracy,this.vehicle);
    this.viewport=this.g;
  }
  bind(){
    const start=e=>{this.drag={x:e.clientX,y:e.clientY,tx:this.tx,ty:this.ty}};
    const move=e=>{if(!this.drag)return;this.tx=this.drag.tx+(e.clientX-this.drag.x);this.ty=this.drag.ty+(e.clientY-this.drag.y);this.apply()};
    const end=()=>this.drag=null;
    this.svg.addEventListener('pointerdown',start);window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);
    this.svg.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.65,Math.min(2.2,this.zoom*(e.deltaY<0?1.1:.9)));this.apply()},{passive:false});
  }
  showRoute(route){if(!route?.points?.length)return;const d=route.points.map((p,i)=>`${i?'L':'M'} ${470+(p.lng-121.5319)*18000} ${330-(p.lat-25.0478)*18000}`).join(' ');if(!this.routeHighlight){this.routeHighlight=this.el('path',{class:'route-highlight'});this.g.appendChild(this.routeHighlight);}this.routeHighlight.setAttribute('d',d);}
  clearRoute(){this.routeHighlight?.remove();this.routeHighlight=null;}
  showSearchPin(p){if(!this.searchPin){this.searchPin=this.el('circle',{r:11,class:'map-pin'});this.g.appendChild(this.searchPin);}const x=470+(p.lng-121.5319)*18000;const y=330-(p.lat-25.0478)*18000;this.searchPin.setAttribute('cx',x);this.searchPin.setAttribute('cy',y);this.tx=500-x;this.ty=325-y;this.zoom=1.15;this.apply();}
  setMode(mode){this.mode=mode;this.svg.closest('.map-shell')?.setAttribute('data-map-mode',mode);}
  setOrientation(o){this.orientation=o;this.apply()}
  apply(){let rot=this.orientation==='HEADING_UP'?getState().heading:0;let scale=`translate(${this.tx} ${this.ty}) scale(${this.zoom})`;this.g.setAttribute('transform',`${scale} rotate(${this.mode==='3D'?2:0} 500 325)`);this.vehicle.setAttribute('transform',`translate(${this.vehicle.dataset.x||470} ${this.vehicle.dataset.y||330}) rotate(${rot})`);this.accuracy.setAttribute('transform',`translate(${this.vehicle.dataset.x||470} ${this.vehicle.dataset.y||330})`)}
  render(state){if(state.currentLocation){const x=470+(state.currentLocation.lng-121.5319)*18000;const y=330-(state.currentLocation.lat-25.0478)*18000;this.vehicle.dataset.x=x;this.vehicle.dataset.y=y;this.accuracy.setAttribute('r',Math.max(20,Math.min(60,(state.accuracy||10)*2)));}this.apply();}
}
