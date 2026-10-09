import {getState,setState,subscribe} from './state.js';
import {DemoProvider,ProviderRegistry} from './providers.js';
import {OfflineManager} from './offline-manager.js';
import {DemoMap} from './map.js';
import {DemoGPS} from './gps.js';
import {PackageManager,PackageStatus} from './package-manager.js';
import {mountSearch} from './search-ui.js';
import {mountRouting} from './route-ui.js';
import {NavigationEngine,instructionLabel} from './navigation.js';
import {buildGuidance,iconFor} from './guidance.js';
import {mountTraffic} from './traffic-ui.js';
import {DriverAssistanceEngine} from './driver-assistance.js';
import {mountDriverAssistance} from './driver-ui.js';
import {UpAheadEngine} from './up-ahead.js';
import {MediaEngine} from './media.js';
import {PhoneEngine} from './phone.js';
import {NotificationCenter} from './notifications.js';
import {mountMedia} from './media-ui.js';
import {mountPhone} from './phone-ui.js';
import {mountNotifications} from './notifications-ui.js';
import {mountUpAhead} from './up-ahead-ui.js';
import {OfflineVoiceEngine,VoiceEvent} from './voice.js';
import {mountWeather} from './weather-ui.js';
import {mountParking} from './parking-ui.js';
import {AINavigationAssistant} from './ai-assistant.js';
import {mountAIAssistant} from './ai-assistant-ui.js';
import {CommercialUI} from './commercial-ui.js';
import {BrowserGeolocationProvider} from './gps-provider.js';
import {OfflineVectorMapProvider,TileMapProvider} from './map-provider.js';
import {OfflineGraphRoutingProvider,ExternalRoutingProvider} from './routing-provider.js';
import {ProviderManager} from './provider-manager.js';
import {mountProviderUI} from './provider-ui.js';
const offline=new OfflineManager();const providers=new ProviderRegistry();const providerManager=new ProviderManager(providers);providers.register('demo',new DemoProvider());providers.register('offline-vector',new OfflineVectorMapProvider());providers.register('browser-geolocation',new BrowserGeolocationProvider());providers.register('tile-provider',new TileMapProvider({template:'',attribution:'',requiresNetwork:true}));
const $=id=>document.getElementById(id);const mapShell=$('mapShell');const status=$('serviceStatus');const gps=new DemoGPS();const map=new DemoMap($('mapCanvas'));const packageManager=new PackageManager();
const navigation=new NavigationEngine();providers.register('offline-graph',new OfflineGraphRoutingProvider(navigation.router));providers.register('external-routing',new ExternalRoutingProvider());providerManager.applyState();
const driverAssistance=new DriverAssistanceEngine();
const upAhead=new UpAheadEngine();
const commercialUI=new CommercialUI({mapShell:$('mapShell'),priority:$('priorityAlert')});
commercialUI.init();
const media=new MediaEngine();
const phone=new PhoneEngine();
const notifications=new NotificationCenter();
const voice=new OfflineVoiceEngine();
const aiAssistant=new AINavigationAssistant();mountProviderUI({container:$('providerStatus'),manager:providerManager});
const voicePanel=document.getElementById('voicePanel');
if(voicePanel){voicePanel.innerHTML='<div class="voice-card"><div><small>語音導航</small><b id="voiceState">離線語音就緒</b></div><button id="voiceToggleBtn" class="secondary">語音：開啟</button></div>';const vb=document.getElementById('voiceToggleBtn');vb.addEventListener('click',()=>{voice.setEnabled(!voice.enabled);vb.textContent=voice.enabled?'語音：開啟':'語音：關閉';});}
let previousVoiceState=null;
function render(state){$('networkState').textContent=state.networkStatus;
 const instr=state.nextInstruction||state.currentInstruction; $('nextAction').textContent=state.navigationStatus==='ARRIVED'?'已抵達目的地':(instr?instructionLabel(instr)+' → '+(instr.road||'前方'):'尚未開始導航'); $('nextActionDistance').textContent=instr?`${Math.max(0,Math.round(instr.distance||0))} m`:'-- m'; const lane=state.laneGuidance; $('laneReason').textContent=lane?.reason||'等待導航'; $('laneGuidance').innerHTML=(lane?.lanes||['左轉','直行','右轉']).map((x,i)=>`<span class="${i===(lane?.active??1)?'active':''}">${x==='左轉'?'←':x==='右轉'?'→':'↑'}</span>`).join(''); $('instructionIcon').textContent=lane?.icon||'↱'; const navTop=document.querySelector('.nav-top strong'); if(navTop){navTop.textContent=instr?(state.navigationStatus==='ARRIVED'?'已抵達目的地':`${instructionLabel(instr)} ${Math.max(0,Math.round(instr.distance||0))} m`):'尚未開始導航';navTop.dataset.arrived=state.navigationStatus==='ARRIVED';} $('packageState').textContent=state.offlinePackageStatus; status.textContent=state.networkStatus; status.dataset.state=state.networkStatus.toLowerCase(); $('gpsStatus').textContent=state.navigationStatus.startsWith('DEMO')?'Demo GPS':'待機'; $('speed').textContent=Math.round(state.speed||0); $('speedLimitLabel').textContent=`速限 ${state.currentRoad==='科技路快速道路'||state.currentRoad==='河岸快速道路'?'80':state.currentRoad==='老街道路'?'30':'50'}`; $('eta').textContent=state.ETA||'--:--'; $('distance').textContent=state.remainingDistance==null?'--':(state.remainingDistance/1000).toFixed(1)+' km'; $('time').textContent=state.remainingTime==null?'--':Math.max(1,Math.round(state.remainingTime/60))+' min';}
