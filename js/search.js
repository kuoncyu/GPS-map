import {Storage} from './storage.js';

export class OfflineSearch {
  constructor(url='./data/places.json',{storage=Storage,fetchImpl=globalThis.fetch}={}){
    this.url=url;this.places=[];this.loaded=false;this.storage=storage;this.fetchImpl=fetchImpl;
    this.packageRecordId=null;this.packageId=null;this.packageVersion=null;this.loading=null;
    this.categories=['全部','餐廳','咖啡','加油','充電','停車','醫院','超商','休息站'];
  }
  async _activePackage(){
    let reconcileError=null;
    if(typeof this.storage?.reconcileActivePackage==='function'){
      try{const p=await this.storage.reconcileActivePackage();if(p?.verified&&Array.isArray(p.payloads)&&p.payloads.length)return p;}
      catch(error){reconcileError=error;}
    }
    try{const p=await this.storage?.getActivePackage?.();if(p?.verified&&Array.isArray(p.payloads)&&p.payloads.length)return p;}
    catch(error){throw new Error(`無法確認目前啟用的離線資料包，為避免混用不同版本，已停止搜尋。${error?.message||''}`);}
    if(reconcileError&&typeof this.storage?.getActivePackage!=='function')throw new Error(`無法確認目前啟用的離線資料包，為避免混用不同版本，已停止搜尋。${reconcileError?.message||''}`);
    return null;
  }
  _normalizePath(value){return String(value||'').replaceAll('\\','/').replace(/^\.\//,'').split('/').pop();}
  async _parsePayload(payload){
    const data=payload?.data;if(data==null)throw new Error(`離線資料包檔案缺少內容：${payload?.path||'unknown'}`);
    let text;
    if(typeof data==='string')text=data;
    else if(data instanceof ArrayBuffer)text=new TextDecoder().decode(data);
    else if(ArrayBuffer.isView(data))text=new TextDecoder().decode(new Uint8Array(data.buffer,data.byteOffset,data.byteLength));
    else if(typeof Blob!=='undefined'&&data instanceof Blob)text=await data.text();
    else throw new Error(`離線資料格式不支援：${payload?.path||'unknown'}`);
    try{return JSON.parse(text)}catch{throw new Error(`離線地點 JSON 格式錯誤：${payload?.path||'unknown'}`)}
  }
  _validatePlaces(value){
    const places=Array.isArray(value)?value:value?.places;
    if(!Array.isArray(places))throw new Error('啟用的離線地點資料缺少 places 清單，無法搜尋。');
    for(const [i,p] of places.entries())if(!p||typeof p.id!=='string'||typeof p.name!=='string'||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))throw new Error(`離線地點資料第 ${i+1} 筆缺少有效 ID、名稱或座標。`);
    return places.map(p=>({...p,lat:Number(p.lat),lng:Number(p.lng),rating:Number.isFinite(Number(p.rating))?Number(p.rating):0,tags:Array.isArray(p.tags)?p.tags.map(String):[]}));
  }
  async load({force=false}={}){
    if(this.loading){await this.loading.catch(()=>{});return this.load({force});}
    this.loading=(async()=>{
      const active=await this._activePackage();
      if(active){
        if(!force&&this.loaded&&this.packageRecordId===active.id&&this.packageVersion===(active.version||null))return this.places;
        const payload=active.payloads.find(x=>this._normalizePath(x.path)==='places.json');
        if(!payload)throw new Error(`啟用的離線資料包 ${active.version||active.id} 缺少 places.json；為避免混用其他版本地點，已停止搜尋。`);
        const places=this._validatePlaces(await this._parsePayload(payload));
        const current=await this._activePackage();
        if(!current||current.id!==active.id||current.version!==active.version)throw new Error('離線資料包在載入期間已切換，請重新搜尋以確保地點與路線使用相同版本。');
        this.places=places.map(p=>({...p,_offlinePackageRecordId:active.id,_offlinePackageId:active.packageId||null,_offlinePackageVersion:active.version||null}));
        this.packageRecordId=active.id;this.packageId=active.packageId||null;this.packageVersion=active.version||null;this.loaded=true;return this.places;
      }
      if(this.loaded&&!force&&this.packageRecordId===null)return this.places;
      if(typeof this.fetchImpl!=='function')throw new Error('目前沒有已安裝的離線地點資料，也沒有可用的資料載入功能。');
      const response=await this.fetchImpl(this.url);if(!response?.ok)throw new Error('離線 POI 資料無法載入');
      const places=this._validatePlaces(await response.json());
      // Recheck the active package before accepting the static fallback; never mix a newly activated package with static POIs.
      const after=await this._activePackage();if(after)throw new Error('離線資料包在搜尋載入期間已啟用，請重新搜尋以確保資料版本一致。');
      this.places=places;this.packageRecordId=null;this.packageId=null;this.packageVersion=null;this.loaded=true;return this.places;
    })();
    try{return await this.loading}finally{this.loading=null;}
  }
  normalize(s=''){return String(s).trim().toLocaleLowerCase('zh-Hant');}
  distance(a,b){const R=6371000,p=Math.PI/180,dLat=(b.lat-a.lat)*p,dLng=(b.lng-a.lng)*p;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
  async query({text='',category='全部',nearby=null}={}){
    await this.load();const q=this.normalize(text);let out=this.places.filter(p=>category==='全部'||p.category===category);
    if(q)out=out.filter(p=>this.normalize([p.name,p.category,p.address,...p.tags].join(' ')).includes(q));
    if(nearby)out=out.map(p=>({...p,distance:this.distance(nearby,p)})).sort((a,b)=>a.distance-b.distance);else out.sort((a,b)=>b.rating-a.rating);
    return out;
  }
}
