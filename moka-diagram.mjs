// The profiles below use the same radii and axial heights as geometry.json.
// Flat section art deliberately omits optical refraction / simulated splashes.
export const MOKA_DIMENSIONS={lowerRadius:.74,upperRadius:.91,base:.43,join:1.65,upperTop:3.18,knob:3.75,valve:1.20};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function updateBrewSection(svg,{water,mass,heat,flow}){
 const waterY=477-clamp(Math.max(18,water-mass),0,158)/130*90;
 svg.querySelector('.boiler-water')?.setAttribute('y',waterY);
 svg.querySelector('.water-ripple')?.setAttribute('d',`M170 ${waterY}Q215 ${waterY-3} 260 ${waterY}T351 ${waterY}`);
 const top=294-clamp(mass/(water*.72),0,1)*119;
 svg.querySelector('.collector-coffee')?.setAttribute('d',`M154 ${top}H364V304H154Z`);
 svg.querySelector('.collector-surface')?.setAttribute('d',`M157 ${top}Q260 ${top+6} 364 ${top}`);
 svg.querySelector('.chimney-liquid')?.setAttribute('fill',mass>0?'#84502c':'#6a7469');
 const arrows=svg.querySelector('.water-path');arrows?.classList.toggle('is-flowing',flow>.06);arrows?.setAttribute('opacity',mass>0?.95:.28);
 svg.querySelectorAll('.blue-flame').forEach(el=>el.setAttribute('visibility',heat?'visible':'hidden'));
 svg.setAttribute('aria-label',`摩卡壶冲煮剖面，已出液 ${mass.toFixed(1)} 克，${heat?'正在加热':'火已关闭'}`);
}
const y=z=>60+(3.75-z)*128;
const x=r=>260+r*128;
const poly=p=>p.map(([r,z])=>[x(r),y(z)].join(',')).join(' ');
const defs=`<defs>
 <linearGradient id="section-metal"><stop stop-color="#898e8d"/><stop offset=".18" stop-color="#f0efea"/><stop offset=".39" stop-color="#c9ccca"/><stop offset=".68" stop-color="#9a9e9c"/><stop offset="1" stop-color="#e8e7e1"/></linearGradient>
 <linearGradient id="section-inner"><stop stop-color="#666a69"/><stop offset=".45" stop-color="#b4b5ad"/><stop offset="1" stop-color="#71766f"/></linearGradient>
 <linearGradient id="section-water" x2="0" y2="1"><stop stop-color="#b1ced2" stop-opacity=".88"/><stop offset="1" stop-color="#709ca8" stop-opacity=".93"/></linearGradient>
 <linearGradient id="section-coffee" x2="0" y2="1"><stop stop-color="#a76432"/><stop offset=".07" stop-color="#653823"/><stop offset="1" stop-color="#352018"/></linearGradient>
 <linearGradient id="section-bakelite" x2="1" y2=".4"><stop stop-color="#141614"/><stop offset=".5" stop-color="#3e403a"/><stop offset="1" stop-color="#1b1d1a"/></linearGradient>
 <pattern id="section-powder" width="12" height="10" patternUnits="userSpaceOnUse"><rect width="12" height="10" fill="#4a2d1d"/><path d="m2 2 3 1m3 5 2-1M1 8l2-1" stroke="#977044" stroke-width="1.7"/></pattern>
 <clipPath id="boiler-cut"><path d="M193 334H327L346 472Q260 485 174 472Z"/></clipPath>
 <clipPath id="collector-cut"><path d="M161 150H359L325 294H195Z"/></clipPath>
 <clipPath id="basket-cut"><path d="M202 329H318V350L271 365V446H249V365L202 350Z"/></clipPath>
 <linearGradient id="stove-silver"><stop stop-color="#838983"/><stop offset=".23" stop-color="#e6e4dd"/><stop offset=".54" stop-color="#a5aaa6"/><stop offset="1" stop-color="#d0d0c9"/></linearGradient>
</defs>`;
const lowerShape=`<path d="M185 334V321Q260 307 335 321V335L356 471Q260 496 164 471Z" fill="url(#section-metal)" stroke="#646b66" stroke-width="1.7"/>
 <path d="M187 341 174 471 196 478 210 343Z" fill="#f0f0e9" opacity=".6"/>
 <path d="M193 334H327L346 472Q260 485 174 472Z" fill="url(#section-inner)" stroke="#434d49" stroke-width="1.4"/>
 <path d="M187 324Q260 307 333 324m-146 6q73-16 146 0" fill="none" stroke="#eeede7" stroke-width="2"/>
 <g class="section-valve"><path d="M338 379 346 375 354 380 354 390 346 395 338 391Z" fill="#bc934e" stroke="#6c542e"/><ellipse cx="347" cy="385" rx="4" ry="6" fill="#ede0af"/><ellipse cx="348" cy="385" rx="2" ry="3.5" fill="#453d30"/></g>`;
