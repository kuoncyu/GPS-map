import {setState} from './state.js';
export class WeatherEngine{
 constructor({dataUrl='./data/weather.json'}={}){this.dataUrl=dataUrl;this.data=null;}
 async init(){this.data=await fetch(this.dataUrl).then(r=>r.json());setState({weather:this.data});return this.data;}
 risk(){const w=this.data;if(!w)return null;return w.driverRisk||null;}
}
