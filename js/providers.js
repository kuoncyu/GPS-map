import {BaseProvider,ProviderKind} from './provider-contracts.js';
export class DemoProvider extends BaseProvider{constructor(){super({id:"demo",kind:"gps",live:false,offline:true});this.isDemo=true}async getPackageManifest(){return {packageId:"DEMO-TPE",version:"0.0.1-demo",region:"Taipei",verified:false}}async search(){return []}async route(){return null}}
export class ProviderRegistry{constructor(){this.providers=new Map()}register(name,provider){this.providers.set(name,provider);return provider}get(name){return this.providers.get(name)}list(){return [...this.providers.values()]}}