const upperShape=`<path d="M365 153H408Q425 151 434 170L452 203Q457 212 452 230L431 299Q428 310 416 311H389L385 290H408L426 221 411 193H367Z" fill="url(#section-bakelite)" stroke="#10140f" stroke-width="2"/>
 <path d="M391 166H412Q420 165 426 175L442 204" fill="none" stroke="#656963" opacity=".65" stroke-width="2"/>
 <path d="M152 151 113 154 155 211 175 205Z" fill="url(#section-metal)" stroke="#5d655f" stroke-width="1.6"/>
 <path d="M143 139H377L339 303H181Z" fill="url(#section-metal)" stroke="#636964" stroke-width="2"/>
 <path d="M147 140 161 150 195 294 181 301Z" fill="#fafaf3" opacity=".65"/>
 <path d="M161 150H359L325 294H195Z" fill="url(#section-inner)" stroke="#59625c" stroke-width="1.5"/>
 <path d="M182 302H338V325Q260 340 182 325Z" fill="url(#section-metal)" stroke="#69726a"/>
 <path d="M183 305Q260 319 337 305M183 321q77 14 154 0" fill="none" stroke="#f3f3ec" stroke-width="1.2"/>
 <rect x="367" y="143" width="23" height="16" rx="3" fill="url(#section-metal)" stroke="#5c625b"/><circle cx="380" cy="151" r="3.8" fill="#e7e8de" stroke="#737971"/>`;
const lid=`<path d="M147 137 247 95H273L375 137Q260 154 147 137Z" fill="url(#section-metal)" stroke="#626c64" stroke-width="1.6"/>
 <path d="M163 136 253 101m14 0 93 35" stroke="#f8f8ed" stroke-width="1.4" fill="none"/>
 <path d="M245 94 239 66Q260 58 281 66L275 94Z" fill="url(#section-bakelite)" stroke="#1b211a"/>
 <path d="M248 68 252 90" stroke="#757970" opacity=".45"/>`;
