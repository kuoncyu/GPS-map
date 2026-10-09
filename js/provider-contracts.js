/** Provider contracts for v1.1. No provider is allowed to silently fake live data. */
export const ProviderKind=Object.freeze({MAP:'map',ROUTING:'routing',GPS:'gps',TRAFFIC:'traffic',POI:'poi'});
export class BaseProvider{
  constructor({id,kind,live=false,offline=false}={}){this.id=id||'unknown';this.kind=kind||'unknown';this.isLive=!!live;this.offlineCapable=!!offline;}
  capabilities(){return {id:this.id,kind:this.kind,isLive:this.isLive,offlineCapable:this.offlineCapable};}
}
export function assertProvider(provider,kind){if(!provider||provider.kind!==kind)throw new Error(`Invalid ${kind} provider`);return provider;}
