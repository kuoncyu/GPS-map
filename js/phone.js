import {setState} from './state.js';
export class PhoneEngine{
 constructor(){this.status='IDLE';this.caller=null;}
 setIncoming(caller='未知來電'){this.status='RINGING';this.caller=caller;this.emit();}
 accept(){this.status='IN_CALL';this.emit();}
 reject(){this.status='IDLE';this.caller=null;this.emit();}
 hangup(){this.status='IDLE';this.caller=null;this.emit();}
 emit(){setState({phone:{status:this.status,caller:this.caller,source:'DEMO_LOCAL'}});}
 init(){this.emit();}
}