function waterFill(water,annotation=false){
 const level=clamp(water,0,158)/130,waterY=477-level*90;
 return `<g clip-path="url(#boiler-cut)"><rect class="boiler-water" x="170" y="${waterY}" width="180" height="170" fill="url(#section-water)"/><path class="water-ripple" d="M170 ${waterY}Q215 ${waterY-3} 260 ${waterY}T351 ${waterY}" fill="none" stroke="#e2f1e9" stroke-width="2"/></g>`+
  (annotation?`<path d="M170 387H402" stroke="${water>130?'#b34d2b':'#9b815e'}" stroke-dasharray="4 5" fill="none"/><path d="M352 385 383 371H411" stroke="#8a7153" fill="none"/><text x="414" y="373" class="diagram-note">安全阀下缘</text><path d="M174 ${waterY}H109" stroke="#587985" fill="none"/><text x="72" y="${waterY-10}" class="diagram-note">水位</text><text x="64" y="${waterY+18}" class="diagram-value">${Math.round(water)} g</text>`:'');
}
function basket(powder){return `<path d="M202 329H318V350L271 365V446H249V365L202 350Z" fill="url(#section-metal)" stroke="#6c746c" stroke-width="1.5"/><path d="M208 332H312V347L266 361V442H254V361L208 347Z" fill="#c3c5bb"/><g clip-path="url(#basket-cut)"><rect x="205" y="${350-clamp(powder/18,0,1)*18}" width="109" height="18" fill="url(#section-powder)"/></g>`;}
export function preparationSVG(kind,{water=120,powder=0,grind=1}={}){
 if(kind==='water')return `<svg class="moka-section lower-diagram" viewBox="38 283 525 235" role="img" aria-label="下壶剖面，水 ${Math.round(water)} 克，水面${water>130?'超过':'低于'}安全阀下缘">${defs}<ellipse cx="260" cy="488" rx="117" ry="7" fill="#39291a" opacity=".12"/>${lowerShape}${waterFill(water,true)}<text x="260" y="509" text-anchor="middle" class="diagram-note">留出空气空间 · 水位示意</text></svg>`;
 const full=clamp(powder/18,0,1),height=full*72;
 return `<svg class="moka-section powder-diagram" viewBox="45 245 525 285" role="img" aria-label="粉篮，已装 ${powder.toFixed(1)} 克，不压实">${defs}<defs><clipPath id="prep-basket-clip"><path d="M173 307H347L342 387Q260 416 179 387Z"/></clipPath></defs><ellipse cx="260" cy="492" rx="109" ry="7" fill="#39291a" opacity=".1"/><path d="M172 304H348L344 389 272 424V485H248V424L176 389Z" fill="url(#section-metal)" stroke="#636e65" stroke-width="2"/><path d="M252 426V478" stroke="#eef0e5" stroke-width="2"/><g clip-path="url(#prep-basket-clip)"><path d="M173 ${389-height}Q260 ${398-height} 347 ${389-height}V400H173Z" fill="url(#section-powder)"/></g><ellipse cx="260" cy="306" rx="88" ry="16" fill="none" stroke="#eceee4" stroke-width="4"/><path d="M346 331H404" stroke="#997b56"/><text x="411" y="335" class="diagram-note">装到篮口</text><text x="260" y="519" text-anchor="middle" class="diagram-note">装满、铺平，不压实 · ${['较粗','中等','较细'][grind]}</text></svg>`;
}
export function brewSectionSVG({water=120,mass=0,heat=0,progress=0,flow=0,temperature=0}={}){
 const coffeeTop=294-clamp(mass/(water*.72),0,1)*119,remaining=Math.max(18,water-mass);
 const moving=flow>.06,flames=heat?Array.from({length:18},(_,i)=>`<path class="blue-flame" style="animation-delay:-${i*.09}s" d="M${167+i*10.5} 518q-5 -10 0 -${heat===1?12:20}q7 12 0 ${heat===1?12:20}" fill="#70b9ee"/>`).join(''):'';
 return `<svg class="moka-section brew-diagram" viewBox="68 38 457 556" role="img" aria-label="摩卡壶冲煮剖面，已出液 ${mass.toFixed(1)} 克，${heat?'正在加热':'火已关闭'}" data-upper-width="1.82" data-lower-width="1.48">${defs}<ellipse cx="266" cy="570" rx="190" ry="10" fill="#3b2917" opacity=".11"/><rect x="113" y="519" width="300" height="42" rx="7" fill="url(#stove-silver)" stroke="#70756c"/><ellipse cx="260" cy="518" rx="111" ry="12" fill="#1c211c"/>${flames}<path d="M152 485v32m215-32v32m-230 8h55m131 0h58" stroke="#272d27" stroke-width="12" stroke-linecap="round"/>${lowerShape}${waterFill(remaining)}${basket(18)}${upperShape}<g clip-path="url(#collector-cut)"><path class="collector-coffee" d="M154 ${coffeeTop}H364V304H154Z" fill="url(#section-coffee)"/><path class="collector-surface" d="M157 ${coffeeTop}Q260 ${coffeeTop+6} 364 ${coffeeTop}" fill="none" stroke="#d99b58" stroke-width="2"/></g><path d="M248 299V159Q260 156 272 159V299" fill="url(#section-metal)" stroke="#697568" stroke-width="1.6"/><path class="chimney-liquid" d="M255 295V166H265V295" fill="${mass?'#84502c':'#6a7469'}"/><path d="M197 327H323" stroke="#262a21" stroke-width="5"/><path d="M202 331H318" stroke="#c2c6bc" stroke-width="4"/>${lid}<g class="water-path ${moving?'is-flowing':''}" opacity="${mass>0?.95:.28}"><path d="M260 429V371M260 350V335" stroke="#d6e4e0" stroke-width="3" fill="none" stroke-dasharray="9 10"/><path d="M260 280V172" stroke="#f4dfc1" stroke-width="3" stroke-dasharray="9 10"/><path d="m254 395 6-9 6 9m-12-56 6-9 6 9m-12-115 6-9 6 9" fill="none" stroke="#f5e8cf" stroke-width="2"/></g><circle cx="175" cy="541" r="15" fill="#242a23" stroke="#596056"/><path d="m175 541 ${heat?'8-8':'0 10'}" stroke="#e7e9da" stroke-width="2"/><text x="270" y="585" text-anchor="middle" class="diagram-note">压力差推动液态水穿过粉层</text></svg>`;
}
