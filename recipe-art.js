import {INGREDIENTS,KEYS,total,CAPACITY} from './recipe-state.mjs';
import {mixedLiquidMarkup,mixingMarkup,spoonMarkup,iceMarkup} from './recipe-mix-art.mjs';
import {fillHeight} from './cup-geometry.mjs';
import {pourMarkup,solidIceMarkup,fallingIceMarkup} from './recipe-dispense-art.mjs';
import {modelPartArt,modelLowerCutaway,modelBrewSVG,modelExplodedSVG,modelPotMarkup} from './recipe-moka-art.mjs';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const line='stroke="#35271f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
let glassData=null;
export function glassMaterialData(){
 if(!glassData)glassData=fetch('assets/reference-room/glass-frame.png').then(r=>{if(!r.ok)throw new Error('glass material unavailable');return r.blob();}).then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);}));
 return glassData;
}
export function ingredientIcon(key){
 const defs='<defs><linearGradient id="ivory" x2="1" y2=".2"><stop stop-color="#fff8e8"/><stop offset=".5" stop-color="#eee3ce"/><stop offset="1" stop-color="#c3b8a4"/></linearGradient><linearGradient id="glass"><stop stop-color="#fff9ec" stop-opacity=".5"/><stop offset=".5" stop-color="#d4c8b4" stop-opacity=".12"/><stop offset="1" stop-color="#fff9ec" stop-opacity=".8"/></linearGradient></defs>';
 const shapes={
 coffee:'<path d="M37 21h34l-3 10 8 11 4 33q-25 12-49 0l4-34 5-10Z" fill="url(#glass)"/><path d="M76 39c32-9 32 37 4 29" fill="none" stroke-width="4"/><path d="m35 53-2 21q22 10 45 0l-3-21q-20 5-40 0" fill="#4c2c1b"/><ellipse cx="54" cy="22" rx="18" ry="4" fill="#f6ead7"/><path d="M41 33h20" stroke="#fff9e8" stroke-width="3"/>',
 water:'<path d="M34 26h39l-6 55q-14 4-27 0Z" fill="url(#glass)"/><path d="m37 56 3 24q14 5 27 0l3-24" fill="#b8d0d5" opacity=".7"/><ellipse cx="54" cy="26" rx="20" ry="4" fill="none"/><path d="M42 33 46 75" stroke="#fff" stroke-width="3"/>',
 milk:'<path d="M28 29q19-4 47 0l-6 49q-21 12-39-1l2-36-11-10Z" fill="url(#ivory)"/><path d="M75 36c28-5 30 29-4 29" fill="none" stroke-width="4"/><ellipse cx="51" cy="30" rx="23" ry="5" fill="#fff5db"/><path d="M35 42 36 69" stroke="#fffaf0" stroke-width="5"/>',
 foam:'<ellipse cx="56" cy="72" rx="31" ry="6" fill="#e3d5bf"/><path d="M27 53q2 25 29 25t29-25" fill="url(#ivory)"/><path d="M29 50q-7-11 4-14 0-11 15-9 6-13 18-1 18-3 15 10 11 5 3 15Z" fill="#fff9e9"/><path d="M39 41q5-9 14-3m8-4q8-1 10 6" fill="none" stroke="#c5b59c"/>',
 ice:'<path d="m22 50 23-8 21 10-6 27-23 4-16-10Z" fill="#d6e1df"/><path d="m48 29 23-5 20 16-6 24-20-12Z" fill="#e8eeea"/><path d="m21 51 19 11 26-10m-26 10-3 20m13-54 17 15 22-3m-22 3-3 23" fill="none" stroke="#8eaaa9"/><path d="m28 53 6 16m23-32 8 4" stroke="#fff" stroke-width="3"/>',
 syrup:'<path d="M45 18h24v10l7 8v42q-20 11-37 0V36l6-8Z" fill="url(#glass)"/><path d="M40 52h35v25q-19 9-35 0Z" fill="#b37a39"/><rect x="44" y="15" width="26" height="9" rx="2" fill="#35271f"/><rect x="39" y="41" width="37" height="19" fill="#eee1c5"/><path d="M48 50h20" stroke="#9c5634"/><path d="M45 65v8" stroke="#f6ce8a" stroke-width="3"/>'
 };
 return '<svg viewBox="0 0 112 100" aria-hidden="true">'+defs+'<ellipse cx="55" cy="85" rx="32" ry="3" fill="#3a2717" opacity=".09"/><g '+line+'>'+shapes[key]+'</g></svg>';
}
export function cupSVG(c,view='recipe',{labels=true,active=false,pouring=null,mix=null,utensil=false,iceDrops=[],fluted=false,glassMaterial='assets/reference-room/glass-frame.png'}={}){
 const t=total(c),height=fillHeight(t),bottom=420,top=bottom-height;
 const clip='M120 96 136 414Q206 426 278 414L296 96Z';
 let layers='',cursor=bottom;
 const nonzero=KEYS.filter(k=>c.amounts[k]>0),a=c.amounts;
 if(mix){layers=mixingMarkup(c,mix.fromView,mix.progress);}
 else if(view==='recipe'){
  const liquidMass=t-a.ice;
  for(const key of nonzero.filter(k=>k!=='ice')){const h=liquidMass?height*a[key]/liquidMass:0;cursor-=h;layers+='<rect x="110" y="'+cursor+'" width="195" height="'+(h+.4)+'" fill="'+INGREDIENTS[key].color+'"/>';
  }
  // Ice is a solid overlay, not a blue ingredient band.
 }else{
  layers=mixedLiquidMarkup(c,top,height);
 }
 const renderedLiquid=layers;
 const facets=fluted?Array.from({length:7},(_,i)=>{const x=139+i*20;return '<path d="M'+x+' 413L'+(x-4)+' 281Q'+(x+3)+' 260 '+(x+10)+' 281L'+(x+17)+' 414" fill="none" stroke="#fff9e9" stroke-opacity=".3" stroke-width="1.25"/><path d="M'+(x+2)+' 410L'+(x-1)+' 290Q'+(x+3)+' 277 '+(x+6)+' 288L'+(x+9)+' 415" fill="#fff9e9" opacity=".065"/>';}).join(''):'';
 const reflections=facets+'<path d="M125 106L137 108L150 399L139 395Z" fill="#fffdf3" opacity=".48"/><path d="M146 105L152 106L161 396L153 398Z" fill="#fffdf3" opacity=".16"/><path d="M286 107L293 105L277 399L268 404Z" fill="#fffdf3" opacity=".31"/>';
 // Only the rim and clear thick base use this material plate. The cup interior
 // stays transparent and every liquid, ice cube and spoon remains native SVG.
 const glassFinish='<defs><clipPath id="glass-rim-'+c.id+'"><path fill-rule="evenodd" clip-rule="evenodd" d="M304 83a96 10 0 1 0-192 0a96 10 0 1 0 192 0M297 83a89 6 0 1 0-178 0a89 6 0 1 0 178 0"/></clipPath></defs><g clip-path="url(#glass-rim-'+c.id+')"><svg x="112" y="71" width="192" height="25" viewBox="180 90 950 125" preserveAspectRatio="none"><image href="'+glassMaterial+'" width="1303" height="1202"/></svg></g><svg x="132" y="403" width="151" height="35" viewBox="260 916 780 202" preserveAspectRatio="none"><image href="'+glassMaterial+'" width="1303" height="1202"/></svg>';
 let annotations='';
 if(view==='recipe'&&labels){
  let y=bottom;
  const marks=nonzero.map(key=>{const h=t?height*a[key]/t:0;y-=h;return {key,anchor:y+h/2};}).reverse();
  // Thin layers still need separate labels after the artwork scales down.
  for(let i=0;i<marks.length;i++)marks[i].labelY=Math.max(marks[i].anchor,i?marks[i-1].labelY+25:110);
  const shift=Math.max(0,(marks.at(-1)?.labelY||0)-414);
  for(const mark of marks){const labelY=mark.labelY-shift;annotations+='<path d="M289 '+mark.anchor+'H310L326 '+labelY+'" stroke="#ad9b80" fill="none" stroke-dasharray="3 4"/><text x="334" y="'+(labelY+5)+'" font-size="14" fill="#59412e">'+INGREDIENTS[mark.key].name+' '+a[mark.key].toFixed(a[mark.key]%1?1:0)+' g</text>';}
 }
 const stream=pourMarkup(c,pouring);
 const solids=solidIceMarkup(c,iceDrops),falling=fallingIceMarkup(c,iceDrops);
 const spoon=mix?spoonMarkup(c,mix.progress):utensil?spoonMarkup(c,0,true):'';
 const overlays='<defs><clipPath id="solid-clip-'+c.id+'"><path d="'+clip+'" transform="scale(1 .62)"/></clipPath></defs>'+spoon+'<g clip-path="url(#solid-clip-'+c.id+')">'+solids+'</g>'+falling+stream;

 const markup='<svg class="glass-illustration" viewBox="'+(labels?'90 61 430 405':'94 61 234 405')+'" role="img" aria-label="'+esc(c.name)+'，总量 '+t+' 克，'+(view==='recipe'?'成分比例示意':'成品示意')+'"><defs><clipPath id="cup-clip-'+c.id+'"><path d="'+clip+'"/></clipPath><linearGradient id="glass-'+c.id+'"><stop stop-color="#fffaf0" stop-opacity=".5"/><stop offset=".18" stop-color="#fffaf0" stop-opacity=".05"/><stop offset=".8" stop-color="#fffaf0" stop-opacity=".08"/><stop offset="1" stop-color="#ddd1bc" stop-opacity=".35"/></linearGradient></defs><ellipse cx="210" cy="445" rx="106" ry="9" fill="#624126" opacity=".09"/>'+(active?'<ellipse cx="210" cy="445" rx="107" ry="10" fill="none" stroke="#ad4d29" stroke-width="2"/>':'')+'<g clip-path="url(#cup-clip-'+c.id+')">'+renderedLiquid+(t?'<ellipse cx="210" cy="'+top+'" rx="90" ry="5" fill="#f7ecd6" opacity=".2"/>':'')+'</g><path d="M113 83 131 420Q207 438 283 420L303 83Z" fill="url(#glass-'+c.id+')" stroke="#392b20" stroke-width="1.7"/><path d="M120 96 136 414Q206 426 278 414L296 96" fill="none" stroke="#83745f" stroke-width="1"/><ellipse cx="208" cy="83" rx="95" ry="8" fill="#fff6e2" fill-opacity=".13" stroke="#392b20" stroke-width="1.6"/><ellipse cx="208" cy="83" rx="88" ry="4" fill="none" stroke="#a39279" stroke-width="1"/><path d="M128 111 143 393M291 115 279 395" fill="none" stroke="#fffaf0" stroke-opacity=".7" stroke-width="4"/><path d="M132 406Q209 424 282 406L283 420Q209 444 131 420Z" fill="#f8f5ec" fill-opacity=".5" stroke="#766855" stroke-width=".8"/><path d="M135 423Q210 438 278 423" fill="none" stroke="#fffef5" stroke-width="3"/><path d="M143 413Q174 430 192 423L184 417Z" fill="#b3b5ad" opacity=".55"/><path d="M246 415L270 411L267 428L246 431Z" fill="#e3e4da" opacity=".8"/><path d="M156 449h104" stroke="#b1a28a" stroke-width=".6"/>'+annotations+'</svg>';
 return markup.replace(labels?'90 61 430 405':'94 61 234 405',labels?'90 36 430 268':'94 20 234 280').replace('</defs>','</defs><g transform="scale(1 .62)">').replace('<path d="M132 406',reflections+'<path d="M132 406').replace('<path d="M156 449',glassFinish+'<path d="M156 449').replace(/<\/svg>$/,'</g>'+overlays+'</svg>');
}
export {modelLowerCutaway as lowerCutaway,modelBrewSVG as brewSVG};
export const PARTS=[
 {id:'lid',name:'壶盖',bounds:[.02,.151],labelY:.11,copy:'覆盖上壶、减少飞溅。它不是下壶的承压密封件。',note:'热壶不直接徒手掀盖。'},
 {id:'upper',name:'上壶',bounds:[.164,.401],labelY:.29,copy:'咖啡液沿中心导管流入这里。上壶与外界连通，用来收集咖啡。',note:'出杯前搅匀上壶咖啡，再握手柄倾倒。'},
 {id:'filter',name:'上滤网',bounds:[.416,.487],labelY:.455,copy:'安装在上壶底部，挡住较大的咖啡粉颗粒，让咖啡液通过。',note:'不是为了堵住水路；滤孔需要保持洁净。'},
 {id:'gasket',name:'密封圈',bounds:[.491,.563],labelY:.53,copy:'在上下壶接缝处形成密封，帮助下壶保持推动水流的压力差。',note:'合壶前扫净壶缘残粉，检查密封圈状态。'},
 {id:'basket',name:'粉篮',bounds:[.574,.744],labelY:.656,copy:'咖啡粉放在篮中。下方细管伸入水中，水沿管上升，穿过粉层，再进入上壶。',note:'装满、铺平，不压实。粉量由器具粉篮决定。'},
 {id:'lower',name:'下壶',bounds:[.750,.966],labelY:.86,copy:'装水，也留有空气空间。加热后，下壶压力升高，压力差推动液态水穿过粉层。',note:'水面在安全阀下缘以下；阀不能被水和杂物堵住。'}
];
export function collectionSVG(mass){
 const drink={id:'collect',name:'这一锅摩卡基底',amounts:{coffee:mass,water:0,milk:0,foam:0,ice:0,syrup:0}};
 return '<svg class="collection-diagram" viewBox="0 0 600 550" role="img" aria-label="关火、移壶、搅匀后，收集 '+mass.toFixed(1)+' 克摩卡基底"><g class="collection-pot"><svg x="180" y="25" width="250" height="296" viewBox="60 70 800 980">'+modelPotMarkup()+'</svg></g><path class="collection-stream" d="M188 130Q136 198 150 305" fill="none" stroke="#653823" stroke-width="7" stroke-linecap="round"/><svg x="42" y="258" width="218" height="255" viewBox="0 0 416 486">'+cupSVG(drink,'finished',{labels:false}).replace(/^<svg[^>]*>|<\/svg>$/g,'')+'</svg><text x="374" y="414" font-size="36" font-family="Georgia" fill="#ac4e2b">'+mass.toFixed(mass%1?1:0)+' g</text><text x="374" y="444" font-size="14" fill="#897761">这锅的可用基底</text></svg>';
}
export {modelPartArt as partArt,modelExplodedSVG as explodedSVG};
