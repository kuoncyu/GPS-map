import {getState,setState} from './state.js';
export const VoiceEvent={START:'START',TURN:'TURN',APPROACH:'APPROACH',REROUTE:'REROUTE',ARRIVED:'ARRIVED',OFF_ROUTE:'OFF_ROUTE',CUSTOM:'CUSTOM'};
export class OfflineVoiceEngine{
 constructor(){this.enabled=true;this.volume=1;this.rate=1;this.lastKey='';this.lastAt=0;this.queue=[];this.speaking=false;this.lang='zh-TW';}
 setEnabled(v){this.enabled=!!v;if(!this.enabled)this.cancel();}
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));}
 setRate(v){this.rate=Math.max(.7,Math.min(1.4,Number(v)||1));}
 cancel(){this.queue=[];if('speechSynthesis' in window)window.speechSynthesis.cancel();this.speaking=false;}
 speak(text,opts={}){if(!text||!this.enabled)return false;const now=Date.now(),key=opts.key||text;if(key===this.lastKey&&now-this.lastAt<Math.max(2500,opts.cooldownMs||6000))return false;this.lastKey=key;this.lastAt=now;this.queue.push({text});this.flush();return true;}
 flush(){if(this.speaking||!this.queue.length||!this.enabled)return;const item=this.queue.shift();if('speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined'){this.speaking=true;const u=new SpeechSynthesisUtterance(item.text);u.lang=this.lang;u.rate=this.rate;u.volume=this.volume;u.onend=()=>{this.speaking=false;this.flush()};u.onerror=()=>{this.speaking=false;this.flush()};window.speechSynthesis.speak(u)}else{this.flush()}}
 announce(event,p={}){const text=buildVoiceMessage(event,p);return this.speak(text,{key:event+':'+(p.instructionKey||p.distance||'x'),cooldownMs:event===VoiceEvent.APPROACH?5000:8000});}
}
export function formatDistanceVoice(m){m=Number(m)||0;if(m<50)return'前方即將';if(m<100)return'前方約五十公尺';if(m<200)return'前方約一百公尺';if(m<500)return`前方約${Math.round(m/50)*50}公尺`;if(m<1000)return`前方約${Math.round(m/100)*100}公尺`;return`前方約${(m/1000).toFixed(1)}公里`}
export function buildVoiceMessage(event,p={}){if(event===VoiceEvent.START)return`開始導航，前往${p.destination||'目的地'}。`;if(event===VoiceEvent.TURN)return`${formatDistanceVoice(p.distance)}${p.action||'請依指示行駛'}${p.road?`，進入${p.road}`:''}。`;if(event===VoiceEvent.APPROACH)return`${formatDistanceVoice(p.distance)}${p.action||'準備轉彎'}。`;if(event===VoiceEvent.REROUTE)return`已重新規劃路線，${p.reason||'請依新的路線行駛'}。`;if(event===VoiceEvent.OFF_ROUTE)return'目前偏離導航路線，正在重新規劃。';if(event===VoiceEvent.ARRIVED)return`已抵達${p.destination||'目的地'}。`;return p.text||''}
