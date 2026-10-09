const DB_NAME='ai-gps-storage'; const DB_VERSION=1;
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('packages'))db.createObjectStore('packages',{keyPath:'id'});if(!db.objectStoreNames.contains('chunks')){const s=db.createObjectStore('chunks',{keyPath:'key'});s.createIndex('packageId','packageId');}if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function tx(store,mode,fn){const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction(store,mode);let result;try{result=fn(t.objectStore(Array.isArray(store)?store[0]:store),t);}catch(e){reject(e);return;}t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error||new Error('IndexedDB transaction failed'));t.onabort=()=>reject(t.error||new Error('IndexedDB transaction aborted'));});}
function requestValue(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export const Storage={
 async estimateCapacity(){
  try{if(!globalThis.navigator?.storage||typeof globalThis.navigator.storage.estimate!=='function')return {supported:false,quota:null,usage:null,available:null};const value=await globalThis.navigator.storage.estimate();const quota=Number.isFinite(value?.quota)?value.quota:null;const usage=Number.isFinite(value?.usage)?value.usage:null;return {supported:true,quota,usage,available:quota==null||usage==null?null:Math.max(0,quota-usage)};}catch(error){return {supported:false,quota:null,usage:null,available:null,errorName:error?.name||'StorageEstimateError'};}
 },
 async putPackage(v){return tx('packages','readwrite',s=>s.put(v))},
 async putPackageAndActivate(record,{keepPerPackage=2}={}){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
   const t=db.transaction(['packages','meta'],'readwrite');const packages=t.objectStore('packages');const meta=t.objectStore('meta');let failure=null;
   const allReq=packages.getAll();
   allReq.onerror=()=>{failure=allReq.error;try{t.abort()}catch{}};
   allReq.onsuccess=()=>{
    try{
     const existing=allReq.result||[];const combined=[...existing.filter(x=>x.id!==record.id),record];
     packages.put(record);meta.put({key:'activePackageId',value:record.id});
     const same=combined.filter(x=>x.packageId===record.packageId&&x.verified&&Array.isArray(x.payloads)&&x.payloads.length>0)
      .sort((a,b)=>(Number(b.installSequence)||Date.parse(b.installedAt)||0)-(Number(a.installSequence)||Date.parse(a.installedAt)||0));
     for(const old of same.slice(Math.max(1,keepPerPackage)))if(old.id!==record.id)packages.delete(old.id);
    }catch(e){failure=e;try{t.abort()}catch{}}
   };
   t.oncomplete=()=>resolve(record);t.onerror=()=>reject(failure||t.error||new Error('資料包提交交易失敗'));t.onabort=()=>reject(failure||t.error||new Error('資料包提交已中止'));
  });
 },
 async getActivePackage(){const meta=await tx('meta','readonly',s=>requestValue(s.get('activePackageId')));if(!meta?.value)return null;return this.getPackage(meta.value);},
 async reconcileActivePackage(){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
   const t=db.transaction(['packages','meta'],'readwrite');const p=t.objectStore('packages');const m=t.objectStore('meta');let selected=null;let failure=null;
   const all=p.getAll();const pointer=m.get('activePackageId');let rows=null;let pointerRow=null;
   const reconcile=()=>{if(!rows||pointerRow===undefined)return;try{const valid=x=>Boolean(x&&x.verified===true&&Array.isArray(x.payloads)&&x.payloads.length>0);const current=rows.find(x=>x.id===pointerRow?.value&&valid(x));if(current){selected=current;return;}const candidates=rows.filter(valid).sort((a,b)=>(Number(b.installSequence)||Date.parse(b.installedAt)||0)-(Number(a.installSequence)||Date.parse(a.installedAt)||0));selected=candidates[0]||null;if(selected)m.put({key:'activePackageId',value:selected.id});else m.delete('activePackageId');}catch(e){failure=e;try{t.abort()}catch{}}};
   all.onsuccess=()=>{rows=all.result||[];reconcile()};all.onerror=()=>{failure=all.error;try{t.abort()}catch{}};pointer.onsuccess=()=>{pointerRow=pointer.result||null;reconcile()};pointer.onerror=()=>{failure=pointer.error;try{t.abort()}catch{}};
   t.oncomplete=()=>resolve(selected);t.onerror=()=>reject(failure||t.error||new Error('啟用資料包復原失敗'));t.onabort=()=>reject(failure||t.error||new Error('啟用資料包復原交易已中止'));
  });
 },
 async activatePackage(id){
  const db=await openDB();
  return new Promise((resolve,reject)=>{const t=db.transaction(['packages','meta'],'readwrite');const p=t.objectStore('packages');const m=t.objectStore('meta');let record=null;let failure=null;const r=p.get(id);r.onsuccess=()=>{record=r.result||null;if(!record||!record.verified||!Array.isArray(record.payloads)||record.payloads.length===0){failure=new Error('無法啟用不存在或未驗證的資料包');try{t.abort()}catch{};return;}m.put({key:'activePackageId',value:id});};r.onerror=()=>{failure=r.error;try{t.abort()}catch{}};t.oncomplete=()=>resolve(record);t.onerror=()=>reject(failure||t.error||new Error('切換資料包版本失敗'));t.onabort=()=>reject(failure||t.error||new Error('切換資料包版本已中止'));});
 },
 async getPackage(id){return tx('packages','readonly',s=>requestValue(s.get(id)).then(v=>v||null))},
 async deletePackage(id){
  const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction(['packages','meta'],'readwrite');const p=t.objectStore('packages');const m=t.objectStore('meta');let failure=null;const r=m.get('activePackageId');r.onsuccess=()=>{if(r.result?.value===id){failure=new Error('不能直接刪除目前啟用的資料包；請先切換版本');try{t.abort()}catch{};return;}p.delete(id)};r.onerror=()=>{failure=r.error;try{t.abort()}catch{}};t.oncomplete=()=>resolve();t.onerror=()=>reject(failure||t.error||new Error('刪除資料包失敗'));t.onabort=()=>reject(failure||t.error||new Error('刪除資料包已中止'));});
 },
 async prunePackages({keepPerPackage=2}={}){
  const limit=Math.max(1,Math.floor(Number(keepPerPackage)||2));const db=await openDB();
  return new Promise((resolve,reject)=>{
   const t=db.transaction(['packages','meta'],'readwrite');const p=t.objectStore('packages');const m=t.objectStore('meta');let removed=[];let failure=null;let rows=null;let pointerRow;
   const all=p.getAll();const pointer=m.get('activePackageId');
   const apply=()=>{if(!rows||pointerRow===undefined)return;try{
    const valid=x=>Boolean(x&&x.verified===true&&Array.isArray(x.payloads)&&x.payloads.length>0);
    const activeId=pointerRow?.value||null;const groups=new Map();
    for(const row of rows){if(!valid(row))continue;const key=row.packageId||row.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
    for(const list of groups.values()){
     list.sort((a,b)=>(Number(b.installSequence)||Date.parse(b.installedAt)||0)-(Number(a.installSequence)||Date.parse(a.installedAt)||0));
     const keep=new Set(list.slice(0,limit).map(x=>x.id));if(activeId&&list.some(x=>x.id===activeId))keep.add(activeId);
     for(const row of list){if(!keep.has(row.id)){p.delete(row.id);removed.push(row.id);}}
    }
   }catch(e){failure=e;try{t.abort()}catch{}}};
   all.onsuccess=()=>{rows=all.result||[];apply()};all.onerror=()=>{failure=all.error;try{t.abort()}catch{}};pointer.onsuccess=()=>{pointerRow=pointer.result||null;apply()};pointer.onerror=()=>{failure=pointer.error;try{t.abort()}catch{}};
   t.oncomplete=()=>resolve({removed,kept:(rows||[]).length-removed.length});t.onerror=()=>reject(failure||t.error||new Error('清理舊資料包失敗'));t.onabort=()=>reject(failure||t.error||new Error('清理舊資料包交易已中止'));
  });
 },
 async listPackages(){return tx('packages','readonly',s=>requestValue(s.getAll()).then(a=>a||[]))},
 async putChunk(v){return tx('chunks','readwrite',s=>s.put(v))},
 async getChunks(id){return tx('chunks','readonly',s=>requestValue(s.index('packageId').getAll(IDBKeyRange.only(id))).then(a=>(a||[]).sort((x,y)=>x.index-y.index)))},
 async clearChunks(id){return tx('chunks','readwrite',(s,t)=>{const r=s.index('packageId').openCursor(IDBKeyRange.only(id));r.onsuccess=()=>{if(r.result){r.result.delete();r.result.continue();}};return undefined;})}
};
