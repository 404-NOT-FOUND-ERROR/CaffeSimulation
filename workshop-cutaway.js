import {SPEC,coffeeLeft,isHot,totalCup} from './workshop-state.mjs';
import {sectionWaterAmount} from './preparation-motion.mjs';
import {detailMarkup,updateDetail} from './workshop-cutaway-details.js';

// A schematic deliberately separate from the 3D asset: readable levels and paths,
// not a claim that an unverified print mesh is a calibrated physical section.
export function createCutaway(svg){
 svg.insertAdjacentHTML('beforeend',`<defs>
  <clipPath id="tankClip"><path d="M87 158H191L207 237H71Z"/></clipPath>
  <clipPath id="upperClip"><path d="M75 45H203L184 125H94Z"/></clipPath>
  <pattern id="powderHatch" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.4" r=".8" fill="#f4ecdd" opacity=".35"/></pattern>
  <marker id="waterArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 8 5 0 10" fill="none" stroke="#547c84" stroke-width="2"/></marker>
 </defs>
 <g id="sectionOverview"><path class="section-shell section-lower" d="M71 237H207L191 158H87Z"/><path class="section-shell section-upper" d="M75 45H203L184 125H94Z"/>
 <path class="section-lid" d="M68 44 140 27 210 44M139 27V18"/>
 <path class="section-handle" d="M202 55H230L250 75 235 117H215"/>
 <g clip-path="url(#tankClip)"><rect id="sectionWater" x="68" y="237" width="143" height="0" fill="#99b8be" opacity=".85"/></g>
 <g clip-path="url(#upperClip)"><rect id="sectionCoffee" x="75" y="124" width="130" height="0" fill="#683c25"/></g>
 <path class="section-basket" d="M98 135H182V153L145 174V218H134V174L98 153Z"/>
 <rect id="sectionGrounds" x="100" y="153" width="80" height="0" fill="#553724"/>
 <rect id="sectionGrain" x="100" y="153" width="80" height="0" fill="url(#powderHatch)"/>
 <path class="section-tube" d="M133 125V64H146V125M98 130H181"/>
 <path id="sectionFlow" class="section-flow" d="M139 205V154M139 126V69M145 69Q162 64 165 86" marker-end="url(#waterArrow)"/>
 <path id="valveLine" class="valve-line" d="M68 177H227"/><circle id="valveDot" cx="194" cy="177" r="4"/>
 <g class="section-upper-label"><path class="section-leader" d="M167 89H252"/><text class="section-label" x="258" y="93">出液</text></g>
 <g class="section-powder-label"><path class="section-leader" d="M181 143H252"/><text class="section-label" x="258" y="147">粉层</text></g>
 <g class="section-valve-label"><path class="section-leader" d="M200 178H245"/><text class="section-label" x="250" y="182">安全阀</text></g>
 <text id="waterLevelText" class="section-amount" x="81" y="223">0 g</text><text id="powderLevelText" class="section-amount" x="110" y="149"></text>
 <g class="section-hit" data-component="lower" tabindex="0" role="button" aria-label="了解下壶与安全阀"><rect x="63" y="158" width="154" height="84"/></g>
 <g class="section-hit" data-component="basket" tabindex="0" role="button" aria-label="了解粉篮与粉层"><rect x="91" y="132" width="99" height="24"/></g>
 <g class="section-hit" data-component="upper" tabindex="0" role="button" aria-label="了解上壶与出液导管"><rect x="73" y="49" width="132" height="77"/></g>
 <g class="section-hit" data-component="filter" tabindex="0" role="button" aria-label="了解滤网与密封圈"><rect x="91" y="125" width="99" height="8"/></g>
 </g>${detailMarkup()}
 <g id="blendSection" style="display:none" aria-label="成杯配方与稀释示意">
 <defs><clipPath id="blendGlassClip"><path d="M98 48H207L193 169Q153 185 112 169Z"/></clipPath></defs>
 <path d="M95 46H210L196 174Q153 190 109 174Z" fill="#f1ecdf" stroke="#9eab9f" stroke-width="1.3"/>
 <path d="M210 69Q253 63 240 117Q235 132 204 128" fill="none" stroke="#9eab9f" stroke-width="3"/>
 <rect id="blendLiquid" x="97" y="174" width="113" height="0" clip-path="url(#blendGlassClip)"/>
 <ellipse id="blendSurface" cx="153" cy="174" rx="47" ry="5" fill="#6a3f28"/>
 <g id="blendIce" clip-path="url(#blendGlassClip)" fill="#dce9e5" stroke="#f9f7ed" opacity=".75"><rect x="122" y="78" width="14" height="12" rx="2"/><rect x="145" y="73" width="14" height="12" rx="2"/><rect x="170" y="79" width="14" height="12" rx="2"/></g>
 <path d="M105 61 116 160" stroke="#fffdf2" stroke-width="3" fill="none" opacity=".6"/>
 <rect id="blendFraction" x="85" y="209" width="0" height="6" fill="#513120"/>
 <rect id="blendAddedFraction" x="85" y="209" width="0" height="6" fill="#d8bea0"/>
 <text id="blendFractionLabel" x="85" y="235" class="section-label">咖啡基底</text>
 <text id="blendMassLabel" x="153" y="35" text-anchor="middle" class="section-label"></text>
 <g class="section-hit" data-component="upper" tabindex="0" role="button" aria-label="了解成杯配方与稀释"><rect x="87" y="43" width="155" height="146"/></g>
 </g>`);
 let box=[50,8,280,242];const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 return {
  waterAt(clientX,clientY){const p=new DOMPoint(clientX,clientY).matrixTransform(svg.getScreenCTM().inverse());return sectionWaterAmount(p.y);},
  animate(mode,view,dt){const desired=!view&&mode==='water'?[15,22,350,235]:!view&&mode==='powder'?[65,52,273,194]:[50,8,280,242];const f=reduced?1:1-Math.exp(-dt*9);box=box.map((n,i)=>n+(desired[i]-n)*f);svg.setAttribute('viewBox',box.join(' '));},
  update(s,mode,{locked=false,view=''}={}){
  const water=s.started?Math.max(0,s.water-s.brewed):s.water,height=water/SPEC.waterMax*60;
  const w=svg.querySelector('#sectionWater');w.setAttribute('y',237-height);w.setAttribute('height',height);
  const fill=s.powder/SPEC.powder*16;
  for(const id of ['sectionGrounds','sectionGrain']){const p=svg.querySelector('#'+id);p.setAttribute('y',153-fill);p.setAttribute('height',fill);}
  const ch=Math.min(65,coffeeLeft(s)/100*60),coffee=svg.querySelector('#sectionCoffee');coffee.setAttribute('y',124-ch);coffee.setAttribute('height',ch);
  svg.querySelector('#waterLevelText').textContent=(s.started?'≈ ':'')+Math.round(water)+' g';svg.querySelector('#powderLevelText').textContent=s.powder>0?Math.round(s.powder)+' g':'';
  updateDetail(svg,s,mode,{locked,view});
  const mixing=mode==='blend'&&!view,blend=svg.querySelector('#blendSection');blend.style.display=mixing?'':'none';blend.setAttribute('aria-hidden',String(!mixing));svg.querySelector('#sectionOverview').setAttribute('aria-hidden',String(mixing||(!view&&['water','powder'].includes(mode))));
  if(mixing){svg.querySelector('#sectionOverview').style.display='none';const amount=totalCup(s),fraction=amount?s.poured/amount:0,level=174-Math.min(amount,SPEC.cupMax)/SPEC.cupMax*113;const liquid=svg.querySelector('#blendLiquid');liquid.setAttribute('y',level);liquid.setAttribute('height',174-level);const milk=s.cup.milk/Math.max(1,amount-s.cup.ice),water=s.cup.water/Math.max(1,amount-s.cup.ice),rgb=[72,39,24].map((n,i)=>Math.round(n+([148,112,77][i]-n)*water*.75+([238,214,175][i]-n)*milk*.92));const color=`rgb(${rgb.join(',')})`;const ice=svg.querySelector('#blendIce');ice.style.display=s.cup.ice?'':'none';ice.setAttribute('transform',`translate(0 ${level-72})`);liquid.setAttribute('fill',color);const surface=svg.querySelector('#blendSurface');surface.setAttribute('cy',level);surface.setAttribute('rx',40+(174-level)*.07);surface.setAttribute('fill',color);svg.querySelector('#blendFraction').setAttribute('width',135*fraction);svg.querySelector('#blendAddedFraction').setAttribute('x',85+135*fraction);svg.querySelector('#blendAddedFraction').setAttribute('width',135*(1-fraction));svg.querySelector('#blendFractionLabel').textContent='咖啡基底 '+Math.round(fraction*100)+'% · 配方质量比';svg.querySelector('#blendMassLabel').textContent='成杯 '+Math.round(amount)+' g'+(s.cup.ice>0?' · 含冰质量':'');}
  for(const hit of svg.querySelectorAll('#sectionOverview .section-hit'))hit.setAttribute('tabindex',view||!['water','powder'].includes(mode)?'0':'-1');
  svg.classList.toggle('overfilled',s.water>SPEC.waterMax);svg.classList.toggle('flowing',s.lastFlow>.08&&s.brewed>0&&s.progress<1);svg.classList.toggle('heated',isHot(s));
  svg.dataset.phase=mode;
 }};
}
