import {freshWorkshop,restoreWorkshop,setBasket,brushRim,turnShell,placePot,setHeat,tickWorkshop,pourCoffee,preparationIssue} from './workshop-state.mjs';
import {measureWater,measurePowder} from './workshop-controls.mjs';
import {RECIPE_STORE,validSession,workshopStore,recipeFromWorkshop} from './recipe-workshop-bridge.mjs';
import {setAmount,snapshot} from './recipe-state.mjs';
import {RECIPE_ORDERS} from './recipe-orders.mjs';
import {referencePreparationSVG as preparationSVG,referenceBrewSVG as brewSectionSVG,updateReferenceBrew as updateBrewSection} from './reference-object-art.mjs';
import {createHybridMoka} from './hybrid-moka-viewer.mjs';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const session=validSession(params.get('session'))?params.get('session'):crypto.randomUUID().replaceAll('-','');
const route=new URL(location.href);route.searchParams.set('session',session);route.searchParams.delete('new');history.replaceState({},'',route);
const orderId=params.get('order'),order=RECIPE_ORDERS.find(o=>o.id===orderId),ticket=Math.max(1,Number(params.get('ticket'))||1),refill=params.get('intent')==='refill';
let w=freshWorkshop(),loaded=false;
try{const raw=JSON.parse(localStorage.getItem(workshopStore(session)));if(raw&&params.get('new')!=='1'){w=restoreWorkshop(raw);loaded=true;}}catch{}
if(!loaded){w.open=1;measureWater(w,120);}
let page=w.started?'brew':'prepare',prep='water',selected='lower',busy=false,hold=false,last=0,paint=0,savedAt=0,toastTimer,viewer;
const parts={lower:['下壶','水位留在安全阀下方。'],basket:['粉篮','装满、铺平，不压实。'],gasket:['密封圈','密封上下壶接缝，热壶勿拆。'],filter:['滤网','挡住咖啡粉，让咖啡液通过。'],upper:['上壶','收集沿中央管上来的咖啡液。'],lid:['壶盖','盖住上壶，注意高温蒸汽。']};
const save=()=>{try{localStorage.setItem(workshopStore(session),JSON.stringify(w));}catch{}};
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');$('liveStatus').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function recipeUrl(){const url=new URL('moka.html',location.href);if(orderId)url.searchParams.set('order',orderId);url.searchParams.set('ticket',ticket);return url;}
$('backLink').href=refill?recipeUrl().href:'studio.html';$('backLink').textContent=refill?'← 回到这杯':'← 咖啡小馆';
$('ticket').innerHTML='<span class="ticket-cup" aria-hidden="true"><svg viewBox="0 0 60 65"><path d="M15 11q-6-8 0-11m13 11q-6-8 0-11m13 11q-6-8 0-11" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 23h36l-5 23q-13 17-25 0Z" fill="currentColor"/><path d="M44 27q19-3 11 12q-3 5-13 5" fill="none" stroke="currentColor" stroke-width="4"/><path d="M8 59h36" stroke="currentColor" stroke-width="2"/></svg></span><small>'+(order?'来单 '+String(ticket).padStart(2,'0'):'自由发挥')+'</small><h2>'+(order?.id==='breakfast'?'早餐奶咖':order?.title||'今天，随你。')+'</h2><p>'+(order?.id==='breakfast'?'热饮 · 约200 g':order?.brief||'按自己的想法调一杯。')+'</p>';
$('partRail').innerHTML=Object.entries(parts).map(([id,[name]])=>'<button data-part="'+id+'" aria-pressed="'+(id===selected)+'">'+name+'</button>').join('');
$('partLabels').innerHTML=Object.entries(parts).map(([id,[name]])=>'<button data-part="'+id+'" aria-label="了解'+name+'" aria-pressed="'+(id===selected)+'">'+name+'</button>').join('');
function selectPart(id){if(!parts[id])return;selected=id;viewer?.select(id);for(const b of document.querySelectorAll('[data-part]'))b.setAttribute('aria-pressed',String(b.dataset.part===id));$('partNote').innerHTML='<h3>'+parts[id][0]+'</h3><p>'+(page==='prepare'&&id==='lower'?'下壶存水，粉篮放咖啡粉。':parts[id][1])+'</p><small>点部件，看看它的作用。</small>';for(const b of $('partLabels').children)b.style.display=page==='prepare'&&!['lower','basket',selected].includes(b.dataset.part)?'none':'';}
selectPart(selected);
try{viewer=createHybridMoka($('modelCanvas'),{onPart:selectPart,onAnchors:anchors=>{let previous=-Infinity;for(const [part,a] of Object.entries(anchors).sort((a,b)=>a[1].y-b[1].y)){const label=$('partLabels').querySelector('[data-part="'+part+'"]');if(label){label.hidden=!a.visible;const top=Math.max(a.y,previous+25);label.style.left=a.x+'px';label.style.top=top+'px';previous=top;}}}});viewer.ready.then(()=>{$('modelStatus').hidden=true;selectPart(selected);}).catch(()=>{$('modelStatus').textContent='三维加载暂不可用，下面仍可了解各个部件。';});}catch{$('modelStatus').textContent='此浏览器未开启三维加速，下面仍可查看部件说明。';}
function render(){
 $('diagram').dataset.kind='';
 $('workbench').dataset.page=page;$('chapter').textContent=page==='prepare'?'01 / PREPARAZIONE':'02 / ESTRAZIONE';
 $('title').innerHTML=page==='prepare'?'先准备好水和粉。':'一边冲煮，一边认识。';
 $('subtitle').textContent=page==='prepare'?'好的咖啡，从恰当的比例开始。':'观察水流与结构，了解一杯好咖啡的诞生。';
 $('structureSafe').hidden=page!=='brew';selectPart(selected);
 $('prepTabs').hidden=page!=='prepare';for(const b of $('prepTabs').children)b.setAttribute('aria-pressed',String(b.dataset.prep===prep));
 $('sectionCaption').textContent=page==='prepare'?(prep==='water'?'下壶 · 教学剖面':'粉篮 · 装粉示意'):'组装好的壶 · 教学剖面';
 if(page==='prepare'){
  $('operationControls').innerHTML=prep==='water'?'<div class="water-control"><label for="waterInput">下壶用水</label><output id="waterOutput">'+Math.round(w.water)+' g</output><input id="waterInput" type="range" min="80" max="160" step="1" value="'+w.water+'"><div class="water-advice"><b>推荐水位</b>水位留在安全阀下方。</div></div>':'<div class="powder-controls"><span class="dose" id="dose">'+w.powder.toFixed(1)+' g</span><button class="scoop" id="scoop" aria-pressed="false">按住装粉</button><button id="fillPowder">装满、铺平</button></div><div class="grind-row"><span>研磨</span>'+['较粗','中等','较细'].map((n,i)=>'<button data-grind="'+i+'" aria-pressed="'+(w.grind===i)+'">'+n+'</button>').join('')+'</div>';
 }else{
  $('operationControls').innerHTML='<div class="brew-progress" role="progressbar" aria-label="演示冲煮进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(w.progress*100)+'"><i id="brewProgress" style="width:'+w.progress*100+'%"></i></div><div class="brew-phases"><span>受热</span><span class="phase"><span id="brewPhase">连续出液</span> · <output id="brewMass">'+w.brewed.toFixed(1)+' g</output></span><span>后段</span></div><div class="fire-controls"><span>火力</span>'+[[1,'微火'],[2,'小火'],[0,'关火']].map(([v,n])=>'<button data-heat="'+v+'" aria-pressed="'+(w.heat===v)+'" '+(w.progress>=1||w.poured>0?'disabled':'')+'>'+n+'</button>').join('')+'</div>';
 }
 paintOperation();
}
function paintOperation(){
 const view={water:w.water,mass:w.brewed,heat:w.heat,progress:w.progress,flow:w.lastFlow,temperature:w.temperature};
 if(page==='brew'&&$('diagram').dataset.kind==='brew')updateBrewSection($('diagram').firstElementChild,view);
 else {$('diagram').innerHTML=page==='prepare'?preparationSVG(prep,w):brewSectionSVG(view);$('diagram').dataset.kind=page;}
 const note=page==='prepare'?(prep==='water'?(w.water>130?'水面过高，先调到安全阀下方。':w.water<110?'再加一点水；克数对应这把示意壶。':''):'按住装粉，松手停止。'):(w.progress>=1?'演示已关火 · 实物需自行关火':'已收集 '+w.brewed.toFixed(1)+' g · 教学时间加速');
 $('operationNote').textContent=note;$('operationNote').classList.toggle('warning',page==='prepare'&&(w.water<110||w.water>130));
 const dose=$('dose');if(dose)dose.textContent=w.powder.toFixed(1)+' g';const waterOutput=$('waterOutput');if(waterOutput)waterOutput.textContent=Math.round(w.water)+' g';
 if(page==='brew'){const mass=$('brewMass');if(mass)mass.textContent=w.brewed.toFixed(1)+' g';$('brewPhase').textContent=w.progress>=1?'出液结束':w.heat===0?'关火观察':w.brewed>0?'连续出液':'正在受热';const bar=$('brewProgress');if(bar){bar.style.width=w.progress*100+'%';bar.parentElement.setAttribute('aria-valuenow',Math.round(w.progress*100));}}
 $('primary').disabled=busy||(page==='prepare'?(w.water<110||w.water>130||prep==='powder'&&w.powder<17.7):w.brewed<5);
 $('primary').textContent=busy?(page==='prepare'?'正在合壶…':'正在收取…'):page==='prepare'?(prep==='water'?'准备粉篮 →':'合壶，开始冲煮 →'):(w.poured>0?'回到这杯 →':'关火收取，去调配 →');
 $('progressNote').textContent=page==='prepare'?'放篮、清理壶缘与合壶由演示完成。你来决定水位与研磨。':w.poured>0?'这锅记录已保留，不会重复生成咖啡。':'演示时间已加速 · 右侧是冷态结构模型，查看部件不会暂停制作。';
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms));
async function begin(){
 if(busy)return;if(prep==='water'){prep='powder';selectPart('basket');render();return;}
 const basketIssue=setBasket(w,true);if(basketIssue){toast(basketIssue);return;}brushRim(w,1000);const issue=preparationIssue(w);if(issue){toast(issue);return;}
 busy=true;hold=false;$('workbench').classList.add('assembling');$('expand').disabled=true;viewer?.expand(0);paintOperation();
 await wait(850);const closeIssue=turnShell(w,-1)||placePot(w,true);if(closeIssue){busy=false;$('expand').disabled=false;$('workbench').classList.remove('assembling');toast(closeIssue);render();return;}
 w.events.push('assisted-assembly');setHeat(w,2);page='brew';busy=false;$('expand').disabled=false;viewer?.expand(.7);$('expand').value='.7';$('expandValue').textContent='70%';$('workbench').classList.remove('assembling');selectPart('basket');render();save();
}
async function collect(){
 if(busy||w.brewed<5)return;busy=true;hold=false;setHeat(w,0);placePot(w,false);w.residual=0;w.stirred=true;pourCoffee(w,1000,1);save();paintOperation();
 let previous=null;try{previous=JSON.parse(localStorage.getItem(RECIPE_STORE));}catch{}
 const already=previous?.batches?.some(b=>b.id==='workshop-'+session);
 try{const recipe=recipeFromWorkshop(w,{session,orderId,ticket,previous,preserve:refill});if(!already&&!refill&&!order?.original){setAmount(recipe,'coffee',Math.min(order?.id==='share'?80:40,w.poured),{remember:false});recipe.history=[];}
  localStorage.setItem(RECIPE_STORE,JSON.stringify(snapshot(recipe)));$('workbench').classList.add('collecting');await wait(650);const url=recipeUrl();url.searchParams.set('collected','1');location.assign(url.href);
 }catch(error){busy=false;$('workbench').classList.remove('collecting');toast(error.message);render();}
}
$('primary').addEventListener('click',()=>page==='prepare'?begin():collect());
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||busy)return;if(b.dataset.prep){hold=false;prep=b.dataset.prep;render();}if(b.dataset.part)selectPart(b.dataset.part);if(b.dataset.grind!==undefined){w.grind=Number(b.dataset.grind);render();save();}if(b.dataset.heat!==undefined){const warning=setHeat(w,Number(b.dataset.heat));if(warning)toast(warning);render();save();}if(b.id==='fillPowder'){measurePowder(w,18);brushRim(w,1000);render();save();toast('已装满、铺平；合壶前会清理残粉，不压实。');}});
document.addEventListener('input',e=>{if(e.target.id==='waterInput'&&page==='prepare'&&!busy){measureWater(w,Number(e.target.value));paintOperation();save();}if(e.target.id==='expand'){viewer?.expand(Number(e.target.value));$('expandValue').textContent=Math.round(Number(e.target.value)*100)+'%';}});
function startScoop(){if(busy||page!=='prepare'||prep!=='powder')return;hold=true;$('scoop').setAttribute('aria-pressed','true');}
function stopScoop(){if(!hold)return;hold=false;$('scoop')?.setAttribute('aria-pressed','false');save();}
document.addEventListener('pointerdown',e=>{if(e.target.closest('#scoop')&&e.button===0){e.preventDefault();startScoop();}});document.addEventListener('pointerup',stopScoop);document.addEventListener('pointercancel',stopScoop);
document.addEventListener('keydown',e=>{if(e.target.id==='scoop'&&[' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)startScoop();}});document.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key))stopScoop();});
$('resetModel').addEventListener('click',()=>{viewer?.reset();viewer?.expand(.7);$('expand').value='.7';$('expandValue').textContent='70%';});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('workbench').requestFullscreen();}catch{toast('浏览器未开放全屏，可以最大化窗口。');}});
window.addEventListener('blur',stopScoop);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopScoop();save();last=0;}});window.addEventListener('pagehide',()=>{stopScoop();save();});
function tick(now){const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(!document.hidden&&!busy){if(hold){measurePowder(w,Math.min(18,w.powder+dt*7));if(w.powder>=18)stopScoop();}if(page==='brew'&&w.poured===0){const was=w.progress;tickWorkshop(w,dt);if(w.progress>=1&&was<1){setHeat(w,0);w.residual=0;render();save();toast('演示出液结束，虚拟炉火已关闭。现在可以去调配。');}}if(now-paint>80&&(hold||page==='brew')){paintOperation();paint=now;}if(now-savedAt>1500&&w.started){save();savedAt=now;}}requestAnimationFrame(tick);}
Object.defineProperty(window,'coffeeWorkbenchSnapshot',{get:()=>({page,prep,session,selected,busy,workshop:structuredClone(w),model:viewer?.state})});
render();save();requestAnimationFrame(tick);if(loaded&&w.started&&w.progress<1&&w.poured===0)toast('已恢复这一锅，火已关闭；选择微火或小火继续。');
