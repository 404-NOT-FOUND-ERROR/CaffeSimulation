import {escapeHTML as esc} from './studio-art.js';
import {GEARS} from './studio-model.mjs';

const $=id=>document.getElementById(id);
const shortBrief={
 window:'热黑咖 · 不加奶 · 慢慢喝',
 breakfast:'热奶咖 · 牛奶多一些',
 bar:'意式浓缩 · 保留原液',
 kitchen:'摩卡壶 · 原液黑咖',
 ice:'冰黑咖 · 不加奶',
 share:'手冲黑咖 · 一壶两人',
 foam:'意式奶咖 · 加奶泡',
 small:'小杯黑咖 · 器具随你'
};
const methods={
 moka:{image:'moka',explain:'炉火加热 · 压力差送水'},
 pour:{image:'pour',name:'手冲咖啡',explain:'手动注水 · 重力过滤'},
 espresso:{image:'espresso',explain:'水泵加压 · 小份萃取'}
};
export function renderEntrance(state){
 $('cafeHome').hidden=state.page!=='lobby';
 $('cafeChoose').hidden=state.page!=='choose';
 if(state.page==='lobby'){
  $('cafeOrders').innerHTML=state.offers.map((order,index)=>`<button class="cafe-order ${state.order?.id===order.id?'is-current':''}" data-order="${order.id}" aria-label="接下来单：${esc(order.title)}，${esc(order.brief)}"><span class="cafe-order-number">0${index+1}</span><span><strong>${esc(order.title)}</strong><small>${esc(shortBrief[order.id]||order.brief)}</small></span><span class="cafe-order-arrow" aria-hidden="true">→</span></button>`).join('');
  $('cafeArchive').hidden=!state.cups.length;
  $('cafeArchive').textContent=`我的出杯 · ${state.cups.length} 杯 ↗`;
 }
 if(state.page==='choose'){
  const order=state.order,title=order?.title||'自由发挥';
  $('methodOrderLabel').innerHTML=order?`已接下来单 / <b>${String(state.ticket||1).padStart(2,'0')}</b>`:'随你发挥 / <b>LIBERO</b>';
  $('methodOrderTitle').innerHTML=title.length===4?esc(title.slice(0,2))+'<br>'+esc(title.slice(2)):esc(title);
  $('methodOrderBrief').textContent=order?.brief||'器具和配方，由你决定。做一杯自己的咖啡，再让它登上特刊。';
  const specs=order?[order.temp==='iced'?'冰饮':'热饮',order.range.join('–')+' g',order.milk==='none'?'不加奶':order.milk==='more'?'牛奶多一些':'可以加奶']:[ '器具随你','自由配方' ];
  $('methodOrderSpecs').textContent=specs.join(' / ');
  const cup=order?.temp==='iced'?'cup-ice':order?.milk==='none'?'cup-black':'cup-milk';
  $('methodCup').src=cup==='cup-ice'?'assets/cafe/cup-ice.png':'assets/cafe/v3/'+cup+'.webp';
  $('methodCup').alt=order?'来单目标：'+order.title+'，饮品示意':'自由创作的咖啡示意';
  $('methodRelease').hidden=!order;
  const preferred=order?.gear||'moka';
  $('methodChoices').innerHTML=Object.entries(GEARS).map(([id,gear],index)=>{
   const main=id===preferred,required=order?.gear===id;
   const label=methods[id].name||gear.name;
   return `<button class="method-choice ${required?'is-required':''}" data-gear="${id}" aria-label="用${label}制作${order?'：'+esc(order.title):'，自由发挥'}"><span class="method-art">${id==='moka'?'<span class="method-word" aria-hidden="true">MOKA</span>':''}<img src="assets/cafe/v3/${methods[id].image}.webp" alt="" width="960" height="1200" decoding="async"></span><span class="method-kicker"><b>0${index+1}</b> / ${gear.latin}</span><strong class="method-name">${label}${main?'':'<i aria-hidden="true">↗</i>'}</strong><span class="method-description">${methods[id].explain}</span>${order?.gear?`<span class="method-fit">${required?'这张来单指定的器具':'另一种做法 · 可自由尝试'}</span>`:''}${main?`<span class="method-enter">用${label}制作 →</span>`:''}</button>`;
  }).join('');
 }
}
export function initEntrance(){
 const home=$('cafeHome'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 home.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||reduced.matches||innerWidth<1024||home.hidden)return;
  const r=home.getBoundingClientRect();
  home.style.setProperty('--cafe-px',((e.clientX-r.left-r.width/2)/r.width*5).toFixed(2)+'px');
  home.style.setProperty('--cafe-py',((e.clientY-r.top-r.height/2)/r.height*3).toFixed(2)+'px');
 });
 const reset=()=>{home.style.setProperty('--cafe-px','0px');home.style.setProperty('--cafe-py','0px');};
 home.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);
}
