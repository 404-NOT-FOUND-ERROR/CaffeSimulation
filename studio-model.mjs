import {simulate,outputAt} from './model.mjs';

export const GEARS={
 moka:{name:'摩卡壶',latin:'MOKA',tag:'家庭厨房',verb:'调节炉火，观察出液，决定何时收杯。',defaults:{dose:18,water:130,grind:1,heat:2,speed:1},parts:{lower:['下壶','这里装水，也留有气体空间。加热后下壶压力升高，推动液态水进入细管。'],basket:['漏斗粉篮','水沿细管进入粉篮，穿过咖啡粉。粉篮的容量与器具有关，本版粉量固定。'],gasket:['密封圈','密封接缝，帮助下壶保持压力。'],filter:['上滤网','阻挡较大的咖啡粉颗粒，让咖啡液继续向上。'],upper:['上壶','收集咖啡液。中心导管通向与外界连通的上壶。'],lid:['壶盖','覆盖上壶；它不是下壶的承压密封件。']},story:'家庭厨房里的小仪式',culture:'一把壶、一个炉头，就能为日常留出一个咖啡时刻。摩卡原液也可以加水或加奶，做出自己的饮法。',science:'加热使下壶气体压力升高，压力差推动液态水穿过粉层。摩卡咖啡与意式浓缩有不同的冲煮条件。',source:'https://compphys.univie.ac.at/Moka/',sourceName:'维也纳大学 · 摩卡壶物理'},
 pour:{name:'手冲滤杯',latin:'FILTRO',tag:'慢饮咖啡桌',verb:'按住注水，移动落点；松开，等水流过粉层。',defaults:{dose:15,water:240,grind:1,heat:2,speed:1},parts:{paper:['滤纸','拦截咖啡粉，让咖啡液通过。它也会影响过滤后的饮品特征。'],cone:['锥形滤杯','容纳滤纸与粉层。肋骨在滤纸外侧留出空气通道。'],bed:['咖啡粉层','水在这里接触咖啡粉，溶出可溶成分。注水速度和排水速度共同决定水位。'],server:['分享壶','收集流下来的咖啡液。注入的水有一部分会留在湿咖啡粉中。']},story:'把注水变成自己的节奏',culture:'手冲把过程放在桌面上：看水位、等滴落、决定下一次注水。它适合边做边观察，也适合把一壶分给朋友。',science:'重力驱动水穿过粉层。注入快于排出时，滤杯中的水位会上升；停止注水后，排水仍会继续。',source:'https://www.hario.cc/V60/v60series.html',sourceName:'HARIO · V60 结构与冲煮'},
 espresso:{name:'意式咖啡机',latin:'ESPRESSO',tag:'街角吧台',verb:'布粉、压粉、启动泵，决定这一杯在哪里停止。',defaults:{dose:18,water:72,grind:1,heat:2,speed:1},parts:{group:['冲煮头','将热水分配到粉饼上方。图中只表现与萃取相关的主要结构。'],puck:['粉饼','布粉和压粉帮助形成均匀粉床。水遇到的阻力与研磨、粉量和分布有关。'],basket:['滤篮','支撑粉饼，通过底部小孔排出咖啡液。'],pump:['水泵','提供推动热水穿过粉饼的压力。不要把它与摩卡壶的加热增压混淆。']},story:'吧台上的短暂停留',culture:'小杯意式是许多意大利吧台场景中的日常选择。浓缩也可以成为加水黑咖和奶咖的基底。这里可以试自己的比例。',science:'泵推动水穿过粉饼。研磨与粉饼分布会改变流动；粉量与出杯量的比例，也是记录一杯意式的重要信息。',source:'https://home.lamarzoccousa.com/using-espresso-brew-ratios/',sourceName:'La Marzocco · 冲煮比例'}
};

