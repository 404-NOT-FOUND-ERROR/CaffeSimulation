// Reuse the previous workshop's original Blender renders. Every part shares
// the same orthographic camera, materials, lighting and assembly axis.
const ASSET='assets/poster-workbench/';
const boxes={lid:[217,144,677,367],upper:[181,222,785,687],filter:[324,598,570,681],gasket:[300,595,593,698],basket:[315,617,578,893],lower:[262,610,632,1005]};
const names={lid:'壶盖',upper:'上壶',filter:'上滤网',gasket:'密封圈',basket:'粉篮',lower:'下壶'};
const picture=id=>'<image href="'+ASSET+id+'.webp" width="960" height="1200" pointer-events="none"/>';
export const modelPotMarkup=()=>['basket','gasket','filter','lower','upper','lid'].map(picture).join('');
export function modelPartArt(id){
 const [x,y,right,bottom]=boxes[id];
 return '<svg viewBox="'+[x-12,y-12,right-x+24,bottom-y+24].join(' ')+'" role="img" aria-label="'+names[id]+'，沿用摩卡工作台模型">'+picture(id)+'</svg>';
}
const tank='M362 667H530L566 944Q447 968 330 944Z';
export function modelLowerCutaway(water){
 const y=952-water/130*114,unsafe=water>130;
 return '<svg class="lower-diagram" viewBox="170 525 640 555" role="img" aria-label="下壶水位 '+water+' 克，'+(unsafe?'超过安全阀下缘':'低于安全阀下缘')+'"><defs><clipPath id="model-tank"><path d="'+tank+'"/></clipPath><linearGradient id="model-water" x2="0" y2="1"><stop stop-color="#b7d5da"/><stop offset="1" stop-color="#739ba9"/></linearGradient></defs>'+picture('lower')+'<path d="'+tank+'" fill="#e4dccb" stroke="#817665" stroke-width="2"/><g clip-path="url(#model-tank)"><rect x="320" y="'+y+'" width="250" height="250" fill="url(#model-water)" opacity=".86"/><ellipse cx="448" cy="'+y+'" rx="112" ry="7" fill="#d7eceb"/></g><path d="M330 838H720" stroke="'+(unsafe?'#b4512e':'#9c7d58')+'" stroke-width="2" stroke-dasharray="7 7"/><circle cx="443" cy="824" r="14" fill="#ae8546" stroke="#eed3a1" stroke-width="3"/><circle cx="443" cy="824" r="7" fill="#3e3021"/><text x="614" y="815" font-size="18" fill="#785337">安全阀下缘</text><text x="411" y="'+(Math.max(y,838)+47)+'" font-size="29" fill="#fdf5e5">'+Math.round(water)+' g</text><text x="305" y="1045" font-size="18" fill="'+(unsafe?'#a94325':'#7a6c59')+'">'+(unsafe?'水面超过安全阀，请调低':'留出空气空间 · 水位示意')+'</text></svg>';
}
export function modelBrewSVG(b){
 const q=Math.max(0,Math.min(1,b.mass/Math.max(1,b.water-22))),waterY=952-Math.max(22,b.water-b.mass)/130*114,coffeeY=635-q*210;
 const window='M410 342H490L483 635 496 699 516 941H386L407 699 418 635Z';
 const flames=b.heat?Array.from({length:12},(_,i)=>'<path class="flame" style="animation-delay:-'+i*.08+'s" d="M'+(320+i*23)+' 1010q-7-12 0-'+(16+b.heat*7)+'q9 14 0 '+(16+b.heat*7)+'" fill="#7cb5ce"/>').join(''):'';
 return '<svg class="brew-diagram" viewBox="40 70 870 1120" role="img" aria-label="摩卡壶冲煮剖面，已出液 '+b.mass.toFixed(1)+' 克" data-model-source="poster-workbench-v1"><defs><clipPath id="model-brew-window"><path d="'+window+'"/></clipPath></defs>'+picture('burner')+flames+modelPotMarkup()+'<g clip-path="url(#model-brew-window)"><rect x="380" y="332" width="150" height="620" fill="#e4dccb"/><rect x="380" y="'+waterY+'" width="150" height="260" fill="#8ab5c0"/><rect x="395" y="'+coffeeY+'" width="115" height="'+(640-coffeeY)+'" fill="#613721"/><path d="M404 654h91v34l-32 30v195h-25V718l-34-30Z" fill="#e3ddcd" stroke="#756957" stroke-width="2"/><rect x="410" y="656" width="79" height="22" fill="#68442a"/><path d="M408 650h84" stroke="#a8a59a" stroke-width="6"/><path d="M438 647V356h23V647" fill="#f4eddd" stroke="#847762" stroke-width="2"/>'+(b.mass>0?'<path class="flow-line" d="M450 883V720M450 703V661" fill="none" stroke="#4a8fa6" stroke-width="5" stroke-dasharray="14 15"/><path class="flow-line" d="M450 619V373" fill="none" stroke="#a15c36" stroke-width="5" stroke-dasharray="14 15"/>':'')+'</g><path d="'+window+'" fill="none" stroke="#83745e" stroke-width="2"/>'+(b.progress>0?'<path d="M527 818H687" stroke="#a25632" stroke-width="2"/><circle cx="527" cy="818" r="4" fill="#a25632"/><text x="695" y="825" font-size="23" fill="#705038">壶身很烫</text>':'')+'</svg>';
}
export function modelExplodedSVG(selected){
 let top=22;
 const parts=Object.keys(names).map(id=>{
  const [x,y,right,bottom]=boxes[id],h=bottom-y,mid=top+h/2,partTop=top;top+=h+35;
  // Crop the transparent canvas so one part cannot intercept another part's
  // hotspot. All x coordinates still share the original assembly axis.
  return '<svg x="'+x+'" y="'+partTop+'" width="'+(right-x)+'" height="'+h+'" viewBox="'+[x,y,right-x,h].join(' ')+'" pointer-events="none">'+picture(id)+'</svg><g class="part-hotspot '+(selected===id?'selected':'')+'" data-part="'+id+'" role="button" tabindex="0" aria-label="了解'+names[id]+'"><rect x="'+(x-12)+'" y="'+(partTop-8)+'" width="'+(right-x+24)+'" height="'+(h+16)+'" rx="16" fill="transparent"/><path d="M143 '+mid+'H'+Math.max(260,x)+'" stroke="#9a856c" stroke-width="2"/><circle cx="'+Math.max(260,x)+'" cy="'+mid+'" r="4" fill="#a2502d"/><text x="125" y="'+(mid+7)+'" text-anchor="end" font-size="28" fill="#5b4431">'+names[id]+'</text></g>';
 }).join('');
 return '<svg class="exploded-diagram" viewBox="25 0 830 '+top+'" role="img" aria-label="同一摩卡模型沿装配轴展开的六个零件" data-model-source="poster-workbench-v1">'+parts+'</svg>';
}
