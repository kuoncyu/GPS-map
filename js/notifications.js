import {setState} from './state.js';
const rank={CRITICAL:100,HIGH:80,NAVIGATION:70,MEDIUM:50,LOW:20,INFO:10};
export class NotificationCenter{
 constructor(){this.items=[];}
 push({title,message,priority='INFO',kind='SYSTEM',speak=false}={}){const item={id:`n-${Date.now()}-${Math.random().toString(16).slice(2)}`,title,message,priority,kind,speak,createdAt:new Date().toISOString()};this.items.unshift(item);this.items=this.items.slice(0,30);this.sync();return item;}
 dismiss(id){this.items=this.items.filter(x=>x.id!==id);this.sync();}
 clear(){this.items=[];this.sync();}
 sync(){this.items.sort((a,b)=>(rank[b.priority]||0)-(rank[a.priority]||0)||b.createdAt.localeCompare(a.createdAt));setState({notifications:this.items});}
 init(){this.sync();}
}
export {rank};
