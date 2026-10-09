import {getState,setState} from './state.js';
import {parseIntent} from './ai-parser.js';
import {OfflineSearch} from './search.js';
import {OfflineRouter} from './routing.js';
import {instructionLabel} from './navigation.js';
import {OfflineVoiceEngine} from './voice.js';
export class AINavigationAssistant{
 constructor(){this.search=new OfflineSearch();this.router=new OfflineRouter();this.voice=new OfflineVoiceEngine();this.ready=false;}
 async init(){await Promise.all([this.search.load(),this.router.init()]);this.ready=true;return this;}
 async ask(input){const intent=parseIntent(input),s=getState();let reply='';
  if(intent.type==='ROUTE_TO'||intent.type==='SEARCH_POI'||intent.type==='NEARBY'){
   const q=intent.query||input; const results=await this.search.query({text:q,nearby:s.currentLocation});
   if(!results.length){reply=`離線資料中找不到「${q}」。目前只能使用已下載的地點資料，沒有網路時不會虛構結果。`;}
   else {const p=results[0]; if(intent.type==='ROUTE_TO'){setState({destination:{id:p.id,name:p.name,lat:p.lat,lng:p.lng,address:p.address,_offlinePackageRecordId:p._offlinePackageRecordId||null,_offlinePackageId:p._offlinePackageId||null,_offlinePackageVersion:p._offlinePackageVersion||null}});reply=`已找到「${p.name}」，可以規劃離線路線。`;} else reply=`找到 ${results.slice(0,3).map(x=>x.name).join('、')}。`;}
  } else if(intent.type==='ROUTE_STATUS'){reply=s.route?`目前還有約 ${((s.remainingDistance||s.route.distance)/1000).toFixed(1)} 公里，預估 ${Math.max(1,Math.round((s.remainingTime??s.route.seconds)/60))} 分鐘抵達。`:'目前尚未建立路線。';}
  else if(intent.type==='NAV_STATUS'){const loc=s.currentLocation;reply=loc?`目前位於 ${s.currentRoad||'道路資料未知'}，速度約 ${Math.round(s.speed||0)} 公里／小時。`:'目前尚未取得定位。';}
  else if(intent.type==='REPEAT'){const i=s.nextInstruction||s.currentInstruction;reply=i?`下一個動作：${instructionLabel(i)}，距離約 ${Math.round(i.distance||0)} 公尺。`:'目前沒有導航指令。';this.voice.speak(reply,{key:'ai-repeat'});}
  else if(intent.type==='STOP_NAV'){setState({navigationStatus:'READY'});reply='已停止導航。';}
  else if(intent.type==='HELP'){reply='我可以協助搜尋離線地點、設定目的地、查詢路線距離與時間、查看目前導航狀態，以及重複下一個導航指令。';}
  else reply='我目前只能根據已下載的離線資料協助導航；請試試「導航到中央咖啡館」、「附近有停車場嗎」或「還有多久到」。';
  const message={role:'assistant',text:reply,time:Date.now(),intent:intent.type};setState({aiConversation:[...s.aiConversation,{role:'user',text:input,time:Date.now()},message]});return {intent,reply};
 }
}
