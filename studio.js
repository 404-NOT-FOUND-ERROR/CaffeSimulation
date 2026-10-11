import {createMoka} from './moka-asset.js';
import {GEARS,newProcess,tick,makeCup,cupFacts,drinkName,checkOrder,makeReport,recipeText,sanitizeCup,clamp} from './studio-model.mjs';
import {RECIPE_ORDERS as ORDERS} from './recipe-orders.mjs';
import {cupSVG,gearIcon,apparatusSVG,escapeHTML as esc,PALETTES,REPORT_STYLES,drawReport} from './studio-art.js';
import {PREPARATION,newPreparation,targetFor,taskComplete,taskAllowed,preparationReady,nextPreparationTask,advancePreparation,quickPreparation} from './studio-steps.mjs';
import {preparationSVG,prepToolIcon} from './studio-prep-art.js';
import {renderEntrance,initEntrance} from './studio-entrance.js';

const $=s=>document.querySelector(s),round=n=>Number(n).toFixed(0);
const S={page:'lobby',gear:'moka',surface:'brew',view:'operate',part:'basket',prepTask:'water',preparations:Object.fromEntries(Object.keys(GEARS).map(k=>[k,newPreparation()])),order:null,offers:[],settings:Object.fromEntries(Object.entries(GEARS).map(([k,v])=>[k,{...v.defaults}])),processes:{},cups:[],selected:null,nextId:1,report:null,style:'manifesto',palette:'torino',details:true,title:'',position:{x:.58,y:.49}};
for(const key of Object.keys(GEARS))S.processes[key]=newProcess(key,S.settings[key]);
let model=null,toastTimer=null,reportRevision=0,pourPointer=null,reportPointer=null,prepHold=null,prepDrag=null,lastFrame=0,lastUI=0;
const process=()=>S.processes[S.gear],settings=()=>S.settings[S.gear],selectedCup=()=>S.cups.find(c=>c.id===S.selected);
const preparation=()=>S.preparations[S.gear],ready=()=>preparationReady(S.gear,preparation(),settings());
const dirty=()=>{try{localStorage.setItem('coffee-studio-v1',JSON.stringify({cups:S.cups.slice(-10),nextId:S.nextId}));}catch{}};
function toast(s){$('#studioToast').textContent=s;$('#studioToast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#studioToast').classList.remove('show'),3000);}
function pickOrders(){
 const previous=new Set(S.offers.map(o=>o.id)),fresh=ORDERS.filter(o=>!previous.has(o.id));
 S.offers=(fresh.length>=3?fresh:ORDERS).map(o=>({o,n:Math.random()})).sort((a,b)=>a.n-b.n).slice(0,3).map(x=>x.o);
 if(S.order){S.offers=S.offers.filter(o=>o.id!==S.order.id).slice(0,2);S.offers.splice(Math.min(2,Math.max(0,(S.ticket||1)-1)),0,S.order);}
}
function renderOrders(){
 $('#orderCards').innerHTML=S.offers.map(o=>`<button class="order-card ${S.order?.id===o.id?'active':''}" data-order="${o.id}" aria-pressed="${S.order?.id===o.id}"><strong>${esc(o.title)}</strong><small>${esc(o.brief)}</small></button>`).join('');
 $('#sessionMode').textContent=S.order?'正在接单':'自由创作';
 $('#activeOrder').hidden=!S.order;
 if(S.order)$('#activeOrder').innerHTML=`<span class="overline">这张订单，由你来做</span><strong>${esc(S.order.title)}</strong><p>${esc(S.order.brief)}</p><button class="text-button" data-action="free">放回订单 · 自由发挥</button>`;
 $('.free-button').classList.toggle('active',!S.order);
 renderEntrance(S);
}
function renderEquipment(){
 $('#equipment').innerHTML=Object.entries(GEARS).map(([id,g])=>`<button data-gear="${id}" class="gear-button ${S.gear===id&&S.surface==='brew'?'active':''}" aria-pressed="${S.gear===id&&S.surface==='brew'}">${gearIcon(id)}<span><strong>${g.name}</strong><small>${g.tag}</small></span></button>`).join('');
}
const PAGES=['choose','prepare','brew','cup','publish'];
function openMoka(){const target=new URL('moka-brew.html',location.href);target.searchParams.set('new','1');target.searchParams.set('session',crypto.randomUUID().replaceAll('-',''));if(S.order){target.searchParams.set('order',S.order.id);target.searchParams.set('ticket',S.ticket||1);}location.href=target.href;}
function goPage(page,push=true){
 if(!['lobby',...PAGES].includes(page))return;
 if(S.gear==='moka'&&['prepare','brew'].includes(page)){openMoka();return;}
 prepHold=null;prepDrag=null;pourPointer=null;
 const p=process();p.holding=false;if(p.status==='running'&&page!=='brew')p.status='paused';
 if(page!=='publish'&&$('#reportDialog').open)$('#reportDialog').close();
 if(page==='publish'&&!selectedCup()){toast('先做一杯咖啡，再让它登上特刊。');page='cup';}
 S.page=page;S.surface=['cup','publish'].includes(page)?'cup':'brew';
 if(page==='prepare')S.prepTask=nextPreparationTask(S.gear,preparation(),settings());
 if(push){const url=new URL(location.href);if(page==='lobby')url.searchParams.delete('page');else url.searchParams.set('page',page);url.searchParams.set('gear',S.gear);if(S.order){url.searchParams.set('order',S.order.id);url.searchParams.set('ticket',S.ticket||1);}else{url.searchParams.delete('order');url.searchParams.delete('ticket');}history.pushState({page,gear:S.gear},'',url);}
 render();if(push&&['lobby','choose'].includes(page))window.scrollTo(0,0);if(page==='publish')openReport();
}
function renderPage(){
 $('.studio').dataset.page=S.page;$('#journeyNav').hidden=S.page==='lobby';$('#backLobby').hidden=S.page==='lobby';
 const copy={lobby:['咖啡工作室 / 随你发挥','这一杯，<br>你来定。','挑一张来单，或从一把壶开始。'],choose:['选择器具 / 01','选一件，<br>好器具。','每种做法，都有自己的节奏。'],prepare:['动手准备 / 02','亲手，<br>备一杯。','加水、装粉、组装，亲手做一遍。'],brew:['冲煮现场 / 03',S.gear==='pour'?'水流，<br>随你走。':S.gear==='espresso'?'这一刻，<br>该收杯？':'火候，<br>你来定。','边做边观察，随时打开器具看原理。'],cup:['调配与出杯 / 04','调出，<br>这一杯。','加一点水、牛奶、奶泡，或保留原液。'],publish:['本期特刊 / 05','留住，<br>这一杯。','把制作记录，变成自己的咖啡报道。']};
 const [label,title,intro]=copy[S.page];$('#pageLabel').textContent=label;$('#pageTitle').innerHTML=title;$('#pageIntro').textContent=intro;
 $('#pageNote').innerHTML=S.page==='lobby'?'':S.order?`<strong>正在做：${esc(S.order.title)}</strong><p>${esc(S.order.story)}</p><p>${esc(S.order.brief)}</p><button class="text-button" data-action="free">放回来单，自由制作 ↗</button>`:'<strong>自由制作</strong><p>器具、配方与杯子都由你决定。可以随时返回，也可以再试另一种做法。</p>';
 $('#choiceDeck').hidden=S.page!=='choose';
 if(S.page==='choose')$('#choiceDeck').innerHTML=Object.entries(GEARS).map(([id,g])=>`<article class="choice-card">${gearIcon(id)}<span class="overline">${g.latin} / ${g.tag}</span><h2>${g.name}</h2><p>${g.verb}</p><p class="choice-fit">${S.order?.gear?(S.order.gear===id?'这张订单指定的器具':'订单指定了其他器具，也可自由尝试'):'可做黑咖，也可继续加水、加奶'}</p><button class="primary" data-gear="${id}">选它，动手准备 ↗</button></article>`).join('');
 const completed={choose:true,prepare:ready(),brew:!!process().cupId,cup:!!selectedCup(),publish:false};
 $('#journeyNav').innerHTML=`<button data-page="lobby">← 工作室</button>${PAGES.map((page,i)=>`<button data-page="${page}" class="journey-step ${S.page===page?'active':''} ${completed[page]?'done':''}" ${S.page===page?'aria-current="step"':''}><b>0${i+1}</b>${['选器具','准备','冲煮','调饮','特刊'][i]}</button>`).join('')}<button data-page="${S.page==='choose'?'prepare':S.page==='prepare'?'brew':S.page==='brew'?'cup':'publish'}">${S.page==='prepare'&&!ready()?'准备好再冲煮':'继续 →'}</button>`;
}
function renderPrepareBench(){
 const prep=preparation(),s=settings(),tasks=PREPARATION[S.gear],task=tasks.find(t=>t.id===S.prepTask)||tasks[0],done=taskComplete(prep,task.id,s),allowed=taskAllowed(S.gear,prep,task.id,s),locked=['running','paused'].includes(process().status),target=targetFor(task.id,s),value=['paper','assemble'].includes(task.id)?(done?1:0):prep[task.id];
 const pourPlan=task.id==='powder'&&S.gear==='pour'?field('water','计划注水',150,420,s.water,10,locked):'';
 $('#benchContent').innerHTML=`<h2>${GEARS[S.gear].name}</h2><div class="prep-progress">${tasks.map(t=>`<button data-prep-task="${t.id}" class="${S.prepTask===t.id?'active':''} ${taskComplete(prep,t.id,s)?'complete':''}">${taskComplete(prep,t.id,s)?'✓ ':''}${t.short}</button>`).join('')}</div><h3 class="prep-action-title">${task.name}</h3><p class="bench-intro">${task.explain}</p>${task.id==='powder'?`<div class="segmented">${['较粗','中等','较细'].map((n,i)=>`<button data-grind="${i}" class="${s.grind===i?'active':''}" ${locked?'disabled':''}>${n}</button>`).join('')}</div>${S.gear==='moka'?'<p class="recipe-line">粉量 18 g · 本器具教学预设</p>':field('dose','计划粉量',S.gear==='espresso'?14:10,22,s.dose,1,locked)}`:task.id==='water'?field('water','计划装水',110,150,s.water,10,locked):''}${pourPlan}<div id="prepMeasure" class="prep-measure">${task.unit?Number(value).toFixed(task.id==='powder'?1:0):done?'✓':'—'}<small>${task.unit?`${task.unit} / ${target} ${task.unit}`:done?'动作完成':'等待操作'}</small></div><div class="prep-meter"><i id="prepMeter" style="width:${Math.min(100,value/target*100)}%"></i></div><button class="primary prepare-primary" ${task.hold?`data-prep-hold="${task.id}"`:`data-prep-action="${task.id}"`} ${done||!allowed||locked?'disabled':''}>${done?'已完成 ✓':task.hold?'按住，'+task.name:task.name+' →'}</button><p id="prepStatus" class="prep-status">${locked?'本次冲煮已开始。可返回继续，或重新准备。':!allowed?'先完成前面的准备，再进行这个动作。':done?'这一项准备好了，可以继续下一项。':'可以按住按钮；工具也可以拖到器具上。'}</p><div class="prep-next"><button class="primary" data-page="brew" ${!ready()?'disabled':''}>去冲煮 →</button><button class="text-button" data-action="quick-prepare">按配方快速准备</button></div><button class="text-button" data-action="reset-brew">重新准备这一锅</button>`;
}
function renderBrewingBench(){
 const p=process(),s=settings(),g=GEARS[S.gear];
 if(!ready()){$('#benchContent').innerHTML=`<h2>先准备好器具。</h2><p class="bench-intro">把原料和器具准备好，再开始${g.name}的冲煮。你也可以使用当前配方快速准备。</p><button class="primary" data-page="prepare">动手准备 →</button><button class="text-button" data-action="quick-prepare">按配方快速准备</button>`;return;}
 $('#benchContent').innerHTML=`<h2>${g.name}</h2><div class="brew-ready">粉量 ${s.dose} g · ${['较粗','中等','较细'][s.grind]}研磨${S.gear!=='espresso'?` · 水 ${s.water} g`:''}<br><button class="text-button" data-page="prepare">返回准备，看看器具</button></div>${S.gear==='moka'?`${field('heat','炉火',1,3,s.heat,1)}<div class="range-ends"><span>小火</span><span>中火</span><span>大火</span></div><button class="primary" data-action="brew" ${p.status==='running'?'disabled':''}>${p.status==='paused'?'继续加热':'开火冲煮'}</button>`:S.gear==='pour'?`<p class="field-label">注水速度</p><div class="segmented">${['缓注','常速','快注'].map((n,i)=>`<button data-speed="${i}" class="${s.speed===i?'active':''}">${n}</button>`).join('')}</div><button id="pourButton" class="primary" data-hold="pour">按住注水 · 松开停水</button><p class="fine-print">在粉层上按住并移动，改变落点。按钮支持按住空格。</p>`:`<p class="bench-intro">粉饼已准备好。启动后观察出液，选择你的收杯时机。</p><button class="primary" data-action="brew" ${p.status==='running'?'disabled':''}>${p.status==='paused'?'继续萃取':'启动萃取'}</button>`}<div class="action-pair"><button data-action="pause" ${['running','paused'].includes(p.status)?'':'disabled'}>${p.status==='paused'?'继续':'暂停'}</button><button data-action="collect" ${p.mass<5?'disabled':''}>收杯，去调饮 →</button></div><button class="text-button" data-action="reset-brew">重新准备这一锅</button><p id="processStatus" class="status-copy"></p>`;
}
function field(name,label,min,max,value,step=1,disabled=false){return `<label class="field">${label}<output data-output="${name}">${value}${['dose','water'].includes(name)?' g':''}</output><input type="range" name="${name}" min="${min}" max="${max}" step="${step}" value="${value}" ${disabled?'disabled':''}></label>`;}
function renderBench(){
 const cup=selectedCup();
 if(S.page==='lobby'){$('#benchContent').innerHTML='<div class="lobby-guide"><p class="overline">今天的咖啡时刻</p><h2>接一张来单，<br>或做自己的作品。</h2><p>从器具开始，亲手准备、冲煮，再决定这一杯怎样出场。</p><button class="primary" data-action="free">自由制作，挑件器具 ↗</button><div class="lobby-moments"><p>做过的杯子留在桌面上。随时继续调配，也可以换一种做法再试。</p><p>最后由特刊记录你的制作与发现。</p></div></div>';return;}
 if(S.page==='choose'){$('#benchContent').innerHTML=`<div class="choose-guide"><p class="overline">同一张桌面，三种做法</p><h2>你想怎样，<br>做这一杯？</h2><p>摩卡用炉火加热；手冲由你控制注水；意式通过泵推动热水穿过粉饼。</p><p>${S.order?esc(S.order.brief):'选器具后进入动手准备。每种器具都有自己的动作，也能随时拆开看原理。'}</p><button class="text-button" data-action="gear-info">查看当前器具档案 ↗</button></div>`;return;}
 if(S.page==='prepare'){renderPrepareBench();return;}
 if(S.page==='brew'){renderBrewingBench();return;}
 document.querySelectorAll('[data-surface]').forEach(b=>{b.classList.toggle('active',b.dataset.surface===S.surface);b.setAttribute('aria-pressed',b.dataset.surface===S.surface);});
 if(S.surface==='cup'){
  if(!cup){$('#benchContent').innerHTML='<h2>桌面还空着。</h2><p class="bench-intro">从器具柜里挑一件，先做一杯咖啡。每一杯都会留在下面的桌面上。</p><button class="primary" data-action="back-brew">去冲煮台 ↗</button>';return;}
  const f=cupFacts(cup),result=checkOrder(cup,S.order);
  $('#benchContent').innerHTML=`<h2>${esc(drinkName(cup))}</h2><p class="bench-intro">保留这一杯的咖啡基底，按你的想法调配。</p><div class="addon-grid">${[['water','热水',20],['milk','牛奶',20],['foam','奶泡',5],['ice','冰块',30]].map(([id,n,amount])=>`<button data-add="${id}" data-amount="${amount}">${n} +${amount} g<span>已加入 ${cup[id]} g</span></button>`).join('')}</div><div class="cup-actions"><button class="text-button" data-action="undo-addon">撤回上一次添加</button><button class="text-button" data-action="clear-addon">恢复原液</button></div><p class="recipe-line">${esc(recipeText(cup))}<br>咖啡基底占比 ${(f.coffeeFraction*100).toFixed(0)}% · 总质量 ${f.total.toFixed(0)} g</p><p class="field-label">换一个杯子</p><div class="segmented">${[['small','小杯'],['ceramic','陶瓷杯'],['glass','玻璃杯']].map(([v,n])=>`<button data-vessel="${v}" class="${cup.vessel===v?'active':''}">${n}</button>`).join('')}</div>${S.order?`<div class="order-feedback">${result.checks.map(c=>`<div class="${c.met?'met':''}">${c.met?'✓':'○'} ${esc(c.label)}</div>`).join('')}</div>`:''}<button class="primary" data-action="report">${S.order?(result.met?'交单，并登上特刊 ↗':'记录这次尝试 ↗'):'出片，制作我的特刊 ↗'}</button><div class="cup-actions"><button class="text-button" data-action="another">同一器具再试一次</button><button class="text-button" data-action="back-brew">回到器具柜</button></div>`;
 }
}
function renderKnowledge(){
 if(S.page==='prepare'&&S.view==='operate'){const g=GEARS[S.gear];$('#knowledgeCard').innerHTML=`<p class="overline">先留一个问题，冲煮时看看</p><h3>${S.gear==='moka'?'水，为什么会向上？':S.gear==='pour'?'停下注水，为什么还在滴？':'热水，怎样穿过粉饼？'}</h3><p>${g.science}</p><button class="text-button" data-action="gear-info">拆解原理与资料 ↗</button>`;return;}
 const gear=S.surface==='cup'&&selectedCup()?selectedCup().gear:S.gear,g=GEARS[gear];
 const explaining=S.surface==='brew'&&S.view!=='operate',part=g.parts[S.part]||Object.values(g.parts)[0];
 $('#knowledgeCard').innerHTML=explaining?`<p class="overline">边做边理解 / ${S.view==='explode'?'器具拆解':'水的路线'}</p><div class="part-list">${Object.entries(g.parts).map(([id,v])=>`<button data-part="${id}" class="${S.part===id?'active':''}">${v[0]}</button>`).join('')}</div><h3>${part[0]}</h3><p>${part[1]}</p><button class="text-button" data-action="gear-info">原理与资料 ↗</button>`:`<p class="overline">${g.tag} / 一点咖啡文化</p><h3>${g.story}</h3><p>${g.culture}</p><button class="text-button" data-action="gear-info">这件器具为什么这样工作？ ↗</button>`;
}
function renderStage(){
 if(['lobby','choose'].includes(S.page)){model?.setVisible(false);return;}
 if(S.surface==='cup'&&!selectedCup()){model?.setVisible(false);for(const id of ['modelHost','apparatus','preparationStage','prepTray','liveReadings'])$('#'+id).hidden=true;$('#viewTools').innerHTML='<button data-page="choose">挑件器具，做第一杯 ↗</button>';$('#cupHero').hidden=false;$('#cupHero').innerHTML='<div class="empty-stage">这一张桌面，<br>等你的第一杯作品。</div>';$('#bigWord').textContent='PAUSA';$('#objectCaption').textContent='先冲煮一杯，或从下面的制作记录中选一杯。';return;}
 const cup=selectedCup(),isCup=S.surface==='cup'&&cup,g=GEARS[isCup?cup.gear:S.gear];
 $('#bigWord').textContent=isCup?(cup.milk>0?'LATTE':cup.water>0&&cup.gear==='espresso'?'PAUSA':g.latin):g.latin;
 $('.object-area').dataset.surface=S.surface;
 $('#viewTools').innerHTML=S.page==='prepare'?`<button data-view="operate" class="${S.view==='operate'?'active':''}">动手准备</button><button data-view="explode" class="${S.view==='explode'?'active':''}">拆开看看</button>`:isCup?'<button class="active" data-page="cup">我的这一杯</button><button data-page="choose">再试一种做法</button>':S.page==='lobby'?'<button data-page="choose">挑件器具，开始制作 ↗</button>':['operate','explode','flow'].map((v,i)=>`<button data-view="${v}" class="${S.view===v?'active':''}" aria-pressed="${S.view===v}">${['动手制作','拆开看看','水路与原理'][i]}</button>`).join('');
 const showModel=!isCup&&S.gear==='moka'&&S.view!=='flow';
 $('#modelHost').hidden=!showModel;model?.setVisible(showModel);model?.expand(S.view==='explode'?.82:S.page==='prepare'&&!preparation().assembled?.65:0);model?.select(S.view==='explode'?S.part:S.page==='prepare'?({water:'lower',powder:'basket',assemble:'upper'}[S.prepTask]||''):'');
 $('#apparatus').hidden=!!isCup||showModel;
 $('#preparationStage').hidden=S.page!=='prepare'||showModel||S.view==='explode';$('#prepTray').hidden=S.page!=='prepare';
 if(S.page==='prepare'){
  if(!showModel&&S.view!=='explode'){$('#apparatus').hidden=true;$('#preparationStage').innerHTML=preparationSVG(S.gear,preparation(),settings(),S.prepTask);}
  else if(!showModel)$('#apparatus').innerHTML=apparatusSVG(S.gear,'explode',S.part);
  const tasks=PREPARATION[S.gear];$('#prepTray').innerHTML=tasks.map(t=>`<button class="prep-tool ${taskComplete(preparation(),t.id,settings())?'completed':''}" draggable="true" data-prep-tool="${t.id}">${prepToolIcon(t.id)}${t.short}${taskComplete(preparation(),t.id,settings())?' ✓':''}</button>`).join('');
  if(S.gear==='pour'&&S.prepTask==='paper'&&!preparation().paper)$('#preparationStage').insertAdjacentHTML('beforeend','<div class="prep-drop-area" data-drop-prep="paper">把滤纸拖到这里，也可以点击放入</div>');
  else if(S.gear!=='moka'&&S.view!=='explode'&&S.prepTask==='powder'&&!taskComplete(preparation(),'powder',settings()))$('#preparationStage').insertAdjacentHTML('beforeend','<div class="prep-drop-area" data-drop-prep="powder">把称好的咖啡粉拖到这里</div>');
 }
 else if(!isCup&&!showModel)$('#apparatus').innerHTML=apparatusSVG(S.gear,S.view,S.view==='explode'?S.part:'');
 $('#cupHero').hidden=!isCup;
 if(isCup)$('#cupHero').innerHTML=cupSVG(cup)+`<p class="cup-name">${esc(drinkName(cup))}</p>`;
 $('#objectCaption').textContent=S.page==='prepare'?(ready()?'器具与原料已就绪，去冲煮台开始。':'选下方工具，或按住右侧按钮完成准备。'):isCup?'这杯留在桌面上。继续调配，或让它登上本期特刊。':S.view==='explode'?'点击零件查看作用 · 返回“动手制作”继续冲煮':S.view==='flow'?'水路与器具结构示意 · 冲煮仍可继续':S.gear==='moka'?'拖动旋转 · 炉火与收杯由你控制':S.gear==='pour'?'按住粉层注水，移动落点，松开等待滴落':'观察出液，决定什么时候收杯';
 $('#liveReadings').innerHTML=isCup?'<div><span>总质量</span><b id="readTotal">—</b><small>g</small></div><div><span>咖啡基底占比</span><b id="readFraction">—</b><small>%</small></div><div><span>器具</span><b style="font-size:15px">'+g.name+'</b></div>':'<div><span>出液</span><b id="readMass">0</b><small>g</small></div><div><span id="secondLabel">'+(S.gear==='pour'?'累计注水':S.gear==='espresso'?'粉 / 出杯':'冲煮进程')+'</span><b id="readSecond">0</b><small id="secondUnit">'+(S.gear==='pour'?'g':S.gear==='moka'?'%':'')+'</small></div><div><span>状态</span><b id="readStatus" style="font-size:14px">待冲煮</b></div>';
 $('#liveReadings').hidden=false;
 updateLive();
}
function renderShelf(){
 $('#shelfCount').textContent=S.cups.length?`${S.cups.length} 杯制作记录`:'桌面还空着';
 $('#cupList').innerHTML=S.cups.length?S.cups.map(c=>`<button class="cup-card ${S.selected===c.id?'active':''}" data-cup="${c.id}" aria-pressed="${S.selected===c.id}">${cupSVG(c,{ink:'#322118'})}<span><strong>${esc(drinkName(c))}</strong><small>${GEARS[c.gear].name} / ${round(cupFacts(c).total)} g</small></span></button>`).join(''):'<p class="empty-shelf">冲煮完成后，杯子会留在这里。<br>可以继续调饮、比较做法、制作不同风格的特刊。</p>';
}
function render(){renderPage();renderOrders();renderEquipment();renderBench();renderKnowledge();renderStage();renderShelf();}
function updateLive(){
 const p=process(),cup=selectedCup();
 if(S.gear==='moka')model?.setContents({water:S.page==='prepare'?preparation().water/settings().water:S.page==='brew'&&ready()?Math.max(0,1-p.progress):0,powder:S.page==='lobby'?1:preparation().powder/settings().dose,coffee:S.page==='brew'?p.progress:0});
 if(S.page==='prepare'){updatePreparation();return;}
 if(S.surface==='cup'&&cup){const f=cupFacts(cup);$('#readTotal').textContent=round(f.total);$('#readFraction').textContent=round(f.coffeeFraction*100);return;}
 if(!$('#readMass'))return;
 $('#readMass').textContent=p.mass.toFixed(1);
 $('#readSecond').textContent=S.gear==='pour'?round(p.poured):S.gear==='espresso'?`1:${(p.mass/settings().dose).toFixed(1)}`:round(p.progress*100);
 $('#readStatus').textContent=({idle:'待冲煮',running:S.gear==='pour'?(p.holding?'正在注水':'等待滴落'):'冲煮中',paused:'已暂停',done:'已完成'})[p.status];
 if($('#processStatus'))$('#processStatus').textContent=S.gear==='pour'?(p.spill>1?'水位过高，有水溢出。松开注水，等水位下降。':p.status==='idle'?'按住注水开始；停水后，滤杯仍会排水。':`已注水 ${round(p.poured)} g，滤杯暂存 ${round(p.bedWater)} g。${p.poured>=settings().water?'等待剩余咖啡液流下。':''}`):S.gear==='espresso'?`本版压缩冲煮时间。${p.levelled?'已做布粉，观察较均匀的水路。':'可先布粉，再比较水路示意。'}`:p.status==='idle'?'选择火力后开火。出杯后还可以加水、加奶。':p.progress<.2?'下壶正在加热，咖啡液还未到达上壶。':'咖啡液进入上壶，可以决定何时收杯。';
 document.querySelectorAll('[data-action="collect"]').forEach(b=>b.disabled=p.mass<5);
 document.querySelectorAll('[data-action="pause"]').forEach(b=>{b.disabled=!['running','paused'].includes(p.status);b.textContent=p.status==='paused'?'继续':'暂停';});
 const active=p.status==='running',pouring=active&&p.holding,flowing=active&&p.flow>.01;
 $('#pour-stream')?.classList.toggle('active',pouring);$('#drain-stream')?.classList.toggle('active',flowing);$('#espresso-stream')?.classList.toggle('active',flowing);$('#side-stream')?.classList.toggle('active',flowing&&!p.levelled);
 $('#route-path')?.classList.toggle('stopped',!flowing);
 if($('#bed-water'))$('#bed-water').setAttribute('opacity',String(.12+p.bedWater/105*.65));
 document.querySelectorAll('[data-zone]').forEach(el=>el.setAttribute('opacity',p.zones[el.dataset.zone]>.1?'.95':'.35'));
 if($('#server-liquid')){const y=438-Math.min(100,p.mass/3);$('#server-liquid').setAttribute('d',`M${208+(438-y)*.46} ${y} H${389-(438-y)*.34} L389 438 Q300 470 208 438Z`);}
 if($('#pressure-needle'))$('#pressure-needle').setAttribute('transform',`rotate(${-60+p.pressure*100} 378 110)`);
 if($('#upper-liquid')){const y=227-p.progress*70;$('#upper-liquid').setAttribute('d',`M247 ${y} H341 L336 229 H250Z`);}
 if($('#lower-water')){const y=339+p.progress*81;$('#lower-water').setAttribute('d',`M${227+(y-339)*.1} ${y} H${363-(y-339)*.08} L352 431 H238Z`);}
}
function updatePreparation(){
 if(S.page!=='prepare')return;
 const prep=preparation(),task=PREPARATION[S.gear].find(t=>t.id===S.prepTask),target=targetFor(task.id,settings()),value=['paper','assemble'].includes(task.id)?(taskComplete(prep,task.id,settings())?1:0):prep[task.id];
 if($('#prepMeasure'))$('#prepMeasure').innerHTML=`${task.unit?Number(value).toFixed(task.id==='powder'?1:0):value>=target?'✓':round(value/target*100)+'%'}<small>${task.unit?`${task.unit} / ${target} ${task.unit}`:value>=target?'动作完成':'操作进度'}</small>`;
 if($('#prepMeter'))$('#prepMeter').style.width=Math.min(100,value/target*100)+'%';
 const locked=['running','paused'].includes(process().status),done=taskComplete(prep,task.id,settings()),button=document.querySelector('.prepare-primary');if(button){button.disabled=done||locked||!taskAllowed(S.gear,prep,task.id,settings());button.textContent=done?'已完成 ✓':task.hold?'按住，'+task.name:task.name+' →';}const next=document.querySelector('.prep-next [data-page="brew"]');if(next)next.disabled=!ready();const quick=document.querySelector('[data-action="quick-prepare"]');if(quick)quick.disabled=locked;
 for(const t of PREPARATION[S.gear]){const b=document.querySelector(`[data-prep-task="${t.id}"]`),complete=taskComplete(prep,t.id,settings());if(b){b.classList.toggle('complete',complete);b.textContent=(complete?'✓ ':'')+t.short;}}
 if($('#prepStatus'))$('#prepStatus').textContent=locked?'本次冲煮已开始。可返回继续，或重新准备。':!taskAllowed(S.gear,prep,task.id,settings())?'先完成前面的准备，再进行这个动作。':done?'这一项准备好了，可以继续下一项。':'按住按钮完成操作，松开可以暂停；也可以拖入工具。';
 if(S.gear==='moka'){model?.setContents({water:prep.water/settings().water,powder:prep.powder/settings().dose,coffee:0});return;}
 if($('#prepPowderFill')){$('#prepPowderFill').setAttribute('rx',String(S.gear==='pour'?52+prep.powder/settings().dose*35:70+prep.powder/settings().dose*32));$('#prepPowderFill').setAttribute('opacity',String(Math.max(.15,prep.powder/settings().dose)));}
 if($('#prepMound'))$('#prepMound').setAttribute('opacity',String(.6*(1-prep.level)));
 if($('#tamper'))$('#tamper').setAttribute('transform',`translate(0 ${prep.tamp*90})`);
 if($('#rinseWater'))$('#rinseWater').setAttribute('transform',`translate(0 ${30*(1-prep.rinse/40)})`);
}
function finishPreparationTask(task){
 if(taskComplete(preparation(),task,settings())&&!preparation().manual.includes(task))preparation().manual.push(task);
 prepHold=null;prepDrag=null;process().levelled=preparation().level>=1;process().tamped=preparation().tamp>=1;
 S.prepTask=nextPreparationTask(S.gear,preparation(),settings());renderBench();renderKnowledge();renderStage();renderPage();
 toast(ready()?'准备好了，去冲煮台试试。':'这一步完成了，继续准备。');
}
function startPreparation(task,pointer){
 if(S.page!=='prepare'||!PREPARATION[S.gear].some(t=>t.id===task))return;
 if(['running','paused'].includes(process().status))return toast('这锅已经开始冲煮，可继续或重新准备。');
 if(!taskAllowed(S.gear,preparation(),task,settings()))return toast('先完成前面的准备，再做这个动作。');
 if(taskComplete(preparation(),task,settings())){S.prepTask=task;renderBench();renderKnowledge();return;}
 S.prepTask=task;
 if(S.view!=='operate'){S.view='operate';renderStage();}
 if(['paper','assemble'].includes(task)){advancePreparation(S.gear,preparation(),task,settings(),0);finishPreparationTask(task);return;}
 if(!$('#prepPowderFill')&&task==='powder'&&S.gear!=='moka'){preparation().powder=.001;renderStage();}
 if(task==='rinse'&&preparation().rinse===0){preparation().rinse=.001;renderStage();}
 prepHold={task,pointer,gear:S.gear};document.querySelectorAll(`[data-prep-hold="${task}"]`).forEach(b=>b.classList.add('holding'));
}
function selectGear(id){
 if(!GEARS[id])return;
 const old=process();if(old.status==='running'){old.status='paused';old.holding=false;}
 pourPointer=null;S.gear=id;S.surface='brew';S.view='operate';S.part=Object.keys(GEARS[id].parts)[0];goPage('prepare');
}
function begin(){
 if(!ready()){goPage('prepare');toast('先准备好器具与原料，或使用快速准备。');return;}
 if(S.view==='explode'){S.view='operate';toast('已合上器具，开始冲煮。');}
 let p=process();if(p.status==='done'){resetBrew();toast('开始新一杯，重新准备原料。上一杯仍留在桌面。');return;}
 if(p.status==='idle')p.curve=newProcess(S.gear,settings()).curve;
 p.settings={...settings()};p.status='running';renderBench();renderStage();renderKnowledge();
}
function resetBrew(){S.processes[S.gear]=newProcess(S.gear,settings());S.preparations[S.gear]=newPreparation();pourPointer=null;goPage('prepare');}
function collect(){
 const p=process();if(p.mass<5)return toast('先冲出一些咖啡液，再收杯。');
 p.status='done';p.holding=false;
 if(p.cupId){S.selected=p.cupId;goPage('cup');return;}
 p.settings={...settings()};const c=makeCup(p,S.nextId++),steps=preparation().manual?.length||0;c.preparation={method:steps===3?'manual':steps>0?'mixed':'quick',steps};p.cupId=c.id;S.cups.push(c);S.selected=c.id;dirty();goPage('cup');toast('这一杯留在桌面上了，可以继续调配。');
}
function startPour(pointer,event){
 if(S.gear!=='pour'||S.page!=='brew')return;
 if(!ready()){goPage('prepare');return;}
 if(S.view==='explode'){S.view='operate';renderStage();renderKnowledge();}
 let p=process();if(p.status==='done'){resetBrew();toast('再做一杯，先准备新的滤纸与咖啡粉。');return;}
 if(p.poured>=settings().water)return;
 if(p.status==='idle')p.settings={...settings()};p.status='running';if(!p.holding)p.pours++;p.holding=true;
 pourPointer=pointer;
 $('#pourButton')?.classList.add('holding');
 if(event)movePour(event);else p.zones[0]+=.2;
 updateLive();
}
function stopPour(){
 const p=S.processes.pour;p.holding=false;pourPointer=null;$('#pourButton')?.classList.remove('holding');updateLive();
}
function movePour(e){
 if(!S.processes.pour.holding)return;
 const zone=$('#pourZone');if(!zone)return;
 const svg=zone.ownerSVGElement,r=svg.getBoundingClientRect(),scale=Math.min(r.width/600,r.height/510),ox=(r.width-600*scale)/2,oy=(r.height-510*scale)/2;
 const x=clamp((e.clientX-r.left-ox)/scale,220,373),y=clamp((e.clientY-r.top-oy)/scale,145,185),angle=Math.atan2((y-165)*4,x-296);
 const index=(Math.floor((angle+Math.PI)/(Math.PI/3))+3)%6;S.processes.pour.zones[index]+=.1;
 $('#pour-stream')?.setAttribute('d',`M${x} ${y-112} L${x} ${y}`);$('#kettle')?.setAttribute('transform',`translate(${x-300} ${y-165})`);
}
let addonHistory=[];
function addIngredient(key,amount){
 const c=selectedCup();if(!c)return;
 const limits={water:400,milk:400,foam:30,ice:150};if(c[key]+amount>limits[key])return toast('这一杯已经加了不少，试试其他比例。');
 addonHistory.push({id:c.id,key,before:c[key]});c[key]+=amount;if(c.vessel==='small')c.vessel='glass';dirty();render();$('#cupHero').classList.remove('cup-pour');void $('#cupHero').offsetWidth;$('#cupHero').classList.add('cup-pour');
}
function openReport(){
 const c=selectedCup();if(!c)return;
 S.report={cup:structuredClone(c),order:S.order?structuredClone(S.order):null};if(S.replayId!==c.id){S.title=makeReport(c,S.order).title;S.position={x:.58,y:.49};}$('#reportName').value=S.title;$('#reportDetails').checked=S.details;
 if(!$('#reportDialog').open)$('#reportDialog').showModal();updateReport();
}
async function updateReport(){
 if(!S.report)return;
 const report=makeReport(S.report.cup,S.report.order),rev=++reportRevision;
 $('#reportStyles').innerHTML=REPORT_STYLES.map(s=>`<button data-report-style="${s.id}" class="${S.style===s.id?'active':''}">${s.name}</button>`).join('');
 $('#reportPalettes').innerHTML=PALETTES.map(p=>`<button data-report-palette="${p.id}" class="${S.palette===p.id?'active':''}"><i style="background:${p.ink};box-shadow:inset -6px 0 ${p.accent}"></i>${p.name}</button>`).join('');
 $('#reportArticle').innerHTML=`<h3>${S.report.order?(report.check.met?'来单完成 / 本期报道':'本期尝试 / 继续探索'):'自由创作 / 本期报道'}</h3><p>${esc(report.intro)}</p>${report.observations.map(p=>`<p>${esc(p)}</p>`).join('')}<p><a href="${report.source}" target="_blank" rel="noopener">${esc(report.sourceName)} ↗</a></p>`;
 $('#reportFacts').textContent=report.recipe;
 const buffer=document.createElement('canvas');await drawReport(buffer,{cup:S.report.cup,report,style:S.style,palette:S.palette,title:S.title,details:S.details,position:S.position});
 if(rev===reportRevision){const canvas=$('#reportCanvas');canvas.width=1200;canvas.height=1800;canvas.getContext('2d').drawImage(buffer,0,0);canvas.dataset.ready='true';}
}
function recipeLink(){
 const c=S.report?.cup||selectedCup();if(!c)return location.href;
 const payload={v:1,cup:c,order:S.report?.order?.id||S.order?.id||null,style:S.style,palette:S.palette,title:S.title,details:S.details,position:S.position};
 const bytes=new TextEncoder().encode(JSON.stringify(payload));return location.origin+location.pathname+'#cup='+btoa(String.fromCharCode(...bytes));
}
function info(gearOnly=false){
 const id=S.surface==='cup'&&selectedCup()?selectedCup().gear:S.gear,g=GEARS[id];
 $('#infoContent').innerHTML=gearOnly?`<p class="overline">器具档案 / ${g.latin}</p><h2 id="infoTitle">${g.name}，怎样工作？</h2><p>${g.science}</p><ul>${Object.values(g.parts).map(([name,desc])=>`<li><strong>${name}：</strong>${desc}</li>`).join('')}</ul><p><a href="${g.source}" target="_blank" rel="noopener">${g.sourceName} ↗</a></p><p class="fine-print">水路与内部结构是教学示意；本版流量、保水量与出液来自简化规则，未经实测校准。冲煮时间已压缩，不能据此预测真实风味。</p>`:`<p class="overline">OFFICINA DEL CAFFÈ / 工作室原型</p><h2 id="infoTitle">一张桌面，随你探索。</h2><p>选择随机来单，或自由制作。器具柜、拆解、水路、调饮、桌面上的成杯都可以随时访问。每次制作有自己的记录，特刊正文据此生成。</p><p>摩卡壶沿用细化后的银色 Blender 模型，补充内部件为教学结构。手冲与意式采用可操作的结构插图。本版没有做真实味觉评分；订单只核对器具、质量与配方要求。</p><p>冲煮过程使用压缩时间和定性规则，数值不是实测预测。咖啡基底占比按成杯总质量计算，包含牛奶、奶泡和冰；它不是整杯的 TDS。冰块融化和奶泡衰减尚未模拟。</p><p>特刊支持独立的构图与配色；改变风格不会改变饮品。杯子保存在这个浏览器里，配方链接供本机预览。</p><p><a href="${GEARS.moka.source}" target="_blank" rel="noopener">摩卡物理</a> · <a href="${GEARS.pour.source}" target="_blank" rel="noopener">HARIO 手冲</a> · <a href="${GEARS.espresso.source}" target="_blank" rel="noopener">La Marzocco 意式</a></p>`;
 $('#infoDialog').showModal();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.id==='cafeArchive'){const target=new URL('moka.html',location.href);target.searchParams.set('shelf','1');try{const previous=JSON.parse(localStorage.getItem('coffee-recipe-lab-v1'));if(previous?.orderId)target.searchParams.set('order',previous.orderId);}catch{}location.href=target.href;return;}
 if(b.dataset.page){goPage(b.dataset.page);return;}
 if(b.dataset.order){S.order=ORDERS.find(o=>o.id===b.dataset.order);S.ticket=S.offers.findIndex(o=>o.id===b.dataset.order)+1;goPage('choose');return;}
 if(b.dataset.gear){if(b.dataset.gear==='moka'){openMoka();return;}selectGear(b.dataset.gear);return;}
 if(b.dataset.surface){goPage(b.dataset.surface==='cup'?'cup':'brew');return;}
 if(b.dataset.prepTask){prepHold=null;S.prepTask=b.dataset.prepTask;renderBench();renderKnowledge();renderStage();return;}
 if(b.dataset.prepAction){startPreparation(b.dataset.prepAction,'click');return;}
 if(b.dataset.prepTool){if(['paper','assemble'].includes(b.dataset.prepTool))startPreparation(b.dataset.prepTool,'click');else{S.prepTask=b.dataset.prepTool;renderBench();renderKnowledge();renderStage();}return;}
 if(b.dataset.view){prepHold=null;prepDrag=null;if(b.dataset.view==='explode'&&process().status==='running'){process().status='paused';process().holding=false;pourPointer=null;toast('拆开观察时已暂停，合上后可以继续。');}S.view=b.dataset.view;renderBench();renderStage();renderKnowledge();return;}
 if(b.dataset.part){S.part=b.dataset.part;model?.select(S.part);renderKnowledge();if(S.gear!=='moka'&&S.view==='explode')renderStage();return;}
 if(b.dataset.cup){S.selected=Number(b.dataset.cup);goPage('cup');return;}
 if(b.dataset.grind!==undefined){settings().grind=Number(b.dataset.grind);if(process().status!=='idle')resetBrew();else{preparation().powder=preparation().level=preparation().tamp=0;preparation().assembled=false;preparation().manual=preparation().manual.filter(t=>!['powder','level','tamp','assemble'].includes(t));S.prepTask='powder';render();}return;}
 if(b.dataset.speed!==undefined){settings().speed=Number(b.dataset.speed);renderBench();return;}
 if(b.dataset.add){addIngredient(b.dataset.add,Number(b.dataset.amount));return;}
 if(b.dataset.vessel){const c=selectedCup();if(c){c.vessel=b.dataset.vessel;dirty();render();}return;}
 if(b.dataset.reportStyle){S.style=b.dataset.reportStyle;updateReport();return;}
 if(b.dataset.reportPalette){S.palette=b.dataset.reportPalette;updateReport();return;}
 switch(b.dataset.action){
  case 'refresh-orders':pickOrders();renderOrders();break;
  case 'free':S.order=null;if(['lobby','choose'].includes(S.page)){goPage('choose');return;}else{const url=new URL(location.href);url.searchParams.delete('order');history.replaceState({page:S.page,gear:S.gear},'',url);render();}toast('可以自由发挥，做自己的这一杯。');break;
  case 'quick-prepare':if(['running','paused'].includes(process().status))return toast('这锅已开始冲煮，重新准备会用一份新原料。');if(process().status==='done')S.processes[S.gear]=newProcess(S.gear,settings());quickPreparation(S.gear,preparation(),settings());process().levelled=preparation().level>=1;process().tamped=preparation().tamp>=1;goPage('brew');toast('已按当前配方快速准备，可以开始冲煮。');break;
  case 'brew':begin();break;
  case 'pause':process().status=process().status==='running'?'paused':'running';process().holding=false;renderBench();updateLive();break;
  case 'collect':collect();break;
  case 'reset-brew':resetBrew();break;
  case 'level':process().levelled=true;renderBench();renderStage();toast('已布粉。可以打开水路，比较均匀与偏流的示意。');break;
  case 'tamp':process().tamped=true;renderBench();toast('压粉完成。启动萃取后，观察流动。');break;
  case 'another':{const c=selectedCup();if(c)S.settings[c.gear]={...c.settings};selectGear(c?.gear||S.gear);resetBrew();break;}
  case 'back-brew':goPage('choose');break;
  case 'undo-addon':{const c=selectedCup(),index=addonHistory.findLastIndex(h=>h.id===c?.id);if(index<0)return toast('这杯没有可撤回的添加。');const h=addonHistory.splice(index,1)[0];c[h.key]=h.before;dirty();render();break;}
  case 'clear-addon':{const c=selectedCup();if(c){c.water=c.milk=c.foam=c.ice=0;addonHistory=addonHistory.filter(h=>h.id!==c.id);dirty();render();}break;}
  case 'report':goPage('publish');break;
  case 'close-report':$('#reportDialog').close();goPage('cup');break;
  case 'about':info();break;
  case 'gear-info':info(true);break;
  case 'close-info':$('#infoDialog').close();break;
  case 'full':if(document.fullscreenElement)document.exitFullscreen();else $('.studio').requestFullscreen().catch(()=>toast('当前环境未启用全屏。'));break;
  case 'download-report':{updateReport().then(()=>$('#reportCanvas').toBlob(blob=>{if(!blob)return toast('图片生成失败，请再试一次。');const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=(S.title||'咖啡特刊').replace(/[\\/:*?"<>|]/g,'-')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('本期特刊已保存。');},'image/png'));break;}
  case 'copy-recipe':navigator.clipboard.writeText(recipeLink()).then(()=>toast('配方链接已复制，用于本机预览。')).catch(()=>toast('当前浏览器不允许写入剪贴板。'));break;
 }
});
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.id==='reportName'){S.title=t.value.slice(0,20);updateReport();return;}
 if(t.id==='reportDetails'){S.details=t.checked;updateReport();return;}
 if(['water','dose','heat'].includes(t.name)){
  if(S.page==='prepare'&&t.name==='water'&&S.gear==='moka'){preparation().water=0;preparation().assembled=false;preparation().manual=preparation().manual.filter(t=>!['water','assemble'].includes(t));}
  if(S.page==='prepare'&&t.name==='dose'){preparation().powder=0;preparation().level=0;preparation().tamp=0;preparation().assembled=false;preparation().manual=preparation().manual.filter(t=>!['powder','level','tamp','assemble'].includes(t));}
  settings()[t.name]=Number(t.value);const output=document.querySelector(`[data-output="${t.name}"]`);if(output)output.textContent=t.value+(t.name==='heat'?'':' g');
  if(process().status==='done')S.processes[S.gear]=newProcess(S.gear,settings());
  if(t.name!=='heat')process().settings={...settings()};updateLive();if(S.page==='prepare'){renderPage();renderStage();}
 }
});
document.addEventListener('pointerdown',e=>{
 const prepButton=e.target.closest('[data-prep-hold]');if(prepButton&&!prepButton.disabled){e.preventDefault();prepButton.setPointerCapture(e.pointerId);startPreparation(prepButton.dataset.prepHold,e.pointerId);}
 if(e.target.id==='prepBed'&&S.page==='prepare'&&S.gear==='espresso'&&S.prepTask==='level'&&taskAllowed('espresso',preparation(),'level',settings())){e.preventDefault();e.target.setPointerCapture(e.pointerId);prepDrag={pointer:e.pointerId,x:e.clientX};}
 if(e.target.closest('[data-hold="pour"]')||e.target.id==='pourZone'){
  e.preventDefault();const target=e.target;target.setPointerCapture?.(e.pointerId);startPour(e.pointerId,e.target.id==='pourZone'?e:null);
 }
 if(e.target.id==='reportCanvas'){
  const r=e.target.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
  if(Math.abs(px-S.position.x)<.3&&py>.25&&py<.7){e.preventDefault();reportPointer={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...S.position},rect:r};e.target.setPointerCapture(e.pointerId);}
 }
});
document.addEventListener('pointermove',e=>{
 if(prepDrag?.pointer===e.pointerId){preparation().quick=false;preparation().level=Math.min(1,preparation().level+Math.abs(e.clientX-prepDrag.x)/150);prepDrag.x=e.clientX;updatePreparation();if(preparation().level>=1)finishPreparationTask('level');}
 if(pourPointer===e.pointerId&&e.target.id==='pourZone')movePour(e);
 if(reportPointer?.id===e.pointerId){S.position.x=clamp(reportPointer.start.x+(e.clientX-reportPointer.x)/reportPointer.rect.width,.36,.73);S.position.y=clamp(reportPointer.start.y+(e.clientY-reportPointer.y)/reportPointer.rect.height,.37,.51);updateReport();}
});
document.addEventListener('pointerup',e=>{if(prepHold?.pointer===e.pointerId)prepHold=null;if(prepDrag?.pointer===e.pointerId)prepDrag=null;if(pourPointer===e.pointerId)stopPour();if(reportPointer?.id===e.pointerId)reportPointer=null;document.querySelectorAll('.holding').forEach(b=>b.classList.remove('holding'));});
document.addEventListener('pointercancel',()=>{prepHold=null;prepDrag=null;stopPour();reportPointer=null;});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat){const prepButton=e.target.closest('[data-prep-hold]');if(prepButton&&!prepButton.disabled){e.preventDefault();startPreparation(prepButton.dataset.prepHold,'keyboard');}else if(e.target.closest('[data-hold="pour"]')){e.preventDefault();startPour('keyboard');}}});
document.addEventListener('keyup',e=>{if(e.code==='Space'){if(prepHold?.pointer==='keyboard'){prepHold=null;document.querySelectorAll('.prepare-primary.holding').forEach(b=>b.classList.remove('holding'));}if(pourPointer==='keyboard'){e.preventDefault();stopPour();}}});
document.addEventListener('dragstart',e=>{const tool=e.target.closest('[data-prep-tool]');if(tool){e.dataTransfer.setData('text/plain',tool.dataset.prepTool);e.dataTransfer.effectAllowed='copy';}});
document.addEventListener('dragover',e=>{const drop=e.target.closest('[data-drop-prep]')||(S.page==='prepare'?e.target.closest('.object-area'):null);if(drop){e.preventDefault();drop.classList.add('drag-over');}});
document.addEventListener('dragleave',e=>{e.target.closest('[data-drop-prep]')?.classList.remove('drag-over');e.target.closest('.object-area')?.classList.remove('drag-over');});
document.addEventListener('drop',e=>{const drop=e.target.closest('[data-drop-prep]')||(S.page==='prepare'?e.target.closest('.object-area'):null);if(drop){e.preventDefault();drop.classList.remove('drag-over');const task=e.dataTransfer.getData('text/plain');if(!drop.dataset.dropPrep||task===drop.dataset.dropPrep)startPreparation(task,'drop');}});
window.addEventListener('blur',()=>{prepHold=null;prepDrag=null;stopPour();for(const p of Object.values(S.processes))if(p.status==='running')p.status='paused';updateLive();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){prepHold=null;prepDrag=null;stopPour();for(const p of Object.values(S.processes))if(p.status==='running')p.status='paused';}});
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});

