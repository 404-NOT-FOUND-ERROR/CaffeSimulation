import {GEARS,cupFacts,drinkName} from './studio-model.mjs';
import {PALETTES} from './poster.js';
export {PALETTES};
export const REPORT_STYLES=[{id:'manifesto',name:'透视宣言'},{id:'arch',name:'午后拱窗'},{id:'collage',name:'几何拼贴'}];
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mix=(a,b,t)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1).match(/../g)[i],16)*t).toString(16).padStart(2,'0')).join('');
let serial=0;
export function cupSVG(c,{ink='#f4ecdd',paper='#f4ecdd'}={}){
 const id=`glass-${++serial}`,f=cupFacts(c),milk=f.total?(c.milk+c.foam)/f.total:0,water=f.total?(c.water+c.ice)/f.total:0;
 const color=mix(mix('#352015','#92603a',water*.5),'#eddbb9',milk*.96),small=c.vessel==='small',ceramic=c.vessel==='ceramic'||small;
 const shape=small?'M49 95 Q50 204 119 208 Q186 204 190 95 Z':ceramic?'M34 63 L52 238 Q119 263 185 238 L203 63 Z':'M46 35 L61 248 Q123 271 180 248 L194 35 Z';
 const fillLevel=ceramic?(small?110:80):Math.max(50,245-Math.min(1,f.total/350)*190),surfaceX=small?119:120,surfaceY=ceramic?(small?100:66):fillLevel;
 const foam=c.foam>0?`<path d="M35 ${fillLevel} Q120 ${fillLevel-20} 204 ${fillLevel} L204 ${fillLevel+17} Q120 ${fillLevel+2} 35 ${fillLevel+17} Z" fill="#f5e4c5"/>`:'';
 const ice=c.ice>0?Array.from({length:Math.min(5,Math.ceil(c.ice/20))},(_,i)=>`<rect x="${75+(i%2)*53}" y="${Math.min(208,fillLevel+20)+Math.floor(i/2)*29}" width="35" height="30" rx="5" fill="#efe6d07a" stroke="#fff8e580" transform="rotate(${i%2?12:-13} ${90+(i%2)*53} ${fillLevel+35+Math.floor(i/2)*29})"/>`).join(''):'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 310" role="img" aria-label="${escapeHTML(drinkName(c))}，${f.total.toFixed(0)}克"><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><ellipse cx="122" cy="282" rx="100" ry="13" fill="${ink}" opacity=".12"/>${ceramic?`<path d="M193 ${small?120:99} C257 79 260 191 191 185" fill="none" stroke="${paper}" stroke-width="18"/>`:''}<path d="${shape}" fill="${ceramic?paper:paper+'22'}" stroke="${ink}" stroke-width="3"/><g clip-path="url(#${id})">${!ceramic?`<rect x="35" y="${fillLevel}" width="175" height="245" fill="${color}"/><ellipse cx="120" cy="${fillLevel}" rx="75" ry="12" fill="${color}" stroke="#c09c7377"/>`:''}${foam}${ice}<path d="M58 36 L75 245 L88 252 L74 36" fill="#ffffff33"/><path d="M166 39 L155 253 L165 247 L177 39" fill="#ffffff22"/></g>${ceramic?`<ellipse cx="${surfaceX}" cy="${surfaceY}" rx="${small?70:83}" ry="15" fill="${color}" stroke="${ink}" stroke-width="2"/>${c.foam>0?`<ellipse cx="${surfaceX}" cy="${surfaceY}" rx="${small?67:79}" ry="12" fill="#efdfc0"/>`:c.gear==='espresso'&&c.milk===0&&c.water===0?`<ellipse cx="${surfaceX}" cy="${surfaceY}" rx="${small?68:81}" ry="13" fill="none" stroke="#b67f43" stroke-width="4"/>`:''}<ellipse cx="120" cy="${small?235:271}" rx="${small?108:113}" ry="13" fill="${paper}" stroke="${ink}" stroke-width="1"/>`:`<ellipse cx="120" cy="35" rx="74" ry="13" fill="none" stroke="${ink}" stroke-width="3"/>`}<path d="M78 ${small?125:70} L87 ${small?181:229}" stroke="#ffffff55" stroke-width="3" stroke-linecap="round"/></svg>`;
}
export function gearIcon(gear){
 const shapes={moka:'<path d="M19 8 H43 L46 25 L42 30 L45 50 H16 L20 30 L16 25 Z" fill="#b9bbba" stroke="#50463e"/><path d="M43 13 H54 L57 21 L52 29 H46" fill="none" stroke="#322118" stroke-width="5"/><path d="M15 8 L44 8 L32 2 Z" fill="#ddd5c8"/><path d="M29 1 H35 V5 H29Z" fill="#322118"/>',pour:'<path d="M9 5 H52 L34 26 H27Z" fill="#d1ba99" stroke="#88705b"/><path d="M26 28 H36 L48 49 Q32 58 15 49Z" fill="#c9d3cd" stroke="#687b77"/><path d="M23 40 H40 L46 49 Q32 54 17 49Z" fill="#61402a"/><path d="M42 34 C56 32 57 46 46 47" fill="none" stroke="#687b77"/>',espresso:'<rect x="6" y="4" width="52" height="35" rx="3" fill="#254854"/><path d="M9 17 H55 V39 H9Z" fill="#bbb9af"/><path d="M26 21 H41 V26 H26Z" fill="#322118"/><path d="M35 25 H56" stroke="#322118" stroke-width="4"/><path d="M27 31 H40 L38 43 H29Z" fill="#f4ecdd"/><path d="M5 46 H60" stroke="#322118" stroke-width="4"/>'};
 return `<svg viewBox="0 0 64 60" aria-hidden="true">${shapes[gear]}</svg>`;
}
export function apparatusSVG(gear,mode='operate',part=''){
 const explode=mode==='explode',flow=mode==='flow',label=(x,y,s)=>`<text x="${x}" y="${y}" fill="#f4ecdd" font-family="Microsoft YaHei,sans-serif" font-size="13">${s}</text>`;
 const hit=(name,body)=>`<g data-part="${name}" class="part-hit" opacity="${part&&part!==name?.65:1}">${body}</g>`;
 const defs='<defs><linearGradient id="metal" x2="1" y2=".1"><stop stop-color="#b1b6b4"/><stop offset=".35" stop-color="#f4efe3"/><stop offset=".5" stop-color="#899994"/><stop offset=".7" stop-color="#e9e6dc"/><stop offset="1" stop-color="#8c9690"/></linearGradient><linearGradient id="glass" x2="1"><stop stop-color="#f4ecdd66"/><stop offset=".5" stop-color="#f4ecdd11"/><stop offset="1" stop-color="#f4ecdd44"/></linearGradient></defs>';
 let content='';
 if(gear==='pour'){
  content+=`<ellipse cx="295" cy="477" rx="153" ry="14" fill="#613921" opacity=".19"/>`;
  content+=hit('server',`<path d="M258 ${explode?324:286} H332 L389 438 Q300 477 208 438 Z" fill="url(#glass)" stroke="#f4ecdd" stroke-width="3"/><path d="M349 332 C430 303 447 402 373 414" fill="none" stroke="#f4ecdd" stroke-width="7"/><path id="server-liquid" d="M234 404 H367 L389 438 Q300 470 208 438Z" fill="#59321e" opacity=".9"/><path d="M245 329 L225 427" stroke="#ffffff55" stroke-width="8"/>${explode?label(410,421,'分享壶'):''}`);
  const dy=explode?-70:0;
  content+=hit('cone',`<g transform="translate(0 ${dy})"><path d="M171 167 Q296 152 421 167 L327 285 H265 Z" fill="${flow?'#f4ecdd22':'url(#metal)'}" stroke="#f4ecdd" stroke-width="3"/>${[0,1,2,3,4].map(i=>`<path d="M${199+i*45} 176 Q${235+i*29} 225 ${280+i*10} 277" fill="none" stroke="#877b6680" stroke-width="2"/>`).join('')}<path d="M413 174 Q474 157 447 210 L402 222" fill="none" stroke="#f4ecdd" stroke-width="7"/></g>${explode?label(445,177,'滤杯'):''}`);
  content+=hit('paper',`<g transform="translate(0 ${explode?-117:0})"><path d="M184 145 L296 267 L410 145" fill="#eadbc3" stroke="#f9f1e2" stroke-width="2"/><ellipse cx="296" cy="155" rx="110" ry="26" fill="#eadbc3"/></g>${explode?label(443,52,'滤纸'):''}`);
  if(!explode){content+=hit('bed',`<ellipse cx="296" cy="165" rx="89" ry="22" fill="#59412b"/><ellipse id="bed-water" cx="296" cy="160" rx="90" ry="23" fill="#75a9b9" opacity=".1"/><g id="wet-zones">${Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return `<ellipse data-zone="${i}" cx="${296+56*Math.cos(a)}" cy="${165+13*Math.sin(a)}" rx="20" ry="8" fill="#8e6340" opacity=".35"/>`}).join('')}</g>`);
   content+=`<path id="pour-stream" class="stream" d="M300 55 L300 162" fill="none" stroke="#d1e6e6" stroke-width="5" stroke-linecap="round"/><path id="drain-stream" class="stream" d="M296 284 L296 386" stroke="#653c25" stroke-width="4" stroke-linecap="round"/><ellipse id="pourZone" class="interactive-zone" cx="296" cy="165" rx="103" ry="33" fill="transparent" aria-label="按住并移动，在粉层上注水"/><g id="kettle" class="pour-cursor"><path d="M323 29 Q388 11 428 40 L414 75 H343Z" fill="url(#metal)" stroke="#f4ecdd" stroke-width="2"/><path d="M347 57 Q310 34 299 54" fill="none" stroke="#dde1d9" stroke-width="9"/><path d="M426 38 C479 17 474 69 419 69" fill="none" stroke="#322118" stroke-width="9"/></g>`;
  }
  if(flow)content+=`<path id="route-path" class="flow-path" d="M296 187 V246 V278 V377" stroke="#d7e9e7" stroke-width="5" fill="none"/>${label(66,245,'重力向下')}${label(405,317,'咖啡液')}`;
 }else if(gear==='espresso'){
  if(explode){content+=hit('pump',`<rect x="170" y="30" width="65" height="64" rx="8" fill="#254854" stroke="#f4ecdd" stroke-width="2"/><path d="M235 62 H294 V112" stroke="#dde5df" stroke-width="5" fill="none"/>${label(85,63,'水泵')}`);
   content+=hit('group',`<path d="M224 128 H367 V183 H224Z" fill="url(#metal)"/><path d="M248 184 H344" stroke="#f4ecdd" stroke-width="3"/>${label(402,158,'冲煮头')}`);
   content+=hit('puck',`<ellipse cx="295" cy="237" rx="68" ry="18" fill="#6b4a2d"/><path d="M227 237 V259 Q295 282 363 259 V237" fill="#4d331e"/>${label(402,252,'粉饼')}`);
   content+=hit('basket',`<path d="M218 321 H372 L351 374 H240Z" fill="url(#metal)" stroke="#f4ecdd" stroke-width="2"/><path d="M366 337 H491" stroke="#322118" stroke-width="18" stroke-linecap="round"/>${label(411,397,'滤篮与手柄')}`);
   content+=`<path d="M295 408 V458" class="flow-path stopped" fill="none" stroke="#e1c097" stroke-width="4"/>`;
  }else{
   content+=`<ellipse cx="298" cy="474" rx="176" ry="12" fill="#613921" opacity=".19"/><path d="M146 89 Q150 70 170 70 H435 L455 286 H151Z" fill="#254854" stroke="#f4ecdd" stroke-width="2"/><path d="M171 145 H436 L445 285 H164Z" fill="url(#metal)"/><path d="M148 280 H459 L448 426 H167Z" fill="#203b43"/><path d="M144 424 H473 L459 448 H160Z" fill="url(#metal)"/>${Array.from({length:7},(_,i)=>`<path d="M${185+i*32} 431 H${205+i*32}" stroke="#4b534d" stroke-width="3"/>`).join('')}<circle cx="378" cy="110" r="23" fill="#f4ecdd"/><path id="pressure-needle" d="M378 110 L391 96" stroke="#b9603d" stroke-width="3"/><circle cx="202" cy="112" r="9" fill="#b9603d"/>`;
   content+=hit('group','<path d="M236 241 H361 V277 H236Z" fill="#8c9994" stroke="#f4ecdd" stroke-width="2"/>');
   content+=hit('basket','<path d="M248 278 H350 L340 303 H256Z" fill="url(#metal)"/><path d="M344 288 H449" stroke="#262422" stroke-width="17" stroke-linecap="round"/>');
   content+=`<path id="espresso-stream" class="stream" d="M289 307 V358 M311 307 V358" fill="none" stroke="#ad723e" stroke-width="4"/><path id="side-stream" class="stream" d="M314 307 L338 356" fill="none" stroke="#ad723e" stroke-width="3"/><path d="M261 366 H340 L332 412 Q297 426 270 412Z" fill="#f4ecdd"/><ellipse id="espresso-liquid" cx="300" cy="368" rx="38" ry="9" fill="#382015"/><path d="M340 379 C370 361 371 405 335 401" fill="none" stroke="#f4ecdd" stroke-width="8"/>`;
   if(flow)content+=hit('puck',`<rect x="174" y="148" width="249" height="128" fill="#254854ee"/><path id="route-path" d="M201 169 H300 V220 H270 V244 M300 220 H330 V244" class="flow-path" fill="none" stroke="#b9d6d8" stroke-width="5"/><path d="M250 244 H350 V263 H250Z" fill="#624128"/>${label(180,197,'泵推动热水')}${label(352,261,'粉饼')}`);
  }
 }else{
  content+=`<g transform="rotate(-8 290 275)"><path d="M199 313 L231 292 H349 L386 313 L369 450 Q292 471 218 450Z" fill="url(#metal)" stroke="#f4ecdd" stroke-width="3"/><path d="M224 335 H365 L352 431 H238Z" fill="#dae3dc"/><path id="lower-water" d="M227 369 H360 L352 431 H238Z" fill="#7fafbc"/><path d="M229 102 H355 L371 125 L355 248 H236 L219 125Z" fill="url(#metal)" stroke="#f4ecdd" stroke-width="3"/><path d="M239 122 H348 L336 229 H250Z" fill="#d3d2c1"/><path id="upper-liquid" d="M247 200 H341 L336 229 H250Z" fill="#774b2d"/><path d="M350 121 H411 L431 146 L406 236 H361" fill="none" stroke="#252421" stroke-width="18"/><path d="M281 409 V271 L254 267 L248 240 H343 L337 267 H308 V409" fill="#eee7d9" stroke="#8b8c7b" stroke-width="2"/><path d="M252 246 H340 V264 H252Z" fill="#62462c"/><path d="M283 240 V139 H305 V240" fill="#d9dbcf" stroke="#898b78"/><path id="route-path" class="flow-path" d="M295 392 V281 V257 V238 V143 Q310 157 320 175" fill="none" stroke="#729dac" stroke-width="6"/><circle cx="346" cy="327" r="9" fill="#b59b60"/><path d="M225 100 L294 79 L358 100Z" fill="url(#metal)"/><path d="M285 80 L280 58 H308 L305 80Z" fill="#252421"/></g>${label(48,335,'下壶压力升高')}${label(418,236,'液态水穿过粉层')}${label(416,162,'上壶收集咖啡')}`;
 }
 return `<svg viewBox="0 0 600 510" role="img" aria-label="${GEARS[gear].name}${explode?'拆解':flow?'水路':'操作'}示意">${defs}${content}</svg>`;
}

