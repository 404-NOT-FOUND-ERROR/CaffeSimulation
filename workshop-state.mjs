import {simulate,outputAt} from './model.mjs';
import {makeReport,checkOrder,cupFacts} from './studio-model.mjs';

// One teaching-sized vessel. Masses are illustrative; physical use follows the actual valve and basket.
export const SPEC={waterMin:110,waterMax:130,tankMax:158,powder:18,cupMax:350};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
export function freshWorkshop(){return {version:2,open:0,lidOpen:0,basketIn:false,water:0,powder:0,crumbs:0,grind:1,heat:0,heatIntegral:0,peakHeat:0,stopProgress:null,lastFlow:0,residual:0,temperature:0,onStove:false,started:false,progress:0,elapsed:0,brewed:0,brewSolutes:0,poured:0,pouredSolutes:0,stirred:false,cup:{water:0,milk:0,ice:0,vessel:'glass'},events:[],history:[],batch:1};}
const remember=(s,event)=>{if(!s.events.includes(event))s.events.push(event);};
export const isHot=s=>s.temperature>.25;
export const totalCup=s=>s.poured+s.cup.water+s.cup.milk+s.cup.ice;
export const coffeeLeft=s=>Math.max(0,s.brewed-s.poured);
export function preparationIssue(s){
 if(s.water<SPEC.waterMin)return '水还不够。取出粉篮，继续加水到安全阀下缘附近。';
 if(s.water>SPEC.waterMax+.01)return '水位超过安全阀下缘。先倒出一点，再合壶。';
 if(!s.basketIn)return '先把粉篮对准下壶口，放进去。';
 if(s.powder<SPEC.powder-.3)return '粉篮还没装满。装到篮口，轻轻铺平，不压实。';
 if(s.crumbs>.05)return '壶缘有残粉。先用刷子扫净，接缝才能正常贴合。';
 return '';
}
export function turnShell(s,delta){
 if(isHot(s))return '壶身仍热，先关火并充分冷却，再旋开。';
 if(s.started)return '这一锅已使用过。保留成杯，再换一把冷壶和新原料。';
 if(s.basketIn&&s.open>.85&&delta<0){const issue=preparationIssue(s);if(issue)return issue;}
 else if(s.open>.85&&delta<0){const issue=preparationIssue(s);if(issue)return issue;}
 s.open=clamp(s.open+delta,0,1);if(s.open===1)remember(s,'opened');if(s.open===0&&s.water>0)remember(s,'assembled');return '';
}
export function waterFlow(s,rate,dt){
 if(s.open<.95||s.basketIn||s.started)return '取出粉篮，再给打开的下壶加水。';
 const previous=s.water;s.water=clamp(s.water+rate*dt,0,SPEC.tankMax);
 if(s.water>SPEC.waterMax){remember(s,'overwater');return '水位到了安全阀。扶正水壶，倒出超出的部分。';}
 if(previous>SPEC.waterMax&&s.water<=SPEC.waterMax)remember(s,'water-corrected');
 if(s.water>=SPEC.waterMin)remember(s,'water-filled');return '';
}
export function setBasket(s,inside){
 if(s.open<.95||s.started)return '先旋开冷壶，露出下壶口。';
 if(inside&&s.water>SPEC.waterMax+.01)return '先把超出的水倒掉，再放粉篮。';
 s.basketIn=inside;remember(s,inside?'basket-placed':'basket-removed');return '';
}
export function powderFlow(s,rate,dt){
 if(s.open<.95||s.started)return '先旋开壶，再装咖啡粉。';
 const incoming=rate*dt;s.powder=clamp(s.powder+incoming,0,SPEC.powder);
 if(s.powder>=SPEC.powder){remember(s,'powder-filled');s.crumbs=clamp(s.crumbs+incoming*.12,0,1);}
 return '';
}
export function brushRim(s,distance){
 if(s.open<.95||s.started)return '先旋开冷壶，再清理壶缘。';
 const before=s.crumbs;s.crumbs=Math.max(0,s.crumbs-Math.abs(distance)*.013);
 if(before>0&&s.crumbs===0)remember(s,'rim-cleaned');return '';
}
export function placePot(s,onStove){
 if(onStove){if(s.open>.01)return '先对准并旋合上下壶，再移到炉头。';const issue=preparationIssue(s);if(issue)return issue;}
 if(!onStove&&s.heat>0)return '先把炉火旋到关闭，再用手柄移壶。';
 s.onStove=onStove;remember(s,onStove?'pot-on-stove':'pot-on-pad');return '';
}
export function setHeat(s,heat){
 heat=clamp(heat,0,3);
 if(heat>0){if(s.progress>=1||s.poured>0){if(heat<s.heat){s.heat=heat;return '出液已经结束，继续把旋钮向左拖至关火。';}return '这锅已结束或已经出杯，不再重复加热；保留这杯后准备新一锅。';}if(!s.onStove)return '先用手柄把合好的壶移到炉头。';if(s.open>.01)return '上下壶还没有旋合。';const issue=preparationIssue(s);if(issue)return issue;s.started=true;remember(s,'heat-started');}
 if(s.heat>0&&heat===0){remember(s,'heat-stopped');s.stopProgress=s.progress;s.residual=s.temperature*.7;}
 if(s.started&&Math.abs(heat-s.heat)>.15){s.history.push({progress:s.progress,heat});s.history=s.history.slice(-60);}
 s.peakHeat=Math.max(s.peakHeat||0,heat);s.heat=heat;return heat>2.5?'火焰别越过壶底，也别烧到手柄；往回调一点。':'';
}
export function tickWorkshop(s,dt,{paused=false}={}){
 if(paused)return;dt=clamp(dt,0,.1);
 const previous=s.brewed;s.lastFlow=0;
 if(s.heat>0&&s.onStove){
  s.temperature=clamp(s.temperature+s.heat*dt*.16,0,1);
  s.elapsed+=dt;s.heatIntegral=(s.heatIntegral||0)+s.heat*dt;s.progress=clamp(s.progress+dt*s.heat/48,0,1);
 }else{
  s.temperature=Math.max(0,s.temperature-dt*.008);
  // A bounded educational carry-over, not a calibrated pressure/temperature solver.
  // Moving off the burner cuts retained input faster; poured cups cannot re-brew.
  if(s.started&&s.poured===0&&s.progress<1&&s.residual>0){s.progress=clamp(s.progress+dt*s.residual/48,0,1);s.residual=Math.max(0,s.residual-dt*(s.onStove?.18:.45));}
 }
 if(s.started&&s.progress>0){const out=outputAt(simulate({water:s.water,grind:s.grind,heat:2}),s.progress);s.brewed=Math.max(s.brewed,out.mass);s.brewSolutes=Math.max(s.brewSolutes,out.solutes);}
 s.lastFlow=dt?(s.brewed-previous)/dt:0;
 if(s.brewed>.5)remember(s,'coffee-flowed');if(s.progress>=1)remember(s,'brew-ended');
}
export function pourCoffee(s,rate,dt){
 if(s.heat>0||s.onStove)return '先关火，用手柄把壶移到隔热垫，再倒咖啡。';
 if(coffeeLeft(s)<.1)return s.poured>0?'壶中的咖啡已倒完。可以调这杯，或保留它再做一锅。':'壶中还没有咖啡。用手柄移回炉头，继续观察出液。';
 const amount=Math.min(Math.max(0,rate*dt),coffeeLeft(s),Math.max(0,SPEC.cupMax-totalCup(s)));
 if(amount>0){const fraction=s.brewed>0?s.brewSolutes/s.brewed:0;s.poured+=amount;s.pouredSolutes+=amount*fraction;remember(s,'coffee-poured');}return '';
}
export function addToCup(s,type,rate,dt){
 if(!['water','milk','ice'].includes(type))return '当前材料不可用。';
 if(s.poured<1)return '先用手柄拿起摩卡壶，把咖啡倒进杯子。';
 const amount=Math.min(Math.max(0,rate*dt),Math.max(0,SPEC.cupMax-totalCup(s)));
 if(amount>0){s.cup[type]+=amount;remember(s,type+'-added');}return totalCup(s)>=SPEC.cupMax?'杯子满了，扶正工具。':'';
}
export function cupSnapshot(s,id=1){
 const average=s.elapsed?(s.heatIntegral||0)/s.elapsed:0;
 const cup={id,gear:'moka',baseMass:s.poured,solutes:s.pouredSolutes,settings:{dose:s.powder,water:s.water,grind:s.grind,heat:average,speed:1},record:{elapsed:s.elapsed,pours:0,zones:0,spill:0,levelled:false,tamped:false,heat:average},preparation:{method:'assisted',steps:3},water:s.cup.water,milk:s.cup.milk,ice:s.cup.ice,foam:0,vessel:s.cup.vessel,name:String(s.cupName||'').slice(0,20),workshop:{events:[...s.events],batch:s.batch,remaining:coffeeLeft(s),progress:s.progress,stopProgress:s.stopProgress,peakHeat:s.peakHeat||0,stirred:s.stirred,history:s.history.map(x=>({...x}))}};
 for(const k of ['baseMass','water','milk','ice','solutes'])cup[k]=Math.round(cup[k]*100)/100;return cup;
}
export function workshopReport(cup,order){
 const r=makeReport(cup,order),events=cup.workshop?.events||[];
 if(events.includes('water-corrected'))r.observations.unshift(events.includes('assisted-assembly')?'你将水位调回安全阀下缘以下，再开始冲煮。':'你倒出了超出安全阀位置的水，再放回粉篮。');
 if(events.includes('rim-cleaned'))r.observations.unshift(events.includes('assisted-assembly')?'合壶前，壶缘残粉已清理，密封圈正常贴合。':'你在合壶前扫净了壶缘残粉。');
 if(events.includes('hot-touch'))r.observations.unshift('壶身受热时，你改用手柄操作。');
 const stop=cup.workshop?.stopProgress;
 if(Number.isFinite(stop))r.observations.unshift(stop>=.999?'演示在出液结束时自动关火保护，你随后移壶出杯。':stop<.88?'你在出液结束前收杯，保留了较少的原液；下一锅可只改变收杯时机，比较份量。':'你在出液回落时收杯，关火后仍有短暂余热出液。');
 if(cup.workshop?.stirred)r.observations.push('出液结束后，演示先搅匀上壶咖啡，再握手柄倾倒。');
 if((cup.workshop?.history||[]).length>2)r.observations.push('你调整过火力。这里比较的是演示时间与出液趋势，不给真实风味打分。');
 return r;
}
export function restoreWorkshop(data){
 const s=freshWorkshop();if(data?.version!==2)return s;
 for(const [key,max] of Object.entries({open:1,lidOpen:1,water:SPEC.tankMax,powder:SPEC.powder,crumbs:1,grind:2,temperature:1,progress:1,elapsed:900,heatIntegral:2700,peakHeat:3,brewed:150,brewSolutes:8,poured:150,pouredSolutes:8,batch:10000}))s[key]=clamp(data[key],0,max);
 for(const k of ['basketIn','onStove','started','stirred'])s[k]=!!data[k];
 s.poured=Math.min(s.poured,s.brewed);s.pouredSolutes=Math.min(s.pouredSolutes,s.brewSolutes);
 for(const k of ['water','milk','ice'])s.cup[k]=clamp(data.cup?.[k],0,SPEC.cupMax);
 const additives=s.cup.water+s.cup.milk+s.cup.ice,available=SPEC.cupMax-s.poured;
 if(additives>available)for(const k of ['water','milk','ice'])s.cup[k]*=available/additives;
 s.events=Array.isArray(data.events)?data.events.filter(x=>typeof x==='string').slice(0,40):[];
 s.stopProgress=Number.isFinite(data.stopProgress)?clamp(data.stopProgress,0,1):null;
 if(Number.isSafeInteger(data.cupId)&&data.cupId>0)s.cupId=data.cupId;
 s.cupName=String(data.cupName||'').slice(0,20);
 s.history=Array.isArray(data.history)?data.history.slice(-60).filter(x=>Number.isFinite(x?.progress)&&Number.isFinite(x?.heat)).map(x=>({progress:clamp(x.progress,0,1),heat:clamp(x.heat,0,3)})):[];
 // Never restore a live flame or a held gesture after reload.
 s.heat=0;return s;
}
export {checkOrder,cupFacts};
