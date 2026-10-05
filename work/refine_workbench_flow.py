"""Apply the audited interaction corrections; assertions avoid broad replacements."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
path=root/'workshop-experience.js'
text=path.read_text(encoding='utf-8-sig')
changes=[
("let autoFill=null,levelDragging=false;", "let autoFill=null,levelDragging=false,previousCup=null;"),
("function range(id,label", "function range(id,label"),
("实物按说明盖好壶盖，移壶握手柄，开盖握盖钮。", "制作中保持壶盖关闭；出液结束后搅匀再倒杯。移壶握手柄，金属仍然很烫。"),
("const preparing=!s.started,ids=preparing?['water','powder']:s.poured>0?['blend','pour']:['heat'];", "const preparing=!s.started,ids=preparing?['water','powder']:s.poured>0?['blend',...(coffeeLeft(s)>=1?['pour']:[])]:['heat'];"),
("+'<div class=\"brew-progress\"><i id=\"brewProgress\"></i></div><p class=\"heat-note\" id=\"heatNote\"></p>';", "+'<div class=\"brew-states\"><span data-brew-state=\"warm\">受热</span><span data-brew-state=\"flow\">出液</span><span data-brew-state=\"tail\">收杯</span></div><div class=\"brew-progress\"><i id=\"brewProgress\"></i></div><p class=\"heat-note\" id=\"heatNote\"></p><button class=\"stop-heat\" data-stop-heat>关火，看看余热 ↗</button><p id=\"batchComparison\" class=\"batch-comparison\"></p>';"),
("if($('#heatAmount'))$('#heatAmount').disabled=s.progress>=1;", "if($('#heatAmount'))$('#heatAmount').disabled=s.progress>=1;"),
("$('#controls').inert=busy()||!!view;", "$('#controls').inert=busy()||!!view;"),
("if(!contextOpen)return;", "if(!contextOpen)return;"),
("const part=components[inspectedPart],copy=", "const part=mode==='blend'?['杯中的咖啡','原液已经萃取完成。加水会稀释，加奶会改变配方与颜色；不会从粉层再萃取出更多咖啡。']:components[inspectedPart],copy="),
("'<p>实物按器具说明操作。", "'<p class=\"reading-pause\">阅读中 · 虚拟制作暂停，收起继续。</p><p>实物按器具说明操作。"),
("`${s.progress>=1?'出液结束':s.brewed>0?'正在出液':'正在受热'} · ${Math.round(s.brewed)} g`", "`${s.progress>=1?'出液结束':s.lastFlow>.08?(s.heat>0?'正在出液':'余热出液'):s.heat>0?'正在受热':'已关火'} · ${Math.round(s.brewed)} g`"),
("if($('#heatNote'))$('#heatNote').textContent=s.progress>=1?'出液结束，炉火已关闭。可以出杯。':s.heat===0?'炉火已关闭，壶身仍会保留热量。':'热量改变下壶内的压力，液态水沿导管上升。';", "if($('#heatNote')){const stage=s.progress>=.82?'tail':s.brewed>.5?'flow':'warm';for(const mark of document.querySelectorAll('[data-brew-state]'))mark.classList.toggle('active',mark.dataset.brewState===stage);$('#heatNote').textContent=s.progress>=1?'演示已自动关火保护。出液结束，可以出杯。':s.heat===0?(s.lastFlow>.08?'已关火，余热仍在推动少量液体；移离炉头后会更快停止。':'已关火。已有原液可以出杯，也可以重新调小火继续。'):s.progress>.82?'流量正在回落。你可以关火收杯，比较这一锅收集了多少。':s.brewed>.5?'正在出液。调小火会减慢这段演示，粉层与水路继续同步。':'水面上方的空气与水蒸气压力变化，推动液态水进入细管。';const stop=$('[data-stop-heat]');if(stop)stop.disabled=busy()||s.heat===0;const comparison=$('#batchComparison');if(comparison)comparison.textContent=previousCup?'上一锅：'+Math.round(previousCup.baseMass)+' g 原液 · 本锅试着改变收杯时机。':'加热时间已压缩 · 流量为教学示意';}"),
("autoFill?'正在加入清水，水面与用量同步变化。'", "autoFill?(autoFill.target<s.water?'正在倒出多余的水，保留其他准备。':'正在加入清水，水面与用量同步变化。')"),
("$('#recipe').innerHTML=`<strong>这一杯的配方</strong>", "const facts=checkOrder(cup,order),needed=order?Math.max(0,order.range[0]-totalCup(s)):0,tip=order&&needed>0?(order.milk==='more'?'加奶可同时改变份量与配方。':'还差约 '+Math.ceil(needed)+' g 达到来单份量；出杯后加水可做成长杯。'):order&&facts.met?'来单配方已满足，可以保留这杯或继续发挥。':'改变添加比例，看看液面和示意颜色怎样变化。';$('#recipe').innerHTML=`<strong>这一杯的配方</strong>"),
("</p>`;}\n if(!s.started)", "</p><p class=\"recipe-tip\">${tip}</p>`;}\n if(!s.started)"),
("setHeat(s,0);const from=", "setHeat(s,0);if(s.stopProgress===null)s.stopProgress=s.progress;const from="),
("{duration:.85,frame(t){tilt=t*.70;}},", "{duration:1.15,begin(){tool='stir';status('出液结束后先轻轻搅匀，再倒入杯中。实物握盖钮，避开热金属。');},frame(t){drag={kind:'stir',dx:Math.sin(t*Math.PI*4)*.14,dz:Math.cos(t*Math.PI*4)*.14};},end(){s.stirred=true;drag=null;tool='coffee';}},\n  {duration:.85,frame(t){tilt=t*.70;}},"),
("if(b.dataset.mode){", "if(b.hasAttribute('data-stop-heat')){setHeat(s,0);status('你关掉了炉火。观察剖面里的余热出液，决定何时移壶收杯。');updateNumbers();save();return;}\n if(b.dataset.mode){"),
("if(busy())return;persistCup();const batch=s.batch+1;", "if(busy())return;previousCup=persistCup();const batch=s.batch+1;"),
("document.hidden||!!view||$('#posterDialog').open", "document.hidden||contextOpen||!!view||$('#posterDialog').open"),
("const cup=cupSnapshot(s,Date.now());", "s.cupId??=Date.now();const cup=cupSnapshot(s,s.cupId);"),
("if(!store.cups.some(c=>c.workshop?.batch===cup.workshop.batch&&c.baseMass===cup.baseMass&&c.milk===cup.milk&&c.water===cup.water&&c.ice===cup.ice))store.cups.push(cup);", "const index=store.cups.findIndex(c=>c.id===cup.id);if(index>=0)store.cups[index]=cup;else store.cups.push(cup);"),
("r.observations.slice(0,3)", "r.observations.slice(0,5)"),
]
for before,after in changes:
    assert before in text, f'Expected source not found: {before[:100]}'
    text=text.replace(before,after,1)
path.write_text(text,encoding='utf-8')