function restore(){
 try{
  if(location.hash.startsWith('#cup=')){
   const payload=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(location.hash.slice(5)),c=>c.charCodeAt(0))));if(payload.v!==1)throw new Error('Version');
   const c=sanitizeCup(payload.cup);S.cups=[c];S.selected=c.id;S.replayId=c.id;S.nextId=2;S.gear=c.gear;S.settings[c.gear]={...c.settings};S.surface='cup';S.page='cup';S.order=ORDERS.find(o=>o.id===payload.order)||null;
   if(REPORT_STYLES.some(s=>s.id===payload.style))S.style=payload.style;if(PALETTES.some(p=>p.id===payload.palette))S.palette=payload.palette;S.title=String(payload.title||'').slice(0,20);S.details=payload.details!==false;S.position={x:clamp(payload.position?.x||.58,.36,.73),y:clamp(payload.position?.y||.49,.37,.51)};return;
  }
  const saved=JSON.parse(localStorage.getItem('coffee-studio-v1')||'null');if(saved?.cups){S.cups=saved.cups.slice(-10).map((v,i)=>({...sanitizeCup(v),id:i+1}));S.nextId=S.cups.length+1;S.selected=S.cups.at(-1)?.id||null;}
 }catch{toast('未能读取这条配方，已打开自由工作室。');}
}
initEntrance();restore();const requested=new URLSearchParams(location.search);S.ticket=Math.min(3,Math.max(1,Number(requested.get('ticket'))||1));if(!location.hash.startsWith('#cup='))S.order=ORDERS.find(o=>o.id===requested.get('order'))||null;if(GEARS[requested.get('gear')]&&!location.hash.startsWith('#cup='))S.gear=requested.get('gear');if(['lobby','choose','prepare','brew','cup'].includes(requested.get('page'))&&!location.hash.startsWith('#cup='))S.page=requested.get('page');S.surface=S.page==='cup'?'cup':'brew';S.prepTask=nextPreparationTask(S.gear,preparation(),settings());pickOrders();render();
if(S.gear==='moka'&&['prepare','brew'].includes(S.page))openMoka();
window.addEventListener('popstate',()=>{const old=process();old.holding=false;if(old.status==='running')old.status='paused';const q=new URLSearchParams(location.search);S.ticket=Math.min(3,Math.max(1,Number(q.get('ticket'))||1));S.order=ORDERS.find(o=>o.id===q.get('order'))||null;if(GEARS[q.get('gear')]){S.gear=q.get('gear');S.part=Object.keys(GEARS[S.gear].parts)[0];}goPage(q.get('page')||'lobby',false);});
$('#reportDialog').addEventListener('close',()=>{if(S.page==='publish')goPage('cup');});
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#cup=')){for(const p of Object.values(S.processes)){p.holding=false;if(p.status==='running')p.status='paused';}S.report=null;$('#reportDialog').close();restore();pickOrders();render();}});
if(!['lobby','choose'].includes(S.page))try{model=createMoka($('#studioMoka'),part=>{S.part=part;if(S.page==='prepare'&&S.view==='operate'){const task={lower:'water',basket:'powder',upper:'assemble'}[part];if(task){S.prepTask=task;renderBench();renderKnowledge();}}else if(S.view==='explode')renderKnowledge();else toast(`${GEARS.moka.parts[part]?.[0]||'零件'}：打开“拆开看看”可以探索。`);});model.ready.then(()=>renderStage()).catch(()=>toast('摩卡模型加载失败，可先试试手冲和意式。'));}catch{toast('当前环境未启用 3D，可以先试试手冲和意式。');}
function frame(now){
 const dt=Math.min(.1,(now-(lastFrame||now))/1000);lastFrame=now;
 if(prepHold&&S.page==='prepare'&&prepHold.gear===S.gear){const task=prepHold.task,done=advancePreparation(S.gear,preparation(),task,settings(),dt);if(now-lastUI>60){lastUI=now;updatePreparation();}if(done)finishPreparationTask(task);}
 const p=process();if(p.status==='running'){
  tick(p,settings(),dt);
  if(p.holding&&pourPointer!==null&&p.zones.every(n=>n===0))p.zones[0]+=.1;
  if(now-lastUI>70){lastUI=now;updateLive();}
  if(p.status==='done'&&!p.cupId)collect();
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Public inspection hooks used by the local browser QA, no external calls.
window.coffeeStudio={state:S,model:()=>model,getCup:selectedCup,render,goPage,ready,tick:(dt)=>tick(process(),settings(),dt),report:()=>makeReport(S.report?.cup||selectedCup(),S.report?.order||S.order),getRecipeLink:recipeLink};