const polygon=(ctx,points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
function text(ctx,s,x,y,size,color,max=1070,font='Microsoft YaHei',weight=700){ctx.fillStyle=color;ctx.font=`${weight} ${size}px "${font}",sans-serif`;while(ctx.measureText(s).width>max&&size>15){size-=2;ctx.font=`${weight} ${size}px "${font}",sans-serif`;}ctx.fillText(s,x,y);}
function lines(ctx,s,x,y,max,size,color,maxLines=3){ctx.fillStyle=color;ctx.font=`400 ${size}px "Microsoft YaHei",sans-serif`;let row='',n=0;for(const ch of Array.from(s)){if(ctx.measureText(row+ch).width>max){ctx.fillText(row,x,y+n*size*1.55);n++;row='';if(n>=maxLines)return;}row+=ch;}if(row&&n<maxLines)ctx.fillText(row,x,y+n*size*1.55);}
const imageFromSVG=svg=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
export async function drawReport(canvas,{cup,report,style='manifesto',palette='torino',title,details=true,position={x:.58,y:.49}}){
 const p=PALETTES.find(v=>v.id===palette)||PALETTES[1],img=await imageFromSVG(cupSVG(cup,{ink:p.bg,paper:p.bg}));
 const scratch=document.createElement('canvas');scratch.width=1200;scratch.height=1800;const ctx=scratch.getContext('2d');ctx.fillStyle=p.bg;ctx.fillRect(0,0,1200,1800);
 const latin=cup.milk>0?'LATTE':cup.water>0&&cup.gear==='espresso'?'AMERICANO':GEARS[cup.gear].latin;
 if(style==='manifesto'){
  polygon(ctx,[[1200,140],[1200,1220],[0,1220],[0,935]],p.accent);polygon(ctx,[[820,600],[1200,900],[1200,1220],[110,1220]],p.ink);
  ctx.save();ctx.translate(40,1200);ctx.transform(1,-.15,0,1,0,0);ctx.font='900 220px Impact,"Arial Black",sans-serif';const scale=Math.min(1,1100/ctx.measureText(latin).width);ctx.scale(scale,1);for(let n=24;n>0;n-=3){ctx.fillStyle=p.ink;ctx.fillText(latin,-n,n);}ctx.fillStyle=p.bg;ctx.fillText(latin,0,0);ctx.restore();
 }else if(style==='arch'){
  ctx.fillStyle=p.ink;ctx.fillRect(0,0,180,1220);ctx.fillStyle=p.accent;ctx.beginPath();ctx.roundRect(270,360,780,950,[390,390,0,0]);ctx.fill();ctx.strokeStyle=p.accent;ctx.lineWidth=3;ctx.beginPath();ctx.arc(660,740,430,Math.PI,Math.PI*2);ctx.stroke();ctx.save();ctx.translate(130,1150);ctx.rotate(-Math.PI/2);text(ctx,latin,0,0,170,p.bg,1010,'Impact',900);ctx.restore();
 }else{
  polygon(ctx,[[600,400],[1200,160],[1200,1220],[700,1220],[190,680]],p.accent);ctx.fillStyle=p.ink;ctx.beginPath();ctx.arc(930,505,230,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=5;ctx.strokeRect(95,585,350,350);ctx.save();ctx.translate(55,1120);ctx.rotate(-.1);text(ctx,latin,0,0,202,p.ink,1120,'Impact',900);ctx.restore();
 }
 text(ctx,'GAZZETTA DEL CAFFÈ',style==='arch'?240:65,66,25,p.ink,1000,'Georgia',400);
 text(ctx,'你的咖啡工作室 / 本期制作',style==='arch'?240:65,111,21,p.ink,900,'Microsoft YaHei',400);
 const chars=Array.from(title||report.title),per=chars.length>11?8:6;for(let i=0;i<Math.min(3,Math.ceil(chars.length/per));i++)text(ctx,chars.slice(i*per,(i+1)*per).join(''),style==='arch'?235:60,245+i*123,108,p.ink,style==='arch'?900:1090,'Microsoft YaHei',900);
 const x=position.x*1200-265,y=position.y*1800-300;ctx.drawImage(img,x,y,620,712);
 ctx.fillStyle=p.bg;ctx.fillRect(0,1260,1200,540);ctx.strokeStyle=p.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(65,1288);ctx.lineTo(1135,1288);ctx.stroke();
 if(details){
  text(ctx,report.name,65,1360,42,p.ink,1060);text(ctx,cupFacts(cup).total.toFixed(0)+' g',1010,1360,35,p.ink,125,'Georgia');
  lines(ctx,report.intro,65,1420,1060,27,p.ink,3);
  text(ctx,'编辑部观察',65,1563,23,p.accent,1000);
  const observation=cup.milk+cup.foam>0?report.observations.find(s=>s.startsWith('加入')&&s.includes('牛奶')):cup.water>0?report.observations.find(s=>s.startsWith('出杯后')):report.observations[0];
  lines(ctx,observation||report.insight,65,1615,1060,26,p.ink,3);
  text(ctx,report.recipe,65,1760,23,p.ink,1070,'Microsoft YaHei',400);
 }else{
  text(ctx,report.name,65,1405,52,p.ink);text(ctx,'一杯咖啡，一种自己的节奏。',65,1480,28,p.ink,1000,'Microsoft YaHei',400);
  text(ctx,GEARS[cup.gear].name+' / '+cupFacts(cup).total.toFixed(0)+' g',65,1755,26,p.ink,1070,'Georgia',400);
 }
 text(ctx,'虚拟制作记录 · 科普示意',65,1720,18,p.accent,1050,'Microsoft YaHei',400);
 canvas.width=1200;canvas.height=1800;canvas.getContext('2d').drawImage(scratch,0,0);
 return {style,palette,recipe:report.recipe};
}
