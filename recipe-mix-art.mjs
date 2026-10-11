import {INGREDIENTS,KEYS,CAPACITY,total,cupAppearance} from './recipe-state.mjs';
import {fillHeight} from './cup-geometry.mjs';

const smooth=x=>x*x*(3-2*x);
const blend=(a,b,t)=>{
 const from=a.startsWith('#')?[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)):a.match(/[\d.]+/g).map(Number);
 const to=b.match(/[\d.]+/g).map(Number);
 return 'rgb('+from.map((v,i)=>Math.round(v+(to[i]-v)*t)).join(',')+')';
};
export function iceMarkup(c,top,opacity=1){
 if(!c.amounts.ice)return '';
 return '<g class="solid-ice" opacity="'+opacity+'">'+Array.from({length:Math.max(1,Math.min(4,Math.ceil(c.amounts.ice/15)))},(_,i)=>{
  const x=147+i%3*36,y=top+9+Math.floor(i/3)*26+i%2*13;
  return '<g transform="rotate('+(i*19-13)+' '+(x+16)+' '+(y+18)+')"><path d="M'+x+' '+(y+9)+'l10-9 25 5-4 10-31-6Z" fill="#f6faf6" fill-opacity=".73" stroke="#fffef4" stroke-width="1"/><path d="M'+x+' '+(y+9)+'l31 6-3 26-27-6Z" fill="#cddcde" fill-opacity=".5" stroke="#fbfcf2" stroke-width="1.2"/><path d="M'+(x+31)+' '+(y+15)+'l4-10-3 28-4 8Z" fill="#99b4bc" fill-opacity=".47" stroke="#f7faf3" stroke-width="1"/><path d="M'+(x+5)+' '+(y+12)+'l2 18m5-25 17 4" stroke="#fffef7" stroke-opacity=".65" stroke-width="1.2" fill="none"/></g>';
 }).join('')+'</g>';
}
function liquidBody(c,top,height){
 const a=cupAppearance(c);
 const rgb=a.color.match(/[\d.]+/g).map(Number),shade=f=>'rgb('+rgb.map(v=>Math.round(Math.min(255,v*f))).join(',')+')',id='liquid-shade-'+c.id;
 return '<defs><linearGradient id="'+id+'" x2=".1" y2="1"><stop stop-color="'+shade(1.08)+'"/><stop offset=".25" stop-color="'+a.color+'"/><stop offset="1" stop-color="'+shade(.88)+'"/></linearGradient></defs><rect class="finished-liquid" x="110" y="'+top+'" width="195" height="'+height+'" fill="url(#'+id+')" opacity="'+a.opacity+'"/>';
}
export function mixedLiquidMarkup(c,top,height){
 const foam=Math.min(50,c.amounts.foam/Math.max(1,total(c))*height);
 return liquidBody(c,top,height)+(foam?'<path class="surface-foam" d="M110 '+(top+foam)+'H305V'+top+'H110Z" fill="#f6efdf"/>':'');
}
export function mixingMarkup(c,fromView,progress){
 const p=Math.max(0,Math.min(1,progress)),q=smooth(p),t=total(c),height=fillHeight(t),bottom=420,top=bottom-height;
 const a=cupAppearance(c),amp=Math.sin(p*Math.PI)*Math.min(25,height*.18),phase=p*Math.PI*5;
 const fade=1-smooth(Math.max(0,(p-.2)/.8)),id='mix-level-'+c.id;
 let cursor=bottom,source='';
 if(fromView==='recipe')for(const [i,key] of KEYS.filter(k=>c.amounts[k]>0&&k!=='ice').entries()){
  const h=height*c.amounts[key]/Math.max(1,t-c.amounts.ice);cursor-=h;
  const intrusion=amp*.55,dy=Math.sin(phase+i*1.7)*amp*.22,y=cursor+dy-intrusion,base=y+h+intrusion*2;
  const wave=Math.sin(phase+i*1.9)*amp;
  source+='<path class="mix-band" data-mix-ingredient="'+key+'" d="M100 '+y+' C160 '+(y+wave)+' 244 '+(y-wave)+' 317 '+y+' L317 '+base+' C245 '+(base-wave)+' 170 '+(base+wave)+' 100 '+base+'Z" fill="'+blend(INGREDIENTS[key].color,a.color,q*.85)+'" opacity="'+fade+'"/>';
 }
 const ribbons=fromView==='recipe'?KEYS.filter(k=>c.amounts[k]>0&&k!=='ice'&&k!=='foam').map((key,i)=>{
  const mid=top+height*(.2+(i*.21)% .6),bend=Math.sin(phase+i*1.3)*height*.22;
  return '<path class="mix-ribbon" d="M94 '+mid+' C156 '+(mid-bend)+' 242 '+(mid+height*.35)+' 324 '+(mid-height*.13)+'" fill="none" stroke="'+blend(INGREDIENTS[key].color,a.color,q*.45)+'" stroke-width="'+(3+amp*.38)+'" opacity="'+(Math.sin(p*Math.PI)*(1-q)*.7)+'" stroke-linecap="round"/>';
 }).join(''):'';
 const ripple=Math.sin(p*Math.PI)*.28;
 return '<defs><clipPath id="'+id+'"><rect x="100" y="'+top+'" width="217" height="'+height+'"/></clipPath></defs><g class="mixing-liquid" data-progress="'+p.toFixed(3)+'" clip-path="url(#'+id+')">'+
  liquidBody(c,top,height)+source+ribbons+
  '<ellipse cx="'+(210+Math.sin(phase)*14)+'" cy="'+(top+Math.min(20,height*.2))+'" rx="67" ry="9" fill="none" stroke="#fff7e6" stroke-width="2" opacity="'+ripple+'"/>'+
  (c.amounts.foam?'<rect x="110" y="'+top+'" width="195" height="'+Math.min(50,c.amounts.foam/t*height)+'" fill="#f6efdf" opacity="'+q+'"/>':'')+'</g>';
}
export function spoonMarkup(c,progress,resting=false){
 const height=fillHeight(total(c)),top=(420-height)*.62,p=Math.max(0,Math.min(1,progress));
 const phase=p*Math.PI*4,envelope=Math.sin(p*Math.PI),x=222+(resting?0:Math.sin(phase)*13*envelope),end=239;
 const angle=14+(resting?0:Math.cos(phase)*4*envelope),id='spoon-metal-'+c.id;
 const body=`<g transform="translate(${x},${end}) rotate(${angle})"><path d="M-2-11C-2.2-50-1.4-103-3-153L-4.8-204Q-4.8-211-1-211Q2.8-211 2.8-204L1-153C.5-101 2-50 2-11Z" fill="url(#${id})" stroke="#60625e" stroke-width=".55"/><path d="M-2.8-205-.4-147 .1-18" fill="none" stroke="#fffdf5" stroke-opacity=".9" stroke-width=".65"/><path d="M0-15C-5.8-15-8-6-6 1C-4.6 6.6-.4 8 3.4 4.2C7-0 6.6-12 0-15Z" fill="url(#${id})" stroke="#6d7474" stroke-width=".65"/><path d="M-.6-12C-3.9-11-5.2-3-2.2 2.3C-5.6-0-4-10-.6-12" fill="#fffdf7" opacity=".9"/></g>`;
 return `<defs><linearGradient id="${id}"><stop stop-color="#656b6c"/><stop offset=".24" stop-color="#b7c1c3"/><stop offset=".44" stop-color="#fefdf5"/><stop offset=".59" stop-color="#9da6a6"/><stop offset=".82" stop-color="#f0f1ea"/><stop offset="1" stop-color="#515b5d"/></linearGradient><clipPath id="spoon-air-${c.id}"><rect x="90" y="0" width="250" height="${top}"/></clipPath><clipPath id="spoon-sub-${c.id}"><rect x="90" y="${top}" width="250" height="270"/></clipPath></defs><g class="stir-spoon"><g clip-path="url(#spoon-air-${c.id})">${body}</g><g clip-path="url(#spoon-sub-${c.id})" opacity=".42">${body}</g></g>`;
}