function syncNetwork(){setState({networkStatus:navigator.onLine?'ONLINE':'OFFLINE'});}
window.AIGPSProviders={manager:providerManager,enableBrowserGPS:()=>{providerManager.select('gps','browser-geolocation');const p=providers.get('browser-geolocation');p.start();return p;},disableBrowserGPS:()=>providers.get('browser-geolocation')?.stop()};
function renderPackage(p){$('downloadMessage').textContent=p.message;$('downloadPercent').textContent=`${p.progress||0}%`;$('downloadProgress').style.width=`${p.progress||0}%`;$('downloadBytes').textContent=`${(p.downloaded||0).toLocaleString()} / ${(p.total||0).toLocaleString()} bytes`;$('downloadBtn').disabled=p.status===PackageStatus.VERIFYING||p.status===PackageStatus.READY||p.status===PackageStatus.UPDATING||(p.status===PackageStatus.DOWNLOADING&&!packageManager.paused);$('pauseBtn').disabled=p.status!==PackageStatus.DOWNLOADING;$('cancelBtn').disabled=!['DOWNLOADING','VERIFYING'].includes(p.status);}
function syncVoice(s){
 const p=previousVoiceState;
 if(!p){previousVoiceState=s;return;}
 if(s.navigationStatus==='NAVIGATING'&&p.navigationStatus!=='NAVIGATING') voice.announce(VoiceEvent.START,{destination:s.destination?.name});
 if(s.navigationStatus==='ARRIVED'&&p.navigationStatus!=='ARRIVED') voice.announce(VoiceEvent.ARRIVED,{destination:s.destination?.name});
 if(s.navigationStatus==='OFF_ROUTE'&&p.navigationStatus!=='OFF_ROUTE') voice.announce(VoiceEvent.OFF_ROUTE);
 const a=s.nextInstruction,b=p.nextInstruction;
 if(s.navigationStatus==='NAVIGATING'&&a&&(!b||a.type!==b.type||a.road!==b.road||Math.abs((a.distance||0)-(b.distance||0))>120)){
   if((a.distance||9999)<=500) voice.announce(VoiceEvent.TURN,{distance:a.distance,action:instructionLabel(a),road:a.road,instructionKey:(a.type||'')+':'+(a.road||'')});
 }
 previousVoiceState=s;
}
subscribe(s=>{render(s);syncVoice(s)});render(getState());window.addEventListener('online',syncNetwork);window.addEventListener('offline',syncNetwork);
packageManager.subscribe(p=>{renderPackage(p);setState({offlinePackageStatus:p.status});});
$('demoBtn').addEventListener('click',()=>{if(gps.timer){gps.stop();$('demoBtn').textContent='▶ 啟動 Demo'}else{gps.start();$('demoBtn').textContent='■ 停止 Demo'}});
$('modeBtn').addEventListener('click',()=>{const next=map.mode==='2D'?'3D':'2D';map.setMode(next);$('modeBtn').textContent=next});
$('orientationBtn').addEventListener('click',()=>{const s=getState();const next=s.settings.orientation==='HEADING_UP'?'NORTH_UP':'HEADING_UP';setState({settings:{...s.settings,orientation:next}});map.setOrientation(next);$('orientationBtn').title=next});
$('themeBtn').addEventListener('click',()=>{const day=mapShell.dataset.theme==='night';mapShell.dataset.theme=day?'day':'night';$('themeBtn').textContent=day?'☀':'☾'});
$('locateBtn').addEventListener('click',()=>{map.tx=0;map.ty=0;map.zoom=1;map.apply()});
$('repeatInstruction').addEventListener('click',()=>{const s=getState();const i=s.nextInstruction||s.currentInstruction;if(s.navigationStatus==='ARRIVED')voice.announce(VoiceEvent.ARRIVED,{destination:s.destination?.name});else if(i)voice.announce(VoiceEvent.TURN,{distance:i.distance,action:instructionLabel(i),road:i.road,instructionKey:'repeat:'+i.type+':'+i.road});else voice.speak('目前尚未開始導航。',{key:'repeat-idle'});});
const modal=$('downloadCenter');
$('openDownloads').addEventListener('click',async()=>{modal.hidden=false;const installed=await packageManager.inspect();$('installedVersion').textContent=installed?`${installed.region} · ${installed.version}`:'尚未安裝';});
$('closeDownloads').addEventListener('click',()=>modal.hidden=true);
$('downloadBtn').addEventListener('click',async()=>{if(packageManager.paused){packageManager.resume();return}if(!navigator.onLine){$('downloadMessage').textContent='目前離線，請先恢復網路後下載。';return}try{const manifest=await fetch('./data/package-manifest.json').then(r=>r.json());await packageManager.install(manifest)}catch(e){$('downloadMessage').textContent=e.message||'下載失敗';}});
$('cancelBtn').addEventListener('click',()=>packageManager.cancel?.());
$('pauseBtn').addEventListener('click',()=>packageManager.pause?.());
$('rollbackBtn').addEventListener('click',async()=>{try{const r=await packageManager.rollback();$('installedVersion').textContent=`${r.region} · ${r.version}`;}catch(e){alert(e.message)}});
mountSearch({input:$('searchInput'),button:$('searchBtn'),chips:$('categoryChips'),results:$('searchResults'),status:$('searchStatus'),nearbyBtn:$('nearbyBtn'),map});
mountTraffic({container:$('trafficEvents'),refreshBtn:$('trafficRefreshBtn')});
mountUpAhead({container:$('upAheadList'),citiesContainer:$('citiesAheadList')});
mountWeather({container:$('weatherInfo')});
mountParking({container:$('parkingList'),button:$('parkingRefreshBtn')});
mountAIAssistant({input:$('aiInput'),button:$('aiAskBtn'),messages:$('aiMessages'),assistant:aiAssistant});
aiAssistant.init().catch(()=>{});
upAhead.init().catch(()=>{});
media.init();phone.init();notifications.init();
mountMedia({container:$('mediaCard'),media});
mountPhone({container:$('phoneCard'),phone});
mountNotifications({container:$('notificationsCard'),center:notifications});
window.addEventListener('ai-gps:select-poi',e=>{const p=e.detail;setState({destination:{id:p.id,name:p.name,lat:p.lat,lng:p.lng,address:p.address}});map.showSearchPin(p);});
window.__aiGpsState={subscribe,getState};
driverAssistance.init().then(()=>mountDriverAssistance({container:$('driverAlerts'),engine:driverAssistance,clearBtn:$('clearDriverAlerts'),status:$('driverAlertStatus')})).catch(()=>{ $('driverAlertStatus').textContent='駕駛輔助資料載入失敗'; });
mountRouting({panel:document.querySelector('.route-panel'),summary:$('routeSummary'),preference:$('routePreference'),avoidHighway:$('avoidHighway'),avoidToll:$('avoidToll'),avoidFerry:$('avoidFerry'),avoidUnpaved:$('avoidUnpaved'),routeBtn:$('routeBtn'),alternativeBtn:$('alternativeBtn'),clearBtn:$('clearRouteBtn'),map});
$('startNavBtn').addEventListener('click',()=>{try{navigation.start();gps.start();$('demoBtn').textContent='■ 停止 Demo'}catch(e){$('routeSummary').textContent=e.message}});
$('stopNavBtn').addEventListener('click',()=>{navigation.stop();gps.stop();$('demoBtn').textContent='▶ 啟動 Demo'});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}

const preview=$('routePreview'); $('previewRouteBtn').addEventListener('click',()=>{const r=getState().route;if(!r){$('previewSummary').textContent='請先規劃離線路線';preview.hidden=false;$('previewSteps').innerHTML='';return}const steps=buildGuidance(r);$('previewSummary').textContent=`${(r.distance/1000).toFixed(1)} km · 約 ${Math.max(1,Math.round(r.seconds/60))} 分鐘 · ${r.preference||'fastest'}`;$('previewSteps').innerHTML=steps.map(x=>`<div class="preview-step"><span class="step-icon">${iconFor(x.type)}</span><div><b>${x.label}</b><small>${x.road}</small></div><span class="step-distance">${Math.round(x.distance)} m</span></div>`).join('');preview.hidden=false}); $('closePreview').addEventListener('click',()=>preview.hidden=true); preview.addEventListener('click',e=>{if(e.target===preview)preview.hidden=true});