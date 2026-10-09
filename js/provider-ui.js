import {subscribe} from './state.js';
export function mountProviderUI({container,manager,onChange=()=>{}}){
  if(!container)return;
  const render=()=>{const items=manager.describe();container.innerHTML=`<div class="provider-card"><div class="card-title">資料來源 Provider</div>${items.map(x=>`<div class="provider-row"><span>${x.kind.toUpperCase()}</span><b>${x.id}</b><small>${x.live?'LIVE':'OFFLINE'} · ${x.offlineCapable?'可離線':'需網路'}</small></div>`).join('')}<div class="provider-note">目前預設使用 Demo／離線 Provider；啟用外部商用服務前，必須設定合法 Provider 與授權。</div></div>`;onChange(items);};
  render();return subscribe(render);
}
