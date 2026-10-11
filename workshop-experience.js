import {createPosterScene} from './workshop-poster-scene.js';
import {createCutaway} from './workshop-cutaway.js';
import {measureWater,measurePowder,reviseBlend} from './workshop-controls.mjs';
import {freshWorkshop,restoreWorkshop,turnShell,setBasket,brushRim,placePot,setHeat,tickWorkshop,pourCoffee,preparationIssue,isHot,coffeeLeft,totalCup,cupSnapshot,workshopReport,SPEC,clamp} from './workshop-state.mjs';
import {ORDERS,drinkName,checkOrder} from './studio-model.mjs';
import {escapeHTML as esc,PALETTES,REPORT_STYLES,drawReport} from './studio-art.js';
import {advanceMeasuredAmount} from './preparation-motion.mjs';
import {RECIPE_ORDERS} from './recipe-orders.mjs';
import {RECIPE_STORE,validSession,workshopStore,recipeFromWorkshop} from './recipe-workshop-bridge.mjs';
import {snapshot as recipeSnapshot} from './recipe-state.mjs';

const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),recipeFlow=$('#workshop').dataset.flow==='recipe',order=(recipeFlow?RECIPE_ORDERS:ORDERS).find(o=>o.id===params.get('order'))||null;
const flowSession=validSession(params.get('session'))?params.get('session'):crypto.randomUUID().replaceAll('-','');
const storeKey=recipeFlow?workshopStore(flowSession):'moka-hands-on-v2';
if(recipeFlow){params.set('session',flowSession);history.replaceState(null,'',location.pathname+'?'+params);}
let s=freshWorkshop(),mode='water',view='',contextOpen=false,inspectedPart='lower',ready=false,animation=null,queue=[],afterSequence=null;
let lastTime=0,lastUI=0,lastPersist=0,saveTimer=0,warningUntil=0,tool='water',flow='',tilt=0,displayTilt=0,drag=null,targetWater=null,targetPowder=null;
let autoFill=null,levelDragging=false,previousCup=null;
let poster=null,posterStyle='manifesto',posterPalette='torino',posterRevision=0,posterPosition={x:.58,y:.49},posterDrag=null,audio=null,sound=false;
try{const saved=JSON.parse(localStorage.getItem(storeKey)||'null');if(params.get('new')!=='1'&&saved&&(recipeFlow||saved.order===(order?.id||null))){s=restoreWorkshop(saved.state);targetWater=clamp(saved.targetWater??s.water,0,SPEC.tankMax);targetPowder=clamp(saved.targetPowder??s.powder,0,SPEC.powder);}}catch{}
if(params.has('new')){params.delete('new');history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));}
try{previousCup=(JSON.parse(localStorage.getItem('coffee-studio-v1')||'{"cups":[]}').cups||[]).filter(c=>c.gear==='moka'&&c.workshop&&c.id!==s.cupId).at(-1)||null;}catch{}
mode=s.poured>0?'blend':s.started?(s.onStove?'heat':'pour'):'water';targetWater??=s.water;targetPowder??=s.powder;
if(!s.started){s.onStove=false;s.basketIn=false;}
const scene=createPosterScene($('#workshopCanvas')),section=createCutaway($('#cutaway'));
s.cup.vessel='ceramic'; // The fixed product set uses a porcelain cup; reports match it.
scene.focus(mode);tool=mode==='blend'?'milk':mode==='heat'?'heat':mode==='pour'?'coffee':'water';
const ticketNumber=Math.min(recipeFlow?999:8,Math.max(1,Number(params.get('ticket'))||(recipeFlow?RECIPE_ORDERS:ORDERS).indexOf(order)+1));
$('#ticket').innerHTML=order?`<strong>来单 <span>${String(ticketNumber).padStart(2,'0')}</span></strong><p>${esc(order.title)}<br>${esc(order.brief)}</p>`:'<strong>自由 <span>01</span></strong><p>这一杯由你决定。<br>做完，再给作品命名。</p>';
$('#ticket').insertAdjacentHTML('beforeend','<dl id="ticketFacts" class="ticket-facts"></dl>');
if(order){const returnUrl=new URL('studio.html',location.href);returnUrl.searchParams.set('order',order.id);returnUrl.searchParams.set('ticket',ticketNumber);$('.scene-copy .back').href=returnUrl.href;}
function mixingUrl(){const url=new URL('moka.html',location.href);if(order)url.searchParams.set('order',order.id);url.searchParams.set('ticket',ticketNumber);return url;}
if(recipeFlow&&params.get('intent')==='refill'){$('.scene-copy .back').href=mixingUrl().href;$('.scene-copy .back').textContent='← 回到调配';}
const status=text=>{$('#sessionStatus').textContent=text;};
function warn(text){if(!text){$('#controlFeedback').textContent='';$('#localWarning').classList.remove('show');return;}$('#controlFeedback').textContent=text;$('#localWarning').textContent=text;$('#localWarning').classList.add('show');warningUntil=performance.now()+4400;status(text);}
function saveSession(){localStorage.setItem(storeKey,JSON.stringify({order:order?.id||null,state:s,targetWater,targetPowder}));}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{saveSession();}catch{}},180);}
function continueRecipe(){
 if(!recipeFlow)return;
 try{
  let previous=null;try{previous=JSON.parse(localStorage.getItem(RECIPE_STORE));}catch{}
  const next=recipeFromWorkshop(s,{session:flowSession,orderId:order?.id||null,ticket:ticketNumber,previous,preserve:params.get('intent')==='refill'});
  saveSession();localStorage.setItem(RECIPE_STORE,JSON.stringify(recipeSnapshot(next)));persistCup();
  const url=mixingUrl();if(next.orderId)url.searchParams.set('order',next.orderId);else url.searchParams.delete('order');url.searchParams.set('ticket',next.ticket);url.searchParams.set('collected',flowSession);location.assign(url.href);
 }catch(error){warn(error.message||'暂时没能保存这锅。咖啡液已保留，可以再试一次。');}
}
const busy=()=>!ready||!!animation||queue.length>0;
const preparationMoving=()=>!!autoFill;
function stopInput(){flow='';tilt=0;drag=null;}
function switchMode(next){if(busy())return;view='';contextOpen=false;delete $('#workshop').dataset.view;mode=next;inspectedPart=next==='water'?'lower':next==='powder'?'basket':'upper';tool=next==='powder'?'powder':next==='heat'?'heat':next==='pour'?'coffee':next==='blend'?'milk':'water';scene.focus(next);renderUI();save();}
function range(id,label,value,min,max,step,ends){return `<label class="quantity-label" for="${id}">${label}<output id="${id}Value">${Math.round(value)} ${id==='heatAmount'?'档':'g'}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><div class="range-ends"><span>${ends[0]}</span><span>${ends[1]}</span></div>`;}
const components={lower:['下壶与安全阀','下壶盛水，受热后的压力差推动水上升。水位不能超过安全阀下缘，给气体留出空间。'],basket:['粉篮与粉层','咖啡粉装满粉篮，轻轻铺平，不压实。水从漏斗细管进入粉层，再经滤网向上。'],filter:['滤网与密封圈','两者正常附在上壶底部。滤网拦住颗粒，密封圈让接缝贴合；合壶前清理壶缘残粉。'],gasket:['密封圈','接缝贴合才能正常工作。合壶前扫净残粉，受热后不能拆开上下壶。'],upper:['上壶与导管','穿过粉层的咖啡液沿中央导管流出，在上壶收集。实时水路在出液时会移动，水位会下降。'],lid:['壶盖与盖钮','壶盖遮挡飞溅，它不是下壶的承压密封件。制作中保持壶盖关闭；出液结束后搅匀再倒杯。移壶握手柄，金属仍然很烫。']};
function grainPreview(coarse){let dots='';for(let i=0;i<34;i++){const x=6+(i*31%78),y=5+(i*19%27),r=coarse?1.8+(i%3)*.35:.8+(i%3)*.2;dots+=`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.72}" transform="rotate(${i*47} ${x} ${y})"/>`;}return `<svg viewBox="0 0 90 38" aria-hidden="true">${dots}</svg>`;}
function renderUI(){
 const copies={water:['水，<br>留点空间。','加入冷水，水面不要超过安全阀下缘。','ACQUA'],powder:['装满，<br>不压实。','看颗粒、装满粉篮，器具会自动合壶。','CAFFÈ'],heat:['水，<br>开始向上。','调节火力，在剖面里看见出液的路径。','MOKA'],pour:['关火，<br>再出杯。','关火、移壶和倾倒会连贯演示。','CAFFÈ'],blend:['这一杯，<br>由你调。','调整配方，看原液如何变成你的作品。','LATTE']};
 if(recipeFlow)copies.blend=['咖啡液，<br>准备好了。','带着这一锅去加料、搅拌，也可以分成两杯。','CAFFÈ'];
 copies.heat=['小火，<br>慢慢来。','观察出液，调节火力，决定何时收杯。','MOKA'];
 const c=view==='structure'?['拆开，<br>看看它。','零件沿装配轴展开，点选了解作用。','MOKA']:view==='section'?['水，<br>为什么向上？','看液态水穿过粉层，在上壶收集。','ACQUA']:view==='cleanup'?['用完，<br>好好收尾。','充分冷却后再拆洗，让下一杯也顺利。','MOKA']:copies[mode];
 $('#workshop').dataset.scene=mode;$('#sceneTitle').innerHTML=c[0];$('#sceneHint').textContent=c[1];$('#latin').textContent=mode==='blend'&&s.cup.milk===0?'CAFFÈ':c[2];$('#microHint').textContent=view?'收起后继续，配方与受热状态保留。':'剖面与模型同步 · 点选部位即可了解';
 const preparing=!s.started,ids=preparing?['water','powder']:s.poured>0?['blend',...(coffeeLeft(s)>=1?['pour']:[])]:['heat'];
 $('#workshop').dataset.preparing=String(preparing);$('#controls').dataset.mode=mode;
 $('#controlsDock').append($('#controls'));$('#controls').prepend($('#tools'));
 $('#sectionHeadingLabel').hidden=preparing;
 $('#tools').innerHTML=ids.map(id=>`<button data-mode="${id}" class="${mode===id?'active':''}" ${busy()||view?'disabled':''}>${{water:'水位',powder:'装粉',heat:'火候',pour:'咖啡余量',blend:'调饮'}[id]}</button>`).join('');
 let html='';
 if(mode==='water')html=range('waterAmount','下壶水量',s.water,0,SPEC.tankMax,1,['空壶','158 g · 可探索超量'])+'<div class="measure-presets"><button data-measure="water" data-value="120">演示安全水位 · 120 g ↗</button></div>';
 if(mode==='powder')html=range('powderAmount','粉篮中的咖啡粉',s.powder,0,SPEC.powder,1,['少量','装满 · 18 g'])+'<div class="measure-presets"><button data-measure="powder" data-value="18">演示装满粉篮 · 18 g ↗</button></div><div class="grind-choices" aria-label="研磨颗粒示意">'+[0,1].map(n=>`<button data-grind="${n}" aria-pressed="${s.grind===n}">${grainPreview(n===0)}<span>${n===0?'偏粗':'中等'}<small>颗粒示意</small></span></button>`).join('')+'</div>';
 if(mode==='heat')html='<div class="heat-papers" aria-label="选择炉火"><button data-fire=".8" aria-pressed="false">♨ 微火</button><button data-fire="1.6" aria-pressed="false">♨ 小火</button><button data-fire="0" aria-pressed="false">关火观察</button></div><div class="brew-states"><span data-brew-state="warm">受热</span><span data-brew-state="flow">出液</span><span data-brew-state="tail">收杯</span></div><div class="brew-progress"><i id="brewProgress"></i></div><p class="heat-note" id="heatNote"></p><p id="batchComparison" class="batch-comparison"></p>';
 if(mode==='pour')html='<p class="pour-summary">壶中还有 <strong id="remainingCoffee">'+Math.round(coffeeLeft(s))+' g</strong><br>已关火。移壶握手柄，充分冷却后再拆洗。</p>';
 if(mode==='blend')html=recipeFlow?'<p class="pour-summary">已收集 <strong>'+s.poured.toFixed(1)+' g</strong> 摩卡咖啡液<br>来单、火候与出液记录一起带到调配桌。</p>':range('milkAmount','牛奶',s.cup.milk,0,250,1,['0 g','250 g'])+range('cupWaterAmount','水',s.cup.water,0,250,1,['0 g','250 g'])+'<div class="ice-row"><span>冰块</span>'+[0,30,60].map(n=>`<button data-ice="${n}" aria-pressed="${s.cup.ice===n}">${n?n+' g':'不加'}</button>`).join('')+'</div>';
 $('#controlBody').innerHTML=html;
 if($('#heatAmount'))$('#heatAmount').disabled=s.progress>=1;
 $('#primaryAction').textContent=mode==='water'?'装粉 →':mode==='powder'?'合壶，开始冲煮 →':mode==='pour'&&coffeeLeft(s)<1&&s.progress<1&&s.poured===0?'移回炉头，继续加热 →':mode==='heat'||mode==='pour'?(s.poured>0?'倒出剩余咖啡 →':'关火，倒入杯中 →'):'这杯完成了 →';
 if(mode==='heat')$('#primaryAction').textContent='关火收杯 →';
 if(recipeFlow&&mode==='blend')$('#primaryAction').textContent='开始加料 →';
 $('#primaryAction').disabled=busy()||!!view||(['heat','pour'].includes(mode)&&coffeeLeft(s)<1&&!(mode==='pour'&&s.progress<1&&s.poured===0));
 $('#controls').inert=busy()||!!view;$('#controls').classList.toggle('busy',busy());
 $('#controlFeedback').textContent='';$('#contextToggle').textContent=view?'收起结构，继续制作 ↙':contextOpen?'收起说明 ↙':'这一处，为什么？ ↗';
 $('#structureToggle').textContent=view?'收起，继续制作 ↙':'看看里面 ↗';$('#structureToggle').setAttribute('aria-pressed',String(!!view));
 $('#structureToggle').disabled=busy();$('#cleanupHelp').disabled=busy();
 $('#insideViews').hidden=!['section','structure'].includes(view);for(const b of document.querySelectorAll('[data-inside-view]'))b.setAttribute('aria-pressed',String(view===b.dataset.insideView));
 $('#recipe').hidden=recipeFlow||mode!=='blend'||!!view;$('#finishCup').hidden=true;$('#newBatch').hidden=recipeFlow||!!view||s.poured<1;$('#cleanupHelp').hidden=!!view||s.poured<1;renderContext();updateNumbers();
}
function renderContext(){
 $('#workshop').dataset.reading=String(contextOpen);$('#contextBody').hidden=!contextOpen;$('#contextToggle').setAttribute('aria-expanded',String(contextOpen));$('#controls').inert=busy()||!!view||contextOpen;if(!contextOpen)return;
 if(view==='cleanup'){$('#contextBody').innerHTML='<h3>一把冷壶的收尾</h3><p class="reading-pause">这是充分冷却后的清理示范，当前这杯的配方与受热状态保留。</p><ol class="cleanup-sequence"><li><strong>01 · 先等它充分冷却</strong><span>热壶不要拧开。握手柄移到合适的耐热表面。</span></li><li><strong>02 · 拆开、弃粉、手洗</strong><span>这把铝制壶按说明用清水手洗；不要用洗碗机，也不要敲打粉篮。</span></li><li><strong>03 · 晾干，拆开放置</strong><span>检查滤网、密封圈与安全阀，干透后收好各部件。</span></li></ol><p class="small">不同材质和型号的清洁方法可能不同。</p><a href="https://www.bialetti.com/media/manual/caffettiere/MOKA_EXPRESS-manual.pdf" target="_blank" rel="noopener">查看对应器具说明 ↗</a>';return;}
 const blending=mode==='blend'&&!view,part=blending?['杯中的咖啡','原液已经萃取完成。加水会稀释，加奶会改变配方与颜色；不会从粉层再萃取出更多咖啡。']:components[inspectedPart],copy=view||inspectedPart?`<h3>${part[0]}</h3><p>${part[1]}</p>`:'';
 $('#contextBody').innerHTML=copy+(blending?'<p>加奶改变配方与示意颜色，不会再次萃取咖啡粉。摩卡原液与意式浓缩采用不同器具；未制作奶泡，就不会自动出现拉花。</p>':'')+(blending?'<p>这把铝制壶冷却后再拆开，弃粉渣，用清水手洗并晾干各部件，拆开放置。清洁方式按对应器具说明。</p>':'')+'<p class="reading-pause">阅读中 · 虚拟制作暂停，收起继续。</p><p>实物按器具说明操作。火焰留在壶底，安全阀不要朝向人；移壶握手柄，充分冷却后才能拆洗。</p><p class="small">内腔、容量和流量为教学示意，加热时间已压缩。</p><a href="https://www.bialetti.com/media/manual/caffettiere/MOKA_EXPRESS-manual.pdf" target="_blank" rel="noopener">查看器具使用说明 ↗</a>';
}
function inspect(part){if(!components[part])return;inspectedPart=part;contextOpen=true;$('#cutaway').dataset.selected=part;$('#contextToggle').textContent='收起说明 ↙';renderContext();status('正在了解：'+components[part][0]);}
function closeContext(){if(recipeFlow&&params.get('inspect')==='structure'&&params.get('intent')==='refill'){location.assign(mixingUrl().href);return;}view='';contextOpen=false;delete $('#workshop').dataset.view;delete $('#cutaway').dataset.selected;scene.focus(mode);renderUI();}
function toggleStructure(){if(busy())return;if(view){closeContext();return;}view='section';contextOpen=true;inspectedPart='lower';$('#workshop').dataset.view=view;scene.focus(view);renderUI();}
function updateNumbers(){
 const fact=$('#ticketFacts');fact.innerHTML=s.started?`<dt>${s.poured>0?'成杯':'出液'}</dt><dd>${Math.round(s.poured>0?totalCup(s):s.brewed)} g</dd><dt>状态</dt><dd>${mode==='blend'?'调配中':contextOpen||view?'阅读暂停':s.heat===0?s.lastFlow>.08?'余热出液':'已关火':s.brewed>.5?'正在出液':'正在受热'}</dd>`:`<dt>水</dt><dd>${Math.round(s.water)} g</dd><dt>咖啡粉</dt><dd>${Math.round(s.powder)} g</dd>`;
 for(const button of document.querySelectorAll('[data-fire]')){const n=Number(button.dataset.fire);button.setAttribute('aria-pressed',String(n===0?s.heat===0:n<1?s.heat>0&&s.heat<1:s.heat>=1));button.disabled=busy()||s.progress>=1;}
 for(const button of document.querySelectorAll('.part-choices [data-inspect]'))button.setAttribute('aria-pressed',String(inspectedPart===button.dataset.inspect));
 const vals={waterAmount:s.water,powderAmount:s.powder,heatAmount:s.heat,milkAmount:s.cup.milk,cupWaterAmount:s.cup.water};
 for(const [id,n] of Object.entries(vals)){const out=$('#'+id+'Value');if(out)out.textContent=id==='heatAmount'?(n===0?'关闭':n<1?'微火':n<=2?'小火':'大火'):Math.round(n)+' g';}
 const read=view?components[inspectedPart][0]:mode==='heat'?`${s.progress>=1?'出液结束':s.lastFlow>.08?(s.heat>0?'正在出液':'余热出液'):s.heat>0?'正在受热':'已关火'} · ${Math.round(s.brewed)} g`:mode==='blend'?`摩卡原液 ${Math.round(s.poured)} g · 成杯 ${Math.round(totalCup(s))} g`:mode==='pour'?`壶中余量 ${Math.round(coffeeLeft(s))} g`:mode==='water'?`水位 ${Math.round(s.water)} g`:`粉量 ${Math.round(s.powder)} g`;
 $('#objectReadout').innerHTML=read+`<small>${isHot(s)?'金属很烫 · 用手柄移壶 · 冷却后再拆洗':view?'教学结构 · 制作暂停':'教学示意 · 实物按安全阀与粉篮位置'}</small>`;
 if($('#brewProgress'))$('#brewProgress').style.width=s.progress*100+'%';
 if($('#heatNote')){const stage=s.progress>=.82?'tail':s.brewed>.5?'flow':'warm';for(const mark of document.querySelectorAll('[data-brew-state]'))mark.classList.toggle('active',mark.dataset.brewState===stage);$('#heatNote').textContent=s.progress>=1?'演示已自动关火保护。出液结束，可以出杯。':s.heat===0?(s.lastFlow>.08?'已关火，余热仍在推动少量液体；移离炉头后会更快停止。':'已关火。已有原液可以出杯，也可以重新调小火继续。'):s.progress>.82?'流量正在回落。你可以关火收杯，比较这一锅收集了多少。':s.brewed>.5?'正在出液。调小火会减慢这段演示，粉层与水路继续同步。':'水面上方的空气与水蒸气压力变化，推动液态水进入细管。';const stop=$('[data-stop-heat]');if(stop)stop.disabled=busy()||s.heat===0;const comparison=$('#batchComparison');if(comparison)comparison.textContent=(previousCup?'上一锅：'+Math.round(previousCup.baseMass)+' g 原液 · 试着改变收杯时机。':'加热时间已压缩 · 流量为教学示意')+(contextOpen?' · 阅读暂停':'');}
 if($('#remainingCoffee'))$('#remainingCoffee').textContent=Math.round(coffeeLeft(s))+' g';
 if(['heat','pour'].includes(mode))$('#primaryAction').disabled=busy()||!!view||coffeeLeft(s)<1&&!(mode==='pour'&&s.progress<1&&s.poured===0);
 const over=targetWater>SPEC.waterMax;
 $('#sectionNote').textContent=view==='section'?'蓝色为液态水，棕色为经过粉层的咖啡液；路径为原理示意。':view==='structure'?'沿装配轴认识部件。实物需充分冷却后才能拆开。':over?'水位超过安全阀下缘，向下调低水位线。':mode==='water'?(autoFill?(autoFill.target<s.water?'正在倒出多余的水，保留其他准备。':'正在加入清水，水面与用量同步变化。'):'拖动圆点调水位，留出上方的空气空间。'):mode==='powder'?(autoFill?'咖啡粉正在落入粉篮，装满后铺平。':'颗粒放大示意。装满、铺平，不压实。'):mode==='heat'?s.brewed>0?'水穿过粉层，咖啡液从中央导管流出。':'下壶受热，水面上方的气体压力开始变化。':mode==='blend'?'咖啡基底已完成，配方仍可自由调整。':'关火不会让金属立刻冷却。';
 $('#sectionNote').classList.toggle('alert',over||isHot(s));
 if(mode==='blend'){const cup=cupSnapshot(s),check=checkOrder(cup,order);const facts=checkOrder(cup,order),needed=order?Math.max(0,order.range[0]-totalCup(s)):0,tip=order&&needed>0?(order.milk==='more'?'加奶可同时改变份量与配方。':'还差约 '+Math.ceil(needed)+' g 达到来单份量；出杯后加水可做成长杯。'):order&&facts.met?'来单配方已满足，可以保留这杯或继续发挥。':'改变添加比例，看看液面和示意颜色怎样变化。';$('#recipe').innerHTML=`<strong>这一杯的配方</strong><p>摩卡原液 ${Math.round(s.poured)} g · 牛奶 ${Math.round(s.cup.milk)} g · 水 ${Math.round(s.cup.water)} g${s.cup.ice?' · 冰 '+Math.round(s.cup.ice)+' g':''}</p><p class="match">${order?(check.met?'符合来单 ✓':'来单反馈：'+check.checks.filter(x=>!x.met).map(x=>x.label).join(' · ')):'自由作品 · 用配方给这一杯签名'}</p><p class="recipe-tip">${tip}</p>`;}
 if(!s.started){$('#primaryAction').disabled=busy()||!!view||preparationMoving();for(const b of $('#tools').querySelectorAll('button'))b.disabled=busy()||!!view||preparationMoving();}
 section.update(s,mode,{locked:busy(),view});
}
function startSequence(steps,done){queue=steps;afterSequence=done;nextAnimation();renderUI();}
function nextAnimation(){animation=queue.shift()||null;if(animation){animation.elapsed=0;animation.begin?.();}else{const done=afterSequence;afterSequence=null;stopInput();done?.();renderUI();save();}}
function runAnimation(dt){if(!animation)return;animation.elapsed+=dt;const p=clamp(animation.elapsed/animation.duration,0,1),e=p*p*(3-2*p);animation.frame?.(e,dt);if(p>=1){animation.end?.();nextAnimation();}}
function fill(kind,amount,{direct=false}={}){if(busy()||s.started)return;if(isHot(s)||s.open<.95){warn('先让器具冷却并打开，再修改原料。');return;}const target=clamp(amount,0,kind==='water'?SPEC.tankMax:SPEC.powder);if(kind==='water'){targetWater=target;tool='water';}else{targetPowder=target;tool='powder';}if(direct){autoFill=null;(kind==='water'?measureWater:measurePowder)(s,target);flow='';tilt=0;}else autoFill=Math.abs(target-s[kind])>.05?{kind,target,elapsed:0}:null;$('#controlFeedback').textContent='';updateNumbers();save();}
function brew(){
 if(busy()||s.started||preparationMoving())return;
 // These are chosen quantities, not a drag skill test. Validate before presenting assembly.
 measureWater(s,targetWater);measurePowder(s,targetPowder);
 const issue=preparationIssue({...s,basketIn:true,crumbs:0});if(issue){if(s.water<SPEC.waterMin||s.water>SPEC.waterMax)switchMode('water');warn(issue.replace('取出粉篮，继续加水','调节水位').replace('先倒出一点','把水位调低一点'));return;}
 s.basketIn=false;if(!s.events.includes('assisted-assembly'))s.events.push('assisted-assembly');mode='powder';tool='powder';scene.focus('powder');
 startSequence([
  {duration:1.05,begin(){tool='basket';scene.focus('close');status('粉篮落位。装满、铺平，不压实。');},frame(t){drag={kind:'basket',dx:-1.9*t,dy:Math.sin(t*Math.PI)*.28};},end(){setBasket(s,true);drag=null;}},
  {duration:.55,begin(){tool='brush';status('扫净壶缘，让密封圈正常贴合。');},frame(t){drag={kind:'brush',dx:Math.sin(t*Math.PI*2)*.42};},end(){brushRim(s,200);drag=null;}},
  {duration:.9,begin(){tool='upper';scene.focus('close');status('上下壶自动旋合，手柄不用于拧紧。');},frame(t){s.open=1-t;},end(){s.open=0;if(!s.events.includes('assembled'))s.events.push('assembled');}},
  {duration:1,begin(){tool='handle';scene.focus('transport');status('握手柄移到炉头，放稳再开火。');},frame(t){drag={kind:'transport',dx:1.8*t};},end(){drag=null;placePot(s,true);setHeat(s,1.6);mode='heat';tool='heat';scene.focus('heat');inspectedPart='upper';}}
 ],()=>{status('小火开始冲煮。实时剖面同步显示水位、粉层和出液路径。');});
}
function serve(){
 if(busy()||coffeeLeft(s)<1)return;
 if(totalCup(s)>=SPEC.cupMax){warn('杯子已满。回到调饮，减少添加材料后再加咖啡。');return;}
 setHeat(s,0);if(s.stopProgress===null)s.stopProgress=s.progress;const from=s.onStove?1.8:0,amount=Math.min(coffeeLeft(s),SPEC.cupMax-totalCup(s));
 mode='pour';
 startSequence([
  {duration:.85,begin(){tool='handle';scene.focus('transport');status(isHot(s)?'先关火，再握住手柄移开。金属仍然很烫。':'先关火，再用手柄将壶移到隔热垫。');},frame(t){drag={kind:'transport',dx:-from*t};},end(){placePot(s,false);drag=null;mode='pour';tool='coffee';scene.focus('pour');}},
  {duration:1.15,begin(){tool='stir';status('出液结束后先轻轻搅匀，再倒入杯中。实物握盖钮，避开热金属。');},frame(t){drag={kind:'stir',dx:Math.sin(t*Math.PI*4)*.14,dz:Math.cos(t*Math.PI*4)*.14};},end(){s.stirred=true;drag=null;tool='coffee';}},
  {duration:.85,frame(t){tilt=t*.70;}},
  {duration:Math.max(1,amount/45),frame(t,dt){tilt=.70;flow='coffee';pourCoffee(s,45,dt);},end(){/* Final fractional frame transfers only the remaining liquid. */pourCoffee(s,amount,1);flow='';}},
  {duration:.7,frame(t){tilt=(1-t)*.70;},end(){tilt=0;flow='';mode='blend';tool='milk';scene.focus('blend');inspectedPart='upper';}}
 ],()=>{if(recipeFlow){continueRecipe();return;}status('咖啡已经入杯。调整牛奶、水和冰块，配方与颜色会一起变化。');});
}
function resumeHeating(){if(busy())return;const issue=preparationIssue(s);if(issue){warn(issue);return;}scene.focus('transport');tool='handle';startSequence([{duration:.85,frame(t){drag={kind:'transport',dx:1.8*t};},end(){drag=null;placePot(s,true);warn(setHeat(s,1.6));mode='heat';tool='heat';scene.focus('heat');}}],()=>{status('器具已放稳，继续加热。金属很烫，移壶用手柄。');});}
$('#primaryAction').addEventListener('click',()=>{if(mode==='water')switchMode('powder');else if(mode==='powder')brew();else if(mode==='pour'&&coffeeLeft(s)<1&&s.progress<1&&s.poured===0)resumeHeating();else if(['heat','pour'].includes(mode))serve();else if(recipeFlow)continueRecipe();else openPoster();});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.insideView&&view){view=b.dataset.insideView;$('#workshop').dataset.view=view;scene.focus(view);renderUI();return;}
 if(b.dataset.inspect&&!busy()){inspect(b.dataset.inspect);return;}
 if(b.dataset.fire!==undefined){warn(setHeat(s,Number(b.dataset.fire)));status(Number(b.dataset.fire)===0?'已关火，观察余热出液；随时可以收杯。':'火力已经调整，水路与出液继续同步。');updateNumbers();save();return;}
 if(b.hasAttribute('data-stop-heat')){setHeat(s,0);status('你关掉了炉火。观察剖面里的余热出液，决定何时移壶收杯。');updateNumbers();save();return;}
 if(b.dataset.mode){if(!preparationMoving())switchMode(b.dataset.mode);return;}
 if(b.dataset.measure){fill(b.dataset.measure,Number(b.dataset.value));const input=$('#'+(b.dataset.measure==='water'?'waterAmount':'powderAmount'));if(input)input.value=b.dataset.value;updateNumbers();return;}
 if(b.dataset.grind!==undefined&&!s.started){s.grind=Number(b.dataset.grind);renderUI();save();return;}
 if(b.dataset.ice!==undefined){const issue=reviseBlend(s,'ice',Number(b.dataset.ice));renderUI();warn(issue);save();return;}
 if(b.dataset.poster==='close'){$('#posterDialog').close();return;}
 if(b.dataset.poster==='save')downloadPoster();if(b.dataset.style){posterStyle=b.dataset.style;updatePoster();}if(b.dataset.palette){posterPalette=b.dataset.palette;updatePoster();}
});
$('#controlBody').addEventListener('input',e=>{const n=Number(e.target.value),id=e.target.id;
 if(id==='waterAmount')fill('water',n,{direct:true});if(id==='powderAmount')fill('powder',n,{direct:true});
 if(id==='heatAmount'){const issue=setHeat(s,n);if(issue)warn(issue);e.target.value=s.heat;save();}
 if(id==='milkAmount'||id==='cupWaterAmount'){const type=id==='milkAmount'?'milk':'water',previous=s.cup[type];warn(reviseBlend(s,type,n));tool=type==='milk'?'milk':'cupwater';e.target.value=s.cup[type];if(s.cup[type]>previous){flow=tool;tilt=.45;blendFlowUntil=performance.now()+500;}save();}
 updateNumbers();
});
let blendFlowUntil=0;
$('#structureToggle').addEventListener('click',toggleStructure);
$('#cleanupHelp').addEventListener('click',()=>{if(busy())return;view='cleanup';contextOpen=true;$('#workshop').dataset.view=view;scene.focus(view);renderUI();});
$('#contextToggle').addEventListener('click',()=>{if(view)closeContext();else{contextOpen=!contextOpen;renderContext();$('#contextToggle').textContent=contextOpen?'收起说明 ↙':'这一处，为什么？ ↗';}});
$('#cutaway').addEventListener('click',e=>{const part=e.target.closest('[data-component]');if(part)inspect(part.dataset.component);});
$('#cutaway').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){const part=e.target.closest('[data-component]');if(part){e.preventDefault();inspect(part.dataset.component);}}});
const sectionSvg=$('#cutaway');
sectionSvg.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-quantity]')||busy()||view||s.started)return;levelDragging=true;sectionSvg.setPointerCapture(e.pointerId);e.preventDefault();fill('water',section.waterAt(e.clientX,e.clientY),{direct:true});});
sectionSvg.addEventListener('pointermove',e=>{if(levelDragging)fill('water',section.waterAt(e.clientX,e.clientY),{direct:true});});
const stopLevelDrag=()=>{levelDragging=false;save();};sectionSvg.addEventListener('pointerup',stopLevelDrag);sectionSvg.addEventListener('pointercancel',stopLevelDrag);sectionSvg.addEventListener('lostpointercapture',stopLevelDrag);
sectionSvg.addEventListener('keydown',e=>{if(!e.target.closest('[data-quantity]')||busy()||view||s.started)return;const step=e.shiftKey?1:5,n={ArrowUp:s.water+step,ArrowRight:s.water+step,ArrowDown:s.water-step,ArrowLeft:s.water-step,Home:0,End:SPEC.tankMax}[e.key];if(n!==undefined){e.preventDefault();fill('water',n,{direct:true});}});
const canvas=$('#workshopCanvas');canvas.addEventListener('pointerdown',e=>{if(busy())return;const hit=scene.pick(e.clientX,e.clientY);if(!hit)return;const part=hit.action==='handle'?'upper':hit.action==='lidknob'?'lid':hit.action;if(components[part])inspect(part);});
canvas.addEventListener('pointermove',e=>{canvas.style.cursor=!busy()&&scene.pick(e.clientX,e.clientY)?'pointer':'default';});
$('#newBatch').addEventListener('click',()=>{if(busy())return;previousCup=persistCup();const batch=s.batch+1;s=freshWorkshop();s.batch=batch;targetWater=targetPowder=0;autoFill=null;mode='water';tool='water';view='';contextOpen=false;delete $('#workshop').dataset.view;scene.focus('water');openPot();status('上一杯已留在工作室。换一把冷壶和新原料。');});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#workshop').requestFullscreen();}catch{warn('可以展开浏览器面板继续体验。');}});
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'全屏工作台');$('#workshop').dataset.fullscreen=String(!!document.fullscreenElement);});
function openPot(){const from=s.open;startSequence([{duration:1.2,frame(t){s.open=from+(1-from)*t;},end(){s.open=1;if(!s.events.includes('opened'))s.events.push('opened');}}],()=>{if(Math.abs(targetWater-s.water)>.05)fill('water',targetWater);else if(Math.abs(targetPowder-s.powder)>.05)fill('powder',targetPowder);status('拖动实时剖面的水位线，观察实时水位变化。');});}
scene.ready.then(()=>{ready=true;$('#stage').classList.remove('model-loading');$('#stage').setAttribute('aria-busy','false');if(recipeFlow&&params.get('inspect')==='structure'){if(!s.started)s.open=1;view='structure';contextOpen=true;scene.focus(view);$('#workshop').dataset.view=view;renderUI();status('这把摩卡壶的结构。收起后回到原来的配方。');}else if(!s.started)openPot();else{renderUI();status(mode==='blend'?'咖啡液已收集，可以继续加料。':s.progress>=1?'出液已完成，炉火已关闭。':s.onStove?'炉火已关闭，调节火力继续这锅。':'这一锅已保留，可以继续加热或出杯。');}}).catch(error=>{console.error(error);$('#stage').classList.remove('model-loading');status('模型未加载，请刷新重试。');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopInput();save();}});
window.addEventListener('pagehide',()=>{clearTimeout(saveTimer);s.heat=0;try{saveSession();}catch{}});
function frame(now){
 const dt=Math.min(.08,(now-(lastTime||now))/1000);lastTime=now;
 const paused=document.hidden||contextOpen||!!view||$('#posterDialog').open;
 if(!paused){
  if(animation)runAnimation(dt);
  else if(!s.started&&ready){
   const dw=targetWater-s.water,dp=targetPowder-s.powder;flow='';tilt=0;
   if(autoFill){const a=autoFill;a.elapsed+=dt;const adding=a.target>s[a.kind];tool=a.kind==='water'?(adding?'water':'drain'):'powder';tilt=a.kind==='water'?.48:.55;if(a.elapsed>.45){const next=advanceMeasuredAmount(s[a.kind],a.target,dt,a.kind==='water'?80:14);(a.kind==='water'?measureWater:measurePowder)(s,next);if(adding||a.kind==='water')flow=tool;if(Math.abs(a.target-s[a.kind])<.03){autoFill=null;flow='';tilt=0;save();}}}else tool=mode==='water'?'water':'powder';
  }else if(now>blendFlowUntil){flow='';tilt=0;}
  tickWorkshop(s,dt,{paused:!!animation});
  if(s.progress>=1&&s.heat>0){setHeat(s,0);renderUI();status('出液结束，炉火已关闭。壶身仍热，请用手柄出杯。');save();}
 }
 displayTilt+=((paused?0:tilt)-displayTilt)*(1-Math.exp(-dt*12));
 scene.update(s,{tool,view,selected:contextOpen?inspectedPart:'',tilt:displayTilt,drag:paused?null:drag,flow:paused||displayTilt<.12?'':flow,time:now/1000,dt});section.animate(mode,view,dt);
 if(now-lastUI>90){lastUI=now;updateNumbers();}if(s.started&&now-lastPersist>2000){lastPersist=now;save();}
 if(now>warningUntil)$('#localWarning').classList.remove('show');
 if(audio)audio.gain.gain.setTargetAtTime(sound&&!paused&&(flow||s.heat>0)?(flow?.13:.05):0,audio.ctx.currentTime,.08);
 requestAnimationFrame(frame);
}
renderUI();requestAnimationFrame(frame);
Object.defineProperty(window,'mokaWorkshopSnapshot',{get:()=>({state:structuredClone(s),mode,view,busy:busy(),moving:preparationMoving()})});

