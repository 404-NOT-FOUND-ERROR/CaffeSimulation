import {ICE_MASS,ICE_INTERVAL,ICE_LIFETIME,iceFits} from './recipe-dispense-art.mjs';
import {INGREDIENTS,KEYS,CAPACITY,SAFE_WATER,round,clamp,freshRecipe,newBrew,activeCup,total,batchAvailable,checkpoint,setAmount,undo,splitCup,mergeCups,clearCup,stirCup,useBatchInCup,prepIssue,startBrew,changeHeat,brewTick,collectBatch,assess,compare,snapshot,restore} from './recipe-state.mjs';
import {esc,ingredientIcon,cupSVG,lowerCutaway,brewSVG,collectionSVG,PARTS,partArt,explodedSVG} from './recipe-art.js';
import {PALETTES,drawGazette,recipeLine,sourceLine,editionTitle} from './recipe-gazette.js';
import {RECIPE_ORDERS} from './recipe-orders.mjs';
import {RECIPE_STORE,validSession} from './recipe-workshop-bridge.mjs';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),key=RECIPE_STORE;
let state=null;
try{const saved=restore(JSON.parse(localStorage.getItem(key)));if(saved&&params.get('new')!=='1'&&saved.orderId===(params.get('order')||null))state=saved;}catch{}
const initialOrder=RECIPE_ORDERS.find(o=>o.id===params.get('order'));
if(!state){state=freshRecipe(initialOrder);try{const old=JSON.parse(localStorage.getItem(key));state.saved=Array.isArray(old?.saved)?old.saved.slice(-6):[];}catch{}}
state.ticket=clamp(params.get('ticket')||state.ticket,1,999);
const order=()=>RECIPE_ORDERS.find(o=>o.id===state.orderId)||null;
let scene='recipe',returnScene='recipe',selectedPart='basket',insideView='parts',selectedIngredient=activeCup(state).amounts.milk>0?'milk':'coffee',editAll=false,hold=null,dispensing=null,iceDrops=[],iceSerial=0,mixing=null,editingInput=null,toastTimer,frame=0,lastPaint=0,posterRevision=0,transitioning=false,enteringWorkshop=false;
const allowedScenes=['recipe','compare','prepare','brewing','structure','gazette'];
 const requested=params.get('page');
