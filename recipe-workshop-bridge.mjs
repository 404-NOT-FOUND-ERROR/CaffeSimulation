import {freshRecipe,restore,emptyAmounts,newBrew,round,clamp} from './recipe-state.mjs';
import {RECIPE_ORDERS} from './recipe-orders.mjs';

export const RECIPE_STORE='coffee-recipe-lab-v1';
export const validSession=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,32}$/.test(id);
export const workshopStore=id=>'coffee-moka-session-'+id;

// A collected batch is the handoff: no example coffee, default milk, or second
// simulated brew is inserted between the apparatus and the recipe editor.
export function recipeFromWorkshop(w,{session,orderId=null,ticket=1,previous=null,preserve=false}={}){
 if(!validSession(session))throw new Error('这锅的记录编号无效。');
 const amount=round(Math.min(w.poured,w.brewed));
 if(!w.started||w.heat>0||w.onStove||!(amount>=1))throw new Error('先关火、移壶，把咖啡液收集好，再去加料。');
 const prior=restore(previous),id='workshop-'+session;
 // Reloads and browser Back must not create a second copy of this coffee.
 if(prior?.batches.some(b=>b.id===id))return prior;
 const keeping=preserve&&prior?.orderId===orderId;
 const s=keeping?prior:freshRecipe();s.orderId=orderId;s.ticket=clamp(ticket,1,999);
 if(!keeping){s.batches=[];s.cups[0].amounts=emptyAmounts();s.cups[0].allocations={};s.history=[];s.saved=prior?.saved||[];}
 const number=s.nextBatch++,record={water:w.water,powder:w.powder,grind:w.grind,elapsed:round(w.elapsed),stop:round((w.stopProgress??w.progress)*100),history:w.history.map(x=>({progress:round(x.progress*100),heat:x.heat})),workshopSession:session,heat:round(w.elapsed?(w.heatIntegral||0)/w.elapsed:0)};
 s.batches.push({id,name:'自制摩卡 · 第 '+number+' 锅',kind:'brewed',capacity:amount,record});s.batchId=id;
 if(!keeping){s.cups[0].amounts.coffee=amount;s.cups[0].allocations={[id]:amount};const order=RECIPE_ORDERS.find(o=>o.id===orderId);s.cups[0].name=orderId==='breakfast'?'我的早餐奶咖':order?'我的'+order.title:'我的第一杯';s.view='recipe';}
 s.brew={...newBrew(),water:w.water,powder:w.powder,grind:w.grind,mass:amount,elapsed:round(w.elapsed),progress:w.progress,status:'collected',resultId:id};
 delete s.pendingWorkshopSession;
 return s;
}
