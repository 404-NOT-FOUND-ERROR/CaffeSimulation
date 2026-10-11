import {totalCup,isHot} from './workshop-state.mjs';
import {transformedPoint,liquidPath} from './poster-motion.mjs';

const ASSET='./assets/poster-workbench/';
const PARTS=['lower','basket','gasket','filter','upper','lid'];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const approach=(from,to,dt)=>from+(to-from)*(reduced?1:1-Math.exp(-dt*9));
const image=(name,className='')=>'<img class="'+className+'" src="'+ASSET+name+'.webp" alt="" draggable="false">';
// Product renders carry material and light only. HTML, liquid paths and state stay live.
export function createPosterScene(canvas){
 const host=canvas.parentElement;canvas.hidden=true;canvas.dataset.asset='poster-workbench-v1';
 host.insertAdjacentHTML('afterbegin','<div class="product-board"><div class="counter-slice" aria-hidden="true"></div><div class="product-frame" aria-hidden="true"><div class="pot-contact"></div><div class="burner-sprite">'+image('burner')+'</div><div class="flame-ring">'+Array.from({length:24},(_,i)=>'<i style="--i:'+i+'"></i>').join('')+'</div><div class="pot-sprites">'+PARTS.map(name=>'<div class="product-part" data-part="'+name+'">'+image(name)+'</div>').join('')+'</div><div class="cup-sprites">'+image('cup-empty','empty-cup')+image('cup-black','black-cup')+image('cup-milk','milk-cup')+'<div class="cup-ice"><i></i><i></i><i></i></div></div><svg class="demo-stream" viewBox="0 0 960 1200"><path class="stream-shadow"/><path class="stream-line"/><ellipse class="stream-ripple" rx="20" ry="3"/></svg><div class="demo-spoon"><svg viewBox="0 0 30 160"><path d="M15 4V122" stroke="#c5c8bd" stroke-width="6" stroke-linecap="round"/><path d="M13 5V119" stroke="#f8f2e5" stroke-width="1.5"/><ellipse cx="15" cy="139" rx="11" ry="20" fill="#9aa69c" stroke="#e5e7dc" stroke-width="2"/></svg></div></div><div class="object-hotspots"><button data-inspect="lower" class="hotspot boiler-hotspot" aria-label="了解下壶与安全阀"><span>下壶</span></button><button data-inspect="upper" class="hotspot collector-hotspot" aria-label="了解上壶与出液导管"><span>上壶</span></button><button data-inspect="basket" class="hotspot basket-hotspot" aria-label="了解粉篮与粉层"><span>粉篮</span></button></div><div class="warm-tag" hidden>金属很烫，握手柄。</div><div class="motion-caption" aria-live="polite"></div></div>');
 const board=host.querySelector('.product-board'),frame=board.querySelector('.product-frame');
 function resize(){const width=Math.max(1,Math.min(host.clientWidth,host.clientHeight*.8));frame.style.width=width+'px';frame.style.height=width*1.25+'px';}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const parts=Object.fromEntries(PARTS.map(name=>[name,board.querySelector('[data-part="'+name+'"]')]));
 const ground=document.createElement('img');ground.src=ASSET+'grounds.webp';ground.alt='';ground.className='grounds-layer';parts.basket.append(ground);
 const cupLayers=board.querySelector('.cup-sprites');
 for(const color of ['black','milk']){
  cupLayers.querySelector('.'+color+'-cup').dataset.level='high';
  for(const level of ['low','mid'])cupLayers.insertAdjacentHTML('beforeend',image('cup-'+color+'-'+level,color+'-cup cup-'+level));
 }
 frame.insertAdjacentHTML('beforeend','<div class="demo-brush"><svg viewBox="0 0 170 32"><path d="M12 16H126" stroke="#896347" stroke-width="9" stroke-linecap="round"/><path d="M120 10H134V23H120Z" fill="#a9b0a5"/><path d="M134 8 164 5 167 27 134 24Z" fill="#c7b28e"/><path d="M139 8V24M145 7V25M151 6V26M157 6V26" stroke="#a59170"/></svg></div>');
 let anchors={spout:[.188878,.220925],burner:[.465393,.79592],cupSurface:[.436046,.32663]};
 const ready=Promise.all([...board.querySelectorAll('img')].map(img=>img.decode().catch(()=>{throw new Error('Product asset failed: '+img.src);})).concat(fetch(ASSET+'manifest.json').then(r=>r.json()).then(data=>{anchors=data.anchors||anchors;})));
 let mode='water',x=0,scale=1,rotation=0;
 const offsets={lower:20,basket:10,gasket:6,filter:0,upper:-10,lid:-22};
 function focus(next){mode=next;host.dataset.pose=next;}
 function update(s,{tool='',view='',selected='',tilt=0,drag=null,flow='',dt=.016,time=0}={}){
  const exploded=view==='structure',clean=view==='cleanup',preparing=!s.started,park=preparing?s.open:0;
  const transport=drag?.kind==='transport'?(drag.dx/1.8)*16:0;
  const targetX=mode==='blend'?-17:mode==='pour'?18:transport;
  x=approach(x,targetX,dt);scale=approach(scale,mode==='blend'?.72:exploded?.65:1,dt);rotation=approach(rotation,tool==='coffee'?-tilt*58:0,dt);
  board.dataset.exploded=String(exploded||clean);board.dataset.flow=flow;board.dataset.preparing=String(preparing);board.dataset.mode=mode;
  frame.style.setProperty('--pot-x',x+'%');frame.style.setProperty('--pot-scale',scale);frame.style.setProperty('--pot-rotation',rotation+'deg');frame.style.setProperty('--heat',s.heat/3);
  for(const name of PARTS){
   const ob=parts[name],upper=['upper','lid','filter','gasket'].includes(name);
   ob.classList.toggle('is-selected',exploded&&selected===name);
   const placing=name==='basket'&&drag?.kind==='basket'?Math.min(1,Math.abs(drag.dx)/1.9):s.basketIn?1:0;
   const px=exploded||clean?0:upper?-park*35:name==='basket'?28*(1-placing):0;
   const py=exploded?offsets[name]:clean?offsets[name]*.65:upper?park*22:name==='basket'?22*(1-placing)-Math.sin(placing*Math.PI)*12:0;
   const zoom=exploded||clean?1:upper?1-park*.24:name==='basket'?.8+placing*.2:1;
   // Isolated transparent renders do not carry inter-part occlusion. The loose
   // funnel may sit in front; once inserted, its tube belongs behind the shell.
   ob.style.zIndex=String(name==='basket'&&placing<.7&&!exploded&&!clean?6:({basket:1,gasket:2,filter:2,lower:3,upper:4,lid:5}[name]));
   ob.style.transform='translate('+px+'%,'+py+'%) scale('+zoom+')';
   if(name==='lid'&&tool==='stir')ob.style.transform='translateY(-12%)';
   ob.style.opacity=(name==='basket'&&!s.basketIn&&mode==='water'&&!view)?'.38':'1';
  }
  ground.style.opacity=s.powder>0?Math.min(1,s.powder/18):0;
  const flame=board.querySelector('.flame-ring');flame.classList.toggle('lit',s.heat>0&&s.onStove&&!view);flame.style.left=(anchors.burner[0]*100-12)+'%';flame.style.top=(anchors.burner[1]*100-1)+'%';
  board.querySelector('.burner-sprite').style.opacity=(s.onStove&&!exploded&&!clean&&mode!=='blend')?'1':'0';
  const cup=board.querySelector('.cup-sprites');cup.classList.toggle('served',s.poured>0);cup.classList.toggle('pouring',mode==='pour'||tool==='coffee');cup.classList.toggle('mixing',mode==='blend');
  const total=totalCup(s),liquid=total-s.cup.ice,milky=s.cup.milk/Math.max(1,liquid),level=liquid<110?'low':liquid<235?'mid':'high';
  for(const img of cup.querySelectorAll('.black-cup,.milk-cup')){
   const imageLevel=img.dataset.level||(img.classList.contains('cup-low')?'low':'mid');
   img.style.opacity=liquid>0&&imageLevel===level?(img.classList.contains('milk-cup')?Math.min(1,milky*1.8):1):0;
  }
  const ice=cup.querySelector('.cup-ice'),surface=anchors.cupLevels?.[level]||anchors.cupSurface;ice.hidden=!s.cup.ice;ice.style.left=(surface[0]*100-8)+'%';ice.style.top=(surface[1]*100-2)+'%';ice.lastElementChild.hidden=s.cup.ice<45;
  cup.style.opacity=preparing?'0':'1';
  const warm=board.querySelector('.warm-tag');warm.hidden=!isHot(s)&&!view;warm.textContent=view?'教学视图 · 虚拟制作暂停':'金属很烫，握手柄。';
  board.querySelector('.basket-hotspot').hidden=!preparing||mode==='water'||!!view;board.querySelector('.boiler-hotspot').hidden=!!view;board.querySelector('.collector-hotspot').hidden=preparing||!!view;
  // Quantities change in the live section. Only actual spout-to-cup transfer draws a stream.
  const target=[(cup.offsetLeft+cup.offsetWidth*anchors.cupSurface[0])*960/frame.clientWidth,(cup.offsetTop+cup.offsetHeight*anchors.cupSurface[1])*1200/frame.clientHeight];
  const stream=flow==='coffee'?liquidPath(transformedPoint(anchors.spout,{x,scale,rotation}),target):'';
  const svg=board.querySelector('.demo-stream');svg.style.opacity=stream&&!view?'1':'0';for(const path of svg.querySelectorAll('path'))path.setAttribute('d',stream);
  svg.style.setProperty('--stream-color',flow==='coffee'?'#704428':flow==='milk'?'#ead8b8':'#87b6c0');
  svg.querySelector('ellipse').setAttribute('cx',target[0]);svg.querySelector('ellipse').setAttribute('cy',target[1]);
  board.querySelector('.demo-spoon').style.opacity=tool==='stir'&&!view?'1':'0';
  const brush=board.querySelector('.demo-brush');brush.style.opacity=tool==='brush'&&!view?'1':'0';brush.style.transform='translateX('+(drag?.kind==='brush'?drag.dx*30:0)+'%) rotate(-12deg)';
  const text=view==='structure'?'零件沿同一装配轴展开':view==='cleanup'?'示范的是一把充分冷却的壶':tool==='brush'?'扫净壶缘，接缝才能贴合':tool==='basket'?'粉篮对准壶口，平稳落位':tool==='stir'?'先搅匀，再出杯':flow==='coffee'?'移离炉头，缓缓倾倒':flow==='water'?'水位正在变化':flow==='powder'?'装满粉篮，铺平不压实':mode==='transport'?'握手柄移壶':mode==='heat'&&s.heat>0?'火焰留在壶底范围内':'';
  const caption=board.querySelector('.motion-caption');if(caption.textContent!==text)caption.textContent=text;
 }
 return{ready,focus,update,pick(){return null;},layout(){resize();const r=host.getBoundingClientRect();return{width:r.width,height:r.height};},dispose(){observer.disconnect();board.remove();}};
}
