// The image concept is a direction, not a baked UI asset. These layers keep
// water, air space, wall thickness, grain size and the level handle independent.
export function detailMarkup(){
 const ticks=Array.from({length:17},(_,i)=>{const value=i*10,y=222-value/130*76;return `<path d="M${i%4===0?48:52} ${y}H58"/>`;}).join('');
 const labels=[0,40,80,120,158].map(v=>`<text x="43" y="${225-v/130*76}">${v}</text>`).join('');
 return `<defs>
  <linearGradient id="detailSilver" x1="0" x2="1"><stop stop-color="#737c7b"/><stop offset=".16" stop-color="#d1d5d0"/><stop offset=".34" stop-color="#f0f0e7"/><stop offset=".52" stop-color="#a0a7a3"/><stop offset=".78" stop-color="#e2e4dc"/><stop offset="1" stop-color="#8b9491"/></linearGradient>
  <linearGradient id="detailLeftFacet" x1="0" x2="1"><stop stop-color="#737d7c"/><stop offset=".45" stop-color="#cbd0c9"/><stop offset="1" stop-color="#f4f2e7"/></linearGradient>
  <linearGradient id="detailRightFacet" x1="0" x2="1"><stop stop-color="#e6e8df"/><stop offset=".45" stop-color="#a5aeaa"/><stop offset="1" stop-color="#777f7d"/></linearGradient>
  <linearGradient id="detailInterior" x1="0" x2="1"><stop stop-color="#505c5d"/><stop offset=".23" stop-color="#879591"/><stop offset=".58" stop-color="#b2bbb4"/><stop offset="1" stop-color="#657370"/></linearGradient>
  <linearGradient id="detailWater" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b6d0cf" stop-opacity=".76"/><stop offset=".46" stop-color="#86afb7" stop-opacity=".82"/><stop offset="1" stop-color="#668e9a" stop-opacity=".9"/></linearGradient>
  <linearGradient id="detailWaterTop" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#cce0db"/><stop offset="1" stop-color="#8eb8be"/></linearGradient>
  <linearGradient id="detailBrass" x1="0" x2="1"><stop stop-color="#8b692f"/><stop offset=".4" stop-color="#dbc088"/><stop offset=".65" stop-color="#be9650"/><stop offset="1" stop-color="#765721"/></linearGradient>
  <linearGradient id="detailGround" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#75503b"/><stop offset="1" stop-color="#3c291f"/></linearGradient>
  <radialGradient id="detailShadow"><stop stop-color="#4c4434" stop-opacity=".18"/><stop offset="1" stop-color="#4c4434" stop-opacity="0"/></radialGradient>
  <clipPath id="detailTankClip"><path d="M153 106Q189 115 225 106L241 221Q188 232 131 221Z"/></clipPath>
  <clipPath id="detailBasketClip"><path d="M128 85Q184 98 240 85L235 126Q184 141 132 126Z"/></clipPath>
  <pattern id="detailFineGrain" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".55" fill="#a27a58" opacity=".6"/><circle cx="3.5" cy="3.4" r=".5" fill="#271c14" opacity=".65"/></pattern>
  <pattern id="detailCoarseGrain" width="8" height="7" patternUnits="userSpaceOnUse"><ellipse cx="2" cy="2" rx="1.4" ry=".9" fill="#ad805b" opacity=".6"/><ellipse cx="6" cy="5" rx="1.2" ry=".85" fill="#271c14" opacity=".65"/></pattern>
 </defs>
 <g id="waterDetail" class="section-detail">
  <ellipse cx="187" cy="242" rx="118" ry="14" fill="url(#detailShadow)"/>
  <path d="M130 71Q130 54 184 50Q234 50 242 67L244 92L261 107L283 219Q246 239 188 242Q127 241 92 224L111 111L127 94Z" fill="url(#detailSilver)"/>
  <path d="M130 71 127 95 111 111 92 224 116 231 143 98 152 73Z" fill="url(#detailLeftFacet)"/>
  <path d="M232 74 244 92 261 107 283 219 254 232 237 98Z" fill="url(#detailRightFacet)"/>
  <path d="M143 98Q189 110 237 98L253 222Q189 241 121 222Z" fill="url(#detailInterior)"/>
  <path d="M153 106Q189 115 225 106L241 221Q188 232 131 221Z" fill="url(#detailInterior)"/>
  <g id="detailWaterBody" clip-path="url(#detailTankClip)">
   <rect id="detailWaterFill" x="125" y="222" width="126" height="0" fill="url(#detailWater)"/>
   <ellipse id="detailWaterSurface" cx="188" cy="222" rx="54" ry="7" fill="url(#detailWaterTop)" stroke="#d4e4dc" stroke-width=".8"/>
   <path d="M148 133 139 219Q145 223 152 223L160 131Z" fill="#f3f6e6" opacity=".16"/>
   <ellipse cx="187" cy="219" rx="44" ry="6" fill="none" stroke="#d6e6df" stroke-width=".7" opacity=".38"/>
  </g>
  <path d="M143 98 121 222 131 221 153 106Z" fill="#e4e9df"/><path d="M237 98 253 222 241 221 225 106Z" fill="#d1d9d0"/>
  <path d="M121 222Q188 241 253 222L249 233Q188 248 116 231Z" fill="url(#detailSilver)"/>
  <path d="M130 69Q183 86 242 69L241 78Q186 96 131 80Z" fill="url(#detailSilver)"/>
  <ellipse cx="186" cy="65" rx="56" ry="13" fill="url(#detailSilver)"/><ellipse cx="186" cy="65" rx="49" ry="9" fill="url(#detailInterior)"/>
  <g fill="none" stroke="#e7eae0" stroke-width="1" opacity=".8"><path d="M132 68Q184 86 240 68M131 73Q184 91 241 74M133 78Q184 96 240 79M114 112 97 221M261 110 278 219"/></g>
  <path d="M246 128 254 126 261 131 261 141 254 146 246 142Z" fill="url(#detailBrass)" stroke="#88652c" stroke-width=".7"/>
  <ellipse cx="251" cy="137" rx="4.6" ry="6.5" fill="#bfa06a"/><ellipse cx="252" cy="137" rx="2.4" ry="4" fill="#58482c"/>
  <path class="detail-safe valve-line" d="M70 146H272"/><text class="detail-label" x="279" y="149">安全阀下缘</text>
  <g class="detail-scale" fill="none" stroke="#b5a48e" stroke-width=".65">${ticks}</g><g class="detail-scale-labels">${labels}<text x="43" y="243">g</text></g>
  <g class="section-hit" data-component="lower" role="button" tabindex="0" aria-label="了解下壶的水与空气空间"><rect x="114" y="91" width="143" height="143"/></g>
  <g id="waterLevelHandle" class="level-handle" data-quantity="water" role="slider" tabindex="-1" aria-label="下壶水量，向上增加，向下减少" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="158" aria-valuenow="0" aria-describedby="sectionNote">
   <path class="level-line" d="M66 0H239"/><circle class="level-thumb" cx="66" cy="0" r="7"/><path class="level-arrows" d="M63 -13 66 -16 69 -13M63 13 66 16 69 13"/><rect class="level-hit" x="51" y="-16" width="190" height="32"/>
  </g>
 </g>
 <g id="powderDetail" class="section-detail">
  <ellipse cx="185" cy="236" rx="71" ry="11" fill="url(#detailShadow)"/>
  <path d="M119 78 121 131 174 162V223Q181 229 190 223V162L245 131 250 78Z" fill="url(#detailSilver)"/>
  <path d="M121 131 174 162V223L180 225V157Z" fill="#dce2d8"/><path d="M245 131 190 162V223L185 224V158Z" fill="url(#detailRightFacet)"/>
  <ellipse cx="184" cy="78" rx="67" ry="14" fill="url(#detailSilver)"/><ellipse cx="184" cy="79" rx="58" ry="10" fill="url(#detailInterior)"/>
  <path d="M127 85Q184 100 240 85L235 126Q184 141 132 126Z" fill="url(#detailInterior)"/>
  <g id="detailPowderBody" clip-path="url(#detailBasketClip)"><rect id="detailPowderFill" x="124" y="126" width="120" height="0" fill="url(#detailGround)"/><ellipse id="detailPowderSurface" cx="184" cy="126" rx="56" ry="8" fill="url(#detailGround)"/><ellipse id="detailPowderGrain" cx="184" cy="126" rx="56" ry="8" fill="url(#detailFineGrain)"/></g>
  <path d="M119 79 121 131 132 126 127 85M250 79 245 131 235 126 240 85" fill="#e7e9df"/>
  <path d="M132 126Q184 141 235 126L231 132Q184 147 135 133Z" fill="url(#detailSilver)"/>
  <path d="M179 160V222Q182 224 185 222V160" fill="#586e6d" opacity=".7"/>
  <path d="M254 79H282" class="detail-leader"/><text class="detail-label" x="289" y="82">粉篮</text>
  <path d="M193 195H260" class="detail-leader"/><text class="detail-label" x="268" y="193">水沿细管<tspan x="268" dy="13">进入粉层</tspan></text>
  <g class="section-hit" data-component="basket" role="button" tabindex="0" aria-label="了解粉篮与不压实的粉层"><rect x="115" y="61" width="140" height="169"/></g>
 </g>`;
}

