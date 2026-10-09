import {BaseProvider,ProviderKind} from './provider-contracts.js';
import {Storage} from './storage.js';

export class OfflineVectorMapProvider extends BaseProvider{
  constructor({id='offline-vector',packageId='TW-TPE'}={}){super({id,kind:ProviderKind.MAP,live:false,offline:true});this.packageId=packageId;}
  async getMapMetadata(){let active=null;try{active=await Storage.reconcileActivePackage?.();}catch{}if(!active?.verified||!Array.isArray(active.payloads)||!active.payloads.length){try{active=await Storage.getActivePackage?.();}catch{}}const usable=active?.verified&&Array.isArray(active.payloads)&&active.payloads.length;return {provider:this.id,packageId:usable?active.packageId:this.packageId,packageVersion:usable?active.version:null,packageRecordId:usable?active.id:null,isLive:false,offlineAvailable:Boolean(usable),format:'offline-package'};}
}

export class TileMapProvider extends BaseProvider{
  constructor({id='tile-provider',template='',attribution='',requiresNetwork=true}={}){super({id,kind:ProviderKind.MAP,live:true,offline:false});this.template=template;this.attribution=attribution;this.requiresNetwork=requiresNetwork;}
  tileUrl(z,x,y){if(!this.template)return null;return this.template.replace('{z}',z).replace('{x}',x).replace('{y}',y);}
  async getMapMetadata(){return {provider:this.id,isLive:true,template:this.template,attribution:this.attribution,requiresNetwork:this.requiresNetwork};}
}