if(allowedScenes.includes(requested)){scene=requested;if(scene==='compare'&&state.cups.length===1)splitCup(state);if(scene==='brewing'&&state.brew.status==='prepare')scene='prepare';}
if(scene==='structure')returnScene=['brewing','ready'].includes(state.brew.status)?'brewing':'prepare';
const cup=()=>activeCup(state),mass=n=>Number(n).toFixed(Number(n)%1?1:0);
const baseShare=c=>total(c)?(c.amounts.coffee/total(c)*100).toFixed(1)+'%':'—';
const save=()=>{if(enteringWorkshop)return;try{localStorage.setItem(key,JSON.stringify(snapshot(state)));}catch{}};
function workshopUrl({session,inspect=false,refill=false,fresh=false}={}){
 const url=new URL('moka-brew.html',location.href);
 url.searchParams.set('session',session||crypto.randomUUID().replaceAll('-',''));
 if(state.orderId)url.searchParams.set('order',state.orderId);
 url.searchParams.set('ticket',state.ticket);
 if(refill)url.searchParams.set('intent','refill');
 if(inspect)url.searchParams.set('inspect','structure');
 if(fresh)url.searchParams.set('new','1');
 return url;
}
function openWorkshop({inspect=false}={}){
 stopHold();finishMix();
 let session=inspect?state.batches.find(b=>b.id===state.batchId)?.record?.workshopSession:state.pendingWorkshopSession;
 const fresh=!validSession(session);
 if(fresh)session=crypto.randomUUID().replaceAll('-','');
 if(!inspect)state.pendingWorkshopSession=session;
 save();location.assign(workshopUrl({session,inspect,refill:true,fresh}).href);
}
function toast(message){if(!message)return;$('labToast').textContent=message;$('labToast').classList.add('show');$('liveStatus').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('labToast').classList.remove('show'),3200);}
function setRoute(next,{push=true}={}){
 stopHold();finishMix();if(!allowedScenes.includes(next))return;
 scene=next;const url=new URL(location.href);url.searchParams.delete('new');if(next==='recipe')url.searchParams.delete('page');else url.searchParams.set('page',next);
 if(push)history.pushState({page:next},'',url);render();save();window.scrollTo({top:0,behavior:'instant'});
 $('lab').classList.remove('scene-enter');requestAnimationFrame(()=>$('lab').classList.add('scene-enter'));
}
function viewSwitch(){return '<div class="view-switch" aria-label="杯中显示方式"><button data-view="finished" aria-pressed="'+(state.view==='finished')+'">成品</button><button data-view="recipe" aria-pressed="'+(state.view==='recipe')+'">配方示意</button></div><p class="view-explanation">'+(mixing?'色带正在交叠、融合 · 冰块保持为固体':state.view==='recipe'?'色带代表成分比例，不代表真实分层':'液色为配方示意，冰块保持为固体')+'</p>';}
function finishMix(){
 if(!mixing)return;mixing=null;delete $('hero').dataset.mixing;
 const b=document.querySelector('[data-action="stir"]');if(b){b.disabled=false;b.textContent='搅拌';}
 if(['recipe','compare'].includes(scene))updateRecipeHero();
}
function startMix(){
 if(mixing)return;stopHold();const fromView=state.view;
 if(!stirCup(state)){toast('先加一点材料。');return;}
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 mixing=reduce?null:{cupId:cup().id,fromView,progress:0,elapsed:0};
 render();save();
 if(mixing){$('hero').dataset.mixing='true';const b=document.querySelector('[data-action="stir"]');b.disabled=true;b.textContent='搅拌中…';}
 else toast('已搅匀。冰块保留，配方用量保持不变。');
}
function renderSlip(){
 const o=order(),c=cup(),isTool=['prepare','brewing','structure'].includes(scene);
 if(isTool){
  $('orderSlip').innerHTML='<p class="slip-kicker">这一杯，仍在桌面</p><h2>'+esc(c.name)+'</h2><div class="slip-facts">'+KEYS.filter(k=>c.amounts[k]>0).map(k=>'<span><b>'+INGREDIENTS[k].name+'</b><em>'+mass(c.amounts[k])+' g</em></span>').join('')+'</div><p class="slip-foot">GOOD IDEAS. BETTER DAYS.</p>';
 }else if(scene==='compare'){
  const x=compare(state),a=state.cups[0].amounts.coffee,b=state.cups[1].amounts.coffee;
  $('orderSlip').innerHTML='<p>自由实验 /<br>同一锅，两种做法。</p>';
 }else{
  $('orderSlip').innerHTML='<p class="slip-kicker">'+(o?'来单 '+String(state.ticket).padStart(2,'0'):'自由发挥')+'</p><h2>'+esc(o?.id==='breakfast'?'早餐奶咖':o?.title||'今天，随你。')+'</h2><p>'+esc(o?.brief||'按自己的想法调一杯。')+'</p><p class="slip-foot">☕<br><i>Buona Giornata!</i></p>';
 }
}
function amountFields(){
 const c=cup(),keys=KEYS.filter(k=>c.amounts[k]>0);
 return '<div class="recipe-amounts">'+keys.map(k=>'<div class="amount-row"><i style="background:'+INGREDIENTS[k].color+'"></i><span>'+INGREDIENTS[k].name+'</span><strong>'+mass(c.amounts[k])+' g</strong></div>').join('')+'</div><div class="recipe-total"><span>总量</span><strong>'+mass(total(c))+' g</strong></div>';
}
function sourceBlock(){
 const batch=state.batches.find(b=>b.id===state.batchId),remaining=batchAvailable(state);
 return '<div class="base-source"><div class="source-copy"><strong>这一锅摩卡</strong><p>剩余 <span id="batchRemaining">'+mass(remaining)+'</span> g</p><button data-action="structure-record">查看这一锅 ↗</button><button data-action="make-base">'+(state.pendingWorkshopSession?'继续这一锅':'补做一锅')+'</button></div><img src="assets/reference-room/assembled-moka.png" alt="这锅咖啡的摩卡壶来源"></div>'+(state.batches.length>1?'<details class="batch-record"><summary>选择咖啡基底</summary><select id="batchSelect" class="source-select" aria-label="选择要添加的咖啡基底">'+state.batches.map(b=>'<option value="'+esc(b.id)+'" '+(b.id===state.batchId?'selected':'')+'>'+esc(b.name)+' · 剩 '+mass(batchAvailable(state,b.id))+' g</option>').join('')+'</select><button data-action="use-batch">用这一锅 →</button></details>':'');
}
function cleanupCopy(){return '<details class="care-note"><summary>这把壶用完，怎么收拾？</summary><p class="fine">先等壶充分冷却，再拆开、弃粉。按这把铝制壶的说明用清水手洗，检查滤网、密封圈与安全阀，晾干后拆开放置。不要把热壶旋开，也不要敲打粉篮。</p></details>';}
function orderChecks(){
 const o=order();if(!o)return '';
 const checks=assess(cup(),o),met=checks.every(x=>x.met)&&(!o.two||state.cups.length===2);
 return '<div class="order-checks">'+checks.map(x=>'<span class="'+(x.met?'met':'')+'">'+(x.met?'✓':'○')+' '+esc(x.label)+'</span>').join('')+(o.two?'<span class="'+(state.cups.length===2?'met':'')+'">'+(state.cups.length===2?'✓':'○')+' 分成两杯</span>':'')+'</div><p class="fine">'+(met?'当前杯符合来单要求。你仍可以继续改配方。':'按当前配方核对来单；不为口味打分。')+'</p>';
}
function updateRecipeHero(){
 if(scene==='compare'){
  $('hero').innerHTML='<div class="two-cups">'+state.cups.map(c=>'<button class="cup-choice" data-cup="'+c.id+'" aria-pressed="'+(c.id===state.selected)+'" aria-label="选择'+c.id+'杯">'+cupSVG(c,state.view,{labels:false,active:false,pouring:dispensing?.cupId===c.id?dispensing:null,iceDrops:iceDrops.filter(d=>d.cupId===c.id),mix:mixing?.cupId===c.id?mixing:null,utensil:c.id===state.selected})+'<strong>'+c.id+' · '+(c.amounts.milk+c.amounts.foam>0?'柔和':c.amounts.water>0?'清爽':'原液')+'</strong><small>'+esc(recipeLine(c))+'<br>'+mass(total(c))+' g</small><span class="selection-tag">'+(state.selected===c.id?'编辑 '+c.id+' ✎':'选择 '+c.id)+'</span></button>').join('')+'</div><p class="comparison-caption">'+(compare(state).sameBatch?(compare(state).different.length?'同锅咖啡液，添加物与用量不同。':'同锅咖啡液，选一杯试试不同配方。'):'各杯保留实际基底来源与配方。')+'</p>';
 }else{
  const c=cup();$('hero').innerHTML='<div class="cup-heading"><input id="cupName" value="'+esc(c.name)+'" maxlength="20" aria-label="给当前咖啡起名"><p>总量 <span id="cupTotal">'+mass(total(c))+'</span> g</p></div><div class="single-cup-art">'+cupSVG(c,state.view,{labels:false,pouring:dispensing?.cupId===c.id?dispensing:null,iceDrops:iceDrops.filter(d=>d.cupId===c.id),mix:mixing?.cupId===c.id?mixing:null,utensil:true})+'</div>'+viewSwitch();
 }
}
function renderRecipeDetails(){
 if(scene==='compare'){
  const x=compare(state),same=x.same.map(k=>INGREDIENTS[k].name+'各 '+mass(state.cups[0].amounts[k])+' g').join(' · ')||'现在两杯的各成分用量都不同。';
  const different=x.different.map(k=>'A '+INGREDIENTS[k].name+' '+mass(state.cups[0].amounts[k])+' g / B '+mass(state.cups[1].amounts[k])+' g').join('<br>')||'两杯配方相同，试着只改一项。';
  $('details').innerHTML='<div class="recipe-paper"><h2>当前杯 '+state.selected+'</h2>'+amountFields()+sourceBlock()+'</div>';
 }else $('details').innerHTML=sourceBlock()+'<div class="recipe-paper"><h2>我的配方</h2>'+amountFields()+'<div class="recipe-total"><span>基底占比</span><strong>'+baseShare(cup())+'</strong></div><p class="recipe-foot">加奶改变比例，不会再次萃取。</p></div>';
}
function comparisonNote(){const x=compare(state);if(!x?.different.length)return '现在两杯配方一样。选中 A 或 B，只改一种原料，观察液色与占比。';return x.different.map(k=>{const diff=round(state.cups[1].amounts[k]-state.cups[0].amounts[k]);return 'B 杯'+INGREDIENTS[k].short+'比 A '+(diff>0?'多':'少')+' '+mass(Math.abs(diff))+' g';}).join('；')+'。';}
function renderTray(){
 $('ingredientTray').style.setProperty('--selected-index',KEYS.indexOf(selectedIngredient));
 $('ingredientTray').innerHTML='<div class="ingredient-grid">'+KEYS.map((k,i)=>'<button class="ingredient-card '+(selectedIngredient===k?'is-selected':'')+'" data-ingredient="'+k+'" aria-label="添加'+INGREDIENTS[k].short+(k==='ice'?'，点击投入一块15克冰':'，按住持续添加')+'" aria-pressed="'+(selectedIngredient===k)+'"><i class="ingredient-photo" style="--ingredient-index:'+i+'" aria-hidden="true"></i><span>'+INGREDIENTS[k].short+'</span></button>').join('')+'</div><div id="ingredientAdjust"></div>';
 renderIngredientAdjust();
}
function renderIngredientAdjust(){
 const k=selectedIngredient,host=$('ingredientAdjust');if(!host)return;
 const step=k==='ice'?ICE_MASS:5;$('ingredientTray').style.setProperty('--selected-index',KEYS.indexOf(k));
 host.innerHTML='<div class="ingredient-adjust"><strong>'+INGREDIENTS[k].short+' <span id="selectedAmount">'+mass(cup().amounts[k])+' g</span></strong><button data-adjust="-'+step+'" aria-label="减少'+INGREDIENTS[k].short+step+'克">−</button><input data-amount="'+k+'" type="number" min="0" max="'+CAPACITY+'" step="'+(k==='ice'?ICE_MASS:1)+'" value="'+mass(cup().amounts[k])+'" aria-label="托盘'+INGREDIENTS[k].short+'用量"><button data-adjust="'+step+'" aria-label="增加'+INGREDIENTS[k].short+step+'克">+</button><small>'+(k==='ice'?'点击投入一块 · 每块 15 g':'按住添加 · 松手停止')+'</small></div>';
}

