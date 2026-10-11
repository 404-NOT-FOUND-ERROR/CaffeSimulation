import {INGREDIENTS,CAPACITY,total} from './recipe-state.mjs';
import {fillHeight} from './cup-geometry.mjs';

export const ICE_MASS=15;
export const ICE_INTERVAL=.68;
export const ICE_LIFETIME=.95;
export const iceFits=c=>CAPACITY-total(c)>=ICE_MASS-.001;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
// These overlays use the glass's visible coordinate system, never its liquid
// calibration transform. A jug, spoon and cube retain their real proportions.
const crops={coffee:[35,225,295,310],water:[378,170,340,360],milk:[748,165,315,370],foam:[1115,260,320,255],syrup:[1870,213,254,300]};
export function pourMarkup(c,motion){
 if(!motion||motion.ingredient==='ice')return '';
 const k=motion.ingredient,crop=crops[k];if(!crop)return '';
 const entry=ease(motion.elapsed/.3),exit=motion.release===undefined?0:ease(motion.release/.32),strength=entry*(1-exit);
 const surface=(420-fillHeight(total(c)))*.62,tipX=277+(1-strength)*16,tipY=35-(1-strength)*10;
 const phase=motion.elapsed*9,ripple=8+Math.sin(phase)*2,color=INGREDIENTS[k].color;
 const w=k==='foam'?70:64,h=w*crop[3]/crop[2],angle=-52*strength;
 const stream=strength>.2?`<path d="M${tipX} ${tipY} Q${tipX-9} 47 265 65 Q${264+Math.sin(phase)*.7} ${surface*.6+26} 265 ${surface+3}" fill="none" stroke="${color}" stroke-opacity="${k==='water'?.56:.88}" stroke-width="${(k==='syrup'?2:3.4)*strength}" stroke-linecap="round"/><path d="M${tipX-1} ${tipY+2} Q${tipX-10} 47 264 65L264 ${surface}" stroke="#fff9e9" stroke-width=".65" opacity=".4" fill="none"/><ellipse cx="265" cy="${surface+3}" rx="${ripple}" ry="2.2" stroke="${color}" stroke-width="1" opacity="${strength*.65}" fill="none"/>`:'';
 return `<g class="pour-illustration" opacity="${1-exit}">${stream}<g transform="translate(${tipX},${tipY}) rotate(${angle})"><svg x="-4" y="-12" width="${w}" height="${h}" viewBox="${crop.join(' ')}" preserveAspectRatio="xMidYMid meet"><image href="assets/reference-room/ingredient-strip.png" width="2172" height="724"/></svg></g></g>`;
}
export function cubeMarkup(x,y,size=27,rotation=0,opacity=1,id='ice'){
 return `<g class="ice-cube" transform="translate(${x},${y}) rotate(${rotation}) scale(${size/30})" opacity="${opacity}"><defs><linearGradient id="${id}" x2="1" y2="1"><stop stop-color="#f7fcff" stop-opacity=".83"/><stop offset=".35" stop-color="#bfd9df" stop-opacity=".36"/><stop offset="1" stop-color="#eef9fb" stop-opacity=".65"/></linearGradient></defs><path d="M-14-9Q-15-12-11-13L8-15 16-8 13 13Q12 16 9 15L-13 11Z" fill="url(#${id})" stroke="#effcff" stroke-width=".75"/><path d="M-13-12 8-14 13-8-7-6Z" fill="#f9fcff" fill-opacity=".62"/><path d="M-7-6 13-8 10 14-10 10Z" fill="#d9ecf0" fill-opacity=".16" stroke="#fff" stroke-opacity=".7" stroke-width=".65"/><path d="m13-8 2-1-2 21-3 2Z" fill="#9ec0ca" fill-opacity=".48"/><path d="m-10-4 2 11m-1-16 15-2m-4 4 3 4-3 7" fill="none" stroke="#fff" stroke-opacity=".64" stroke-width=".7"/><path d="m-4 1 3-3 4 2-2 5-4-1Z" fill="#fff" opacity=".2"/></g>`;
}
export function solidIceMarkup(c,drops=[]){
 if(!c.amounts.ice)return '';
 const pending=drops.filter(d=>d.elapsed<ICE_LIFETIME),n=Math.min(8,Math.ceil(c.amounts.ice/ICE_MASS)),surface=(420-fillHeight(total(c)))*.62;
 const size=Math.min(31,24+Math.sqrt(c.amounts.ice/n)*1.2),positions=[];
 for(let i=0;i<n;i++)positions.push([156+(i%4)*31+(i%2?2:0),surface+7+Math.floor(i/4)*22+(i%2?7:0)]);
 const settled=positions.slice(0,Math.max(0,n-pending.length)).map(([x,y],i)=>cubeMarkup(x,y,size,i*17-16,.87,`solid-${c.id}-${i}`)).join('');
 return `<g class="solid-ice">${settled}</g>`;
}
export function fallingIceMarkup(c,drops=[]){
 const surface=(420-fillHeight(total(c)))*.62;
 return drops.map((d,i)=>{
  const t=d.elapsed,fall=clamp(t/.52),slot=d.index||0,x=156+(slot%4)*31+(slot%2?2:0),target=surface+7+Math.floor(slot/4)*22+(slot%2?7:0),y=18+(target-18)*fall*fall,angle=slot*17-16;
  const size=Math.min(31,24+Math.sqrt(c.amounts.ice/Math.max(1,Math.min(8,Math.ceil(c.amounts.ice/ICE_MASS))))*1.2);
  if(t<.52)return cubeMarkup(x,y,size,angle+(1-fall)*-35,1,`drop-${c.id}-${d.seed}`);
  const p=clamp((t-.52)/.43),opacity=(1-p)*.4;
  return cubeMarkup(x,target+Math.sin(p*Math.PI*2)*5*(1-p),size,angle,.87,`drop-${c.id}-${d.seed}`)+`<g class="ice-impact" opacity="${opacity}"><ellipse cx="${x}" cy="${surface+2}" rx="${8+25*p}" ry="${2+3*p}" fill="none" stroke="#fff9e7" stroke-width=".8"/><path d="M${x-12} ${surface-2}q-3 ${-8*(1-p)}-5-1m31 0q4 ${-6*(1-p)}6 1" stroke="#fff9e7" fill="none" stroke-width=".85"/></g>`;
 }).join('');
}
