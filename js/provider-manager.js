import {getState,setState} from './state.js';
import {ProviderKind} from './provider-contracts.js';

export class ProviderManager{
  constructor(registry){this.registry=registry;this.active={map:'tile-provider',routing:'offline-graph',gps:'demo'};}
  register(kind,id,provider){if(kind!==provider.kind)throw new Error(`Provider kind mismatch: ${kind}/${provider.kind}`);this.registry.register(id,provider);}
  select(kind,id){const provider=this.registry.get(id);if(!provider||provider.kind!==kind)throw new Error(`Provider not available: ${kind}/${id}`);this.active[kind]=id;setState({providerState:{...this.active}});return provider;}
  get(kind){return this.registry.get(this.active[kind]);}
  describe(){return Object.entries(this.active).map(([kind,id])=>{const p=this.registry.get(id);return {kind,id,live:!!p?.isLive,offlineCapable:!!p?.offlineCapable};});}
  applyState(){setState({providerState:{...this.active}});}
}
export {ProviderKind};
