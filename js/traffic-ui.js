import {getState,setState,subscribe} from './state.js';
import {TrafficEngine,trafficLabel,severityLabel} from './traffic.js';
export function mountTraffic({container,refreshBtn}){
 const engine=new TrafficEngine();
 const render=s=>{const events=s.trafficEvents||[];container.innerHTML=events.length?events.map(e=>`<div class="traffic-event ${String(e.severity||'').toLowerCase()}"><b>${trafficLabel(e.type)}</b><span>${e.road}</span><small>${e.message} · ${severityLabel(e.severity)}</small></div>`).join(''):'目前沒有離線交通事件';};
 subscribe(render);render(getState());
 refreshBtn.addEventListener('click',async()=>{refreshBtn.disabled=true;refreshBtn.textContent='更新中…';try{await engine.applyToState()}catch(e){container.textContent=e.message||'交通資料載入失敗'}finally{refreshBtn.disabled=false;refreshBtn.textContent='載入 Demo 交通'}});
 return engine;
}
