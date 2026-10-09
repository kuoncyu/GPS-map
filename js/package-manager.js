import {Storage} from './storage.js';
import {verifyPackageFiles} from './offline-package-integrity.js';
export const PackageStatus={NOT_INSTALLED:'NOT_INSTALLED',DOWNLOADING:'DOWNLOADING',VERIFYING:'VERIFYING',READY:'READY',UPDATING:'UPDATING',ERROR:'ERROR'};
const validPackage=x=>Boolean(x&&x.verified&&Array.isArray(x.payloads)&&x.payloads.length>0);
const sequence=x=>Number(x.installSequence)||Date.parse(x.installedAt)||0;
function storageErrorMessage(error){const name=error?.name||'';const message=String(error?.message||'');if(name==='QuotaExceededError'||/quota|storage.?full|disk.?full|儲存空間不足/i.test(message))return '裝置可用儲存空間不足，資料包尚未完成安裝；請先釋放空間後重試。既有已安裝資料會保留。';if(name==='AbortError'||/transaction.*abort|交易已中止/i.test(message))return '資料包寫入交易未完成，安裝已取消；請保留目前資料並重試。';return message||'資料包下載或安裝失敗';}
export class PackageManager{
 constructor({fetchImpl=globalThis.fetch}={}){this.listeners=new Set();this.fetchImpl=fetchImpl;this.state={status:PackageStatus.NOT_INSTALLED,progress:0,downloaded:0,total:0,message:'尚未安裝必要資料包'};this.current=null;this.paused=false;this.cancelled=false;this.pauseWaiters=[];this.operationQueue=Promise.resolve()}
 _enqueue(task){const run=this.operationQueue.then(task,task);this.operationQueue=run.then(()=>undefined,()=>undefined);return run}
 subscribe(fn){this.listeners.add(fn);fn({...this.state});return()=>this.listeners.delete(fn)}
 emit(p){this.state={...this.state,...p};this.listeners.forEach(f=>f({...this.state}))}
 async inspect(){let active=null;if(typeof Storage.reconcileActivePackage==='function')active=await Storage.reconcileActivePackage().catch(()=>null);if(!active)active=await Storage.getActivePackage().catch(()=>null);if(validPackage(active)){this.current=active;return active;}const all=(await Storage.listPackages()).filter(validPackage).sort((a,b)=>sequence(b)-sequence(a));this.current=all[0]||null;if(this.current)await Storage.activatePackage(this.current.id).catch(()=>{});return this.current}
 pause(){if(this.state.status!==PackageStatus.DOWNLOADING)return;if(this.paused){this.resume();return;}this.paused=true;this.emit({message:'已暫停下載；再次按「下載／恢復」可繼續。'});}
 resume(){if(this.paused){this.paused=false;this.pauseWaiters.splice(0).forEach(resolve=>resolve());this.emit({message:'正在恢復下載…'});}}
 cancel(){if(['DOWNLOADING','VERIFYING','UPDATING'].includes(this.state.status)){this.cancelled=true;this.resume();this.emit({status:PackageStatus.ERROR,message:'正在取消資料包安裝…'});}}
 async waitIfPaused(){while(this.paused&&!this.cancelled)await new Promise(resolve=>this.pauseWaiters.push(resolve));if(this.cancelled)throw new Error('使用者取消下載');}
 install(manifest,options={}){return this._enqueue(()=>this._installUnlocked(manifest,options));}
 async _installUnlocked(manifest,{forceUpdate=false}={}){
  const existing=await this.inspect();const packageId=manifest?.packageId;this.cancelled=false;this.paused=false;
  if(existing&&existing.packageId===packageId&&existing.version===manifest.version&&!forceUpdate){this.emit({status:PackageStatus.READY,progress:100,downloaded:existing.sizeBytes,total:existing.sizeBytes,message:`${existing.region} ${existing.version} 已安裝且驗證完成`});return existing;}
  const requestedBytes=Number(manifest?.sizeBytes)|| (Array.isArray(manifest?.files)?manifest.files.reduce((sum,file)=>sum+(Number(file?.size)||0),0):0);
  this.emit({status:existing?'UPDATING':'DOWNLOADING',progress:0,downloaded:0,total:requestedBytes,message:'檢查資料包清單與可用儲存空間…'});
  try{
   if(requestedBytes>0&&typeof Storage.estimateCapacity==='function'){const capacity=await Storage.estimateCapacity();if(capacity?.supported&&Number.isFinite(capacity.available)&&capacity.available<requestedBytes){const error=new Error('QuotaExceededError');error.name='QuotaExceededError';throw error;}}
   const verified=await verifyPackageFiles(manifest,{fetchImpl:this.fetchImpl,shouldCancel:()=>this.cancelled,waitIfPaused:()=>this.waitIfPaused(),onProgress:p=>this.emit({status:PackageStatus.DOWNLOADING,...p})});
   if(this.cancelled)throw new Error('使用者取消下載');this.emit({status:PackageStatus.VERIFYING,progress:98,downloaded:verified.downloaded,total:verified.total,message:'檔案均已通過大小與 SHA-256 驗證，正在提交安裝…'});
   const installedAt=new Date().toISOString();const installSequence=Date.now();const record={id:`${packageId}@${manifest.version}@${installSequence}`,packageId,version:manifest.version,region:manifest.region,sizeBytes:verified.total,sha256:manifest.sha256||null,verified:true,installedAt,installSequence,manifest,payloads:verified.payloads};
   // Persist the verified payload and activate it in one IndexedDB transaction.
   await Storage.putPackageAndActivate(record,{keepPerPackage:2});this.current=record;this.emit({status:PackageStatus.READY,progress:100,downloaded:verified.total,total:verified.total,message:`${manifest.region} ${manifest.version} 已驗證並安裝完成`});return record;
  }catch(e){const message=storageErrorMessage(e);this.emit({status:PackageStatus.ERROR,message});if(message!==e?.message){const wrapped=new Error(message,{cause:e});wrapped.name=e?.name||'PackageInstallError';throw wrapped;}throw e;}
 }
 rollback(){return this._enqueue(()=>this._rollbackUnlocked());}
 async _rollbackUnlocked(){const active=await this.inspect();if(!active)throw new Error('目前沒有已驗證的啟用資料包');const all=(await Storage.listPackages()).filter(x=>x.id!==active.id&&x.packageId===active.packageId&&validPackage(x)).sort((a,b)=>sequence(b)-sequence(a));if(!all.length)throw new Error('沒有可回復的上一個已驗證版本');const previous=all[0];await Storage.activatePackage(previous.id);this.current=previous;this.emit({status:PackageStatus.READY,progress:100,downloaded:previous.sizeBytes,total:previous.sizeBytes,message:`已回復至 ${previous.version}；新版資料仍保留供再次切換`});return previous;}
 async cleanupOldPackages({keepPerPackage=2}={}){return this._enqueue(async()=>{const result=await Storage.prunePackages({keepPerPackage});const active=await Storage.getActivePackage().catch(()=>null);this.current=validPackage(active)?active:null;return {...result,activePackageId:this.current?.id||null};});}
}