export function updateDetail(svg,s,mode,{locked=false,view=''}={}){
 const waterMode=mode==='water'&&!s.started&&!view,powderMode=mode==='powder'&&!s.started&&!view;
 svg.querySelector('#waterDetail').style.display=waterMode?'':'none';svg.querySelector('#waterDetail').setAttribute('aria-hidden',String(!waterMode));svg.querySelector('#powderDetail').setAttribute('aria-hidden',String(!powderMode));svg.querySelector('#powderDetail').style.display=powderMode?'':'none';svg.querySelector('#sectionOverview').style.display=waterMode||powderMode?'none':'';
 const level=222-s.water/130*76,water=svg.querySelector('#detailWaterFill');water.setAttribute('y',level);water.setAttribute('height',232-level);svg.querySelector('#detailWaterBody').style.display=s.water>.05?'':'none';
 const surface=svg.querySelector('#detailWaterSurface');surface.setAttribute('cy',level);surface.setAttribute('rx',36+(level-106)/116*19);
 const handle=svg.querySelector('#waterLevelHandle');handle.setAttribute('transform',`translate(0 ${level})`);handle.setAttribute('aria-valuenow',String(Math.round(s.water)));handle.setAttribute('aria-disabled',String(locked||!waterMode));handle.setAttribute('tabindex',waterMode&&!locked?'0':'-1');
 const powderLevel=126-s.powder/18*40,powder=svg.querySelector('#detailPowderFill');powder.setAttribute('y',powderLevel);powder.setAttribute('height',139-powderLevel);svg.querySelector('#detailPowderBody').style.display=s.powder>.05?'':'none';
 for(const id of ['detailPowderSurface','detailPowderGrain'])svg.querySelector('#'+id).setAttribute('cy',powderLevel);svg.querySelector('#detailPowderGrain').setAttribute('fill',s.grind===0?'url(#detailCoarseGrain)':'url(#detailFineGrain)');
}
