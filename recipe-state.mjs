// Recipe mass accounting is independent of presentation and apparatus animation.
export const INGREDIENTS = {
 coffee: {name:'摩卡咖啡液',short:'咖啡液',color:'#4b291b',rate:18},
 water: {name:'水',short:'水',color:'#d5c7ac',rate:26},
 milk: {name:'牛奶',short:'牛奶',color:'#eee1c4',rate:24},
 foam: {name:'奶泡',short:'奶泡',color:'#fff7df',rate:10},
 ice: {name:'冰',short:'冰',color:'#cbdbe0',rate:18},
 syrup: {name:'糖浆',short:'糖浆',color:'#b77d41',rate:6}
};
export const KEYS=Object.keys(INGREDIENTS), CAPACITY=360, SAFE_WATER=130;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
export const round=v=>Math.round(v*10)/10;
export const emptyAmounts=()=>Object.fromEntries(KEYS.map(k=>[k,0]));
export const total=c=>round(KEYS.reduce((n,k)=>n+c.amounts[k],0));
export const activeCup=s=>s.cups.find(c=>c.id===s.selected)||s.cups[0];
export function freshRecipe(order=null){
 const amounts={...emptyAmounts(),coffee:40};
 if(!order||order.milk==='more'||order.milk==='some'){amounts.milk=80;amounts.syrup=order?0:10;}
 if(order?.id==='share')amounts.coffee=80;
 return {version:1,orderId:order?.id||null,ticket:1,view:'recipe',selected:'A',cups:[{id:'A',name:order?.id==='breakfast'?'我的早餐奶咖':order?'我的'+order.title:'我的第一杯',amounts,allocations:{example:amounts.coffee},stirred:false}],batches:[{id:'example',name:'示例摩卡基底',kind:'example',capacity:160,record:null}],batchId:'example',nextBatch:1,history:[],brew:newBrew(),poster:{title:'',style:0,palette:0,layout:'single'},saved:[]};
}
export function newBrew(){return {status:'prepare',water:120,powder:0,grind:1,heat:0,progress:0,mass:0,elapsed:0,residual:0,history:[],resultId:null};}
export const batchUsed=(s,id)=>round(s.cups.reduce((n,c)=>n+(c.allocations[id]||0),0));
export const batchAvailable=(s,id=s.batchId)=>round(Math.max(0,(s.batches.find(b=>b.id===id)?.capacity||0)-batchUsed(s,id)));
export function checkpoint(s){
 s.history.push({cups:structuredClone(s.cups),selected:s.selected,view:s.view,batchId:s.batchId});
 if(s.history.length>30)s.history.shift();
}
export function undo(s){const h=s.history.pop();if(!h)return false;Object.assign(s,structuredClone(h));return true;}
export function setAmount(s,key,value,{remember=true}={}){
 if(!KEYS.includes(key))return {changed:0,message:'原料不存在。'};
 const c=activeCup(s),before=c.amounts[key],availableRoom=CAPACITY-total(c)+before;
 let next=round(clamp(value,0,availableRoom)),message='';
 if(key==='coffee'&&next>before){
  const can=batchAvailable(s);if(next-before>can){next=round(before+can);message='这批基底已用完，可以现做一份。';}
 }
 if(Number(value)>availableRoom)message='杯子到容量了，先减一点其他材料。';
 if(next===before)return {changed:0,message};
 if(remember)checkpoint(s);
 if(key==='coffee'){
  let delta=round(next-before);
  if(delta>0)c.allocations[s.batchId]=round((c.allocations[s.batchId]||0)+delta);
  else for(const id of Object.keys(c.allocations).reverse()){
   const take=Math.min(c.allocations[id],-delta);c.allocations[id]=round(c.allocations[id]-take);delta=round(delta+take);
   if(!c.allocations[id])delete c.allocations[id];if(delta===0)break;
  }
 }
 c.amounts[key]=next;c.stirred=false;
 return {changed:round(next-before),message};
}
export function splitCup(s){
 if(s.cups.length!==1)return '现在已有两杯，分别调整就好。';
 const c=activeCup(s);if(total(c)<2)return '先添加一些材料，再分成两杯。';
 checkpoint(s);
 const a=structuredClone(c),b=structuredClone(c);a.id='A';b.id='B';a.name='A · 我的配方';b.name='B · 我的配方';
 for(const key of KEYS){a.amounts[key]=round(c.amounts[key]/2);b.amounts[key]=round(c.amounts[key]-a.amounts[key]);}
 for(const id of Object.keys(c.allocations)){a.allocations[id]=round(c.allocations[id]/2);b.allocations[id]=round(c.allocations[id]-a.allocations[id]);}
 a.amounts.coffee=round(Object.values(a.allocations).reduce((n,v)=>n+v,0));b.amounts.coffee=round(Object.values(b.allocations).reduce((n,v)=>n+v,0));
 s.cups=[a,b];s.selected='B';s.view='finished';s.poster.layout='double';return '';
}
export function clearCup(s){checkpoint(s);const c=activeCup(s);c.amounts=emptyAmounts();c.allocations={};c.stirred=false;}
// Recombine as an editable recipe. Do not lose ingredients or exceed one vessel.
export function mergeCups(s){
 if(s.cups.length!==2)return '当前只有一杯。';
 if(round(s.cups.reduce((n,c)=>n+total(c),0))>CAPACITY)return '两杯合计超过 360 g，先减少一些材料。';
 checkpoint(s);const c=structuredClone(s.cups[0]);c.id='A';c.name='合杯 · 我的配方';c.stirred=false;
 for(const k of KEYS)c.amounts[k]=round(s.cups.reduce((n,cup)=>n+cup.amounts[k],0));
 c.allocations={};for(const cup of s.cups)for(const [id,n] of Object.entries(cup.allocations))c.allocations[id]=round((c.allocations[id]||0)+n);
 s.cups=[c];s.selected='A';s.view='recipe';s.poster.layout='single';return '';
}
export function stirCup(s){const c=activeCup(s);if(total(c)===0)return false;checkpoint(s);c.stirred=true;s.view='finished';return true;}
export function useBatchInCup(s,id=s.batchId){
 const c=activeCup(s),batch=s.batches.find(b=>b.id===id);
 if(!batch)return {changed:false,message:'这锅基底暂不可用。'};
 const available=round(batchAvailable(s,id)+(c.allocations[id]||0));
 const amount=c.amounts.coffee||Math.min(40,available,CAPACITY-total(c));
 if(amount<=0)return {changed:false,message:'先给杯子留出空间，或再做一锅。'};
 if(amount>available)return {changed:false,message:'这锅还剩 '+available+' g，先调低杯中基底用量再替换。'};
 if(c.amounts.coffee===amount&&Object.keys(c.allocations).length===1&&c.allocations[id]===amount)return {changed:false,message:'当前杯已使用这锅基底。'};
 checkpoint(s);c.amounts.coffee=amount;c.allocations={[id]:amount};c.stirred=false;s.batchId=id;
 return {changed:true,message:'已使用 '+amount+' g '+batch.name+'，其他材料保持原用量。'};
}
export function prepIssue(b){
 if(b.water>SAFE_WATER)return '水面超过安全阀下缘。先调低水位，再开始冲煮。';
 if(b.water<110)return '这把演示壶需要 110–130 g 水；实物以阀的位置和说明书为准。';
 if(b.powder<18)return '先把粉篮装满，铺平，不压实。';return '';
}
export function startBrew(s){const b=s.brew,issue=prepIssue(b);if(issue)return issue;b.status='brewing';b.heat=2;return '';}
export function changeHeat(b,heat){
 if(b.status!=='brewing')return;
 const next=clamp(heat,0,2);
 if(b.heat>0&&next===0)b.residual=.8;
 b.heat=next;b.history.push({progress:round(b.progress*100),heat:next});
}
// Bounded illustrative process. No claimed physical temperature, pressure or taste prediction.
export function brewTick(b,dt,{paused=false}={}){
 if(paused||b.status!=='brewing')return;
 dt=clamp(dt,0,.12);b.elapsed+=dt;
 const energy=b.heat>0?b.heat:b.residual;
 b.progress=clamp(b.progress+dt*energy/35,0,1);
 if(!b.heat)b.residual=Math.max(0,b.residual-dt*.22);
 const q=clamp((b.progress-.22)/.70,0,1);
 const output=(b.water-22)*(q*q*(3-2*q));
 b.mass=Math.max(b.mass,round(output));
 if(b.progress>=1){b.heat=0;b.residual=0;b.status='ready';}
}
export function collectBatch(s){
 const b=s.brew;if(b.resultId)return s.batches.find(x=>x.id===b.resultId);
 if(b.mass<5)return null;
 const id='moka-'+s.nextBatch++,record={water:b.water,powder:b.powder,grind:b.grind,elapsed:round(b.elapsed),stop:round(b.progress*100),history:structuredClone(b.history)};
 const batch={id,name:'自制摩卡 · 第 '+(s.nextBatch-1)+' 锅',kind:'brewed',capacity:round(b.mass),record};
 s.batches.push(batch);s.batchId=id;b.resultId=id;b.status='collected';b.heat=0;b.residual=0;return batch;
}
export function assess(c,order){
 if(!order)return [];
 const a=c.amounts,t=total(c),milk=a.milk+a.foam;
 const checks=[{label:'成杯 '+order.range.join('–')+' g',met:t>=order.range[0]&&t<=order.range[1]}];
 if(order.milk==='none')checks.push({label:'不加牛奶和奶泡',met:milk===0});
 if(order.milk==='more')checks.push({label:'牛奶与奶泡至少占一半',met:t>0&&milk/t>=.5});
 if(order.milk==='some')checks.push({label:'加入牛奶',met:a.milk>0});
 if(order.foam)checks.push({label:'加入奶泡',met:a.foam>0});
 checks.push({label:order.temp==='iced'?'加入冰块':'不加冰',met:order.temp==='iced'?a.ice>0:a.ice===0});
 if(order.original)checks.push({label:'保持原液',met:KEYS.filter(k=>k!=='coffee').every(k=>a[k]===0)});
 if(order.gear&&order.gear!=='moka')checks.push({label:'指定'+(order.gear==='pour'?'手冲':'意式')+'，本页当前为摩卡基底',met:false});
 return checks;
}
export function cupAppearance(c){
 const {coffee,water,milk,syrup}=c.amounts,liquid=coffee+water+milk+syrup;
 // Visual approximation, not calibrated colorimetry. Solid ice does not
 // dilute the liquid until it melts; foam is drawn separately at the surface.
 if(!liquid)return {color:'rgb(243,236,224)',opacity:0};
 if(!coffee&&!milk&&!syrup)return {color:'rgb(166,195,202)',opacity:.3};
 const darkness=1-Math.exp(-8*coffee/Math.max(1,coffee+water+syrup));
 const milkScatter=milk/(milk+coffee*1.05+water*.05+syrup*.3||1);
 const amber=syrup/(liquid||1)*.68;
 const rgb=[0,1,2].map(i=>{
  const black=[220,188,140][i]*(1-darkness)+[36,16,9][i]*darkness;
  // Channel-dependent scattering keeps diluted milk coffee warm and caramel,
  // instead of averaging milk and coffee into an opaque grey.
  const scatter=Math.pow(milkScatter,[.7,1.3,1.8][i]);
  const milkTint=[245,233,217][i]*Math.exp(-[.8,1.7,4.1][i]*coffee/liquid);
  const milky=black*(1-scatter)+milkTint*scatter;
  return Math.round(milky*(1-amber)+[179,111,45][i]*amber);
 });
 return {color:'rgb('+rgb.join(',')+')',opacity:(coffee||milk) ? .97 : .6};
}
export const cupColor=c=>cupAppearance(c).color;
export function compare(s){
 if(s.cups.length!==2)return null;const [a,b]=s.cups;
 const same=KEYS.filter(k=>Math.abs(a.amounts[k]-b.amounts[k])<.05&&a.amounts[k]>0);
 const different=KEYS.filter(k=>Math.abs(a.amounts[k]-b.amounts[k])>=.05);
 const ids=[...new Set([...Object.keys(a.allocations),...Object.keys(b.allocations)])];
 return {same,different,sameBatch:ids.length===1,coffee:round(a.amounts.coffee+b.amounts.coffee),sameTotal:Math.abs(total(a)-total(b))<.05};
}
export function snapshot(s){const x=structuredClone(s);x.history=[];x.brew.heat=0;x.brew.residual=0;return x;}
export function restore(data){
 if(data?.version!==1||!Array.isArray(data.cups)||!Array.isArray(data.batches))return null;
 const s=freshRecipe();s.orderId=typeof data.orderId==='string'?data.orderId:null;s.ticket=clamp(data.ticket,1,999);
 s.batches=data.batches.slice(-25).filter(b=>typeof b?.id==='string'&&b.id.length<50).map(b=>({id:b.id,name:String(b.name||'摩卡基底').slice(0,40),kind:b.kind==='brewed'?'brewed':'example',capacity:round(clamp(b.capacity,0,160)),record:b.record?{water:clamp(b.record.water,0,SAFE_WATER),powder:18,grind:clamp(b.record.grind,0,2),elapsed:clamp(b.record.elapsed,0,900),stop:clamp(b.record.stop,0,100),history:Array.isArray(b.record.history)?b.record.history.slice(-60).filter(x=>Number.isFinite(x?.progress)&&Number.isFinite(x?.heat)).map(x=>({progress:clamp(x.progress,0,100),heat:clamp(x.heat,0,3)})):[],workshopSession:typeof b.record.workshopSession==='string'&&/^[a-zA-Z0-9_-]{1,32}$/.test(b.record.workshopSession)?b.record.workshopSession:null,heat:clamp(b.record.heat,0,3)}:null}));
 if(!s.batches.length)return null;
 const used={};
 s.cups=data.cups.slice(0,2).map((c,index)=>{
  const amounts=emptyAmounts(),allocations={};for(const k of KEYS)amounts[k]=round(clamp(c?.amounts?.[k],0,CAPACITY));
  for(const b of s.batches){const available=Math.max(0,b.capacity-(used[b.id]||0)),n=round(clamp(c?.allocations?.[b.id],0,available));if(n){allocations[b.id]=n;used[b.id]=(used[b.id]||0)+n;}}
  const allocated=Object.values(allocations).reduce((n,x)=>n+x,0);amounts.coffee=round(allocated);
  const sum=KEYS.reduce((n,k)=>n+amounts[k],0);if(sum>CAPACITY){const extra=sum-CAPACITY;let left=extra;for(const k of KEYS.filter(k=>k!=='coffee').reverse()){const take=Math.min(left,amounts[k]);amounts[k]=round(amounts[k]-take);left-=take;}}
  return {id:index?'B':'A',name:String(c?.name||'我的第一杯').slice(0,20),amounts,allocations,stirred:!!c?.stirred};
 });
 if(!s.cups.length)return null;
 s.selected=s.cups.some(c=>c.id===data.selected)?data.selected:'A';s.view=data.view==='finished'?'finished':'recipe';
 if(typeof data.pendingWorkshopSession==='string'&&/^[a-zA-Z0-9_-]{1,32}$/.test(data.pendingWorkshopSession))s.pendingWorkshopSession=data.pendingWorkshopSession;
 s.batchId=s.batches.some(b=>b.id===data.batchId)?data.batchId:s.batches.at(-1).id;s.nextBatch=Math.max(1,Math.floor(clamp(data.nextBatch,1,10000)));
 if(data.brew){const b=data.brew;s.brew={...newBrew(),water:clamp(b.water,0,158),powder:clamp(b.powder,0,18),grind:clamp(b.grind,0,2),progress:clamp(b.progress,0,1),mass:clamp(b.mass,0,130),elapsed:clamp(b.elapsed,0,600),status:b.status==='collecting'?'ready':['prepare','brewing','ready','collected'].includes(b.status)?b.status:'prepare',resultId:s.batches.some(x=>x.id===b.resultId)?b.resultId:null};}
 s.poster={title:String(data.poster?.title||'').slice(0,20),style:clamp(data.poster?.style,0,2),palette:clamp(data.poster?.palette,0,5),layout:s.cups.length===2&&data.poster?.layout==='double'?'double':data.poster?.layout==='recipe'?'recipe':'single'};
 s.saved=Array.isArray(data.saved)?data.saved.slice(-6).filter(x=>x&&typeof x.title==='string'):[];return s;
}
