import {createWorkshopScene} from './workshop-scene.js';
import {freshWorkshop,restoreWorkshop,turnShell,waterFlow,setBasket,powderFlow,brushRim,placePot,setHeat,tickWorkshop,pourCoffee,addToCup,preparationIssue,isHot,coffeeLeft,totalCup,cupSnapshot,workshopReport,SPEC,clamp} from './workshop-state.mjs';
import {ORDERS,drinkName,checkOrder,cupFacts} from './studio-model.mjs';
import {escapeHTML as esc,PALETTES,REPORT_STYLES,drawReport} from './studio-art.js';

const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),order=ORDERS.find(o=>o.id===params.get('order'))||null;
let s=freshWorkshop(),tool='upper',mode='open',view='',inspectedPart='basket',contextOpen=false,gesture=null,tilt=0,drag=null,flow='',warningUntil=0,lastTime=0,lastUI=0,saveTimer=0,poster=null,posterStyle='manifesto',posterPalette='torino',posterRevision=0,posterPosition={x:.58,y:.49},posterDrag=null,undo=[],audio=null,sound=false;
try{const saved=JSON.parse(localStorage.getItem('moka-hands-on-v2')||'null');if(params.get('new')!=='1'&&saved&&saved.order===(order?.id||null)){s=restoreWorkshop(saved.state);mode=s.poured>0?'blend':s.started?(s.onStove?'heat':'pour'):s.open>.95?'water':s.open===0&&s.water>0?'transport':'open';tool=mode==='blend'?'milk':mode==='heat'?'heat':mode==='pour'?'coffee':mode==='water'?'water':mode==='transport'?'handle':'upper';}}catch{}
if(params.has('new')){params.delete('new');history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));}
const scene=createWorkshopScene($('#workshopCanvas'));scene.focus(mode);
$('#ticket').innerHTML=order?`<strong>来单 <span>${String(ORDERS.indexOf(order)+1).padStart(2,'0')}</span></strong><p>${esc(order.title)}<br>${esc(order.brief)}</p>`:'<strong>自由 <span>01</span></strong><p>这一杯由你决定。<br>做完，再给作品命名。</p>';
const status=text=>{$('#sessionStatus').textContent=text;};
function warn(text){if(!text)return;$('#localWarning').textContent=text;$('#localWarning').classList.add('show');warningUntil=performance.now()+4400;status(text);}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem('moka-hands-on-v2',JSON.stringify({order:order?.id||null,state:s}));}catch{}},200);}
function stopInput(){gesture=null;tilt=0;drag=null;flow='';scene.gesture(false);if(audio)audio.gain.gain.setTargetAtTime(0,audio.ctx.currentTime,.04);save();}
function setMode(next,nextTool){stopInput();mode=next;tool=nextTool||tool;view='';contextOpen=false;scene.focus(next);renderUI();}
function chooseTool(id){
 if(view){closeContext();return;}
 if(['water','basket','powder','brush','drain'].includes(id)&&s.started){warn(isHot(s)?'壶身仍热；这锅已经开始，先关火并充分冷却。':'这锅已经制作过。保留杯子，再准备一份新原料。');return;}
 if(['water','basket','powder','brush','drain'].includes(id)&&s.open<.95){warn('先握住冷壶上下壶身，旋开壶。');return;}
 if(id==='water'&&!['blend','milk'].includes(mode)&&s.basketIn){warn('先拿出粉篮，露出下壶口再加水。');return;}
 if(id==='upper'){if(isHot(s)){s.events.includes('hot-touch')||s.events.push('hot-touch');warn('壶身很烫。移壶用手柄，旋开前要充分冷却。');return;}setMode(s.open>.5?'close':'open','upper');if(mode==='close')status('上壶对准接缝，向左拖动旋合；无需推动手柄。');return;}
 if(id==='handle'){if(s.open>.01){warn('上下壶还没旋合。手柄不能用来拧紧接缝。');return;}setMode(s.onStove?'heat':'transport','handle');return;}
 if(id==='heat'){setMode(s.onStove?'heat':'transport','heat');return;}
 if(id==='coffee'){if(s.onStove){warn('先关火，再用手柄移到隔热垫。');return;}setMode('pour','coffee');return;}
 if(['milk','ice','cupwater'].includes(id)){if(s.poured<1){warn('先把壶中的咖啡倒进杯子，再调饮。');return;}setMode('blend',id);return;}
 tool=id;scene.focus(id==='water'||id==='drain'||id==='basket'?'water':id==='brush'?'brush':'powder');mode=['water','drain','basket'].includes(id)?'water':'powder';contextOpen=false;renderUI();
}
const copies={open:['旋开，<br>认识它。','握住冷壶上下壶身，向右拖动旋开。','MOKA'],water:['慢慢倒，<br>看水位。','拿起水壶，向左拖动倾倒；松手停水。','ACQUA'],powder:['装满，<br>不压实。','拿起粉勺，向右拖动装粉；扫净壶缘。','CAFFÈ'],close:['对准，<br>轻轻合。','握住上下壶身，向左拖动旋合。','MOKA'],transport:['放稳，<br>再开火。','用手柄把壶拖向右侧炉头。','FUOCO'],heat:['听一听，<br>看出液。','拖动炉火旋钮，观察出液；向左拖至关火。','MOKA'],pour:['这一杯，<br>慢慢来。','握住手柄，向左拖动倾倒咖啡。','CAFFÈ'],blend:['这一杯，<br>由你调。','拿起水壶或奶壶，向左拖动控制加入量。','LATTE']};
const toolNames={upper:'合壶',water:'水壶',drain:'倒出多余水',basket:'粉篮',powder:'咖啡粉',brush:'刷子',handle:'手柄移壶',heat:'炉火',coffee:'倒咖啡',milk:'温牛奶',cupwater:'热水',ice:'冰块',blend:'调这杯',undo:'撤回调配',stir:'搅匀咖啡'};
const components={lower:['下壶与安全阀','下壶盛水，受热后形成推动水上升的压力差。安全阀用于异常泄压；装水不能超过安全阀下缘。'],basket:['漏斗粉篮','篮中装粉，细管伸入下壶水中。受热后的压力差推动液态水沿细管进入粉层。装满、铺平，不压实。'],gasket:['密封圈','正常附在上壶底部，让上下壶接缝贴合。残粉会妨碍贴合，所以合壶前要扫净壶缘。'],filter:['滤网','正常附在上壶底部，隔开粉层与上壶，帮助拦住咖啡颗粒。它和密封圈配合，而不是另一个粉篮。'],upper:['上壶与导管','经过粉层的咖啡液沿中央导管流出，在上壶收集。受热后金属非常烫；移壶握手柄。'],lid:['壶盖与盖钮','壶盖盖住上壶，帮助挡住热液飞溅。它不是下壶的承压密封件。操作握盖钮，制作时按器具说明盖好壶盖。']};
function renderUI(){
 const c=view==='structure'?['拆开，<br>看看它。','点选展开的部件，认识每一件的作用。','MOKA']:copies[mode]||copies.open;$('#workshop').dataset.scene=mode;$('#sceneTitle').innerHTML=c[0];$('#sceneHint').textContent=view?c[1]:tool==='drain'?'向左拖动下壶，把多余水倒进接水碗。':tool==='basket'?'对准壶口拖动粉篮，松手落位。':tool==='brush'?'左右扫过壶缘，把接缝处的残粉扫净。':tool==='ice'?'用冰夹把冰拖到杯口，松手加入。':tool==='stir'?'拿着勺子，左右轻轻搅匀上壶咖啡。':c[1];$('#latin').textContent=view==='structure'?'MOKA':mode==='blend'&&s.cup.milk===0?'CAFFÈ':c[2];
 $('#microHint').textContent=tool==='basket'?(s.basketIn?'把粉篮向右拖出，可在桌上检查或装粉。':'把粉篮拖到下壶口，落位后松手。'):tool==='drain'?'向左拖动下壶，倒出一点水；松手停水。':tool==='brush'?'只扫壶缘，不把粉篮里的咖啡粉压实。':mode==='heat'?'向上拖动黑色盖钮观察出液；注意热液飞溅，金属壶身很烫。':'点选工具会靠近观察，拖动才改变制作。';
 const ids=mode==='open'?[]:mode==='water'||mode==='powder'||mode==='close'?['water','basket','powder','brush','upper',...(s.water>0?['drain']:[])]:mode==='transport'?['handle','heat']:mode==='heat'?['heat',...(s.heat===0?['handle']:[])]:mode==='pour'?['coffee',...(s.progress<1&&s.poured===0?['handle']:[]),...(s.brewed>0&&!s.stirred?['stir']:[]),...(s.poured>=1?['blend']:[])]:['coffee','milk','cupwater','ice',...(undo.length?['undo']:[])];
 $('#tools').innerHTML=ids.map(id=>`<button data-tool="${id}" class="${id===tool?'active':''}" ${view?'disabled':''}>${id==='basket'&&s.basketIn?'取出粉篮':id==='handle'&&mode==='pour'?'移回炉头':toolNames[id]}</button>`).join('');
 if(!view&&tool==='handle'&&s.onStove){$('#sceneTitle').innerHTML='关火，<br>握手柄。';$('#sceneHint').textContent='握住手柄，把壶拖向左侧隔热垫。';$('#microHint').textContent='先关火；关火后金属仍然很烫。';}
 $('#recipe').hidden=mode!=='blend'||!!view;$('#finishCup').hidden=!!view||s.poured<1||!['blend','pour'].includes(mode);$('#newBatch').hidden=!!view||s.poured<1;
 $('#contextToggle').textContent=view==='structure'?'结构展开 · 点选零件 ↗':mode==='open'?'上下壶如何连接？ ↗':mode==='heat'||mode==='pour'?'水为什么会往上走？ ↗':mode==='transport'?'炉火与烫手风险 ↗':mode==='powder'||mode==='close'?'粉篮、滤网与密封圈 ↗':mode==='blend'?'加奶后，这杯改变了什么？ ↗':'水位与安全阀有什么关系？ ↗';
 renderContext();updateNumbers();save();
}
function renderContext(){
 $('#contextBody').hidden=!contextOpen;$('#contextToggle').setAttribute('aria-expanded',String(contextOpen));
 if(!contextOpen)return;
 let copy=mode==='blend'?`<h3>配方变了，基底没变。</h3><p>加水让咖啡变成更长的一杯；牛奶改变配方、液量与示意颜色。它们都不会再次萃取咖啡粉。</p><p>这杯用摩卡壶制作，称为摩卡奶咖。没有制作奶泡，就不会自动出现拿铁拉花。</p>`:mode==='heat'||mode==='pour'?`<h3>水，沿压力差前进。</h3><p>下壶受热，气体与水蒸气形成的压力变化，推动液态水进入漏斗细管，穿过粉层与滤网，再从上壶导管流出。</p><p>上壶收集咖啡液。壶盖盖着上壶，它不是下壶的承压密封件。</p><button data-knowledge="flow">${view==='flow'?'返回正常观察':'看看教学剖面 →'}</button>`:mode==='powder'||mode==='close'?`<h3>篮中装粉，接缝密封。</h3><p>粉篮可以放在桌上装粉，再放回下壶。装满、铺平，不像意式粉饼那样压实。</p><p>滤网与密封圈正常附着在上壶底部。合壶前扫净壶缘，让接缝正常贴合。</p><label>本锅研磨 <select id="grindChoice" ${s.powder>0||s.started?'disabled':''}><option value="0" ${s.grind===0?'selected':''}>适合摩卡 · 偏粗</option><option value="1" ${s.grind===1?'selected':''}>适合摩卡 · 中等</option></select></label>`:`<h3>装水，看安全阀。</h3><p>安全阀用于异常情况下泄压。按实际器具说明书装水，水位不要超过安全阀下缘，也别遮挡它。</p><p>下壶不是灌得越满越好。图中的内腔与数值采用教学规格，不能直接当作实物容量。</p>`;
 if(mode==='transport')copy=`<h3>小火，留在壶底。</h3><p>放稳再点火，火焰不要超出壶底，也不要烧到手柄。下壶受热后，金属外壳与接缝会很烫。</p><p>移壶握手柄，开盖握盖钮。观察时留意热液飞溅；实物按说明盖好壶盖，制作结束后关火，充分冷却再拆洗。</p>`;
 if(mode==='open')copy=`<h3>螺纹连接，接缝密封。</h3><p>握住冷壶上下壶身，旋开接缝。手柄用来移壶，不是拧紧接缝的杠杆。</p><p>拆开后，下壶装水，漏斗粉篮装粉；滤网和密封圈正常留在上壶底部。可以展开模型，点选每一件了解作用。</p>`;
 if(mode==='blend'||mode==='pour')copy+='<p>出杯后先关火，充分冷却再旋开壶，取出粉篮、倒掉粉渣，按器具说明清洗并晾干。新一锅会换一把冷壶和新原料。</p>';
 if(view==='structure'){const part=components[inspectedPart];copy=`<h3>${part[0]}</h3><p>${part[1]}</p><p>点选模型上的其他部件，看看它在整把壶中承担什么作用。</p>`;}
 $('#contextBody').innerHTML=copy+`${view==='structure'?'':'<button data-knowledge="structure">把结构展开看看 →</button>'}${view?'<button data-knowledge="return">收起，继续原操作 →</button>':''}<p class="small">展开观察时暂停虚拟时间；原料、配方和受热状态保持原样。</p><p class="small">模型内腔为教学结构。加热时间已压缩，流量未经实测标定，不用于预测真实风味或判断实物已冷却。</p><a href="https://www.bialetti.com/media/manual/caffettiere/MOKA_EXPRESS-manual.pdf" target="_blank" rel="noopener">Bialetti Moka Express 使用说明 ↗</a>`;
}
function closeContext(){view='';delete $('#workshop').dataset.view;contextOpen=false;scene.focus(mode);stopInput();renderUI();}
function updateNumbers(){
 let read=mode==='open'?`旋开 ${(s.open*100).toFixed(0)}%`:mode==='water'?`已加入 ${s.water.toFixed(0)} g`:'咖啡粉 '+s.powder.toFixed(1)+' g';
 if(mode==='close')read=`旋合 ${((1-s.open)*100).toFixed(0)}%`;
 if(mode==='transport')read=s.onStove?'已放稳在炉头':'隔热垫 → 炉头';
 if(mode==='heat')read=`${s.progress>=1?(s.heat>0?'出液结束 · 请关火':'出液结束 · 已关火'):s.brewed>0?(s.heat>0?'正在出液':'已关火'):s.heat>0?'正在受热':'炉火已关闭'} · 已收集 ${s.brewed.toFixed(0)} g`;
 if(mode==='pour')read=`杯中咖啡 ${s.poured.toFixed(0)} g · 壶中剩余 ${coffeeLeft(s).toFixed(0)} g`;
 if(mode==='blend')read=`成杯 ${totalCup(s).toFixed(0)} g`;
 if(view==='structure')read=components[inspectedPart][0];else if(view==='flow')read='水路剖面 · 制作已暂停';
 $('#objectReadout').innerHTML=read+'<small>'+(view?'教学结构示意 · 原操作状态保留':['heat','pour'].includes(mode)?(isHot(s)?'壶身很烫 · 移壶用手柄':'受热与出液均为教学示意'):'数值为本器具教学预设')+'</small>';
 if(mode==='blend'){const cup=cupSnapshot(s),check=checkOrder(cup,order);$('#recipe').innerHTML=`<strong>当前配方</strong><p>摩卡咖啡 ${s.poured.toFixed(0)} g</p>${s.cup.milk>.1?`<p>温牛奶 ${s.cup.milk.toFixed(0)} g</p>`:''}${s.cup.water>.1?`<p>水 ${s.cup.water.toFixed(0)} g</p>`:''}${s.cup.ice>.1?`<p>冰块 ${s.cup.ice.toFixed(0)} g</p>`:''}<p class="match">${order?(check.met?'符合来单 ✓':'尚待调整：'+check.checks.filter(x=>!x.met).map(x=>x.label).join(' · ')):'自由配方 · 由你决定何时完成'}</p>`;}
 const action=view==='structure'?inspectedPart:tool==='coffee'||tool==='handle'?'handle':tool==='drain'?'lower':tool==='cupwater'?'water':tool==='stir'?'powder':tool;
 const p=scene.project(action),width=$('#stage').clientWidth,height=$('#stage').clientHeight;
 const cue=$('#gestureCue');cue.style.left=clamp(p.x+34,5,Math.max(5,width-140))+'px';cue.style.top=clamp(p.y-50,10,Math.max(10,height-55))+'px';
 cue.textContent=['water','milk','cupwater','coffee','drain'].includes(tool)?'向左拖动倾倒':tool==='heat'?'左关 · 右开':tool==='basket'?'拖到壶口':tool==='ice'?'拖到杯口':tool==='brush'?'扫过壶缘':tool==='powder'?'向右拖动装粉':tool==='stir'?'轻轻左右搅匀':tool==='handle'?(s.onStove?'拖到左侧隔热垫':'拖到右侧炉头'):mode==='close'?'向左旋合':'向右旋开';cue.hidden=!!view;
 $('#objectControl').style.left=p.x+'px';$('#objectControl').style.top=p.y+'px';$('#objectControl').setAttribute('aria-label',view==='structure'?'结构观察：左右方向键选部件，回车返回原操作。':toolNames[tool]+'：左右方向键微调；倾倒用空格按住，松开停止；粉篮与移壶用回车落位。'+(['heat','pour'].includes(mode)?'上下方向键开合壶盖。':''));
}
function beginGesture(action,e){
 if(view){if(view==='structure'){const part=action==='lidknob'?'lid':action==='handle'?'upper':action;if(components[part]){inspectedPart=part;renderContext();status('正在观察：'+components[part][0]+'。制作状态仍然保留。');}}else status('教学观察已暂停制作。收起说明后继续。');return;}
 if(action==='lidknob'||action==='lid'&&!isHot(s)){
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,tool:'lid',startLid:s.lidOpen};scene.gesture(true);if(e.isTrusted)canvas.setPointerCapture?.(e.pointerId);status('握住盖钮向上拖开盖，向下拖闭合；留意热液飞溅。');return;
 }
 if(['upper','lower','lid','filter','gasket'].includes(action)&&isHot(s)){if(!s.events.includes('hot-touch'))s.events.push('hot-touch');warn('壶身很烫。用手柄移壶；充分冷却后才能旋开。');return;}
 if(['filter','gasket'].includes(action)){stopInput();inspectedPart=action;contextOpen=true;view='structure';$('#workshop').dataset.view=view;scene.focus('structure');renderUI();return;}
 if(action==='cup'){setMode('blend','milk');return;}
 let id=action;
 if(action==='lower')id=tool==='drain'?'drain':s.open<.95&&!s.started?'upper':'water';
 if(action==='handle')id=mode==='pour'?'coffee':'handle';
 if(action==='water'&&mode==='blend')id='cupwater';
 if(action==='upper')id='upper';if(action==='powder'&&tool==='stir')id='stir';
 if(tool!==id){chooseTool(id);return;}
 if(tool==='heat'&&!s.onStove){warn('用手柄把合好的壶拖到炉头，放稳后开火。');return;}
 if(tool==='upper'&&s.started){warn(isHot(s)?'先关火并充分冷却，再拆壶。':'这一锅已经完成。保留作品后再准备一锅。');return;}
 if(tool==='handle'&&s.onStove&&s.heat>0){warn('先把旋钮向左拖至关闭，再用手柄移壶。');return;}
 gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,tool,startHeat:s.heat,startOpen:s.open};drag=null;flow='';scene.gesture(true);
 if(['milk','cupwater','ice'].includes(tool))undo.push({...s.cup});
 if(e.isTrusted)$('#workshopCanvas').setPointerCapture?.(e.pointerId);status(tool==='heat'?'旋钮停在你设定的位置；向左拖至零才会关火。':'松手会停止当前操作，已经加入的原料会保留。');
}
function moveGesture(e){
 if(!gesture||e.pointerId!==gesture.id)return;
 const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,step=e.clientX-gesture.lastX;
 if(gesture.tool==='lid'){s.lidOpen=clamp(gesture.startLid-dy/100,0,1);return;}
 const scale=scene.layout().height/Math.max(1,$('#stage').clientHeight)*1.12;
 if(tool==='upper'){const issue=turnShell(s,step*.005);if(issue)warn(issue);}
 else if(['water','milk','cupwater','coffee','drain','powder'].includes(tool)){tilt=clamp((tool==='powder'?dx:-dx)/140,0,1);}
 else if(tool==='basket'){drag={kind:'basket',dx:dx*scale,dy:-dy*scale};}
 else if(tool==='handle'){drag={kind:'transport',dx:dx*scale,dy:0};}
 else if(tool==='ice'){drag={kind:'ice',dx:dx*scale,dy:-dy*scale};}
 else if(tool==='brush'){drag={kind:'brush',dx:clamp(dx*scale,-.5,.5),dy:0};const issue=brushRim(s,step);if(issue)warn(issue);}
 else if(tool==='stir'){drag={kind:'stir',dx:clamp(dx*scale,-.3,.3),dy:0};if(Math.abs(dx)>70){s.stirred=true;if(!s.events.includes('coffee-stirred'))s.events.push('coffee-stirred');status('咖啡已轻轻搅匀。继续用手柄倒出。');}}
 else if(tool==='heat'){const issue=setHeat(s,gesture.startHeat+dx/55);if(issue)warn(issue);}
 gesture.lastX=e.clientX;gesture.lastY=e.clientY;
}
function endGesture(){
 if(!gesture)return;
 if(gesture.tool==='lid'){stopInput();status(s.lidOpen>.5?'上壶正在收集咖啡液。避开热液，观察后可向下拖盖钮合盖。':'壶盖已合上。金属仍可能很烫，移壶握手柄。');return;}
 if(tool==='basket'&&drag){const target=s.basketIn?drag.dx:1.9+drag.dx;if(!s.basketIn&&Math.abs(target)<.85){const issue=setBasket(s,true);if(issue)warn(issue);else status('粉篮落位。装满咖啡粉，铺平但别压实。');}else if(s.basketIn&&Math.abs(drag.dx)>1){setBasket(s,false);status('粉篮已放到桌上，仍可装粉。');}else warn('对准壶口再松手；粉篮已回到原处。');}
 if(tool==='handle'&&drag){if(!s.onStove&&drag.dx>1.1){const issue=placePot(s,true);if(issue)warn(issue);else{setMode('heat','heat');status('已放稳。直接拖动旋钮，调节炉火。');}}else if(s.onStove&&drag.dx<-1.1){const issue=placePot(s,false);if(issue)warn(issue);else{setMode('pour','coffee');status('壶已移到隔热垫。关火后壶仍然很烫，继续用手柄倒咖啡。');}}else warn(s.onStove?'把壶拖向左侧隔热垫再松手。':'把壶拖向右侧炉头再松手。');}
 if(tool==='ice'&&drag){if(Math.abs(1.3+drag.dx)<.65){warn(addToCup(s,'ice',30,1));status('已加入一块冰；总量包含冰块质量。');}else warn('把冰块拖到杯口再松手。');}
 const previousMode=mode;stopInput();
 if(tool==='upper'&&s.open>=.99&&previousMode==='open'){setMode('water','water');status('下壶已打开。滤网和密封圈仍附在上壶，粉篮放在桌边。');}
 else if(tool==='upper'&&s.open<=.01&&s.water>0){setMode('transport','handle');status('接缝已合好。用手柄移到炉头，放稳再开火。');}
 else renderUI();
}
const canvas=$('#workshopCanvas');canvas.addEventListener('pointerdown',e=>{const hit=scene.pick(e.clientX,e.clientY);if(hit){e.preventDefault();beginGesture(hit.action,e);}});
canvas.addEventListener('pointermove',e=>{if(gesture){if(e.buttons===0&&gesture.id!=='keyboard')endGesture();else moveGesture(e);}else canvas.style.cursor=scene.pick(e.clientX,e.clientY)?'grab':'default';});
canvas.addEventListener('pointerup',endGesture);canvas.addEventListener('pointercancel',stopInput);canvas.addEventListener('lostpointercapture',()=>{if(gesture)stopInput();});
window.addEventListener('pointerup',()=>{if(gesture&&gesture.id!=='keyboard')endGesture();});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.tool){const id=b.dataset.tool;if(id==='blend'){setMode('blend','milk');return;}if(id==='undo'){const prev=undo.pop();if(prev){s.cup=prev;renderUI();}return;}if(id==='stir'){tool='stir';status('上壶的咖啡先轻轻搅匀，再倒入杯中。按住模型并左右拖动。');renderUI();return;}chooseTool(id);return;}
 if(b.dataset.knowledge){if(b.dataset.knowledge==='return'||b.dataset.knowledge==='structure'&&view==='structure'){closeContext();status('已回到原操作，原料与配方保留。');return;}stopInput();const next=b.dataset.knowledge;if(view===next)view='';else view=next;if(view){$('#workshop').dataset.view=view;scene.focus(view==='structure'?'structure':mode==='heat'?'heat':'open');}else{delete $('#workshop').dataset.view;scene.focus(mode);}renderContext();renderUI();return;}
 if(b.dataset.poster==='close'){$('#posterDialog').close();return;}
 if(b.dataset.poster==='save')downloadPoster();
 if(b.dataset.style){posterStyle=b.dataset.style;updatePoster();}
 if(b.dataset.palette){posterPalette=b.dataset.palette;updatePoster();}
});
$('#contextToggle').addEventListener('click',()=>{stopInput();if(contextOpen)closeContext();else{contextOpen=true;renderContext();}});
document.addEventListener('change',e=>{if(e.target.id==='grindChoice'&&s.powder===0&&!s.started){s.grind=Number(e.target.value);save();}});
$('#finishCup').addEventListener('click',openPoster);
$('#newBatch').addEventListener('click',()=>{if(s.heat>0){warn('先关闭炉火，再开始新一锅。');return;}persistCup();const nextBatch=s.batch+1;s=freshWorkshop();s.batch=nextBatch;undo=[];setMode('open','upper');status('上一杯已保留在工作室。这里换了一把冷壶和新原料。');});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#workshop').requestFullscreen();}catch{warn('当前浏览器没有开放页面全屏，可以展开浏览器面板继续操作。');}});
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'全屏工作台');$('#workshop').dataset.fullscreen=String(!!document.fullscreenElement);});
function persistCup(){const cup=cupSnapshot(s,Date.now());if(cup.baseMass<1)return;try{const store=JSON.parse(localStorage.getItem('coffee-studio-v1')||'{"cups":[]}');store.cups||=[];if(!store.cups.some(c=>c.workshop?.batch===cup.workshop.batch&&c.baseMass===cup.baseMass&&c.milk===cup.milk&&c.water===cup.water&&c.ice===cup.ice))store.cups.push(cup);store.cups=store.cups.slice(-10);store.nextId=Math.max(...store.cups.map(c=>Number(c.id)||0))+1;localStorage.setItem('coffee-studio-v1',JSON.stringify(store));}catch{}return cup;}
function openPoster(){
 if(s.poured<1){warn('先倒一杯咖啡。');return;}stopInput();poster=structuredClone(cupSnapshot(s));const r=workshopReport(poster,order);$('#posterName').value=drinkName(poster);$('#posterStory').innerHTML=`<h3>${esc(r.title)}</h3><p>${esc(r.intro)}</p>${r.observations.slice(0,3).map(x=>'<p>'+esc(x)+'</p>').join('')}`;$('#posterDialog').showModal();updatePoster();persistCup();
}
async function updatePoster(){
 if(!poster)return;const rev=++posterRevision;const cup=structuredClone(poster),report=workshopReport(cup,order),offscreen=document.createElement('canvas');
 $('#posterStyles').innerHTML=REPORT_STYLES.map(x=>`<button data-style="${x.id}" class="${posterStyle===x.id?'active':''}">${x.name}</button>`).join('');
 $('#posterPalettes').innerHTML=PALETTES.map(x=>`<button data-palette="${x.id}" class="${posterPalette===x.id?'active':''}"><i style="background:${x.accent}"></i>${x.name}</button>`).join('');
 await drawReport(offscreen,{cup,report,style:posterStyle,palette:posterPalette,title:$('#posterName').value,position:posterPosition});if(rev!==posterRevision)return;$('#posterCanvas').getContext('2d').drawImage(offscreen,0,0);$('#posterCanvas').dataset.recipe=JSON.stringify(cup);
}
$('#posterName').addEventListener('input',updatePoster);
async function downloadPoster(){await updatePoster();const blob=await new Promise(resolve=>$('#posterCanvas').toBlob(resolve,'image/png'));if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='摩卡特刊-'+posterPalette+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#posterCanvas').addEventListener('pointerdown',e=>{posterDrag={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...posterPosition}};e.target.setPointerCapture(e.pointerId);});
$('#posterCanvas').addEventListener('pointermove',e=>{if(!posterDrag)return;const r=e.target.getBoundingClientRect();posterPosition={x:clamp(posterDrag.start.x+(e.clientX-posterDrag.x)/r.width,.36,.73),y:clamp(posterDrag.start.y+(e.clientY-posterDrag.y)/r.height,.37,.51)};updatePoster();});
$('#posterCanvas').addEventListener('pointerup',()=>posterDrag=null);$('#posterCanvas').addEventListener('pointercancel',()=>posterDrag=null);
function initSound(){const ctx=new AudioContext(),buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.18;const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;const gain=ctx.createGain();gain.gain.value=0;source.connect(filter).connect(gain).connect(ctx.destination);source.start();return {ctx,gain,filter};}
$('#soundToggle').addEventListener('click',()=>{sound=!sound;if(sound&&!audio)audio=initSound();audio?.ctx.resume();$('#soundToggle').textContent='声音 '+(sound?'开':'关');$('#soundToggle').setAttribute('aria-pressed',String(sound));$('#soundToggle').setAttribute('aria-label',sound?'关闭冲煮声音':'打开冲煮声音');});
const keyControl=$('#objectControl');keyControl.addEventListener('keydown',e=>{
 if(e.repeat&&e.code==='Space')return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Space'].includes(e.code))e.preventDefault();
 if(view){if(view==='structure'&&['ArrowLeft','ArrowRight'].includes(e.code)){const ids=Object.keys(components);inspectedPart=ids[(ids.indexOf(inspectedPart)+(e.code==='ArrowRight'?1:ids.length-1))%ids.length];renderContext();updateNumbers();}else if(e.code==='Enter')closeContext();return;}
 if(['ArrowUp','ArrowDown'].includes(e.code)&&['heat','pour'].includes(mode)){s.lidOpen=clamp(s.lidOpen+(e.code==='ArrowUp'?.25:-.25),0,1);save();}
 if(e.code==='ArrowLeft'||e.code==='ArrowRight'){
  const sign=e.code==='ArrowRight'?1:-1;
  if(tool==='upper')warn(turnShell(s,sign*.12));
  else if(tool==='heat')warn(setHeat(s,s.heat+sign*.3));
  else if(tool==='brush')warn(brushRim(s,35));
  else if(tool==='stir'){s.stirred=true;if(!s.events.includes('coffee-stirred'))s.events.push('coffee-stirred');}
  else if(tool==='water')warn(waterFlow(s,sign<0?5:0,1));
  else if(tool==='drain')warn(waterFlow(s,sign<0?-5:0,1));
  else if(tool==='powder')warn(powderFlow(s,sign>0?2:0,1));
  else if(tool==='coffee')warn(pourCoffee(s,sign<0?5:0,1));
  else if(['milk','cupwater'].includes(tool)&&sign<0){undo.push({...s.cup});warn(addToCup(s,tool==='milk'?'milk':'water',5,1));}
  renderUI();
 }
 if(e.code==='Enter'){if(tool==='basket')warn(setBasket(s,!s.basketIn));else if(tool==='handle'){const issue=placePot(s,!s.onStove);if(issue)warn(issue);else setMode(s.onStove?'heat':'pour',s.onStove?'heat':'coffee');}else if(tool==='ice'){undo.push({...s.cup});warn(addToCup(s,'ice',30,1));renderUI();}else if(tool==='upper'){if(s.open===1)setMode('water','water');else if(s.open===0&&s.water>0)setMode('transport','handle');}}
 if(e.code==='Space'){gesture={id:'keyboard',tool,x:0,y:0,lastX:0,lastY:0};if(['milk','cupwater'].includes(tool))undo.push({...s.cup});tilt=.65;scene.gesture(true);}
});keyControl.addEventListener('keyup',e=>{if(e.code==='Space')endGesture();});keyControl.addEventListener('blur',()=>{if(gesture?.id==='keyboard')stopInput();});
window.addEventListener('blur',stopInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopInput();});window.addEventListener('pagehide',()=>{stopInput();s.heat=0;try{localStorage.setItem('moka-hands-on-v2',JSON.stringify({order:order?.id||null,state:s}));}catch{}});
scene.ready.then(()=>{$('#stage').classList.remove('model-loading');$('#stage').setAttribute('aria-busy','false');renderUI();status('工作台就绪。操作工具与模型，随时展开旁边的说明。');}).catch(error=>{console.error(error);$('#stage').classList.remove('model-loading');status('外观模型未加载，请刷新重试。');});
function frame(now){
 const dt=Math.min(.08,(now-(lastTime||now))/1000);lastTime=now;flow='';
 const paused=document.hidden||contextOpen||!!view||$('#posterDialog').open;
 tickWorkshop(s,dt,{paused});
 if(gesture&&!paused&&tilt>.16){const rate=Math.pow((tilt-.16)/.84,1.2);let issue='';
  if(tool==='water'){issue=waterFlow(s,rate*35,dt);if(!issue||s.water>SPEC.waterMax)flow='water';}
  if(tool==='drain'){issue=waterFlow(s,-rate*24,dt);if(!issue)flow='drain';}
  if(tool==='powder'){issue=powderFlow(s,rate*6,dt);if(!issue)flow='powder';}
  if(tool==='coffee'){issue=pourCoffee(s,rate*28,dt);if(!issue&&coffeeLeft(s)>.1)flow='coffee';}
  if(tool==='milk'||tool==='cupwater'){issue=addToCup(s,tool==='milk'?'milk':'water',rate*42,dt);if(!issue)flow=tool==='milk'?'milk':'cupwater';}
  if(issue&&$('#localWarning').textContent!==issue)warn(issue);
 }
 scene.update(s,{tool,view,tilt,drag,flow,time:now/1000,dt});
 if(now-lastUI>90){lastUI=now;updateNumbers();if(mode==='heat'&&s.heat===0&&!$('#tools [data-tool="handle"]'))renderUI();if(s.poured>=1&&$('#finishCup').hidden&&!view)renderUI();}
 if(now>warningUntil){$('#localWarning').classList.remove('show');$('#localWarning').textContent='';}
 if(audio){audio.filter.frequency.setTargetAtTime(s.progress>.86?600:1100,audio.ctx.currentTime,.15);audio.gain.gain.setTargetAtTime(sound&&!paused&&(flow||s.heat>0)?(flow?.16:.06):0,audio.ctx.currentTime,.08);}
 requestAnimationFrame(frame);
}
renderUI();requestAnimationFrame(frame);
// Read-only summaries and projected targets support browser QA without simulating user actions through state writes.
window.mokaWorkshop={state:()=>structuredClone(s),targets:()=>Object.fromEntries(['upper','lower','water','basket','powder','brush','heat','handle','milk','cup','ice'].map(id=>[id,scene.project(id)])),layout:()=>scene.layout(),getCup:()=>cupSnapshot(s),getReport:()=>workshopReport(cupSnapshot(s),order)};
