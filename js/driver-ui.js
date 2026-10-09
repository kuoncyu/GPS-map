import {alertLabel} from './driver-assistance.js';
export function mountDriverAssistance({container,engine,clearBtn,status}){
 const paint=s=>{const list=s.driverAlerts||[];status.textContent=list.length?`${list.length} 項提醒`:'安全駕駛';container.innerHTML=list.length?list.map(a=>`<button class="driver-alert ${String(a.severity).toLowerCase()}" data-id="${a.id}"><span class="driver-icon">${a.type==='SPEEDING'?'⚠':a.type==='SHARP_TURN'?'↪':a.type==='TRAFFIC_EVENT'?'🚧':'!'}</span><span><b>${alertLabel(a)}</b><small>${a.message}${a.distance!=null?` · ${a.distance} m`:''}</small></span><i>×</i></button>`).join(''):'<div class="driver-safe">✓ 目前沒有需要立即處理的警告</div>';};
 const {subscribe}=window.__aiGpsState||{}; if(subscribe)subscribe(paint);
 paint(window.__aiGpsState?.getState?.()||{driverAlerts:[]});
 container.addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b)engine.acknowledge(b.dataset.id);});
 clearBtn.addEventListener('click',()=>engine.clear());
 return {render:paint};
}
