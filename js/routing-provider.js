import {BaseProvider,ProviderKind} from './provider-contracts.js';

export class OfflineGraphRoutingProvider extends BaseProvider{
  constructor(router){super({id:'offline-graph',kind:ProviderKind.ROUTING,live:false,offline:true});this.router=router;}
  async route(request){if(!this.router?.calculate)throw new Error('Offline router unavailable');return this.router.calculate(request);}
}

export class ExternalRoutingProvider extends BaseProvider{
  constructor({id='external-routing',endpoint='',requiresNetwork=true}={}){super({id,kind:ProviderKind.ROUTING,live:true,offline:false});this.endpoint=endpoint;this.requiresNetwork=requiresNetwork;}
  async route(){throw new Error('External routing adapter is not configured. Configure a licensed provider endpoint before enabling live routing.');}
}
