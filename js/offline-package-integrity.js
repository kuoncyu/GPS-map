const SHA256_RE=/^[a-f0-9]{64}$/i;
export function validatePackageManifest(manifest){
 const errors=[];
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))return {valid:false,errors:['資料包 manifest 必須是物件']};
 for(const key of ['packageId','version','region'])if(typeof manifest[key]!=='string'||!manifest[key].trim())errors.push(`缺少有效欄位：${key}`);
 if(!Array.isArray(manifest.files)||manifest.files.length===0)errors.push('資料包 files 必須至少包含一個檔案');
 const seen=new Set();
 for(const [i,file] of (Array.isArray(manifest.files)?manifest.files:[]).entries()){
  const label=`files[${i}]`;
  if(!file||typeof file!=='object'){errors.push(`${label} 格式錯誤`);continue;}
  if(typeof file.path!=='string'||!file.path.trim())errors.push(`${label}.path 不可空白`);
  else {const normalized=file.path.replaceAll('\\','/');if(normalized.startsWith('/')||/^[a-z]+:/i.test(normalized)||normalized.split('/').some(part=>part==='..')||normalized.includes('?')||normalized.includes('#'))errors.push(`${label}.path 必須是安全的相對路徑`);if(seen.has(normalized))errors.push(`資料包含重複路徑：${normalized}`);seen.add(normalized);}
  if(!Number.isSafeInteger(file.size)||file.size<=0)errors.push(`${label}.size 必須是大於 0 的整數`);
  if(typeof file.sha256!=='string'||!SHA256_RE.test(file.sha256))errors.push(`${label}.sha256 必須是 64 位十六進位 SHA-256`);
 }
 if(manifest.sha256!=null&&!SHA256_RE.test(String(manifest.sha256)))errors.push('manifest.sha256 格式錯誤');
 if(manifest.sizeBytes!=null){const sum=(Array.isArray(manifest.files)?manifest.files:[]).reduce((n,file)=>n+(Number.isSafeInteger(file?.size)&&file.size>0?file.size:0),0);if(!Number.isSafeInteger(manifest.sizeBytes)||manifest.sizeBytes!==sum)errors.push('manifest.sizeBytes 與檔案大小總和不符');}
 return {valid:errors.length===0,errors};
}
export async function sha256Bytes(data){const bytes=data instanceof ArrayBuffer?data:data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function verifyPackageFiles(manifest,{fetchImpl=globalThis.fetch,onProgress=()=>{},shouldCancel=()=>false,waitIfPaused=async()=>{}}={}){
 const validation=validatePackageManifest(manifest);if(!validation.valid)throw new Error(`資料包 manifest 驗證失敗：${validation.errors.join('；')}`);
 if(typeof fetchImpl!=='function')throw new Error('目前環境沒有可用的資料下載功能');
 if(manifest.sha256){const actual=await sha256Bytes(new TextEncoder().encode(JSON.stringify(manifest.files)));if(actual.toLowerCase()!==manifest.sha256.toLowerCase())throw new Error('資料包清單 SHA-256 不符，已拒絕安裝');}
 const total=manifest.files.reduce((sum,file)=>sum+file.size,0);let downloaded=0;const payloads=[];
 for(const file of manifest.files){await waitIfPaused();if(shouldCancel())throw new Error('使用者取消下載');let response;try{response=await fetchImpl(file.path,{cache:'no-store'});}catch(e){throw new Error(`下載失敗：${file.path}（${e?.message||'網路錯誤'}）`)}
  if(!response||!response.ok)throw new Error(`下載失敗：${file.path}（HTTP ${response?.status??'無回應'}）`);
  const data=await response.arrayBuffer();if(data.byteLength!==file.size)throw new Error(`檔案大小不符：${file.path}，預期 ${file.size} bytes，實際 ${data.byteLength} bytes`);
  const actual=await sha256Bytes(data);if(actual.toLowerCase()!==file.sha256.toLowerCase())throw new Error(`SHA-256 驗證失敗：${file.path}`);
  payloads.push({path:file.path,size:data.byteLength,sha256:actual,data});downloaded+=data.byteLength;onProgress({downloaded,total,progress:Math.min(95,Math.round(downloaded/Math.max(total,1)*95)),message:`已驗證 ${file.path}`});
 }
 return {payloads,total,downloaded,verified:true};
}
