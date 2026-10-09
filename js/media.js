import {getState,setState} from './state.js';
export class MediaEngine{
 constructor(){this.audio=null;this.playing=false;this.volume=0.7;this.queue=[];this.track={title:'Demo Drive Mix',artist:'AI-GPS Demo',duration:215,position:0};}
 init(){this.render();}
 play(){this.playing=true;this.emit();}
 pause(){this.playing=false;this.emit();}
 toggle(){this.playing?this.pause():this.play();}
 next(){this.track={...this.track,title:this.track.title==='Demo Drive Mix'?'Night Highway':'Demo Drive Mix',position:0};this.emit();}
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));this.emit();}
 emit(){setState({media:{playing:this.playing,volume:this.volume,track:this.track,source:'DEMO_LOCAL'}});}
 render(){this.emit();}
}