function renderRecipe(){
 const two=state.cups.length===2;
 if(two&&scene==='recipe')scene='compare';
 $('headline').innerHTML='';
 $('italian').textContent=scene==='compare'?'DUE TAZZE, DUE IDEE':'PICCOLI ESPERIMENTI';
 $('leftNote').innerHTML='';
 updateRecipeHero();renderRecipeDetails();
 $('controlDock').innerHTML='<button class="secondary" data-action="undo" '+(!state.history.length?'disabled':'')+'>↶ 撤销</button><button class="secondary" data-action="stir">◎ 搅拌'+(two?' '+state.selected:'')+'</button>'+(!two?'<button class="secondary" data-action="split">▱ 分成两杯</button>':'<button class="secondary" data-action="merge">▱ 回到单杯</button>')+'<button class="primary" data-action="gazette" '+(total(cup())===0?'disabled':'')+'>'+(two?'制作双杯特刊':'出品')+' →</button>';
 renderTray();
}
function renderPrepare(){
 const b=state.brew;$('headline').innerHTML='做一份，<br>自己的摩卡。';$('italian').textContent='PREPARA LA BASE';
 $('leftNote').textContent='制作完成后，基底回到成分托盘，原来的杯子保留。';
 $('hero').innerHTML='<div class="prepare-hero"><div class="parked-upper">'+partArt('upper')+'</div><div id="lowerArt">'+lowerCutaway(b.water,b.powder)+'</div><div class="parked-basket '+(b.powder>=18?'is-filled':'')+'">'+partArt('basket')+'</div></div><div class="water-control"><label for="waterInput">下壶水量 <output id="waterOutput">'+mass(b.water)+' g</output></label><input id="waterInput" type="range" min="30" max="158" step="1" value="'+b.water+'" aria-label="下壶水量"><small>30 g <span style="float:right">158 g · 安全阀下缘示意 130 g</span></small></div><div class="powder-demo"><span id="powderStatus">'+(b.powder>=18?'已装满 · 18 g · 不压实':'粉篮装满，铺平不压实')+'</span><button data-action="fill-powder" '+(b.powder>=18?'disabled':'')+'>演示装粉</button></div>';
 $('details').innerHTML='<h2>水面，留在这里。</h2><p class="teaching-copy" id="waterAdvice">'+(b.water>SAFE_WATER?'水面超过了安全阀下缘，先调低。':'不要超过安全阀下缘，留出空气空间。')+'</p><button class="small-link" data-action="structure">看剖面与零件 ↗</button><p class="thermal-badge">○ 当前是冷壶</p><p class="teaching-copy">本页演示使用冷水准备。合壶时清理壶缘残粉，检查密封圈，再自动放篮、合壶。</p><p class="fine">110–130 g / 18 g 是这把演示壶的设定；实物按对应壶型的安全阀和粉篮判断。</p>'+sourceLinks();
 $('controlDock').innerHTML='<span class="dock-label">准备</span><button class="secondary" data-action="safe-water">演示安全水位</button><button class="secondary" data-action="fill-powder" '+(b.powder>=18?'disabled':'')+'>装粉</button><button class="primary" data-action="start-brew">准备好，开始冲煮 →</button><p class="dock-note" id="prepFeedback">'+(prepIssue(b)||'已准备好。放篮、清理壶缘与合壶会连续演示。')+'</p>';
}
function sourceLinks(){return '<p class="fine"><a href="https://bialetti-cookware.zendesk.com/hc/en-us/articles/5416235346322-How-to-use-the-Moka-Express" target="_blank" rel="noopener">操作依据 · Bialetti ↗</a><br><a href="https://compphys.univie.ac.at/Moka/" target="_blank" rel="noopener">原理资料 · 维也纳大学 ↗</a></p>';}
function brewPhase(){const b=state.brew;return b.status==='ready'?'结束，等待收杯':b.heat===0?'关火，余热观察':b.mass>0?'正在出液':'正在受热';}
function paintBrew(){
 $('hero').innerHTML=brewSVG(state.brew);
 const output=$('brewOutput');if(output)output.textContent=mass(state.brew.mass);
 if($('brewPhase'))$('brewPhase').textContent=brewPhase();
 document.querySelectorAll('[data-phase]').forEach(el=>el.classList.toggle('is-current',el.dataset.phase===(state.brew.status==='ready'?'2':state.brew.mass>0?'1':'0')));
 const collect=document.querySelector('[data-action="collect"]');if(collect)collect.disabled=state.brew.mass<5||transitioning;
}
function renderBrewing(){
 const b=state.brew;$('headline').innerHTML='慢慢出液，<br>何时收杯？';$('italian').textContent='OSSERVA E SCEGLI';
 $('leftNote').textContent='观察水位下降与咖啡液上升。关火后，还有短暂余热出液。';
 $('hero').innerHTML=brewSVG(b);
 $('details').innerHTML='<div class="brew-status"><h2 id="brewPhase">'+brewPhase()+'</h2><div class="brew-output"><span id="brewOutput">'+mass(b.mass)+'</span> <small>g</small></div><p class="fine">已出液 · 暂留在上壶</p><div class="process-marks"><span data-phase="0">受热</span><span data-phase="1">出液</span><span data-phase="2">收杯</span></div><p class="teaching-copy">下壶的压力差推动液态水穿过粉层，咖啡液沿中心导管进入上壶。</p><button class="small-link" data-action="structure">看剖面与零件 ↗</button><p class="teaching-copy">壶身很烫，握手柄操作。火焰留在壶底，避免烧到手柄。</p><p class="fine">过程经过加速；份量与时间为教学示意。出液结束时演示自动关火。</p></div>';
 $('controlDock').innerHTML='<span class="dock-label">火候</span><div class="fire-buttons"><button data-heat="1" aria-pressed="'+(b.heat===1)+'" '+(b.status==='ready'?'disabled':'')+'>微火</button><button data-heat="2" aria-pressed="'+(b.heat===2)+'" '+(b.status==='ready'?'disabled':'')+'>小火</button><button data-heat="0" aria-pressed="'+(b.heat===0)+'">关火观察</button></div><button class="primary" data-action="collect" '+(b.mass<5?'disabled':'')+'>关火收杯 →</button><p class="dock-note">收杯会连续演示关火、移壶、搅匀与倾倒，基底随后回到托盘。</p>';paintBrew();
}
function renderStructure(){
 const p=PARTS.find(x=>x.id===selectedPart);$('headline').innerHTML='拆开，<br>理解这一份。';$('italian').textContent='DENTRO LA MOKA';
 $('leftNote').textContent='教学视图 · 虚拟制作暂停。实物充分冷却后，才可以拆开。';
 $('hero').innerHTML=insideView==='parts'?explodedSVG(selectedPart):brewSVG(state.brew.status==='prepare'?{...state.brew,mass:0,progress:0,heat:0}:state.brew);
 $('details').innerHTML='<p class="fine">正在了解</p><h2 class="part-name">'+p.name+'</h2><div class="parts-detail">'+partArt(p.id)+'</div><p class="part-copy">'+p.copy+'</p><div class="detail-rule"></div><p class="part-copy">'+p.note+'</p>'+sourceLinks();
 $('controlDock').innerHTML='<div class="view-switch"><button data-inside="section" aria-pressed="'+(insideView==='section')+'">剖面</button><button data-inside="parts" aria-pressed="'+(insideView==='parts')+'">零件</button></div><div class="part-buttons">'+PARTS.map(p=>'<button data-part="'+p.id+'" aria-pressed="'+(p.id===selectedPart)+'">'+p.name+'</button>').join('')+'</div><button class="primary" data-action="close-structure">收起，继续制作 →</button><p class="dock-note">当前配方和冲煮进度已保留 · 实物需要充分冷却后拆卸。</p>';
}
function render(){
 $('lab').dataset.scene=scene;$('sceneLayout').hidden=scene==='gazette';$('gazetteLayout').hidden=scene!=='gazette';
 document.querySelector('.lab-header .coffee-progress')?.querySelectorAll('span').forEach((el,i)=>el.classList.toggle('current',i===(scene==='gazette'?2:1)));
 $('ingredientTray').hidden=!['recipe','compare'].includes(scene);$('resumeBrew').hidden=!['recipe','compare'].includes(scene)||!state.pendingWorkshopSession;
 $('shelfCount').textContent=state.saved.length?'· '+state.saved.length:'';
 $('backNote').textContent=['prepare','brewing','structure'].includes(scene)?'配方已保留':'';
 $('backLink').textContent=scene==='gazette'?'← 继续调配':scene==='structure'?'← 收起，继续制作':['prepare','brewing'].includes(scene)?'← 回到这一杯':'← 咖啡小馆';
 if(scene==='gazette'){renderGazette();return;}
 if(['recipe','compare'].includes(scene))renderRecipe();else if(scene==='prepare')renderPrepare();else if(scene==='brewing')renderBrewing();else renderStructure();
 $('lab').dataset.scene=scene;renderSlip();
}
function refreshAmounts(){
 updateRecipeHero();
 if(hold){document.querySelectorAll('[data-amount]').forEach(input=>{if(input!==document.activeElement)input.value=mass(cup().amounts[input.dataset.amount]);});}
 renderRecipeDetails();
 const amount=$('selectedAmount');if(amount)amount.textContent=mass(cup().amounts[selectedIngredient])+' g';
 const remain=$('batchRemaining');if(remain)remain.textContent=mass(batchAvailable(state));
 refreshComparisonCopy();refreshOrderChecks();
}
function refreshComparisonCopy(){
 if(scene!=='compare')return;
 if($('comparisonNote'))$('comparisonNote').textContent=comparisonNote();
 const x=compare(state),a=state.cups[0],b=state.cups[1],same=x.same.map(k=>INGREDIENTS[k].name+'各 '+mass(a.amounts[k])+' g').join(' · ')||'现在两杯的成分用量都不同。';
 const different=x.different.map(k=>'A '+INGREDIENTS[k].name+' '+mass(a.amounts[k])+' g / B '+mass(b.amounts[k])+' g').join('<br>')||'两杯配方相同，试着只改一项。';
 const summary=document.querySelector('.compare-summary');if(summary)summary.innerHTML='<div><h3>相同的部分</h3><p>'+same+(x.sameTotal?'<br>总量各 '+mass(total(a))+' g':'')+'</p></div><div><h3>不同的部分</h3><p>'+different+'</p></div>';
 if(summary?.nextElementSibling)summary.nextElementSibling.textContent=x.different.length&&x.sameTotal&&a.amounts.coffee===b.amounts.coffee?'基底占比相同，添加成分不同。':'只改变一个因素，更容易看清配方的差别。';
}
function refreshOrderChecks(){const checks=document.querySelector('.order-checks');if(checks){const box=document.createElement('div');box.innerHTML=orderChecks();checks.nextElementSibling?.replaceWith(box.lastElementChild);checks.replaceWith(box.firstElementChild);}}
function beginHold(element,pointer=null){
 if(hold||transitioning||!['recipe','compare'].includes(scene))return;
 finishMix();
 const ingredient=element.dataset.ingredient;selectedIngredient=ingredient;
 hold={ingredient,pointer,elapsed:0,amount:0,started:false,startAmount:cup().amounts[ingredient],cupId:state.selected,element};element.classList.add('is-holding');document.querySelectorAll('[data-ingredient]').forEach(b=>{b.classList.toggle('is-selected',b===element);b.setAttribute('aria-pressed',String(b===element));});
 if(pointer!==null)try{element.setPointerCapture(pointer);}catch{}
 if(ingredient==='ice'){checkpoint(state);hold.started=true;hold.nextIce=ICE_INTERVAL;addIceCube(false);}
 renderIngredientAdjust();refreshAmounts();
}
function addIceCube(remember=true){
 if(!iceFits(cup())){toast('杯里放不下一整块冰了。可先减少其他材料。');return false;}
 const result=setAmount(state,'ice',cup().amounts.ice+ICE_MASS,{remember});
 if(result.changed>0){
  if(hold)hold.amount+=result.changed;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)iceDrops.push({cupId:cup().id,elapsed:0,seed:++iceSerial,index:Math.min(7,Math.ceil(cup().amounts.ice/ICE_MASS)-1)});
 }
 return result.changed>0;
}
function stopHold(){
 if(!hold)return;const held=hold;hold=null;held.element.classList.remove('is-holding');
 // Liquids require a hold; a tap drops exactly one solid cube.
 if(dispensing)dispensing.release=0;
 if(held.started&&!held.amount)state.history.pop();
 if(['recipe','compare'].includes(scene)){refreshAmounts();renderSlip();renderTray();const undoButton=document.querySelector('[data-action="undo"]');if(undoButton)undoButton.disabled=!state.history.length;const saveButton=document.querySelector('[data-action="gazette"]');if(saveButton)saveButton.disabled=total(cup())===0;}
 save();$('liveStatus').textContent=held.started?'已添加 '+mass(held.amount)+' g '+INGREDIENTS[held.ingredient].name+'，当前杯 '+mass(total(cup()))+' g。':'已选择'+INGREDIENTS[held.ingredient].name+'，可在旁边调整用量。';
}
async function prepareStart(){
 if(transitioning)return;const issue=prepIssue(state.brew);if(issue){toast(issue);return;}transitioning=true;
 $('controlDock').querySelectorAll('button').forEach(x=>x.disabled=true);
 $('hero').innerHTML='<div class="auto-assembly">'+partArt('basket')+'<p class="fine">放篮 · 清理壶缘 · 合壶</p>'+partArt('upper')+'</div>';
 await new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion: reduce)').matches?100:1400));
 startBrew(state);transitioning=false;setRoute('brewing');toast('壶已合好、移到炉头；用微火或小火观察出液。');
}
async function collect(){
 if(transitioning||state.brew.mass<5)return;
 transitioning=true;changeHeat(state.brew,0);state.brew.status='collecting';$('hero').innerHTML=collectionSVG(state.brew.mass);$('hero').classList.add('collecting');$('controlDock').querySelectorAll('button').forEach(b=>b.disabled=true);
 $('backNote').textContent='关火 · 移壶 · 搅匀 · 出杯';
 await new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion: reduce)').matches?100:2100));
 const b=collectBatch(state);transitioning=false;$('hero').classList.remove('collecting');setRoute(state.cups.length===2?'compare':'recipe');
 toast('这一锅已收集 '+mass(b.capacity)+' g。可把杯中基底换成这锅，或从托盘继续添加。');
}
function recordCopy(){
 const x=compare(state),cups=state.poster.layout==='double'?state.cups:[cup()];
 return '<h2>本期记录</h2><p>'+esc(sourceLine(state,cups))+'</p>'+cups.map(c=>'<p>'+(cups.length>1?c.id+' / ':'')+esc(recipeLine(c))+' · 总量 '+mass(total(c))+' g</p>').join('')+(cups.length>1?'<p>'+(x.sameBatch?'同一批基底，可以比较两种搭配。':'两杯使用了不同批次，配方与来源都保留。')+'</p>':'');
}
function renderGazette(){
 $('gazetteTitle').value=editionTitle(state);
 $('gazetteLayouts').innerHTML=[['single','单杯'],['double','双杯'],['recipe','配方']].map(([id,name])=>'<button data-layout="'+id+'" aria-pressed="'+(state.poster.layout===id)+'" '+(id==='double'&&state.cups.length<2?'disabled':'')+'>'+name+'</button>').join('');
 $('gazettePalettes').innerHTML=[0,2,1].map(i=>'<button data-palette="'+i+'" aria-pressed="'+(state.poster.palette===i)+'" aria-label="'+PALETTES[i].name+'"><canvas width="120" height="180" id="palette-'+i+'" aria-hidden="true"></canvas></button>').join('');
 $('gazetteStyles').innerHTML=['杯子特写','人物拼贴','配方报道'].map((name,i)=>'<button data-style="'+i+'" aria-pressed="'+(state.poster.style===i)+'" aria-label="'+name+'"><canvas width="120" height="180" id="style-'+i+'" aria-hidden="true"></canvas><small>'+name+'</small></button>').join('');
 $('gazetteRecord').innerHTML='<details><summary>制作记录</summary>'+recordCopy()+'</details>';paintGazette();
}
async function paintGazette(){
 const revision=++posterRevision,data=structuredClone(state);
 const temp=document.createElement('canvas');temp.width=1200;temp.height=1800;
 try{await drawGazette(temp,data);if(revision!==posterRevision||scene!=='gazette')return;const ctx=$('gazetteCanvas').getContext('2d');ctx.clearRect(0,0,1200,1800);ctx.drawImage(temp,0,0);$('gazetteCanvas').dataset.posterStyle=data.poster.style;$('gazetteCanvas').dataset.posterPalette=data.poster.palette;
  await Promise.all([0,1,2].map(async style=>{const thumbnail=document.createElement('canvas');thumbnail.width=120;thumbnail.height=180;await drawGazette(thumbnail,data,{style});if(revision===posterRevision&&$('style-'+style))$('style-'+style).getContext('2d').drawImage(thumbnail,0,0);}));
  await Promise.all([0,2,1].map(async palette=>{const thumbnail=document.createElement('canvas');thumbnail.width=120;thumbnail.height=180;const variant=structuredClone(data);variant.poster.palette=palette;await drawGazette(thumbnail,variant);if(revision===posterRevision&&$('palette-'+palette))$('palette-'+palette).getContext('2d').drawImage(thumbnail,0,0);}));
 }catch(error){toast('特刊插画暂未加载完成，请再试一次。');console.error(error);}
}
async function exportGazette(){
 const button=document.querySelector('[data-action="export"]');button.disabled=true;button.textContent='正在保存…';
 try{await document.fonts.ready;await drawGazette($('gazetteCanvas'),structuredClone(state));
  const blob=await new Promise(r=>$('gazetteCanvas').toBlob(r,'image/png'));if(!blob)throw new Error('PNG unavailable');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='咖啡特刊-'+(state.poster.title||cup().name)+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  const edition={title:editionTitle(state),date:new Date().toISOString(),data:snapshot(state)};edition.data.saved=[];state.saved.push(edition);state.saved=state.saved.slice(-6);save();$('shelfCount').textContent='· '+state.saved.length;
  // The local preview server also exposes a reviewable file when browser downloads are hidden.
  try{const res=await fetch('api/export-poster',{method:'POST',headers:{'Content-Type':'image/png'},body:blob});if(res.ok){const result=await res.json();$('exportLink').href=result.url;$('exportLink').hidden=false;}}catch{}
  toast('本期特刊已生成，配方也收入特刊册。');
 }catch(error){toast('保存失败，请重试。');console.error(error);}
 finally{button.disabled=false;button.textContent='↓ 保存海报 PNG';}
}
function openShelf(){
 $('savedEditions').innerHTML=state.saved.length?state.saved.map((x,i)=>'<article class="edition-card"><div><strong>'+esc(x.title)+'</strong><p>'+esc(x.data.cups.map(c=>c.id+'杯 '+total(c)+' g').join(' / '))+'</p></div><button data-edition="'+i+'">继续这份配方 ↗</button></article>').join(''):'<p class="teaching-copy">还没有特刊。做好一杯，保存第一期吧。</p>';$('shelfDialog').showModal();
}
document.addEventListener('pointerdown',e=>{const card=e.target.closest('[data-ingredient]');if(card&&e.button===0){e.preventDefault();beginHold(card,e.pointerId);}});
document.addEventListener('pointerup',()=>stopHold());document.addEventListener('pointercancel',()=>stopHold());window.addEventListener('blur',()=>{stopHold();save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHold();save();}});
document.addEventListener('keydown',e=>{const card=e.target.closest('[data-ingredient]');if(card&&[' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)beginHold(card);}const part=e.target.closest('.part-hotspot');if(part&&[' ','Enter'].includes(e.key)){e.preventDefault();selectedPart=part.dataset.part;renderStructure();}});
document.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)&&hold){e.preventDefault();stopHold();}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button,[data-part]');if(!b||b.disabled)return;
 if(b.dataset.adjust){finishMix();if(selectedIngredient==='ice'&&Number(b.dataset.adjust)>0){addIceCube();render();save();return;}const result=setAmount(state,selectedIngredient,cup().amounts[selectedIngredient]+Number(b.dataset.adjust));render();save();if(result.message)toast(result.message);return;}
 if(mixing&&b.dataset.action!=='stir')finishMix();
 if(b.dataset.cup){stopHold();state.selected=b.dataset.cup;render();save();return;}
 if(b.dataset.view){state.view=b.dataset.view;render();save();return;}
 if(b.dataset.heat!==undefined){changeHeat(state.brew,Number(b.dataset.heat));renderBrewing();save();return;}
 if(b.dataset.part){selectedPart=b.dataset.part;renderStructure();return;}
 if(b.dataset.inside){insideView=b.dataset.inside;renderStructure();return;}
 if(b.dataset.palette!==undefined){state.poster.palette=Number(b.dataset.palette);renderGazette();save();return;}
 if(b.dataset.style!==undefined){state.poster.style=Number(b.dataset.style);renderGazette();save();return;}
 if(b.dataset.layout){state.poster.layout=b.dataset.layout;renderGazette();save();return;}
 if(b.dataset.edition!==undefined){const saved=state.saved,data=restore(saved[Number(b.dataset.edition)].data);if(data){state=data;state.saved=saved;const url=new URL(location.href);if(state.orderId)url.searchParams.set('order',state.orderId);else url.searchParams.delete('order');history.replaceState({},'',url);$('shelfDialog').close();setRoute(state.cups.length===2?'compare':'recipe');}return;}
 const action=b.dataset.action;if(!action)return;
 if(transitioning)return;
 if(action==='undo'){iceDrops=[];dispensing=null;if(undo(state)){setRoute(state.cups.length===2?'compare':'recipe');toast('已恢复上一次配方。');}}
 else if(action==='stir')startMix();
 else if(action==='split'){const issue=splitCup(state);if(issue)toast(issue);else{setRoute('compare');toast('各成分平均分入两杯。点选 A 或 B，再分别添加。');}}
 else if(action==='merge'){const issue=mergeCups(state);if(issue)toast(issue);else{setRoute('recipe');toast('已合并配方，可撤销回到两杯。');}}
 else if(action==='clear'){clearCup(state);render();save();toast('当前杯已清空，可撤销恢复。');}
 else if(action==='edit-all'){editAll=!editAll;renderRecipeDetails();}
 else if(action==='gazette'){state.poster.layout=state.cups.length===2?'double':'single';$('exportLink').hidden=true;setRoute('gazette');}
 else if(action==='return-recipe'){setRoute(state.cups.length===2?'compare':'recipe');}
 else if(action==='make-base')openWorkshop();
 else if(action==='use-batch'){const result=useBatchInCup(state);if(result.changed){render();save();}toast(result.message);}
 else if(action==='structure-record')openWorkshop({inspect:true});
 else if(action==='fill-powder'){state.brew.powder=18;renderPrepare();save();toast('粉篮已装满并铺平，不压实；合壶时会清理壶缘。');}
 else if(action==='safe-water'){state.brew.water=120;renderPrepare();save();}
 else if(action==='start-brew')prepareStart();
 else if(action==='collect')collect();
 else if(action==='structure'){returnScene=scene;selectedPart=scene==='prepare'?'lower':'basket';insideView='parts';setRoute('structure');}
 else if(action==='close-structure'){setRoute(returnScene==='structure'?'recipe':returnScene);}
 else if(action==='export')exportGazette();
 else if(action==='save-shelf'){const edition={title:editionTitle(state),date:new Date().toISOString(),data:snapshot(state)};edition.data.saved=[];state.saved.push(edition);state.saved=state.saved.slice(-6);save();$('shelfCount').textContent='· '+state.saved.length;toast('配方与制作记录已收入特刊册。');}
 else if(action==='close-shelf')$('shelfDialog').close();
 else if(action==='free'){state.orderId=null;const url=new URL(location.href);url.searchParams.delete('order');history.replaceState({},'',url);render();save();toast('来单已放回，保留当前配方，自由发挥。');}
});
$('backLink').addEventListener('click',e=>{if(scene==='structure'){e.preventDefault();setRoute(returnScene);}else if(!['recipe','compare'].includes(scene)){e.preventDefault();setRoute(state.cups.length===2?'compare':'recipe');}});
$('resumeBrew').addEventListener('click',()=>openWorkshop());$('shelfButton').addEventListener('click',openShelf);
document.addEventListener('change',e=>{
 if(e.target.dataset.amount){const r=setAmount(state,e.target.dataset.amount,e.target.value,{remember:editingInput!==e.target});editingInput=null;render();save();if(r.message)toast(r.message);}
 else if(e.target.id==='batchSelect'){state.batchId=e.target.value;renderRecipeDetails();save();}
 else if(e.target.id==='cupName'){cup().name=e.target.value.trim().slice(0,20)||'我的第一杯';save();}
});
document.addEventListener('input',e=>{
 if(mixing&&(e.target.dataset.amount||e.target.id==='cupName'))finishMix();
 if(e.target.dataset.amount){if(e.target.value==='')return;if(editingInput!==e.target){checkpoint(state);editingInput=e.target;}const result=setAmount(state,e.target.dataset.amount,e.target.value,{remember:false});updateRecipeHero();renderRecipeDetails();const selectedAmount=$('selectedAmount');if(selectedAmount)selectedAmount.textContent=mass(cup().amounts[selectedIngredient])+' g';refreshComparisonCopy();refreshOrderChecks();const sum=document.querySelector('.recipe-total strong');if(sum)sum.textContent=mass(total(cup()))+' g';const undoButton=document.querySelector('[data-action="undo"]');if(undoButton)undoButton.disabled=!state.history.length;const saveButton=document.querySelector('[data-action="gazette"]');if(saveButton)saveButton.disabled=total(cup())===0;save();if(result.message)toast(result.message);}
 else if(e.target.id==='cupName'){cup().name=e.target.value.trim().slice(0,20)||'我的第一杯';save();}
 else if(e.target.id==='waterInput'){state.brew.water=Number(e.target.value);$('lowerArt').innerHTML=lowerCutaway(state.brew.water);$('waterOutput').textContent=mass(state.brew.water)+' g';$('waterAdvice').textContent=state.brew.water>SAFE_WATER?'水面超过安全阀下缘，先调低。':'不要超过安全阀下缘，留出空气空间。';$('waterAdvice').classList.toggle('warning',state.brew.water>SAFE_WATER);$('prepFeedback').textContent=prepIssue(state.brew)||'已准备好。放篮、清理壶缘与合壶会连续演示。';save();}
 else if(e.target.id==='gazetteTitle'){state.poster.title=e.target.value.slice(0,20);paintGazette();save();}
 if(e.target.dataset.amount)document.querySelectorAll('[data-amount="'+e.target.dataset.amount+'"]').forEach(input=>{if(input!==e.target)input.value=mass(cup().amounts[e.target.dataset.amount]);});
 if(e.target.dataset.amount&&e.target.value!==''&&Number(e.target.value)!==cup().amounts[e.target.dataset.amount])e.target.value=mass(cup().amounts[e.target.dataset.amount]);
});
window.addEventListener('popstate',()=>{stopHold();finishMix();const p=new URLSearchParams(location.search).get('page')||'recipe';scene=allowedScenes.includes(p)?p:'recipe';if(scene==='brewing'&&state.brew.status==='prepare')scene='prepare';if(scene==='compare'&&state.cups.length===1)scene='recipe';render();});
window.addEventListener('pagehide',save);
function tick(now){
 const dt=frame?Math.min(.1,(now-frame)/1000):0;frame=now;
 if(!document.hidden&&hold){
  hold.elapsed+=dt;
  if(hold.ingredient==='ice'){
   if(hold.elapsed>=hold.nextIce){hold.nextIce+=ICE_INTERVAL;if(!addIceCube(false))stopHold();}
  }else if(hold.elapsed>.25){
   if(!hold.started){checkpoint(state);hold.started=true;dispensing={ingredient:hold.ingredient,cupId:hold.cupId,elapsed:0};}
   const target=hold.startAmount+INGREDIENTS[hold.ingredient].rate*(hold.elapsed-.25);
   const result=setAmount(state,hold.ingredient,target,{remember:false});hold.amount+=result.changed;
   if(result.message){toast(result.message);if(result.changed===0)stopHold();}
  }
 }
 let endedMotion=false;
 if(!document.hidden){
  if(dispensing){dispensing.elapsed+=dt;if(dispensing.release!==undefined){dispensing.release+=dt;if(dispensing.release>.34){dispensing=null;endedMotion=true;}}}
  iceDrops.forEach(d=>d.elapsed+=dt);
  if(iceDrops.some(d=>d.elapsed>=ICE_LIFETIME))endedMotion=true;
  iceDrops=iceDrops.filter(d=>d.elapsed<ICE_LIFETIME);
 }

 const old=state.brew.status;
 if(mixing&&!document.hidden){mixing.elapsed+=dt;mixing.progress=clamp(mixing.elapsed/2.8,0,1);if(mixing.progress>=1){finishMix();toast('已搅匀。冰块保留，配方用量保持不变。');}}
 brewTick(state.brew,dt,{paused:scene!=='brewing'||document.hidden||transitioning});
 if(state.brew.status==='ready'&&old!=='ready'){renderBrewing();save();toast('演示出液结束，已自动关火。现在可以收杯。');}
 if(now-lastPaint>((mixing||dispensing||iceDrops.length)?30:95)||endedMotion){if(['recipe','compare'].includes(scene)){if(hold)refreshAmounts();else if(mixing||dispensing||iceDrops.length||endedMotion)updateRecipeHero();}else if(scene==='brewing'&&!transitioning)paintBrew();lastPaint=now;}
 requestAnimationFrame(tick);
}
// Read-only debug snapshot for QA; no imperative test-only state mutation surface.
Object.defineProperty(window,'coffeeRecipeSnapshot',{get:()=>({scene,state:snapshot(state),holding:!!hold})});
// Orders begin at the apparatus. Only a completed brew enters the recipe desk.
// The shelf can still open historical editions without overwriting them.
if(['prepare','brewing','structure'].includes(requested)){
 openWorkshop({inspect:requested==='structure'});
}else if(params.get('shelf')!=='1'&&(params.get('new')==='1'||!state.batches.some(b=>b.kind==='brewed'))){
 enteringWorkshop=true;
 location.replace(workshopUrl({fresh:true}).href);
}else{
 render();save();requestAnimationFrame(tick);
 if(params.get('shelf')==='1')openShelf();
 if(params.has('collected'))toast('这一锅已收取：'+mass(state.batches.find(b=>b.id===state.batchId)?.capacity||0)+' g。杯中与剩余库存分别记录，可以继续调配。');
 if(params.has('new')||params.has('shelf')||params.has('collected')){const clean=new URL(location.href);for(const p of ['new','shelf','collected'])clean.searchParams.delete(p);history.replaceState({page:scene},'',clean);}
 if(scene==='brewing'&&state.brew.status==='brewing'&&state.brew.heat===0)toast('已恢复这一锅，火已关闭。选择微火或小火继续。');
}