// Orders describe observable recipe requirements. They do not claim to judge taste.
export const ORDERS=[
 {id:'window',title:'窗边的长杯',brief:'热黑咖，不加奶，想慢慢喝。',range:[180,270],milk:'none',temp:'hot',story:'坐到窗边的人想要一杯能陪伴阅读的黑咖啡。'},
 {id:'breakfast',title:'早餐搭档',brief:'热奶咖，牛奶多一些，约 200 g。',range:[170,260],milk:'more',temp:'hot',story:'早餐桌上，希望咖啡与牛奶一起出场。'},
 {id:'bar',title:'吧台小杯',brief:'意式浓缩，25–50 g，保持原液。',range:[25,50],gear:'espresso',milk:'none',original:true,temp:'hot',story:'吧台上的短暂停留，想要一杯小小的意式浓缩。'},
 {id:'kitchen',title:'厨房来客',brief:'用摩卡壶，70–110 g 原液黑咖。',range:[70,110],gear:'moka',milk:'none',original:true,temp:'hot',story:'朋友到厨房做客，想看看这把摩卡壶的本事。'},
 {id:'ice',title:'清爽冰咖',brief:'冰黑咖，不加奶，180–280 g。',range:[180,280],milk:'none',temp:'iced',story:'给午后的桌面加一点冰，做一杯不加奶的冰黑咖。'},
 {id:'share',title:'双人分享',brief:'手冲黑咖，300–400 g，一壶两人。',range:[300,400],gear:'pour',milk:'none',temp:'hot',story:'两个人坐下聊天，希望共享一壶手冲。'},
 {id:'foam',title:'泡沫早餐',brief:'意式奶咖，加奶泡，180–260 g。',range:[180,260],gear:'espresso',milk:'some',foam:true,temp:'hot',story:'牛奶与奶泡一起加入，让小杯浓缩成为早餐饮品。'},
 {id:'small',title:'自己的小杯',brief:'热黑咖，100–170 g，器具随你。',range:[100,170],milk:'none',temp:'hot',story:'这张来单只要求一小杯黑咖，做法留给你决定。'}
];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
export function newProcess(gear,settings){return {gear,settings:{...settings},status:'idle',elapsed:0,progress:0,mass:0,solutes:0,poured:0,retained:0,bedWater:0,spill:0,pressure:0,flow:0,pours:0,holding:false,levelled:false,tamped:false,zones:[0,0,0,0,0,0],heatIntegral:0,curve:gear==='moka'?simulate(settings):null};}
export function tick(p,settings,dt){
 if(p.status!=='running')return p;
 dt=clamp(dt,0,.1);p.elapsed+=dt;
 if(p.gear==='moka'){
  p.heatIntegral+=settings.heat*dt;
  const advance=dt/18*settings.heat/2;p.progress=Math.min(1,p.progress+advance);
  const out=outputAt(p.curve,p.progress);p.mass=out.mass;p.solutes=out.solutes;p.pressure=out.pressure;p.flow=out.flow/18*settings.heat/2;
  if(p.progress>=1)p.status='done';
 }else if(p.gear==='pour'){
  const fastDt=dt*4;
  if(p.holding){
   const incoming=Math.min([9,15,32][settings.speed]*fastDt,Math.max(0,settings.water-p.poured));p.poured+=incoming;
   const retained=Math.min(incoming,Math.max(0,settings.dose*2-p.retained));p.retained+=retained;
   const available=p.bedWater+incoming-retained;p.spill+=Math.max(0,available-105);p.bedWater=Math.min(105,available);
  }
  const drained=Math.min(p.bedWater,[20,12,6][settings.grind]*fastDt);p.bedWater-=drained;p.mass+=drained;p.flow=fastDt?drained/fastDt:0;
  p.solutes=Math.min(settings.dose*.21*(1-Math.exp(-p.mass/(settings.dose*4))),p.mass*.035);
  p.progress=settings.water?p.poured/settings.water:0;
  if(p.poured>=settings.water-.001&&p.bedWater<.05){p.status='done';p.holding=false;}
 }else{
  const virtualElapsed=p.elapsed*4,rate=[3.6,1.7,.7][settings.grind]*(p.levelled?1:1.15),rise=clamp((virtualElapsed-2)/3,0,1);
  p.flow=rate*rise;p.mass=Math.min(settings.dose*4,p.mass+p.flow*dt*4);p.poured=p.mass;
  p.solutes=Math.min(settings.dose*.22*(1-Math.exp(-p.mass/(settings.dose*1.2))),p.mass*.12);
  p.pressure=rise*(p.tamped?1:.5);p.progress=clamp(p.mass/(settings.dose*4),0,1);
  if(virtualElapsed>=60||p.mass>=settings.dose*4)p.status='done';
 }
 return p;
}
export function makeCup(p,id){return {id,gear:p.gear,baseMass:p.mass,solutes:p.solutes,settings:{...p.settings},record:{elapsed:p.elapsed,pours:p.pours,zones:p.zones.filter(n=>n>0).length,spill:p.spill,levelled:p.levelled,tamped:p.tamped,heat:p.gear==='moka'&&p.elapsed?p.heatIntegral/p.elapsed:p.settings.heat},water:0,milk:0,foam:0,ice:0,vessel:p.gear==='espresso'?'small':'glass',name:''};}
export function cupFacts(c){
 const total=c.baseMass+c.water+c.milk+c.foam+c.ice;
 return {total,coffeeFraction:total>0?c.baseMass/total:0,milkFraction:total>0?(c.milk+c.foam)/total:0,temperature:c.ice>0?'iced':'hot',added:c.water+c.milk+c.foam+c.ice};
}
export function drinkName(c){
 if(c.name)return c.name;
 const cold=c.ice>0?'冰':'';
 if(c.milk+c.foam>0)return cold+(c.foam>0?'奶泡':'')+({moka:'摩卡奶咖',pour:'手冲奶咖',espresso:'意式奶咖'}[c.gear]);
 if(c.water>0)return cold+({moka:'加水摩卡',pour:'加水手冲',espresso:'美式咖啡'}[c.gear]);
 return cold+({moka:'摩卡原液',pour:'手冲黑咖',espresso:'意式浓缩'}[c.gear]);
}
export function checkOrder(c,order){
 if(!order)return {checks:[],met:true};
 const f=cupFacts(c),checks=[];
 if(order.gear)checks.push({label:`使用${GEARS[order.gear].name}`,met:c.gear===order.gear});
 checks.push({label:`成杯 ${order.range[0]}–${order.range[1]} g`,met:f.total>=order.range[0]&&f.total<=order.range[1]});
 if(order.milk==='none')checks.push({label:'不加牛奶和奶泡',met:c.milk+c.foam===0});
 if(order.milk==='more')checks.push({label:'牛奶与奶泡至少占一半',met:f.milkFraction>=.5});
 if(order.milk==='some')checks.push({label:'加入牛奶',met:c.milk>0});
 if(order.original)checks.push({label:'保持原液，不加水',met:c.water===0});
 if(order.foam)checks.push({label:'加入奶泡',met:c.foam>0});
 checks.push({label:order.temp==='iced'?'加入冰块':'热饮，不加冰',met:order.temp==='iced'?c.ice>0:c.ice===0});
 return {checks,met:checks.every(x=>x.met)};
}
export function makeReport(c,order){
 const f=cupFacts(c),check=checkOrder(c,order),gear=GEARS[c.gear],name=drinkName(c);
 let title=order?(check.met?'这张来单，你完成了。':'这一杯，还有新可能。'):(c.milk>0?'让牛奶加入这一杯。':c.water>0?'一杯咖啡，多一点水。':'今天，按自己的方式。');
 const intro=order?`本期收到「${order.title}」来单。你用${gear.name}制作了${name}，成杯 ${f.total.toFixed(0)} g。${check.met?'配方符合这张来单的要求。':'还有这些要求可以继续尝试：'+check.checks.filter(x=>!x.met).map(x=>x.label).join('、')+'。'}`:`你选择${gear.name}，以 ${c.baseMass.toFixed(0)} g 咖啡基底完成了${name}。这杯由你决定，成杯 ${f.total.toFixed(0)} g。`;
 const observations=[];
 if(c.gear==='pour')observations.push(`这次注水分成 ${c.record.pours} 次，触及粉层 ${c.record.zones} / 6 个示意区域。${c.record.spill>1?'出现了水位过高的溢出，可以试试放慢注水。':'注水结束后，粉层中的水继续流向分享壶。'}`);
 if(c.gear==='espresso')observations.push(`使用 ${c.settings.dose} g 咖啡粉，出液 ${c.baseMass.toFixed(0)} g，粉量与出杯量约为 1 : ${(c.baseMass/c.settings.dose).toFixed(1)}。${c.record.levelled?'你做了布粉。':'下一杯可以试着先布粉，比较水路示意。'}`);
 if(c.gear==='moka')observations.push(`你用${['较粗','中等','较细'][c.settings.grind]}研磨，收集了 ${c.baseMass.toFixed(0)} g 摩卡咖啡。加热推动液态水穿过粉层，进入上壶。`);
 if(c.preparation)observations.push(c.preparation.method==='assisted'?'你选择水位、研磨和火候，器具演示装粉、合壶与出杯。':c.preparation.method==='quick'?'这次按当前配方使用了快速准备。下一杯也可以亲手完成器具准备。':c.preparation.method==='mixed'?`你亲手完成了 ${c.preparation.steps} 项准备，其余步骤使用了快速准备。`:`你亲手完成了 ${c.preparation.steps} 项器具准备，再进入冲煮。`);
 if(c.water>0)observations.push(`出杯后加入 ${c.water} g 水，增加杯量并稀释咖啡，过程没有再次接触咖啡粉。`);
 if(c.milk+c.foam>0)observations.push(`加入 ${c.milk} g 牛奶${c.foam>0?'与 '+c.foam+' g 奶泡':''}；咖啡基底占成杯总质量的 ${(f.coffeeFraction*100).toFixed(0)}%。这个比例描述配方，不等于味觉评分。`);
 if(c.ice>0)observations.push(`加入 ${c.ice} g 冰块。这里的成杯总量包含冰块质量。`);
 return {title,intro,observations,insight:gear.science,name,check,recipe:recipeText(c),source:gear.source,sourceName:gear.sourceName};
}
export function recipeText(c){return `${GEARS[c.gear].name} · 粉 ${c.settings.dose} g · 基底 ${c.baseMass.toFixed(1)} g`+[['water','水'],['milk','牛奶'],['foam','奶泡'],['ice','冰']].filter(([k])=>c[k]>0).map(([k,n])=>` · ${n} ${c[k]} g`).join('');}
export function sanitizeCup(value){
 if(!value||!GEARS[value.gear])throw new Error('Unknown apparatus');
 const s=value.settings||{},c={id:1,gear:value.gear,baseMass:clamp(value.baseMass,0,500),solutes:clamp(value.solutes,0,8),settings:{dose:clamp(s.dose,10,22),water:clamp(s.water,30,420),grind:clamp(Math.round(s.grind),0,2),heat:clamp(s.heat,1,3),speed:clamp(Math.round(s.speed),0,2)},record:{elapsed:clamp(value.record?.elapsed,0,300),pours:clamp(value.record?.pours,0,200),zones:clamp(value.record?.zones,0,6),spill:clamp(value.record?.spill,0,500),levelled:!!value.record?.levelled,tamped:!!value.record?.tamped,heat:clamp(value.record?.heat,1,3)},water:clamp(value.water,0,400),milk:clamp(value.milk,0,400),foam:clamp(value.foam,0,30),ice:clamp(value.ice,0,150),vessel:['glass','ceramic','small'].includes(value.vessel)?value.vessel:'glass',name:String(value.name||'').slice(0,20)};
 if(value.preparation)c.preparation={method:['quick','mixed','assisted'].includes(value.preparation.method)?value.preparation.method:'manual',steps:clamp(value.preparation.steps,0,3)};
 if(c.baseMass<1)throw new Error('Empty cup');return c;
}