function persistCup(){s.cupId??=Date.now();const cup=cupSnapshot(s,s.cupId);if(cup.baseMass<1)return;try{const store=JSON.parse(localStorage.getItem('coffee-studio-v1')||'{"cups":[]}');store.cups||=[];const index=store.cups.findIndex(c=>c.id===cup.id);if(index>=0)store.cups[index]=cup;else store.cups.push(cup);store.cups=store.cups.slice(-10);store.nextId=Math.max(...store.cups.map(c=>Number(c.id)||0))+1;localStorage.setItem('coffee-studio-v1',JSON.stringify(store));}catch{}return cup;}
function reportHighlights(report,cup){const observations=report.observations;return [...new Set([observations.find(x=>x.includes('收杯')),cup.water>0?observations.find(x=>x.startsWith('出杯后')):null,cup.milk>0?observations.find(x=>x.startsWith('加入')&&x.includes('牛奶')):null,cup.ice>0?observations.find(x=>x.includes('冰块')):null,...observations].filter(Boolean))].slice(0,4);}
function openPoster(){
 if(s.poured<1){warn('先倒一杯咖啡。');return;}stopInput();poster=structuredClone(cupSnapshot(s));const r=workshopReport(poster,order);$('#posterName').value=drinkName(poster);$('#posterStory').innerHTML=`<h3>${esc(r.title)}</h3><p>${esc(r.intro)}</p>${reportHighlights(r,poster).map(x=>'<p>'+esc(x)+'</p>').join('')}`;$('#posterDialog').showModal();updatePoster();persistCup();
}
async function updatePoster(){
 if(!poster)return;const rev=++posterRevision;const cup=structuredClone(poster),report=workshopReport(cup,order),offscreen=document.createElement('canvas');
 $('#posterStyles').innerHTML=REPORT_STYLES.map(x=>`<button data-style="${x.id}" class="${posterStyle===x.id?'active':''}">${x.name}</button>`).join('');
 $('#posterPalettes').innerHTML=PALETTES.map(x=>`<button data-palette="${x.id}" class="${posterPalette===x.id?'active':''}"><i style="background:${x.accent}"></i>${x.name}</button>`).join('');
 await drawReport(offscreen,{cup,report,style:posterStyle,palette:posterPalette,title:$('#posterName').value,position:posterPosition});if(rev!==posterRevision)return;$('#posterCanvas').getContext('2d').drawImage(offscreen,0,0);$('#posterCanvas').dataset.recipe=JSON.stringify(cup);
}
$('#posterName').addEventListener('input',()=>{s.cupName=$('#posterName').value.slice(0,20);if(poster)poster.name=s.cupName;updatePoster();persistCup();save();});
async function downloadPoster(){
 const button=$('[data-poster="save"]');button.disabled=true;button.textContent='正在生成 PNG…';
 try{await updatePoster();const blob=await new Promise(resolve=>$('#posterCanvas').toBlob(resolve,'image/png'));if(!blob)throw new Error('Empty PNG');
  let url='';
  if(['127.0.0.1','localhost'].includes(location.hostname)){try{const response=await fetch('/api/export-poster',{method:'POST',headers:{'Content-Type':'image/png'},body:blob});if(response.ok)url=(await response.json()).url;}catch{}}
  const localCopy=!!url;if(!url)url=URL.createObjectURL(blob);
  let preview=$('#posterExportLink');if(!preview){preview=document.createElement('a');preview.id='posterExportLink';preview.className='poster-back';preview.target='_blank';preview.rel='noopener';button.after(preview);}
  preview.href=url;preview.textContent='打开本期 PNG，可另存图片 ↗';
  if(!localCopy){const a=document.createElement('a');a.href=url;a.download='摩卡特刊-'+posterPalette+'.png';a.click();}
  button.textContent='PNG 已生成 · 再导出 ↗';
 }catch(error){console.error(error);button.textContent='生成失败，重试 ↗';}finally{button.disabled=false;}
}
$('#posterCanvas').addEventListener('pointerdown',e=>{posterDrag={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...posterPosition}};e.target.setPointerCapture(e.pointerId);});
$('#posterCanvas').addEventListener('pointermove',e=>{if(!posterDrag)return;const r=e.target.getBoundingClientRect();posterPosition={x:clamp(posterDrag.start.x+(e.clientX-posterDrag.x)/r.width,.36,.73),y:clamp(posterDrag.start.y+(e.clientY-posterDrag.y)/r.height,.37,.51)};updatePoster();});
$('#posterCanvas').addEventListener('pointerup',()=>posterDrag=null);$('#posterCanvas').addEventListener('pointercancel',()=>posterDrag=null);
function initSound(){const ctx=new AudioContext(),buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.18;const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;const gain=ctx.createGain();gain.gain.value=0;source.connect(filter).connect(gain).connect(ctx.destination);source.start();return {ctx,gain,filter};}
$('#soundToggle').addEventListener('click',()=>{sound=!sound;if(sound&&!audio)audio=initSound();audio?.ctx.resume();$('#soundToggle').textContent='声音 '+(sound?'开':'关');$('#soundToggle').setAttribute('aria-pressed',String(sound));$('#soundToggle').setAttribute('aria-label',sound?'关闭冲煮声音':'打开冲煮声音');});
